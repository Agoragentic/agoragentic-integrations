import assert from 'node:assert/strict';
import test from 'node:test';
import { createVerifierCapacity } from '../src/verifier-capacity.mjs';

const gate = () => createVerifierCapacity({ timeoutMs: 50, concurrency: 1 });
const tick = () => new Promise(resolve => setImmediate(resolve));

test('verifiers require strict true and contain throws and rejections', async () => {
  const verify = gate();
  assert.equal(await verify(() => true), true);
  for (const value of [false, null, undefined, 'true', 1, {}]) assert.equal(await verify(() => value), false);
  assert.equal(await verify(() => { throw new Error('private verifier diagnostic'); }), false);
  assert.equal(await verify(() => Promise.reject(new Error('private'))), false);
  assert.equal(await verify(() => true), true);
});

test('capacity is reserved synchronously; overload never invokes callback', async () => {
  const verify = gate(); let finish, invoked = 0;
  const pending = verify(() => new Promise(resolve => { finish = resolve; }));
  assert.equal(await verify(() => { invoked += 1; return true; }), false);
  assert.equal(invoked, 0);
  await tick(); finish(true);
  assert.equal(await pending, true);
  assert.equal(await verify(() => true), true);
});

test('timeout denies late success and holds capacity until actual settlement', async () => {
  const verify = gate(); let finish, invoked = 0;
  const pending = verify(() => new Promise(resolve => { finish = resolve; }));
  assert.equal(await pending, false);
  for (let i = 0; i < 20; i++) assert.equal(await verify(() => { invoked++; return true; }), false);
  assert.equal(invoked, 0);
  finish(true); await tick();
  assert.equal(await pending, false);
  assert.equal(await verify(() => true), true);
});

test('late rejection releases slot without unhandled rejection or leaked diagnostics', async () => {
  const verify = gate(); let fail;
  const pending = verify(() => new Promise((_, reject) => { fail = reject; }));
  assert.equal(await pending, false);
  fail(new Error('private')); await tick();
  assert.equal(await verify(() => true), true);
});

test('independent verification pools preserve recovery capacity', async () => {
  const resource = gate(), cleanup = gate(), recovery = gate();
  const hung = resource(() => new Promise(() => {}));
  assert.equal(await cleanup(() => true), true);
  assert.equal(await recovery(() => true), true);
  assert.equal(await hung, false);
});

test('synchronous callback returning after deadline cannot attest success', async () => {
  const verify = gate();
  assert.equal(await verify(() => {
    const until = performance.now() + 60;
    while (performance.now() < until) {} // Deliberately trusted-host blocking fixture.
    return true;
  }), false);
});

test('invalid capacity and deadline options fail closed', () => {
  for (const value of [undefined, null, 0, 65, 1.5, '1']) assert.throws(() => createVerifierCapacity({ timeoutMs: 50, concurrency: value }));
  for (const value of [undefined, null, 49, 30001, '50']) assert.throws(() => createVerifierCapacity({ timeoutMs: value, concurrency: 1 }));
});

import { createManagedProviderRegistry } from '../src/provider-registry.mjs';
import { RiskForkProvider, REQUIRED_PROVIDER_METHODS } from '../../src/provider.mjs';
import { sha256Ref } from '../../src/canonical.mjs';

function registry(callbacks = {}) {
  const provider = new RiskForkProvider({ id: 'local-test-provider', capabilities: {
    supports_filesystem_snapshot: true, supports_network_policy: true,
    supports_verified_destruction: true, supports_hard_ttl: true,
    child_credentials_mode: 'prohibited', isolation_class: 'local_test_fixture_only',
    adapter_implementation: 'managed_service_test_fixture', mock_conformance: 'local_unit_test',
  } });
  for (const method of REQUIRED_PROVIDER_METHODS) provider[method] = async () => {};
  return createManagedProviderRegistry([{
    provider, enabled: true, adapter_digest: sha256Ref('adapter'), qualification_class: 'local_test',
    qualification_receipt_hash: sha256Ref('receipt'), tenant_ids: ['tenant_alpha'],
    verify_resource_binding: () => true, verify_cleanup_evidence: () => true,
    verify_recovery_absence: () => true, ...callbacks,
  }], { verification_timeout_ms: 50, verification_concurrency: 1 });
}

function request(reg) {
  return { provider_id: 'local-test-provider', tenant_id: 'tenant_alpha',
    provider_binding_hash: reg.admissionBinding('local-test-provider', 'tenant_alpha').provider_binding_hash,
    resources: { provider_recovery_key: 'recovery:test', savepoint_ref: 'savepoint:test', fork_ref: 'fork:test', absent_resource_kinds: [] },
    context: { invocation_ref: 'invocation:test', recovery_mode: false, provider_recovery_key: 'recovery:test', savepoint_ref: 'savepoint:test', fork_ref: 'fork:test' },
    evidence: { evidence_hash: sha256Ref('evidence'), provider_recovery_key: 'recovery:test' },
    request: { request_hash: sha256Ref('request') },
  };
}

test('registry bounds actual resource verifier without exhausting cleanup or recovery', async () => {
  let finish, calls = 0;
  const reg = registry({ verify_resource_binding: () => { calls++; return new Promise(resolve => { finish = resolve; }); } });
  const input = request(reg);
  const first = assert.rejects(reg.verifyResourceBinding(input), { code: 'RESOURCE_BINDING_ATTESTATION_FAILED' });
  await assert.rejects(reg.verifyResourceBinding(input), { code: 'RESOURCE_BINDING_ATTESTATION_FAILED' });
  assert.match(await reg.verifyCleanupEvidence(input), /^sha256:/);
  assert.match(await reg.verifyRecoveryAbsence(input), /^sha256:/);
  await first;
  await assert.rejects(reg.verifyResourceBinding(input), { code: 'RESOURCE_BINDING_ATTESTATION_FAILED' });
  assert.equal(calls, 1);
  finish(true); await tick();
});

test('registry applies deadlines to cleanup and recovery, preserving failure codes', async () => {
  const reg = registry({ verify_cleanup_evidence: () => new Promise(() => {}), verify_recovery_absence: () => new Promise(() => {}) });
  const input = request(reg);
  await Promise.all([
    assert.rejects(reg.verifyCleanupEvidence(input), { code: 'CLEANUP_PROVIDER_ATTESTATION_FAILED' }),
    assert.rejects(reg.verifyRecoveryAbsence(input), { code: 'RECOVERY_ABSENCE_ATTESTATION_FAILED' }),
  ]);
  assert.match(await reg.verifyResourceBinding(input), /^sha256:/);
});

test('registry options are strict and production remains disabled', () => {
  for (const options of [{ unexpected: true }, { verification_timeout_ms: null }, { verification_concurrency: null }, { verification_timeout_ms: 49 }, { verification_concurrency: 0 }]) {
    assert.throws(() => createManagedProviderRegistry([], options));
  }
  assert.equal(registry().summary().production_provider_count, 0);
});

test('registry freezes verifier payload before deferred callback execution', async () => {
  let seen;
  const reg = registry({ verify_resource_binding: payload => { seen = payload; return true; } });
  const input = request(reg);
  const result = reg.verifyResourceBinding(input);
  assert.throws(() => { input.resources.fork_ref = 'fork:substituted'; });
  assert.throws(() => { input.context.invocation_ref = 'invocation:substituted'; });
  assert.match(await result, /^sha256:/);
  assert.equal(seen.resources.fork_ref, 'fork:test');
  assert.equal(seen.context.invocation_ref, 'invocation:test');
});
