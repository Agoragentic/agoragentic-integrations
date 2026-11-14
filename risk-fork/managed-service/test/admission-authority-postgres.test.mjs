import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { sha256Ref } from '../../src/canonical.mjs';
import { createPostgresAuthorityPool } from '../../src/adapters/postgres-authority-migrator.mjs';
import { createManagedAuthenticator, createTrustedOAuthAuthenticator, hashManagedApiKey } from '../src/auth.mjs';
import { createManagedServiceConfig } from '../src/config.mjs';
import { createManagedRiskForkControlPlane } from '../src/control-plane.mjs';
import { migrateManagedServicePostgres } from '../src/postgres-migrator.mjs';
import { PostgresManagedServiceStore } from '../src/postgres-store.mjs';
import { createManagedProviderRegistry } from '../src/provider-registry.mjs';
import { createStablePostgresClock, invocationRequest, TestProvider, TEST_TOKEN } from './helpers.mjs';

const connectionString = process.env.RISK_FORK_MANAGED_TEST_POSTGRES_URL;
let skip = 'An explicit disposable loopback risk_fork_managed_test database is required';
try {
  const url = new URL(connectionString);
  if (['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
    && url.pathname === '/risk_fork_managed_test'
    && process.env.RISK_FORK_MANAGED_TEST_CONFIRM_DISPOSABLE === 'YES_DELETE_DATA') skip = false;
} catch { /* Never fall back to a different database. */ }
if (skip && process.env.RISK_FORK_MANAGED_REQUIRE_POSTGRES_TESTS === '1') throw new Error(skip);
const denied = (error) => ['AUTHENTICATION_FAILED', 'AUTHORIZATION_DENIED'].includes(error.code);

async function fixture(t) {
  const schemaName = `risk_fork_admission_${randomUUID().replaceAll('-', '')}`;
  const schema = `"${schemaName}"`;
  const rawPool = await createPostgresAuthorityPool({ connectionString, requireTls: false, maxConnections: 4 });
  t.after(async () => {
    try { await rawPool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`); }
    finally { await rawPool.end(); }
  });
  await migrateManagedServicePostgres({ pool: rawPool, schemaName, requireTls: false });
  const { pool, clock } = await createStablePostgresClock(rawPool, schemaName);
  await pool.query(`INSERT INTO ${schema}.managed_tenants
    (tenant_id, status, daily_budget_micros, max_invocation_cost_micros, max_concurrent_invocations)
    VALUES ('tenant_alpha', 'active', 1000000, 500000, 4)`);
  await pool.query(`INSERT INTO ${schema}.managed_api_keys
    (key_hash, key_id, tenant_id, scopes, not_before, expires_at)
    VALUES ($1, 'key_alpha', 'tenant_alpha', '["invocations:write"]'::jsonb,
      clock_timestamp() - interval '1 minute', clock_timestamp() + interval '1 hour')`,
  [hashManagedApiKey(TEST_TOKEN)]);
  const store = new PostgresManagedServiceStore({ pool, schemaName, requireTls: false });
  const auth = createManagedAuthenticator({ store, clock });
  const providerRegistry = createManagedProviderRegistry([{
    provider: new TestProvider(), enabled: true,
    adapter_digest: sha256Ref({ fixture: 'admission-authority' }), qualification_class: 'local_test',
    qualification_receipt_hash: sha256Ref({ test: true }), tenant_ids: ['tenant_alpha'],
    verify_resource_binding: async () => false, verify_cleanup_evidence: async () => false,
    verify_recovery_absence: async () => false,
  }]);
  const control = createManagedRiskForkControlPlane({
    config: createManagedServiceConfig({ enabled: true, environment: 'local_test' }),
    store, providerRegistry, requirePrincipal: auth.requirePrincipal, clock,
  });
  const principal = await auth.authenticate(`Bearer ${TEST_TOKEN}`, 'invocations:write');
  async function snapshot() {
    const result = {};
    for (const table of ['managed_invocations', 'managed_usage_buckets', 'managed_audit_events']) {
      result[table] = (await pool.query(`SELECT * FROM ${schema}.${table}`)).rows;
    }
    return result;
  }
  return { pool, clock, schema, store, control, principal, snapshot, providerRegistry };
}

async function waitUntilBlocked(pool, blockerPid) {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    const result = await pool.query(`SELECT EXISTS (
      SELECT 1 FROM pg_stat_activity WHERE $1::integer = ANY(pg_blocking_pids(pid))
    ) AS blocked`, [blockerPid]);
    if (result.rows[0].blocked) return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.fail('admission did not reach the expected database lock within five seconds');
}

for (const barrier of ['tenant', 'credential', 'budget']) {
  for (const authority of ['API key', 'OAuth token']) {
    test(`PostgreSQL rejects ${authority} expiry across a ${barrier} lock wait`,
      { skip, timeout: 20_000 }, async (t) => {
        const f = await fixture(t);
        let control = f.control;
        let principal = f.principal;
        const expiry = new Date(f.clock().getTime() + 2_000).toISOString();
        if (authority === 'API key') {
          await f.pool.query(`UPDATE ${f.schema}.managed_api_keys SET expires_at = $1 WHERE key_id = 'key_alpha'`, [expiry]);
        } else {
          const identity = {
            key_hash: hashManagedApiKey(TEST_TOKEN), key_id: 'key_alpha', tenant_id: 'tenant_alpha',
            subject: 'key_alpha', issuer: 'https://fixture.invalid/issuer', audience: 'risk-fork-fixture',
            scopes: ['invocations:write'], not_before: f.clock().toISOString(), expires_at: expiry,
          };
          const auth = createTrustedOAuthAuthenticator({ store: f.store, verify: async () => identity,
            issuer: identity.issuer, audience: identity.audience, clock: f.clock });
          principal = await auth.authenticate(`Bearer ${TEST_TOKEN}`, 'invocations:write');
          control = createManagedRiskForkControlPlane({
            config: createManagedServiceConfig({ enabled: true, environment: 'local_test' }),
            store: f.store, providerRegistry: f.providerRegistry, requirePrincipal: auth.requirePrincipal, clock: f.clock,
          });
        }
        if (barrier === 'budget') {
          await f.pool.query(`INSERT INTO ${f.schema}.managed_usage_buckets
            (tenant_id, budget_day_utc, reserved_micros, spent_micros, updated_at)
            VALUES ('tenant_alpha', (clock_timestamp() AT TIME ZONE 'UTC')::date, 0, 0, clock_timestamp())`);
        }
        const before = await f.snapshot();
        const commit = f.store.admitInvocation.bind(f.store);
        f.store.admitInvocation = async (...args) => {
          // Authentication and early replay lookup have already completed.
          const blocker = await f.pool.connect();
          let pending;
          try {
            await blocker.query('BEGIN');
            const table = { tenant: 'managed_tenants', credential: 'managed_api_keys', budget: 'managed_usage_buckets' }[barrier];
            await blocker.query(`SELECT * FROM ${f.schema}.${table} WHERE tenant_id = 'tenant_alpha' FOR UPDATE`);
            const { rows: [{ pid }] } = await blocker.query('SELECT pg_backend_pid() AS pid');
            pending = commit(...args).then((value) => ({ value }), (error) => ({ error }));
            await waitUntilBlocked(f.pool, pid);
            await blocker.query(`SELECT pg_sleep(GREATEST(0,
              EXTRACT(EPOCH FROM ($1::timestamptz - clock_timestamp()))) + 0.05)`, [expiry]);
          } finally {
            await blocker.query('ROLLBACK');
            blocker.release();
          }
          const result = await pending;
          if (result.error) throw result.error;
          return result.value;
        };
        await assert.rejects(control.admitInvocation(principal, invocationRequest()), denied);
        assert.deepEqual(await f.snapshot(), before);
      });
  }
}

for (const change of ['revocation', 'scope']) {
  test(`PostgreSQL observes ${change} committed while admission waits for the credential lock`,
    { skip, timeout: 15_000 }, async (t) => {
      const f = await fixture(t);
      const before = await f.snapshot();
      const commit = f.store.admitInvocation.bind(f.store);
      f.store.admitInvocation = async (...args) => {
        const blocker = await f.pool.connect();
        let pending;
        try {
          await blocker.query('BEGIN');
          await blocker.query(`SELECT * FROM ${f.schema}.managed_api_keys WHERE key_id = 'key_alpha' FOR UPDATE`);
          const { rows: [{ pid }] } = await blocker.query('SELECT pg_backend_pid() AS pid');
          pending = commit(...args).then((value) => ({ value }), (error) => ({ error }));
          await waitUntilBlocked(f.pool, pid);
          const assignment = change === 'revocation' ? 'revoked_at = clock_timestamp()' : "scopes = '[]'::jsonb";
          await blocker.query(`UPDATE ${f.schema}.managed_api_keys SET ${assignment} WHERE key_id = 'key_alpha'`);
          await blocker.query('COMMIT');
        } finally {
          await blocker.query('ROLLBACK');
          blocker.release();
        }
        const result = await pending;
        if (result.error) throw result.error;
        return result.value;
      };
      await assert.rejects(f.control.admitInvocation(f.principal, invocationRequest()), denied);
      assert.deepEqual(await f.snapshot(), before);
    });
}

for (const replay of [false, true]) {
  for (const change of ['expiry', 'revocation', 'scope']) {
    test(`PostgreSQL rejects ${change} during idempotency wait (replay=${replay})`, { skip }, async (t) => {
      const f = await fixture(t);
      const request = invocationRequest();
      if (replay) await f.control.admitInvocation(f.principal, request);
      const before = await f.snapshot();
      const lookup = f.store.findIdempotentInvocation.bind(f.store);
      f.store.findIdempotentInvocation = async (...args) => {
        const assignment = {
          expiry: 'expires_at = clock_timestamp()',
          revocation: 'revoked_at = clock_timestamp()',
          scope: "scopes = '[]'::jsonb",
        }[change];
        await f.pool.query(`UPDATE ${f.schema}.managed_api_keys SET ${assignment} WHERE key_id = 'key_alpha'`);
        return lookup(...args);
      };
      await assert.rejects(f.control.admitInvocation(f.principal, request), denied);
      assert.deepEqual(await f.snapshot(), before);
    });
  }
}
