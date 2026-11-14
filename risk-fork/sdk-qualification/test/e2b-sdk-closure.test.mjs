import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createRequire } from 'node:module';
import { createE2BRuntimeSdkIntegrityVerifier, loadVerifiedE2BRuntimeSdk } from '../../src/e2b-qualification.mjs';
const sdkRequire = createRequire(new URL('../package.json', import.meta.url));
async function canonicalFixtureRoot(prefix) {
  const canonicalTemp = await realpath(os.tmpdir());
  const root = await mkdtemp(path.join(canonicalTemp, prefix));
  const canonicalRoot = await realpath(root);
  return canonicalRoot;
}

test('runtime SDK integrity verifier loads only the exact signed e2b package tree', async (t) => {
  const root = await canonicalFixtureRoot('risk-fork-e2b-sdk-integrity-');
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'dist'), { recursive: true });
  await writeFile(path.join(root, 'package.json'), JSON.stringify({
    name: 'e2b',
    version: '2.63.0',
    main: 'dist/index.js',
  }));
  await writeFile(path.join(root, 'dist', 'index.js'), 'module.exports = { Sandbox: class Sandbox {} };\n');

  const verifier = createE2BRuntimeSdkIntegrityVerifier({ packageDirectory: root });
  const inspected = await verifier.inspect();
  const loaded = await loadVerifiedE2BRuntimeSdk(inspected, verifier);
  assert.equal(loaded.package, 'e2b');
  assert.equal(loaded.version, '2.63.0');
  assert.equal(loaded.integrity_hash, inspected.integrity_hash);
  assert.equal(typeof loaded.module.default.Sandbox, 'function');

  await writeFile(path.join(root, 'dist', 'index.js'), 'module.exports = { Sandbox: class Tampered {} };\n');
  await assert.rejects(
    loadVerifiedE2BRuntimeSdk(inspected, verifier),
    /integrity|binding|changed/i,
  );
  await assert.rejects(
    loadVerifiedE2BRuntimeSdk(inspected, Object.freeze({
      inspect: async () => inspected,
      load: async () => ({ module: { Sandbox: class Sandbox {} }, ...inspected }),
    })),
    /trusted|verifier|factory/i,
  );
});

async function writeRuntimePackage(root, manifest, source = 'module.exports = {};\n') {
  await mkdir(root, { recursive: true });
  await writeFile(path.join(root, 'package.json'), JSON.stringify(manifest));
  await writeFile(path.join(root, manifest.main ?? 'index.js'), source);
}

test('runtime SDK closure binds recursive dependencies plus present and absent optional peers', async (t) => {
  const fixture = await canonicalFixtureRoot('risk-fork-e2b-sdk-closure-');
  t.after(() => rm(fixture, { recursive: true, force: true }));
  const modules = path.join(fixture, 'node_modules');
  const sdkRoot = path.join(modules, 'e2b');
  const importMarker = '__riskForkSyntheticClosureImported';
  delete globalThis[importMarker];
  t.after(() => { delete globalThis[importMarker]; });
  await mkdir(path.join(sdkRoot, 'dist'), { recursive: true });
  await writeFile(path.join(sdkRoot, 'package.json'), JSON.stringify({
    name: 'e2b',
    version: '2.63.0',
    main: 'dist/index.js',
    dependencies: { 'required-dependency': '1.0.0' },
    optionalDependencies: {
      'present-optional': '1.0.0',
      'late-optional': '1.0.0',
    },
    peerDependencies: {
      'required-peer': '1.0.0',
      'optional-peer': '1.0.0',
    },
    peerDependenciesMeta: {
      'optional-peer': { optional: true },
    },
  }));
  await writeFile(
    path.join(sdkRoot, 'dist', 'index.js'),
    `globalThis.${importMarker} = true; module.exports = { Sandbox: class Sandbox {} };\n`,
  );
  await writeRuntimePackage(path.join(modules, 'required-dependency'), {
    name: 'required-dependency',
    version: '1.0.0',
    main: 'index.js',
    dependencies: { 'transitive-dependency': '1.0.0' },
  });
  await writeRuntimePackage(path.join(modules, 'transitive-dependency'), {
    name: 'transitive-dependency',
    version: '1.0.0',
    main: 'index.js',
  });
  await writeRuntimePackage(path.join(modules, 'present-optional'), {
    name: 'present-optional',
    version: '1.0.0',
    main: 'index.js',
  });
  await writeRuntimePackage(path.join(modules, 'required-peer'), {
    name: 'required-peer',
    version: '1.0.0',
    main: 'index.js',
  });

  const verifier = createE2BRuntimeSdkIntegrityVerifier({ packageDirectory: sdkRoot });
  const absentOptionalBinding = await verifier.inspect();
  await writeRuntimePackage(path.join(modules, 'optional-peer'), {
    name: 'optional-peer',
    version: '1.0.0',
    main: 'index.js',
  });
  const presentOptionalPeerBinding = await verifier.inspect();
  assert.notEqual(
    presentOptionalPeerBinding.integrity_hash,
    absentOptionalBinding.integrity_hash,
    'installing a previously absent optional peer must change the closure binding',
  );
  await rm(path.join(modules, 'optional-peer'), { recursive: true, force: true });

  await writeRuntimePackage(path.join(modules, 'late-optional'), {
    name: 'late-optional',
    version: '1.0.0',
    main: 'index.js',
  });
  await assert.rejects(
    loadVerifiedE2BRuntimeSdk(absentOptionalBinding, verifier),
    /integrity|binding/i,
  );
  assert.equal(globalThis[importMarker], undefined, 'optional drift must fail before SDK import');
  await rm(path.join(modules, 'late-optional'), { recursive: true, force: true });
  await rm(path.join(modules, 'required-peer'), { recursive: true, force: true });
  await assert.rejects(
    loadVerifiedE2BRuntimeSdk(absentOptionalBinding, verifier),
    /required-peer|required.*missing/i,
  );
  assert.equal(globalThis[importMarker], undefined, 'missing required peer must fail before import');
});

test('copied installed e2b closure rejects transitive drift, missing packages, and substitution before import', async (t) => {
  const installedEntry = sdkRequire.resolve('e2b');
  let installedRoot = path.dirname(installedEntry);
  let foundInstalledRoot = false;
  for (let depth = 0; depth < 8; depth += 1) {
    try {
      const manifest = JSON.parse(await readFile(path.join(installedRoot, 'package.json'), 'utf8'));
      if (manifest.name === 'e2b') {
        foundInstalledRoot = true;
        break;
      }
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
    installedRoot = path.dirname(installedRoot);
  }
  assert.equal(foundInstalledRoot, true, 'the real installed e2b package root must be discoverable');
  const installedModules = path.dirname(installedRoot);
  const fixture = await canonicalFixtureRoot('risk-fork-real-e2b-closure-');
  t.after(() => rm(fixture, { recursive: true, force: true }));
  const copiedModules = path.join(fixture, 'node_modules');
  await cp(installedModules, copiedModules, { recursive: true, errorOnExist: true });
  const copiedSdkRoot = path.join(copiedModules, 'e2b');
  const copiedSdkEntry = path.join(copiedSdkRoot, 'dist', 'index.js');
  const originalSdkBytes = await readFile(copiedSdkEntry);
  const sdkImportMarker = '__riskForkCopiedSdkImported';
  delete globalThis[sdkImportMarker];
  await writeFile(
    copiedSdkEntry,
    Buffer.concat([
      Buffer.from(`globalThis.${sdkImportMarker} = true;\n`, 'utf8'),
      originalSdkBytes,
    ]),
  );
  const copiedVerifier = createE2BRuntimeSdkIntegrityVerifier({
    packageDirectory: copiedSdkRoot,
  });
  const expected = await copiedVerifier.inspect();
  const transitiveRoot = path.join(copiedModules, 'openapi-fetch');
  const transitiveEntry = path.join(transitiveRoot, 'dist', 'index.cjs');
  const originalTransitiveBytes = await readFile(transitiveEntry);
  const importMarker = '__riskForkTamperedTransitiveImported';
  delete globalThis[importMarker];
  t.after(() => {
    delete globalThis[sdkImportMarker];
    delete globalThis[importMarker];
  });
  await writeFile(
    transitiveEntry,
    Buffer.concat([
      Buffer.from(`globalThis.${importMarker} = true;\n`, 'utf8'),
      originalTransitiveBytes,
    ]),
  );
  await assert.rejects(
    loadVerifiedE2BRuntimeSdk(expected, copiedVerifier),
    /integrity|binding/i,
  );
  assert.equal(
    globalThis[importMarker],
    undefined,
    'a copied transitive dependency must be rejected before its executable bytes import',
  );
  assert.equal(
    globalThis[sdkImportMarker],
    undefined,
    'transitive drift must be rejected before the copied root SDK import begins',
  );

  await writeFile(transitiveEntry, originalTransitiveBytes);
  await rm(transitiveRoot, { recursive: true, force: true });
  await assert.rejects(
    loadVerifiedE2BRuntimeSdk(expected, copiedVerifier),
    /openapi-fetch|required.*missing/i,
  );
  assert.equal(globalThis[sdkImportMarker], undefined);
  assert.equal(globalThis[importMarker], undefined);

  await cp(
    path.join(installedModules, 'chalk'),
    transitiveRoot,
    { recursive: true, errorOnExist: true },
  );
  await assert.rejects(
    loadVerifiedE2BRuntimeSdk(expected, copiedVerifier),
    /package identity mismatch|expected openapi-fetch.*observed chalk/i,
  );
  assert.equal(globalThis[sdkImportMarker], undefined);
  assert.equal(globalThis[importMarker], undefined);
});
