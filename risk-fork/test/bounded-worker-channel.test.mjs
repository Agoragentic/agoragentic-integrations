import assert from 'node:assert/strict';
import test from 'node:test';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { spawn } from 'node:child_process';
import { createBoundedWorkerChannel } from '../scripts/lib/bounded-worker-channel.mjs';

function fixture(options) {
  const child = Object.assign(new EventEmitter(), {
    stdin: new PassThrough(), stdout: new PassThrough(), stderr: new PassThrough(),
  });
  return { child, channel: createBoundedWorkerChannel(child, options) };
}

test('fragmented UTF-8 frames survive byte boundaries', async () => {
  const { child, channel } = fixture();
  const bytes = Buffer.from('{"phase":"é"}\n');
  for (const byte of bytes) child.stdout.write(Buffer.from([byte]));
  assert.deepEqual(await channel.next(), { phase: 'é' });
  channel.close();
});

test('protocol failures latch, discard queued frames and deny later handoff', async () => {
  for (const bad of [Buffer.from('null\n'), Buffer.from('[]\n'), Buffer.from('true\n'), Buffer.from('bad\n'), Buffer.from([0xff, 10])]) {
    const { child, channel } = fixture();
    child.stdout.write('{"phase":"ready"}\n');
    child.stdout.write(bad);
    child.stdout.write('{"phase":"late"}\n');
    await assert.rejects(channel.next());
    assert.throws(() => channel.send({ start: true }));
    channel.close();
  }
});

test('stdout and stderr share a lifetime output limit', async () => {
  const { child, channel } = fixture({ maxBytes: 20 });
  child.stdout.write('{"ok":true}\n');
  child.stderr.write('x'.repeat(10));
  await assert.rejects(channel.next());
  assert.throws(() => channel.send({ start: true }));
});

test('frame queue and pending requests are bounded', async () => {
  const queued = fixture({ maxFrames: 1 });
  queued.child.stdout.write('{}\n{}\n');
  await assert.rejects(queued.channel.next());
  const waiting = fixture({ maxFrames: 1 });
  const first = assert.rejects(waiting.channel.next());
  await assert.rejects(waiting.channel.next());
  await first;
});

test('deadline failure cannot be reversed by a late ready frame', async () => {
  const { child, channel } = fixture({ deadlineMs: 10 });
  await assert.rejects(channel.next());
  child.stdout.write('{"phase":"ready"}\n');
  await assert.rejects(channel.next());
  assert.throws(() => channel.send({ start: true }));
});

test('stream errors, close and cancellation settle pending reads', async () => {
  for (const action of ['stdin', 'stdout', 'stderr', 'close', 'cancel']) {
    const { child, channel } = fixture();
    const pending = assert.rejects(channel.next());
    if (action === 'cancel') channel.close();
    else if (action === 'close') child.emit('close', 0);
    else child[action].emit('error', new Error('synthetic'));
    await pending;
    assert.throws(() => channel.send({ start: true }));
  }
});

test('real provider-free child exchanges a frame; exit revokes channel', async () => {
  const child = spawn(process.execPath, ['-e', 'process.stdout.write("{\\"phase\\":\\"ready\\"}\\n");process.stdin.once("data",()=>process.exit(0));'], {
    env: {}, stdio: ['pipe', 'pipe', 'pipe'],
  });
  const channel = createBoundedWorkerChannel(child);
  try {
    assert.deepEqual(await channel.next(), { phase: 'ready' });
    const exit = new Promise(resolve => child.once('close', resolve));
    channel.send({ finish: true });
    await exit;
    await assert.rejects(channel.next());
  } finally { channel.close(); child.kill(); }
});

test('invalid limits and oversized handoff are rejected before writing', async () => {
  for (const value of [0, -1, Infinity, 1.5, '10']) assert.throws(() => fixture({ deadlineMs: value }));
  const { child, channel } = fixture({ maxBytes: 10 });
  let written = false;
  child.stdin.on('data', () => { written = true; });
  assert.throws(() => channel.send({ start: 'x'.repeat(20) }));
  assert.equal(written, false);
  await assert.rejects(channel.next());
});

test('stdout EOF discards a queued ready frame even with truncated UTF-8', async () => {
  const { child, channel } = fixture();
  child.stdout.write('{"phase":"ready"}\n');
  child.stdout.write(Buffer.from([0xc3]));
  const ended = new Promise(resolve => child.stdout.once('end', resolve));
  child.stdout.end();
  await ended;
  await assert.rejects(channel.next());
  assert.throws(() => channel.send({ start: true }));
});

test('half-open stream lifecycle revokes queued frames and pending reads', async () => {
  for (const [name, action] of [['stdout', 'end'], ['stderr', 'end'], ['stdout', 'destroy'], ['stderr', 'destroy'], ['stdin', 'end'], ['stdin', 'destroy']]) {
    for (const queued of [true, false]) {
      const { child, channel } = fixture();
      if (queued) child.stdout.write('{"phase":"ready"}\n');
      const pending = queued ? null : assert.rejects(channel.next());
      child[name][action]();
      await new Promise(resolve => setImmediate(resolve));
      if (pending) await pending;
      await assert.rejects(channel.next());
      assert.throws(() => channel.send({ start: true }));
      // The child itself has not emitted close: stream loss alone must revoke.
    }
  }
});

test('real keyless worker closing stdout while alive cannot retain handoff', async () => {
  const child = spawn(process.execPath, ['-e', 'require("node:fs").writeSync(1,"{\\"phase\\":\\"ready\\"}\\n");require("node:fs").closeSync(1);setInterval(()=>{},1000);'], {
    env: {}, stdio: ['pipe', 'pipe', 'pipe'],
  });
  const channel = createBoundedWorkerChannel(child);
  const closed = new Promise(resolve => child.once('close', resolve));
  try {
    await new Promise(resolve => child.stdout.once('end', resolve));
    assert.equal(child.exitCode, null);
    await assert.rejects(channel.next());
    assert.throws(() => channel.send({ start: true }));
  } finally { channel.close(); child.kill(); await closed; }
});
