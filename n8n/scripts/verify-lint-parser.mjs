import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { closeSync, constants, fstatSync, lstatSync, openSync, readFileSync, readdirSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
export const fixtureRoot = path.join(root, 'fixtures/lint-parser');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const json = file => JSON.parse(readPlainFile(file).toString('utf8'));
const pins = Object.freeze({
  upstream_package: '@typescript-eslint/typescript-estree',
  upstream_version: '8.72.2',
  upstream_integrity: 'sha512-pQEGqIK/cqEvKivVWaFLYpe7XYejFxfuAOi4mu1oAWFvIo36aRHI9esRFTUxcIy/z8N482RJyH+LpZB0ZIU7Ow==',
  upstream_package_json_sha256: 'e80c0a230f1d94751af1a91ce2431759781f40e206f8d9b67f0b7db90714c39c',
  upstream_fix_commit: '837401e92d7379a8623ccf6a0883250f4e706ad7',
  local_version: '8.72.2+agoragentic.minimatch.1',
  minimatch_range: '^11.0.1',
  artifact_inventory_sha256: '623f261482104ff86492e34e9eb3d71bfd52292dc879d28125a543b7b60e5d1c',
});

function plain(file, kind = 'file') {
  const stat = lstatSync(file);
  assert.ok(!stat.isSymbolicLink() && (kind === 'directory' ? stat.isDirectory() : stat.isFile()),
    `Expected plain ${kind}: ${file}`);
}

export function readPlainFile(file) {
  // Read and inspect the same opened object. O_NOFOLLOW is unavailable on
  // Windows, so also bind the non-symlink path entry to the descriptor identity.
  const descriptor = openSync(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0) | (constants.O_NONBLOCK ?? 0));
  try {
    const opened = fstatSync(descriptor, { bigint: true });
    assert.ok(opened.isFile(), `Expected plain file: ${file}`);
    const checkEntry = () => {
      const entry = lstatSync(file, { bigint: true });
      assert.ok(!entry.isSymbolicLink() && entry.isFile(), `Expected plain file: ${file}`);
      assert.equal(entry.dev, opened.dev, `File changed while verifying: ${file}`);
      assert.equal(entry.ino, opened.ino, `File changed while verifying: ${file}`);
    };
    checkEntry();
    const bytes = readFileSync(descriptor);
    const completed = fstatSync(descriptor, { bigint: true });
    for (const key of ['dev', 'ino', 'size', 'mtimeNs', 'ctimeNs']) {
      assert.equal(completed[key], opened[key], `File changed while verifying: ${file}`);
    }
    checkEntry();
    return bytes;
  } finally {
    closeSync(descriptor);
  }
}

function inventoryFiles(directory, relative = '') {
  plain(directory, 'directory');
  return readdirSync(directory).sort().flatMap(name => {
    // Installed transitive dependencies are checked through the lock and audit.
    if (name === 'node_modules') return [];
    const file = path.join(directory, name);
    const entry = relative ? `${relative}/${name}` : name;
    const stat = lstatSync(file);
    assert.ok(!stat.isSymbolicLink(), `Fixture symlink refused: ${entry}`);
    if (stat.isDirectory()) return inventoryFiles(file, entry);
    if (entry === 'package.json') return [];
    const bytes = readPlainFile(file);
    return [{ path: entry, bytes: bytes.length, sha256: sha256(bytes) }];
  }).sort((a, b) => a.path.localeCompare(b.path, 'en'));
}

export function verifyFixture(directory = fixtureRoot) {
  if (directory === fixtureRoot) plain(path.dirname(directory), 'directory');
  plain(directory, 'directory');
  const manifest = json(path.join(directory, 'manifest.json'));
  assert.equal(manifest.schema, 'agoragentic.n8n-lint-parser-fixture.v1');
  for (const [key, value] of Object.entries(pins)) assert.equal(manifest[key], value, key);
  assert.equal(manifest.published, false);
  assert.equal(manifest.runtime_code_changed, false);
  assert.equal(manifest.unchanged_artifact_files, 90);
  const upstreamBytes = readPlainFile(path.join(directory, 'upstream-package.json'));
  assert.equal(sha256(upstreamBytes), pins.upstream_package_json_sha256);
  const inventoryBytes = readPlainFile(path.join(directory, 'artifact-inventory.json'));
  assert.equal(sha256(inventoryBytes), pins.artifact_inventory_sha256);
  const expected = JSON.parse(upstreamBytes.toString('utf8'));
  assert.equal(expected.name, pins.upstream_package);
  assert.equal(expected.version, pins.upstream_version);
  assert.equal(expected.dependencies.minimatch, '^10.2.2');
  expected.version = pins.local_version;
  expected.private = true;
  expected.dependencies.minimatch = pins.minimatch_range;
  // This is the published, precompiled consumer package. Upstream's monorepo
  // build/test commands are neither present nor executed here.
  delete expected.devDependencies;
  delete expected.scripts;
  const packageRoot = path.join(directory, 'package');
  plain(packageRoot, 'directory');
  assert.deepEqual(json(path.join(packageRoot, 'package.json')), expected);
  const recorded = JSON.parse(inventoryBytes.toString('utf8'));
  assert.equal(recorded.length, 90);
  assert.deepEqual(inventoryFiles(packageRoot), recorded.slice().sort((a, b) => a.path.localeCompare(b.path, 'en')));
  return { unchanged_artifact_files: recorded.length, local_version: pins.local_version };
}

export function verifyInstalled() {
  const require = createRequire(path.join(root, 'package.json'));
  const expectedManifest = realpathSync(path.join(fixtureRoot, 'package/package.json'));
  for (const consumer of ['typescript-eslint', '@typescript-eslint/parser', '@typescript-eslint/utils', '@n8n/eslint-plugin-community-nodes']) {
    const consumerRequire = createRequire(require.resolve(consumer));
    assert.equal(realpathSync(consumerRequire.resolve('@typescript-eslint/typescript-estree/package.json')),
      expectedManifest, `Unexpected parser for ${consumer}`);
  }
  const packageJson = json(path.join(root, 'package.json'));
  assert.equal(packageJson.devDependencies['@typescript-eslint/typescript-estree'], 'file:fixtures/lint-parser/package');
  assert.equal(packageJson.overrides, undefined);
  assert.equal(packageJson.resolutions, undefined);
  const lock = json(path.join(root, 'package-lock.json'));
  const parserLink = lock.packages['node_modules/@typescript-eslint/typescript-estree'];
  assert.deepEqual(parserLink, { resolved: 'fixtures/lint-parser/package', link: true });
  assert.equal(lock.packages['fixtures/lint-parser/package'].version, pins.local_version);
  for (const [name, pkg] of Object.entries(lock.packages)) {
    if (name.endsWith('/node_modules/@typescript-eslint/typescript-estree')) {
      assert.fail(`Unexpected nested parser: ${name}`);
    }
    if (name.endsWith('/minimatch') && pkg.version) {
      const [major, minor, patch] = pkg.version.split('.').map(Number);
      assert.ok(!(major >= 7 && major < 11) && !(major === 11 && minor === 0 && patch === 0),
        `Affected minimatch in lock: ${name}@${pkg.version}`);
    }
  }
  const parserRequire = createRequire(expectedManifest);
  const minimatch = json(parserRequire.resolve('minimatch/package.json'));
  assert.equal(minimatch.version, lock.packages['node_modules/minimatch'].version);
  assert.equal(minimatch.version, '11.0.8');
  return { consumers: 4, minimatch: minimatch.version };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const archiveFlag = process.argv.indexOf('--archive');
  if (archiveFlag !== -1) {
    const archive = process.argv[archiveFlag + 1];
    assert.ok(archive, '--archive needs a path');
    const integrity = `sha512-${createHash('sha512').update(readPlainFile(archive)).digest('base64')}`;
    assert.equal(integrity, pins.upstream_integrity);
  }
  console.log(JSON.stringify({ ...verifyFixture(), ...verifyInstalled() }));
}
