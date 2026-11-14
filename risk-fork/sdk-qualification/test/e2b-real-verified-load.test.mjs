import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createE2BRuntimeSdkIntegrityVerifier, loadVerifiedE2BRuntimeSdk } from '../../src/e2b-qualification.mjs';

test('the installed exact SDK loads through the verifier and reuses only the same binding', async () => {
  const verifier = createE2BRuntimeSdkIntegrityVerifier({ packageDirectory:
    fileURLToPath(new URL('../node_modules/e2b/', import.meta.url)) });
  const binding = await verifier.inspect();
  assert.equal(binding.version, '2.63.0');
  const loaded = await loadVerifiedE2BRuntimeSdk(binding, verifier);
  assert.equal(typeof loaded.module.Sandbox, 'function');
  assert.equal((await loadVerifiedE2BRuntimeSdk(binding, verifier)).module, loaded.module);
  // No Sandbox construction or provider request occurs in this test.
});
