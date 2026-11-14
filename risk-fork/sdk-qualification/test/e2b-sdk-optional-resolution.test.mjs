import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  createE2BRuntimeSdkIntegrityVerifier,
  loadVerifiedE2BRuntimeSdk,
} from '../../src/e2b-qualification.mjs';

// Synthetic packages only: no SDK download, provider, credential or network use.
async function fixture(t, { optional = true, name = 'risk-fork-synthetic-optional', entry = null } = {}) {
  const root = await mkdtemp(path.join(await realpath(os.tmpdir()), 'risk-fork-sdk-optional-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const sdk = path.join(root, 'inner', 'node_modules', 'e2b');
  const marker = Symbol.for(path.basename(root));
  t.after(() => { delete globalThis[marker]; });
  await mkdir(path.join(sdk, 'dist'), { recursive: true });
  await writeFile(path.join(sdk, 'package.json'), JSON.stringify({
    name: 'e2b', version: '2.63.0', main: 'dist/index.js',
    [optional ? 'optionalDependencies' : 'dependencies']: { [name]: '1.0.0' },
  }));
  await writeFile(path.join(sdk, 'dist', 'index.js'), entry ?? `module.exports = require(${JSON.stringify(name)});\n`);
  const outer = path.join(root, 'node_modules', name);
  const source = `globalThis[Symbol.for(${JSON.stringify(path.basename(root))})] = true; module.exports = {};\n`;
  const verifier = createE2BRuntimeSdkIntegrityVerifier({ packageDirectory: sdk });
  return { root, sdk, name, marker, outer, source, verifier };
}

test('ancestor optional package is rejected before unbound code evaluates', async (t) => {
  const f = await fixture(t);
  await mkdir(f.outer, { recursive: true });
  await writeFile(path.join(f.outer, 'package.json'), JSON.stringify({ name: f.name, version: '1.0.0', main: 'index.js' }));
  await writeFile(path.join(f.outer, 'index.js'), f.source);
  await assert.rejects(async () => {
    const pin = await f.verifier.inspect();
    await loadVerifiedE2BRuntimeSdk(pin, f.verifier);
  }, /outside|closure|absent optional/i);
  assert.equal(globalThis[f.marker], undefined, 'unbound optional code must not execute');
});

async function writePackage(root, name, source, manifest = {}) {
  await mkdir(root, { recursive: true });
  await writeFile(path.join(root, 'package.json'), JSON.stringify({ name, version: '1.0.0', main: 'index.js', ...manifest }));
  await writeFile(path.join(root, 'index.js'), source);
}

for (const [label, manifest] of [
  ['broken main', { main: 'missing.js' }],
  ['hidden root export', { exports: { './subpath': './subpath.js' } }],
]) {
  test(`ancestor optional package with ${label} is rejected before a subpath executes`, async (t) => {
    const name = 'risk-fork-synthetic-optional';
    const f = await fixture(t, { entry: `module.exports = require(${JSON.stringify(name + '/subpath')});\n` });
    await mkdir(f.outer, { recursive: true });
    await writeFile(path.join(f.outer, 'package.json'), JSON.stringify({ name: f.name, version: '1.0.0', ...manifest }));
    await writeFile(path.join(f.outer, 'subpath.js'), f.source);
    await assert.rejects(f.verifier.inspect(), /outside|closure|absent optional/i);
    assert.equal(globalThis[f.marker], undefined);
  });
}

test('dangling ancestor optional symlink cannot establish absence', async (t) => {
  const f = await fixture(t);
  await mkdir(path.dirname(f.outer), { recursive: true });
  try { await symlink(path.join(f.root, 'missing'), f.outer, 'dir'); }
  catch (error) {
    if (process.platform === 'win32' && ['EPERM', 'EACCES'].includes(error.code)) { t.skip('symlink privilege unavailable'); return; }
    throw error;
  }
  await assert.rejects(f.verifier.inspect(), /outside|closure|absent optional/i);
});

test('ancestor legacy optional file is rejected', async (t) => {
  const f = await fixture(t);
  await mkdir(path.dirname(f.outer), { recursive: true });
  await writeFile(`${f.outer}.js`, f.source);
  await assert.rejects(f.verifier.inspect(), /outside|closure|absent optional/i);
  assert.equal(globalThis[f.marker], undefined);
});

test('scoped ancestor optional package is rejected', async (t) => {
  const f = await fixture(t, { name: '@risk-fork-synthetic/optional' });
  await writePackage(f.outer, f.name, f.source);
  await assert.rejects(f.verifier.inspect(), /outside|closure|absent optional/i);
  assert.equal(globalThis[f.marker], undefined);
});

function runFreshWorker(source) {
  const env = {};
  if (process.platform === 'win32' && process.env.SystemRoot) env.SystemRoot = process.env.SystemRoot;
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', source], {
    env, encoding: 'utf8', timeout: 10_000,
  });
  assert.ifError(child.error);
  assert.equal(child.status, 0, child.stderr);
}

function freshLoadSource(f, setup = '') {
  return `
    import assert from 'node:assert/strict';
    import { createRequire } from 'node:module';
    import { rm } from 'node:fs/promises';
    import { createE2BRuntimeSdkIntegrityVerifier, loadVerifiedE2BRuntimeSdk } from ${JSON.stringify(new URL('../../src/e2b-qualification.mjs', import.meta.url).href)};
    ${setup}
    const verifier = createE2BRuntimeSdkIntegrityVerifier({ packageDirectory: ${JSON.stringify(f.sdk)} });
    const pin = await verifier.inspect();
    assert.equal((await loadVerifiedE2BRuntimeSdk(pin, verifier)).module.default.ok, true);
  `;
}

test('truly absent optional package remains loadable in a fresh worker', async (t) => {
  const f = await fixture(t, { entry: 'module.exports = { ok: true };\n' });
  runFreshWorker(freshLoadSource(f));
});

test('missing required dependency is rejected', async (t) => {
  const f = await fixture(t, { optional: false });
  await assert.rejects(f.verifier.inspect(), /required but missing/i);
});

test('ancestor appearing after pin is rejected before root evaluation', async (t) => {
  const f = await fixture(t, { entry: `globalThis[Symbol.for('risk-fork-root-marker')] = true; module.exports = {};\n` });
  t.after(() => { delete globalThis[Symbol.for('risk-fork-root-marker')]; });
  const pin = await f.verifier.inspect();
  await writePackage(f.outer, f.name, f.source);
  await assert.rejects(loadVerifiedE2BRuntimeSdk(pin, f.verifier), /outside|closure|absent optional/i);
  assert.equal(globalThis[Symbol.for('risk-fork-root-marker')], undefined);
  assert.equal(globalThis[f.marker], undefined);
});

test('bound optional package inside anchor remains loadable', async (t) => {
  const f = await fixture(t);
  const bound = path.join(path.dirname(f.sdk), f.name);
  await writePackage(bound, f.name, f.source);
  const pin = await f.verifier.inspect();
  await loadVerifiedE2BRuntimeSdk(pin, f.verifier);
  assert.equal(globalThis[f.marker], true);
});

test('optional Node builtin cannot be treated as absent', async (t) => {
  const f = await fixture(t, { name: 'fs', entry: 'module.exports = {};\n' });
  await assert.rejects(f.verifier.inspect(), /outside|closure|absent optional/i);
});


test('optional peer outside the anchor is rejected', async (t) => {
  const f = await fixture(t);
  await writeFile(path.join(f.sdk, 'package.json'), JSON.stringify({
    name: 'e2b', version: '2.63.0', main: 'dist/index.js',
    peerDependencies: { [f.name]: '1.0.0' }, peerDependenciesMeta: { [f.name]: { optional: true } },
  }));
  await writePackage(f.outer, f.name, f.source);
  await assert.rejects(f.verifier.inspect(), /outside|closure|absent optional/i);
  assert.equal(globalThis[f.marker], undefined);
});


test('NODE_PATH optional fallback is rejected in an isolated process', async (t) => {
  const f = await fixture(t);
  const globals = path.join(f.root, 'global-modules');
  await writePackage(path.join(globals, f.name), f.name, f.source);
  const source = `
    import assert from 'node:assert/strict';
    import { createE2BRuntimeSdkIntegrityVerifier } from ${JSON.stringify(new URL('../../src/e2b-qualification.mjs', import.meta.url).href)};
    const verifier = createE2BRuntimeSdkIntegrityVerifier({ packageDirectory: ${JSON.stringify(f.sdk)} });
    await assert.rejects(verifier.inspect(), /outside|closure|absent optional/i);
    assert.equal(globalThis[Symbol.for(${JSON.stringify(path.basename(f.root))})], undefined);
  `;
  const env = { NODE_PATH: globals };
  if (process.platform === 'win32' && process.env.SystemRoot) env.SystemRoot = process.env.SystemRoot;
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', source], {
    env, encoding: 'utf8', timeout: 10_000,
  });
  assert.ifError(child.error);
  assert.equal(child.status, 0, child.stderr);
});


test('stale uncached resolution permits true absence in a fresh worker', async (t) => {
  const f = await fixture(t, { entry: 'module.exports = { ok: true };\n' });
  await writePackage(f.outer, f.name, f.source);
  const setup = `
    const requireFromSdk = createRequire(${JSON.stringify(path.join(f.sdk, 'package.json'))});
    assert.equal(requireFromSdk.resolve(${JSON.stringify(f.name)}), ${JSON.stringify(path.join(f.outer, 'index.js'))});
    assert.equal(globalThis[Symbol.for(${JSON.stringify(path.basename(f.root))})], undefined);
    await rm(${JSON.stringify(f.outer)}, { recursive: true, force: true });
  `;
  runFreshWorker(freshLoadSource(f, setup));
});

test('deleted ancestor package with cached executable remains rejected', async (t) => {
  const f = await fixture(t, { entry: 'module.exports = {};\n' });
  await writePackage(f.outer, f.name, f.source);
  const requireFromSdk = createRequire(path.join(f.sdk, 'package.json'));
  const resolved = requireFromSdk.resolve(f.name);
  t.after(() => { delete requireFromSdk.cache[resolved]; });
  requireFromSdk(f.name);
  assert.equal(globalThis[f.marker], true);
  delete globalThis[f.marker];
  await rm(f.outer, { recursive: true, force: true });
  await assert.rejects(f.verifier.inspect(), /outside|closure|absent optional/i);
  assert.equal(globalThis[f.marker], undefined);
});

test('hosted bundle rejects unbound ancestor optional before evaluation', async (t) => {
  const f = await fixture(t);
  await writePackage(f.outer, f.name, f.source);
  const hosted = await import('../../../risk-fork-hosted-mcp/dist/runtime/index.mjs');
  const verifier = hosted.createE2BRuntimeSdkIntegrityVerifier({ packageDirectory: f.sdk });
  await assert.rejects(async () => {
    const pin = await verifier.inspect();
    await hosted.loadVerifiedE2BRuntimeSdk(pin, verifier);
  }, /outside|closure|absent optional/i);
  assert.equal(globalThis[f.marker], undefined);
});


test('deleted ancestor package with cached subpath remains rejected', async (t) => {
  const f = await fixture(t, { entry: 'module.exports = {};\n' });
  await mkdir(f.outer, { recursive: true });
  await writeFile(path.join(f.outer, 'package.json'), JSON.stringify({ name: f.name, version: '1.0.0' }));
  await writeFile(path.join(f.outer, 'subpath.js'), f.source);
  const requireFromSdk = createRequire(path.join(f.sdk, 'package.json'));
  const spec = `${f.name}/subpath`;
  const resolved = requireFromSdk.resolve(spec);
  t.after(() => { delete requireFromSdk.cache[resolved]; });
  requireFromSdk(spec);
  assert.equal(globalThis[f.marker], true);
  delete globalThis[f.marker];
  await rm(f.outer, { recursive: true, force: true });
  assert.doesNotThrow(() => requireFromSdk(spec));
  await assert.rejects(f.verifier.inspect(), /outside|closure|absent optional/i);
  assert.equal(globalThis[f.marker], undefined);
});


test('deleted ancestor symlink with cached subpath remains rejected', async (t) => {
  const rootMarker = Symbol.for('risk-fork-symlink-root-marker');
  t.after(() => { delete globalThis[rootMarker]; });
  const f = await fixture(t, { entry: `globalThis[Symbol.for('risk-fork-symlink-root-marker')] = true; module.exports = {};\n` });
  const target = path.join(f.root, 'external-target');
  await mkdir(target, { recursive: true });
  await mkdir(path.dirname(f.outer), { recursive: true });
  await writeFile(path.join(target, 'package.json'), JSON.stringify({ name: f.name, version: '1.0.0' }));
  await writeFile(path.join(target, 'subpath.js'), f.source);
  try { await symlink(target, f.outer, 'dir'); }
  catch (error) {
    if (process.platform === 'win32' && ['EPERM', 'EACCES'].includes(error.code)) { t.skip('symlink privilege unavailable'); return; }
    throw error;
  }
  const requireFromSdk = createRequire(path.join(f.sdk, 'package.json'));
  const spec = `${f.name}/subpath`;
  const resolved = requireFromSdk.resolve(spec);
  t.after(() => { delete requireFromSdk.cache[resolved]; });
  requireFromSdk(spec);
  assert.equal(globalThis[f.marker], true);
  delete globalThis[f.marker];
  await rm(f.outer);
  assert.doesNotThrow(() => requireFromSdk(spec));
  const pin = await f.verifier.inspect();
  await assert.rejects(loadVerifiedE2BRuntimeSdk(pin, f.verifier), /cache|provenance|restart/i);
  assert.equal(globalThis[rootMarker], undefined);
  assert.equal(globalThis[f.marker], undefined);
});


test('unrelated cached module prevents absent-optional load before SDK evaluation', async (t) => {
  const rootMarker = Symbol.for('risk-fork-unrelated-root-marker');
  t.after(() => { delete globalThis[rootMarker]; });
  const f = await fixture(t, { entry: `globalThis[Symbol.for('risk-fork-unrelated-root-marker')] = true; module.exports = {};\n` });
  const unrelated = path.join(f.root, 'unrelated.cjs');
  await writeFile(unrelated, 'module.exports = {};\n');
  const requireFromSdk = createRequire(path.join(f.sdk, 'package.json'));
  requireFromSdk(unrelated);
  t.after(() => { delete requireFromSdk.cache[unrelated]; });
  const pin = await f.verifier.inspect();
  await assert.rejects(loadVerifiedE2BRuntimeSdk(pin, f.verifier), /cache|provenance|restart/i);
  assert.equal(globalThis[rootMarker], undefined);
});
