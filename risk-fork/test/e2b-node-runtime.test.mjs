import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import * as core from '../src/index.mjs';
import { assertE2BNodeRuntime } from '../src/e2b-node-runtime.mjs';
import { createE2BRuntimeSdkProcessBoundary } from '../src/e2b-sdk-process.mjs';
import { runE2BTemplateBuild } from '../scripts/e2b-build-template.mjs';
import { runE2BLiveQualification } from '../scripts/e2b-live-qualification.mjs';

const [major, minor] = process.versions.node.split('.').map(Number);
const supported = major > 22 || (major === 22 && minor >= 19);
const unsupported = { code: 'E2B_NODE_RUNTIME_UNSUPPORTED' };

test('core exports and canonical contracts remain usable without the optional SDK', () => {
  assert.equal(core.canonicalize({ z: 1, a: 2 }), '{"a":2,"z":1}');
  assert.match(core.sha256Ref({ core: true }), /^sha256:[a-f0-9]{64}$/);
  assert.equal(typeof core.E2BRiskForkAdapter, 'function');
});

test('E2B runtime guard checks the actual process and exposes no version override', () => {
  assert.equal(assertE2BNodeRuntime.length, 0);
  if (supported) assert.doesNotThrow(() => assertE2BNodeRuntime());
  else {
    assert.throws(() => assertE2BNodeRuntime(), unsupported);
    assert.throws(() => assertE2BNodeRuntime('99.0.0'), unsupported);
  }
});

test('serialized child gate rejects every runtime below the exact SDK floor', () => {
  for (const version of ['20.20.2', '21.7.0', '22.0.0', '22.18.9', '22.19.0-rc.1', 'invalid']) {
    assert.throws(() => vm.runInNewContext(`(${assertE2BNodeRuntime.toString()})()`, {
      process: { versions: { node: version } },
    }), unsupported);
  }
  for (const version of ['22.19.0', '22.23.0', '24.0.0', '24.22.1']) {
    assert.doesNotThrow(() => vm.runInNewContext(`(${assertE2BNodeRuntime.toString()})()`, {
      process: { versions: { node: version } },
    }));
  }
});

test('unsupported Node refuses every SDK load and harness before reading options or consuming authority', async () => {
  if (supported) {
    // Supported runtime still cannot bypass the branded verifier or disabled gates.
    await assert.rejects(core.loadVerifiedE2BRuntimeSdk({}, {}), /trusted verifier/);
    await assert.rejects(runE2BTemplateBuild({ env: {} }), { code: 'E2B_OWNER_GATE_CLOSED' });
    await assert.rejects(runE2BLiveQualification({ env: {} }), { code: 'E2B_OWNER_GATE_CLOSED' });
    return;
  }
  let reads = 0;
  const hostile = new Proxy({}, { get() { reads++; throw new Error('options read'); } });
  const verifier = core.createE2BRuntimeSdkIntegrityVerifier({ packageDirectory: process.cwd() });
  await assert.rejects(core.loadVerifiedE2BRuntimeSdk(hostile, hostile), unsupported);
  await assert.rejects(verifier.load(hostile), unsupported);
  assert.throws(() => createE2BRuntimeSdkProcessBoundary(hostile), unsupported);
  await assert.rejects(runE2BTemplateBuild(hostile), unsupported);
  await assert.rejects(runE2BLiveQualification(hostile), unsupported);
  assert.equal(reads, 0);
});
