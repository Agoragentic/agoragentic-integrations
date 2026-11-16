import { requireInteger } from './validation.mjs';

// Host-owned local wait bound, not callback cancellation or isolation. Separate
// instances reserve independent capacity for resource, cleanup and recovery.
export function createVerifierCapacity({ timeoutMs, concurrency }) {
  requireInteger(timeoutMs, 'verifier timeoutMs', { min: 50, max: 30_000 });
  requireInteger(concurrency, 'verifier concurrency', { min: 1, max: 64 });
  let active = 0;
  return async (callback) => {
    if (active >= concurrency) return false; // Never queue unbounded waiters.
    active += 1;
    const started = performance.now();
    let timer;
    const expired = new Promise(resolve => { timer = setTimeout(() => resolve(false), timeoutMs); });
    // Keep the slot until actual callback settlement, even if the caller's wait
    // has expired. Repeated retries cannot multiply hung verifier operations.
    const settled = Promise.resolve().then(() => {
      // A queued microtask can run before an overdue timer after the host has
      // blocked the event loop. Do not begin an already-expired invocation.
      if (performance.now() - started >= timeoutMs) return false;
      return callback();
    }).then(
      value => value === true && performance.now() - started < timeoutMs,
      () => false,
    ).finally(() => { active -= 1; clearTimeout(timer); });
    return Promise.race([settled, expired]);
  };
}
