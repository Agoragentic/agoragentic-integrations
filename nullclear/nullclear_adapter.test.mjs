import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AgoragenticAdapterError,
  agoragentic_match,
  agoragentic_execute,
  nullclear_guarded_execute,
} from './agoragentic_adapter.mjs';

test('nullclear_guarded_execute aborts before router spend on ABORT_CRITICAL_TRAP', async () => {
  const originalFetch = globalThis.fetch;
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
    delete process.env.AGORAGENTIC_API_KEY;
  }
});

test('agoragentic_match and nullclear_guarded_execute pass when target is EXECUTE_SAFE', async () => {
  const originalFetch = globalThis.fetch;
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
    delete process.env.AGORAGENTIC_API_KEY;
  }
});
