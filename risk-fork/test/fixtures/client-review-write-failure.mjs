// Test-only filesystem fault injection. The CLI has no injection hook.
import fs from 'node:fs/promises';
import path from 'node:path';
import { syncBuiltinESMExports } from 'node:module';

const output = process.env.RISK_FORK_TEST_REVIEW_OUTPUT;
const filename = process.env.RISK_FORK_TEST_REVIEW_FILENAME;
const mode = process.env.RISK_FORK_TEST_REVIEW_FAILURE;
const originalOpen = fs.open;
const originalUnlink = fs.unlink;
const originalWriteFile = fs.writeFile;
const originalLstat = fs.lstat;
if (mode === 'directory-entry-count') {
  fs.lstat = async function (...args) {
    const details = await originalLstat.apply(this, args);
    if (args[0] === output && details.isDirectory()) {
      details.nlink += BigInt((await fs.readdir(output)).length);
    }
    return details;
  };
}
fs.open = async function (...args) {
  const handle = await originalOpen.apply(this, args);
  if (args[0] !== path.join(output, filename) || args[1] !== 'wx') return handle;
  const originalWrite = handle.writeFile.bind(handle);
  handle.writeFile = async function (bytes) {
    await originalWrite(bytes.subarray(0, 17));
    if (mode === 'unexpected') {
      await originalWriteFile(path.join(output, 'keep.txt'), 'unrelated review notes\n', { flag: 'wx' });
    } else if (mode === 'replaced') {
      await originalUnlink(args[0]);
      await originalWriteFile(args[0], 'replacement contents\n', { flag: 'wx' });
    } else if (mode === 'changed') {
      await originalWriteFile(args[0], 'edited contents\n');
    } else if (mode === 'cleanup-failure') {
      fs.unlink = async function (target) {
        if (target === args[0]) throw Object.assign(new Error('injected cleanup failure'), { code: 'EPERM' });
        return originalUnlink(target);
      };
      syncBuiltinESMExports();
    }
    throw Object.assign(new Error('injected partial review write'), { code: 'EIO' });
  };
  return handle;
};
syncBuiltinESMExports();
