import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const sdkRoot = path.join(root, 'sdk');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

test('public SDK source versions and repository paths are synchronized', () => {
  const nodePackage = readJson('sdk/node/package.json');
  const cliPackage = readJson('sdk/agent-os-cli/package.json');
  const pythonProject = read('sdk/python/pyproject.toml');
  const pythonInit = read('sdk/python/src/agoragentic/__init__.py');
  const pythonClient = read('sdk/python/src/agoragentic/client.py');

  assert.equal(nodePackage.version, '1.7.1');
  assert.equal(cliPackage.version, '1.7.1');
  assert.equal(cliPackage.dependencies.agoragentic, '^1.7.1');
  assert.equal(nodePackage.repository.directory, 'sdk/node');
  assert.equal(cliPackage.repository.directory, 'sdk/agent-os-cli');
  assert.match(pythonProject, /^version = "1\.7\.1"$/m);
  assert.match(pythonInit, /^__version__ = "1\.7\.1"$/m);
  assert.match(pythonClient, /^_SDK_VERSION = "1\.7\.1"$/m);
});

test('Node ESM source imports and exposes the documented entry contract', async () => {
  const entry = path.join(sdkRoot, 'node', 'index.mjs');
  const mod = await import(pathToFileURL(entry).href);
  assert.ok(mod.default);
  assert.equal(mod.agoragentic, mod.default);
  assert.equal(typeof mod.AgoragenticClient, 'function');
});

test('public package mirror excludes the obsolete root Python package and retired Syrin exports', () => {
  assert.equal(fs.existsSync(path.join(root, 'pyproject.toml')), false);
  assert.equal(fs.existsSync(path.join(root, 'src', 'agoragentic')), false);
  assert.match(read('.gitignore'), /^sdk\/python\/src\/\*\.egg-info\/$/m);

  const publicPackageFiles = [
    'sdk/node/package.json',
    'sdk/node/index.js',
    'sdk/node/index.d.ts',
    'sdk/python/pyproject.toml',
    'sdk/python/src/agoragentic/__init__.py',
  ];
  for (const relativePath of publicPackageFiles) {
    assert.doesNotMatch(read(relativePath), /syrin/i, `${relativePath} must not expose retired Syrin package APIs`);
  }
});

test('PyPI trusted publishing builds from the public sdk/python source', () => {
  const assertHandoff = (workflow) => {
    const text = workflow.replaceAll('\r\n', '\n');
    const buildStart = text.indexOf('\n  build:');
    const publishStart = text.indexOf('\n  publish:');
    assert.ok(buildStart >= 0 && publishStart > buildStart, 'build and publish must be separate jobs');
    const buildJob = text.slice(buildStart, publishStart);
    const publishJob = text.slice(publishStart);

    assert.match(buildJob, /working-directory: sdk\/python/);
    const permissions = (job) => job.match(/^    permissions:\n((?:      [^\n]*\n)+)/m)?.[1].trim().split('\n').map((line) => line.trim()).sort();
    assert.deepEqual(permissions(buildJob), ['contents: read'], 'build permissions must remain read-only');
    assert.doesNotMatch(buildJob, /id-token:\s*write/);
    assert.match(buildJob, /python -m pip install --require-hashes --only-binary=:all: -r requirements-build\.txt/);
    assert.match(buildJob, /python -m build --no-isolation/);
    assert.match(buildJob, /env:\n\s+RELEASE_TAG: \$\{\{ github\.event\.release\.tag_name \}\}/);
    assert.match(buildJob, /test "\$\{RELEASE_TAG\}" = "py-v\$\{package_version\}"/);
    assert.match(buildJob, /path: sdk\/python\/dist\//);
    assert.match(buildJob, /actions\/upload-artifact@cf430e030ddbb5b0abf93d22962f4752f3646cd9/);

    const uploadName = buildJob.match(/name: (agoragentic-python-\$\{\{ github\.event\.release\.tag_name \}\})/);
    const downloadName = publishJob.match(/name: (agoragentic-python-\$\{\{ github\.event\.release\.tag_name \}\})/);
    assert.ok(uploadName && downloadName, 'build and publish must name the artifact');
    assert.equal(uploadName[1], downloadName[1], 'publish must download the exact build artifact');
    assert.match(publishJob, /needs: build/);
    assert.deepEqual(permissions(publishJob), ['contents: read', 'id-token: write']);
    assert.match(publishJob, /actions\/download-artifact@9000827ccba6bdab643e8b6fd33ac0654aef8333/);
    assert.match(publishJob, /path: dist\//);
    assert.match(publishJob, /pypa\/gh-action-pypi-publish@7245906fb61fa33a13554f9d5fb856fe61758086/);
    assert.match(publishJob, /packages-dir: dist\//);
    assert.equal((publishJob.match(/uses:/g) ?? []).length, 2, 'publisher may only download and invoke PyPI publisher');
    assert.doesNotMatch(publishJob, /actions\/checkout@|\brun:\s*|python -m build/);
    assert.doesNotMatch(text, /password:|api-token:|PYPI_API_TOKEN/);
  };

  const workflow = read('.github/workflows/publish-pypi.yml').replaceAll('\r\n', '\n');
  assertHandoff(workflow);
  assert.throws(() => assertHandoff(workflow.replace('name: agoragentic-python-${{ github.event.release.tag_name }}', 'name: wrong-artifact')), /artifact/);
  assert.throws(() => assertHandoff(workflow.replace('contents: read', 'contents: read\n      id-token: write')), /build permissions/);
  assert.throws(() => assertHandoff(workflow.replace('--require-hashes', '--no-deps')), /--require-hashes/);
  assert.throws(() => assertHandoff(workflow.replace('      - name: Publish to PyPI with Trusted Publishing', '      - uses: actions\/checkout@deadbeef\n\n      - name: Publish to PyPI with Trusted Publishing')), /publisher may only/);
  assert.throws(() => assertHandoff(workflow.replace('      - name: Publish to PyPI with Trusted Publishing', '      - name: Unexpected publisher run\n        run: echo bad\n\n      - name: Publish to PyPI with Trusted Publishing')), /run:/);
});

test('active trusted publishers bind release tags through environment variables', () => {
  const workflow = read('.github/workflows/publish-pypi.yml');
  assert.match(workflow, /RELEASE_TAG: \$\{\{ github\.event\.release\.tag_name \}\}/);
  assert.match(workflow, /test "\$\{RELEASE_TAG\}"/);
  assert.doesNotMatch(workflow, /test "\$\{\{ github\.event\.release\.tag_name \}\}"/);
});

test('disabled MCP publication workflow remains a manual read-only guard', () => {
  const workflow = read('.github/workflows/publish-mcp.yml');
  assert.match(workflow, /^\s*workflow_dispatch:\s*$/m);
  assert.match(workflow, /^\s*contents:\s*read\s*$/m);
  assert.doesNotMatch(workflow, /^\s*(?:release|push|pull_request|schedule|workflow_run):\s*$/m);
  assert.doesNotMatch(workflow, /npm\s+publish/i);
  assert.doesNotMatch(workflow, /id-token:\s*write/i);
});
