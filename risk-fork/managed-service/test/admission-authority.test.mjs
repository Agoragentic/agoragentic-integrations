import assert from 'node:assert/strict';
import test from 'node:test';
import { createTrustedOAuthAuthenticator, hashManagedApiKey } from '../src/auth.mjs';
import { createManagedRiskForkControlPlane } from '../src/control-plane.mjs';
import { MemoryManagedServiceStore } from '../src/memory-store.mjs';
import { createFixture, invocationRequest, TEST_TOKEN } from './helpers.mjs';

const expiredAt = '2026-09-05T12:01:00.000Z';
const denied = (error) => error.code === 'AUTHENTICATION_FAILED';

for (const replay of [false, true]) {
  test(`memory rejects credential expiry during idempotency wait (replay=${replay})`, async () => {
    const f = await createFixture({ credentialExpiresAt: expiredAt });
    const request = invocationRequest();
    if (replay) await f.controlPlane.admitInvocation(f.principal, request);
    const before = await f.store.listAuditInvocations('tenant_alpha');
    const lookup = f.store.findIdempotentInvocation.bind(f.store);
    f.store.findIdempotentInvocation = async (...args) => {
      await Promise.resolve();
      f.setNow(expiredAt);
      return lookup(...args);
    };
    await assert.rejects(f.controlPlane.admitInvocation(f.principal, request), denied);
    assert.deepEqual(await f.store.listAuditInvocations('tenant_alpha'), before);
  });
}

test('memory samples current time inside the exclusive admission section', async () => {
  const f = await createFixture({ credentialExpiresAt: expiredAt });
  const commit = f.store.admitInvocation.bind(f.store);
  f.store.admitInvocation = (...args) => {
    const pending = commit(...args);
    // #exclusive has yielded; the earlier admission.now is still unexpired.
    f.setNow(expiredAt);
    return pending;
  };
  await assert.rejects(f.controlPlane.admitInvocation(f.principal, invocationRequest()), denied);
  assert.equal((await f.store.listAuditInvocations('tenant_alpha')).invocations.length, 0);
  f.setNow('2026-09-05T12:00:00.000Z');
  f.store.admitInvocation = commit;
  // A denied attempt left no reservation, idempotency entry or invocation.
  assert.equal((await f.controlPlane.admitInvocation(f.principal, invocationRequest())).created, true);
});

for (const replay of [false, true]) {
  test(`memory enforces shorter OAuth expiry after authentication (replay=${replay})`, async () => {
    const f = await createFixture();
    let now = '2026-09-05T12:00:00.000Z';
    const clock = () => new Date(now);
    const identity = {
      key_hash: hashManagedApiKey(TEST_TOKEN), key_id: 'key_alpha', tenant_id: 'tenant_alpha',
      issuer: 'https://fixture.invalid/issuer', audience: 'risk-fork-fixture', subject: 'key_alpha',
      scopes: ['invocations:write'], not_before: now, expires_at: expiredAt,
    };
    const auth = createTrustedOAuthAuthenticator({ store: f.store, issuer: identity.issuer,
      audience: identity.audience, clock, verify: async () => identity });
    const control = createManagedRiskForkControlPlane({ config: f.config, store: f.store,
      providerRegistry: f.providerRegistry, requirePrincipal: auth.requirePrincipal, clock });
    const principal = await auth.authenticate(`Bearer ${TEST_TOKEN}`, 'invocations:write');
    const request = invocationRequest();
    if (replay) await control.admitInvocation(principal, request);
    const method = replay ? 'findIdempotentInvocation' : 'admitInvocation';
    const original = f.store[method].bind(f.store);
    f.store[method] = (...args) => {
      const pending = original(...args);
      now = expiredAt;
      return pending;
    };
    const before = await f.store.listAuditInvocations('tenant_alpha');
    await assert.rejects(control.admitInvocation(principal, request), denied);
    assert.deepEqual(await f.store.listAuditInvocations('tenant_alpha'), before);
  });
}

test('memory store admission requires current persisted identity and permission', async () => {
  const f = await createFixture();
  let input;
  const commit = f.store.admitInvocation.bind(f.store);
  f.store.admitInvocation = (value, options) => { input = value; return commit(value, options); };
  await f.controlPlane.admitInvocation(f.principal, invocationRequest());
  const clock = () => new Date('2026-09-05T12:00:00.000Z');
  for (const change of [
    { scopes: ['invocations:read'] },
    { revoked_at: clock().toISOString() },
    { expires_at: clock().toISOString() },
    { not_before: expiredAt },
    { key_id: 'key_other' },
    { tenant_id: 'tenant_other' },
  ]) {
    const store = new MemoryManagedServiceStore({ tenants: [f.tenant, f.otherTenant],
      credentials: [{ ...f.credentials[0], ...change }] });
    await assert.rejects(store.admitInvocation(input, { clock }), denied);
    assert.equal((await store.listAuditInvocations('tenant_alpha')).invocations.length, 0);
  }
});
