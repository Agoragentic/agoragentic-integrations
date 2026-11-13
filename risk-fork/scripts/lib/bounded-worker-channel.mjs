// Internal provider-free supervisor protocol. This conveys no custody authority.
import { TextDecoder } from 'node:util';

export function createBoundedWorkerChannel(child, { deadlineMs = 10_000, maxBytes = 16_384, maxFrames = 4 } = {}) {
  for (const value of [deadlineMs, maxBytes, maxFrames]) {
    if (!Number.isSafeInteger(value) || value <= 0) throw new Error('invalid channel limit');
  }
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const frames = [], waiters = [];
  let tail = '', bytes = 0, failed;
  const fail = () => {
    if (!failed) failed = new Error('bounded worker channel unavailable');
    frames.length = 0; tail = '';
    while (waiters.length) waiters.shift().reject(failed);
    return failed;
  };
  const count = (chunk) => {
    if (failed) return false;
    bytes += chunk.length;
    if (bytes > maxBytes) { fail(); return false; }
    return true;
  };
  child.once('error', fail);
  child.once('close', fail);
  child.stdin.on('error', fail);
  child.stdout.on('error', fail);
  child.stderr.on('error', fail);
  // A worker can close one pipe without exiting. A queued ready frame never
  // survives loss of any protocol stream, including clean EOF with a partial
  // UTF-8 sequence buffered in the decoder. EOF always revokes authority, so
  // there is no need to flush/decode a final (potentially incomplete) frame.
  for (const stream of [child.stdout, child.stderr]) {
    stream.once('end', fail);
    stream.once('close', fail);
  }
  child.stdin.once('finish', fail);
  child.stdin.once('close', fail);
  const assertOpen = () => {
    if (failed || child.stdin.destroyed || child.stdin.writableEnded
      || !child.stdin.writable
      || [child.stdout, child.stderr].some((stream) => stream.destroyed || stream.readableEnded)) {
      throw fail();
    }
  };
  child.stderr.on('data', count);
  child.stdout.on('data', (chunk) => {
    if (!count(chunk)) return;
    try {
      tail += decoder.decode(chunk, { stream: true });
      while (tail.includes('\n')) {
        const end = tail.indexOf('\n');
        const frame = JSON.parse(tail.slice(0, end));
        tail = tail.slice(end + 1);
        if (frame === null || typeof frame !== 'object' || Array.isArray(frame)) throw new Error();
        if (waiters.length) waiters.shift().resolve(frame);
        else {
          if (frames.length >= maxFrames) throw new Error();
          frames.push(frame);
        }
      }
    } catch { fail(); }
  });
  return Object.freeze({
    send(value) {
      assertOpen();
      const frame = `${JSON.stringify(value)}\n`;
      if (Buffer.byteLength(frame) > maxBytes) throw fail();
      child.stdin.write(frame);
    },
    next() {
      try { assertOpen(); } catch (error) { return Promise.reject(error); }
      if (frames.length) return Promise.resolve(frames.shift());
      if (waiters.length >= maxFrames) return Promise.reject(fail());
      return new Promise((resolve, reject) => {
        const timer = setTimeout(fail, deadlineMs);
        waiters.push({
          resolve(value) { clearTimeout(timer); resolve(value); },
          reject(error) { clearTimeout(timer); reject(error); },
        });
      });
    },
    // Cancels protocol authority only; the owning supervisor must still perform
    // exact-ID teardown and independent kernel observation, even after failure.
    close() { fail(); },
  });
}
