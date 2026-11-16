import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstat, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const packageRoot = fileURLToPath(new URL('../', import.meta.url));
const cli = path.join(packageRoot, 'scripts/client-adoption.mjs');
const injector = new URL('./fixtures/client-review-write-failure.mjs', import.meta.url).href;

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), 'risk-fork-review-recovery-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const gateway = path.join(root, 'risk-forkd.js');
  const bytes = Buffer.from("throw new Error('review must never execute the gateway');\n");
  await writeFile(gateway, bytes);
  const hash = `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
  const output = path.join(root, 'review');
  function run(args, failure) {
    return spawnSync(process.execPath, [
      ...(failure ? ['--import', injector] : []), cli, ...args,
      '--gateway', gateway, '--gateway-sha256', hash,
    ], {
      encoding: 'utf8', timeout: 20_000, windowsHide: true,
      env: {
        ...process.env, NODE_OPTIONS: '', NODE_PATH: '',
        RISK_FORK_TEST_REVIEW_OUTPUT: output,
        RISK_FORK_TEST_REVIEW_FILENAME: failure?.filename ?? '',
        RISK_FORK_TEST_REVIEW_FAILURE: failure?.mode ?? '',
      },
    });
  }
  return {
    output,
    write: (failure) => run(['write-review', '--client', 'all', '--output', output, '--yes'], failure),
    verify: () => run(['verify-review', '--manifest', path.join(output, 'manifest.json')]),
  };
}

const filenames = [
  'claude-code-risk-fork.disabled.mcp.json',
  'claude-code-risk-fork.disabled.settings.json',
  'codex-risk-fork.disabled.toml',
  'cursor-risk-fork.disabled.mcp.json',
  'cursor-risk-fork.disabled.permissions.json',
  'manifest.json',
];

for (const filename of filenames) {
  test(`review write failure in ${filename} rolls back and permits verified retry`, async (t) => {
    const f = await fixture(t);
    const failed = f.write({ filename, mode: 'partial' });
    assert.equal(failed.status, 64, failed.stderr);
    const error = JSON.parse(failed.stderr);
    assert.equal(error.message, 'injected partial review write');
    assert.equal(error.review_cleanup_status, 'removed');
    assert.equal(error.client_enabled, false);
    assert.equal(error.provider_calls, 0);
    assert.equal(failed.stdout, '');
    await assert.rejects(lstat(f.output), { code: 'ENOENT' });
    const retry = f.write();
    assert.equal(retry.status, 0, retry.stderr);
    assert.deepEqual((await readdir(f.output)).sort(), [...filenames].sort());
    const verified = f.verify();
    assert.equal(verified.status, 0, verified.stderr);
    assert.equal(JSON.parse(verified.stdout).files_verified, 5);
  });
}

for (const mode of ['unexpected', 'replaced', 'changed', 'cleanup-failure']) {
  test(`review rollback preserves files after ${mode}`, async (t) => {
    const f = await fixture(t);
    const filename = filenames[0];
    const failed = f.write({ filename, mode });
    assert.equal(failed.status, 64, failed.stderr);
    assert.equal(JSON.parse(failed.stderr).review_cleanup_status, 'incomplete');
    if (mode === 'unexpected') {
      assert.equal(await readFile(path.join(f.output, 'keep.txt'), 'utf8'), 'unrelated review notes\n');
    } else if (mode === 'replaced' || mode === 'changed') {
      assert.equal(await readFile(path.join(f.output, filename), 'utf8'),
        mode === 'replaced' ? 'replacement contents\n' : 'edited contents\n');
    } else {
      assert.equal((await readFile(path.join(f.output, filename))).length, 17);
    }
    const beforeRetry = await readdir(f.output);
    assert.equal(f.write().status, 64);
    assert.deepEqual(await readdir(f.output), beforeRetry);
    assert.equal(f.verify().status, 64, 'incomplete output must never verify');
  });
}

test('review rollback permits directory link counts that track created file entries', async (t) => {
  const f = await fixture(t);
  const failed = f.write({ filename: 'manifest.json', mode: 'directory-entry-count' });
  assert.equal(failed.status, 64, failed.stderr);
  assert.equal(JSON.parse(failed.stderr).review_cleanup_status, 'removed');
  await assert.rejects(lstat(f.output), { code: 'ENOENT' });
  assert.equal(f.write().status, 0);
  assert.equal(f.verify().status, 0);
});

test('review writer leaves a pre-existing output directory untouched', async (t) => {
  const f = await fixture(t);
  await mkdir(f.output);
  await writeFile(path.join(f.output, 'keep.txt'), 'existing work\n');
  const failed = f.write();
  assert.equal(failed.status, 64);
  assert.equal(JSON.parse(failed.stderr).review_cleanup_status, undefined);
  assert.deepEqual(await readdir(f.output), ['keep.txt']);
  assert.equal(await readFile(path.join(f.output, 'keep.txt'), 'utf8'), 'existing work\n');
});
