import assert from 'node:assert/strict';
import { closeSync, constants, fstatSync, lstatSync, openSync, readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const parserName = '@typescript-eslint/typescript-estree';
const parserLockPath = `node_modules/${parserName}`;
const json = file => JSON.parse(readPlainFile(file).toString('utf8'));

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

export function verifyParserLock(packageJson, lock) {
  assert.equal(packageJson.overrides, undefined);
  assert.equal(packageJson.resolutions, undefined);
  const version = packageJson.devDependencies[parserName];
  assert.match(version, /^\d+\.\d+\.\d+$/);
  assert.equal(packageJson.devDependencies['typescript-eslint'], version);
  assert.equal(lock.packages[''].devDependencies[parserName], version);
  const parser = lock.packages[parserLockPath];
  assert.equal(parser.version, version);
  assert.equal(parser.link, undefined);
  assert.equal(parser.resolved, `https://registry.npmjs.org/${parserName}/-/typescript-estree-${version}.tgz`);
  assert.match(parser.integrity, /^sha512-[A-Za-z0-9+/]{86}==$/);
  for (const [name, pkg] of Object.entries(lock.packages)) {
    if (name.endsWith(`/${parserLockPath}`)) {
      assert.fail(`Unexpected nested parser: ${name}`);
    }
    if (name.endsWith('/minimatch') && pkg.version) {
      const [major, minor, patch] = pkg.version.split('.').map(Number);
      assert.ok(!(major >= 7 && major < 11) && !(major === 11 && minor === 0 && patch === 0),
        `Affected minimatch in lock: ${name}@${pkg.version}`);
    }
  }
  return version;
}

export function verifyInstalled() {
  const require = createRequire(path.join(root, 'package.json'));
  const lock = json(path.join(root, 'package-lock.json'));
  const version = verifyParserLock(json(path.join(root, 'package.json')), lock);
  const expectedManifest = realpathSync(path.join(root, parserLockPath, 'package.json'));
  const installed = json(expectedManifest);
  assert.equal(installed.name, parserName);
  assert.equal(installed.version, version);
  assert.equal(installed.dependencies.minimatch, lock.packages[parserLockPath].dependencies.minimatch);
  const consumers = ['typescript-eslint', '@typescript-eslint/parser', '@typescript-eslint/utils', '@n8n/eslint-plugin-community-nodes'];
  for (const consumer of consumers) {
    const consumerRequire = createRequire(require.resolve(consumer));
    assert.equal(realpathSync(consumerRequire.resolve(`${parserName}/package.json`)),
      expectedManifest, `Unexpected parser for ${consumer}`);
  }
  const parserRequire = createRequire(expectedManifest);
  const minimatchManifest = realpathSync(parserRequire.resolve('minimatch/package.json'));
  const minimatchPath = path.relative(root, path.dirname(minimatchManifest)).split(path.sep).join('/');
  const minimatch = json(minimatchManifest).version;
  assert.equal(lock.packages[minimatchPath]?.version, minimatch);
  assert.match(minimatch, /^11\.(?:0\.[1-9]\d*|[1-9]\d*\.\d+)$/);
  return { parser: version, consumers: consumers.length, minimatch };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(verifyInstalled()));
}
