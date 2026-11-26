import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AgoragenticAdapterError,
  agoragentic_match,
  agoragentic_execute,
  nullclear_preflight_token,
  nullclear_decode_calldata,
  nullclear_guarded_execute,
} from './agoragentic_adapter.mjs';

test('nullclear_guarded_execute aborts before router spend on ABORT_CRITICAL_TRAP', async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.AGORAGENTIC_API_KEY;
  process.env.AGORAGENTIC_API_KEY = 'test-key';
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    return new Response(
      JSON.stringify({ recommendedAgentAction: 'ABORT_CRITICAL_TRAP', verdict: 'HONEYPOT' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  };
  try {
    await assert.rejects(
      () =>
        nullclear_guarded_execute(
          'token_swap',
          { amount: 10 },
          { chain: 'base', targetAddress: '0x000000000000000000000000000000000000dead', maxCost: 0.05 },
        ),
      (err) => err instanceof AgoragenticAdapterError && err.code === 'nullclear_preflight_aborted',
    );
    assert.equal(calls.length, 1);
    assert.match(calls[0], /\/v1\/scan\/base\//);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.AGORAGENTIC_API_KEY;
    else process.env.AGORAGENTIC_API_KEY = originalKey;
  }
});

const targetAddress = '0x000000000000000000000000000000000000dead';
const guardOptions = { chain: 'base', targetAddress, maxCost: 0.05 };
const safeReport = {
  recommendedAgentAction: 'EXECUTE_SAFE',
  verdict: 'VERIFIED CLEAR',
};

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
}

async function withMockedFetch(handler, run) {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.AGORAGENTIC_API_KEY;
  const originalBase = process.env.AGORAGENTIC_BASE_URL;
  const calls = [];
  process.env.AGORAGENTIC_API_KEY = 'synthetic-nullclear-test-key';
  process.env.AGORAGENTIC_BASE_URL = 'https://router.example';
  globalThis.fetch = async (url, options) => {
    const call = { url: String(url), options };
    calls.push(call);
    return handler(call);
  };
  try {
    return await run(calls);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.AGORAGENTIC_API_KEY;
    else process.env.AGORAGENTIC_API_KEY = originalKey;
    if (originalBase === undefined) delete process.env.AGORAGENTIC_BASE_URL;
    else process.env.AGORAGENTIC_BASE_URL = originalBase;
  }
}

function adapterError(code, status) {
  return (error) => error instanceof AgoragenticAdapterError
    && error.code === code && error.status === status;
}

test('guard rejects invalid task, chain, target and budget before any request', async (t) => {
  const cases = [
    ['blank task', '   ', guardOptions, 'invalid_task'],
    ['non-string task', 12, guardOptions, 'invalid_task'],
    ['missing target', 'summarize', { maxCost: 0 }, 'invalid_address'],
    ['blank target', 'summarize', { ...guardOptions, targetAddress: ' ' }, 'invalid_address'],
    ['non-string target', 'summarize', { ...guardOptions, targetAddress: 12 }, 'invalid_address'],
    ['blank chain', 'summarize', { ...guardOptions, chain: ' ' }, 'invalid_chain'],
    ['non-string chain', 'summarize', { ...guardOptions, chain: 12 }, 'invalid_chain'],
  ];
  for (const maxCost of [undefined, null, '', '0.05', -1, NaN, Infinity, -Infinity]) {
    cases.push([`invalid budget ${String(maxCost)}`, 'summarize', { ...guardOptions, maxCost }, 'invalid_max_cost']);
  }
  for (const [name, task, options, code] of cases) {
    await t.test(name, () => withMockedFetch(
      () => { throw new Error('No request expected'); },
      async (calls) => {
        await assert.rejects(() => nullclear_guarded_execute(task, {}, options), adapterError(code, 400));
        assert.equal(calls.length, 0);
      },
    ));
  }
});

test('guard rejects every non-affirmative report before routing', async (t) => {
  const reports = [
    null, {}, [], 'EXECUTE_SAFE',
    { recommendedAgentAction: 'EXECUTE_SAFE' },
    { verdict: 'VERIFIED CLEAR' },
    { recommendedAgentAction: 'UNKNOWN', verdict: 'VERIFIED CLEAR' },
    { recommendedAgentAction: 'CAUTION_HIGH_RISK', verdict: 'CAUTION' },
    { recommendedAgentAction: 'EXECUTE_SAFE', verdict: 'CRITICAL TRAP' },
    { recommendedAgentAction: 'CAUTION_HIGH_RISK', verdict: 'VERIFIED CLEAR' },
    { ...safeReport, success: false },
    { ...safeReport, error: 'scan unavailable' },
  ];
  for (const [index, report] of reports.entries()) {
    await t.test(`report ${index}`, () => withMockedFetch(
      () => jsonResponse(report),
      async (calls) => {
        await assert.rejects(
          () => nullclear_guarded_execute('summarize', {}, guardOptions),
          adapterError('nullclear_preflight_unverified', 403),
        );
        assert.equal(calls.length, 1);
        assert.match(calls[0].url, /\/v1\/scan\/base\//);
      },
    ));
  }
});

test('all named abort actions stop before routing', async (t) => {
  for (const action of ['ABORT_CRITICAL_TRAP', 'ABORT_DRAINER_APPROVAL', 'ABORT_WILL_REVERT']) {
    await t.test(action, () => withMockedFetch(
      () => jsonResponse({ recommendedAgentAction: action, verdict: 'CRITICAL TRAP' }),
      async (calls) => {
        await assert.rejects(
          () => nullclear_guarded_execute('summarize', {}, guardOptions),
          adapterError('nullclear_preflight_aborted', 403),
        );
        assert.equal(calls.length, 1);
      },
    ));
  }
});

test('malformed successful JSON stops before routing', () => withMockedFetch(
  () => new Response('{', { status: 200 }),
  async (calls) => {
    await assert.rejects(
      () => nullclear_guarded_execute('summarize', {}, guardOptions),
      adapterError('nullclear_preflight_unverified', 403),
    );
    assert.equal(calls.length, 1);
  },
));

test('scan HTTP errors stop before routing without payment or automatic retry', async (t) => {
  for (const status of [400, 402, 408, 429, 500, 503]) {
    await t.test(`HTTP ${status}`, () => withMockedFetch(
      () => jsonResponse({ error: 'fixture error', recommendedAgentAction: 'ATTACH_X402_PAYMENT_HEADER' }, status),
      async (calls) => {
        await assert.rejects(
          () => nullclear_guarded_execute('summarize', {}, guardOptions),
          (error) => error instanceof AgoragenticAdapterError && error.status === status
            && error.code === (status === 402 ? 'nullclear_x402_required' : 'nullclear_preflight_failed')
            && error.retryable === (status === 408 || status === 429 || status >= 500),
        );
        assert.equal(calls.length, 1);
        assert.deepEqual(calls[0].options.headers, { Accept: 'application/json' });
      },
    ));
  }
});

test('transport failure and timeout stop before routing', async (t) => {
  for (const [name, code, status] of [
    ['TimeoutError', 'nullclear_preflight_timeout', 408],
    ['TypeError', 'nullclear_preflight_transport_failed', 503],
  ]) {
    await t.test(name, () => withMockedFetch(
      () => {
        const error = new Error('synthetic failure');
        error.name = name;
        throw error;
      },
      async (calls) => {
        await assert.rejects(() => nullclear_guarded_execute('summarize', {}, guardOptions), adapterError(code, status));
        assert.equal(calls.length, 1);
        assert.equal(calls[0].options.redirect, 'error');
        assert.ok(calls[0].options.signal instanceof AbortSignal);
      },
    ));
  }
});

test('affirmative scan precedes one zero-budget router call with credential separation', () => withMockedFetch(
  ({ url }) => jsonResponse(url.includes('/v1/scan/') ? safeReport : { receipt: { id: 'synthetic-receipt' } }),
  async (calls) => {
    const result = await nullclear_guarded_execute('summarize', { text: 'fixture' }, { ...guardOptions, maxCost: 0 });
    assert.equal(result.execution.receipt.id, 'synthetic-receipt');
    assert.equal(calls.length, 2);
    assert.match(calls[0].url, /\/v1\/scan\/base\//);
    assert.equal(calls[0].options.headers.Authorization, undefined);
    assert.equal(calls[1].url, 'https://router.example/api/execute');
    assert.equal(calls[1].options.headers.Authorization, 'Bearer synthetic-nullclear-test-key');
    assert.deepEqual(JSON.parse(calls[1].options.body), {
      task: 'summarize', input: { text: 'fixture' }, constraints: { max_cost: 0 },
    });
    for (const call of calls) {
      assert.equal(call.options.redirect, 'error');
      assert.ok(call.options.signal instanceof AbortSignal);
    }
  },
));

test('router HTTP failure is returned without retrying execution', () => withMockedFetch(
  ({ url }) => url.includes('/v1/scan/') ? jsonResponse(safeReport) : jsonResponse({ error: { code: 'rate_limited' } }, 429),
  async (calls) => {
    await assert.rejects(
      () => nullclear_guarded_execute('summarize', {}, guardOptions),
      (error) => error instanceof AgoragenticAdapterError && error.code === 'rate_limited'
        && error.status === 429 && error.retryable === true,
    );
    assert.equal(calls.length, 2);
  },
));

test('actual client timeout aborts a pending scan before routing', () => withMockedFetch(
  ({ options }) => new Promise((resolve, reject) => {
    const watchdog = setTimeout(() => reject(new Error('Client timeout did not abort the pending scan')), 12_000);
    options.signal.addEventListener('abort', () => {
      clearTimeout(watchdog);
      reject(options.signal.reason);
    }, { once: true });
  }),
  async (calls) => {
    const started = performance.now();
    await assert.rejects(
      () => nullclear_guarded_execute('summarize', {}, guardOptions),
      adapterError('nullclear_preflight_timeout', 408),
    );
    assert.ok(performance.now() - started >= 9_000);
    assert.ok(performance.now() - started < 12_000);
    assert.equal(calls.length, 1);
  },
));

test('direct execute preserves optional server budget defaults and validates explicit bounds', () => withMockedFetch(
  () => jsonResponse({ ok: true }),
  async (calls) => {
    await agoragentic_execute('summarize', {});
    assert.equal(Object.hasOwn(JSON.parse(calls[0].options.body), 'constraints'), false);
    await agoragentic_execute('summarize', {}, { maxCost: 0.05 });
    assert.deepEqual(JSON.parse(calls[1].options.body).constraints, { max_cost: 0.05 });
    await assert.rejects(() => agoragentic_execute('summarize', {}, { maxCost: '0.05' }), adapterError('invalid_max_cost', 400));
    assert.equal(calls.length, 2);
  },
));

test('standalone scan and decoder validate inputs and never attach router authentication', () => withMockedFetch(
  () => jsonResponse({ advisory: true }),
  async (calls) => {
    await assert.rejects(() => nullclear_preflight_token({ address: ' ' }), adapterError('invalid_address', 400));
    await assert.rejects(() => nullclear_decode_calldata({ calldata: ' ' }), adapterError('invalid_calldata', 400));
    assert.equal(calls.length, 0);
    await nullclear_preflight_token({ chain: 'base', address: targetAddress });
    await nullclear_decode_calldata({ chain: 'base', calldata: '0x1234', to: targetAddress });
    assert.equal(calls.length, 2);
    for (const call of calls) {
      assert.equal(call.options.headers.Authorization, undefined);
      assert.equal(call.options.redirect, 'error');
      assert.ok(call.options.signal instanceof AbortSignal);
    }
    assert.deepEqual(JSON.parse(calls[1].options.body), { chain: 'base', calldata: '0x1234', to: targetAddress });
  },
));

test('agoragentic_match and nullclear_guarded_execute pass when target is EXECUTE_SAFE', async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.AGORAGENTIC_API_KEY;
  process.env.AGORAGENTIC_API_KEY = 'test-key';
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    if (String(url).includes('/v1/scan/')) {
      return new Response(
        JSON.stringify({
          recommendedAgentAction: 'EXECUTE_SAFE',
          verdict: 'VERIFIED CLEAR',
          provenance: { attestationSha256: '0xabc' },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }
    return new Response(
      JSON.stringify({ ok: true, receipt: { id: 'rcpt_123' } }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  };
  try {
    const m = await agoragentic_match('security');
    assert.equal(m.ok, true);
    const res = await nullclear_guarded_execute(
      'summarize',
      { text: 'hello' },
      { chain: 'base', targetAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', maxCost: 0.05 },
    );
    assert.equal(res.preflight.recommendedAgentAction, 'EXECUTE_SAFE');
    assert.equal(res.execution.receipt.id, 'rcpt_123');
    const direct = await agoragentic_execute('summarize', { text: 'ok' }, { maxCost: 0.01 });
    assert.equal(direct.ok, true);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.AGORAGENTIC_API_KEY;
    else process.env.AGORAGENTIC_API_KEY = originalKey;
  }
});
