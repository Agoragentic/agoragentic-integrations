# Agoragentic + NullClear

## What this adapter does

Pairs Agoragentic router `agoragentic_match()` and `agoragentic_execute()` with zero-key NullClear pre-flight EVM/Solana token & calldata safety verification (plus optional `@nullclear/x402-arbiter` deferred schema-escrow clearing).

## Install

Requires Node.js 18+ (zero external runtime dependencies for the adapter; optional `@nullclear/x402-arbiter` for automated x402 deferred schema-escrow wrapping).

```bash
node --test nullclear/nullclear_adapter.test.mjs
```

## Configure

Set `AGORAGENTIC_API_KEY` through your environment or secret manager. Never commit a key. NullClear's pre-flight endpoints (`/v1/scan/:chain/:address`, `/v1/decode`) require zero API key for up to 100 calls/day/IP and scale via x402 (`$0.005 USDC` on Base).

## Example

```js
import { agoragentic_match, agoragentic_execute, nullclear_guarded_execute } from './agoragentic_adapter.mjs';

// 1. Preview providers via Agoragentic Router
const preview = await agoragentic_match('token security scan');
console.log(preview);

// 2. Run zero-key NullClear pre-flight check before bounded execution
const result = await nullclear_guarded_execute(
  'summarize',
  { text: 'Verify Base USDC safety before action' },
  {
    chain: 'base',
    targetAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    maxCost: 0.05,
  },
);
console.log(result.preflight?.recommendedAgentAction, result.execution?.receipt);
```

## Supported tools

- `agoragentic_match` — Canonical router provider preview
- `agoragentic_execute` — Canonical bounded router execution
- `nullclear_preflight_token` — Calls `GET https://api.nullclear.dev/v1/scan/:chain/:address` (remote MCP equivalent: `nullclear_scan_token` at `https://api.nullclear.dev/mcp`)
- `nullclear_decode_calldata` — Calls `POST https://api.nullclear.dev/v1/decode` (catches drainer approvals & revert vectors)
- `nullclear_guarded_execute` — Fail-closed wrapper aborting on `ABORT_CRITICAL_TRAP`, `ABORT_DRAINER_APPROVAL`, or `ABORT_WILL_REVERT` before calling `agoragentic_execute`

For third-party x402 sellers returning unverified payloads, wrap calls with `@nullclear/x402-arbiter` (`DeferredSchemaEscrow`) against `https://api.nullclear.dev/v1/bazaar/*`.

## Receipt location

Router execution receipts are returned on `result.execution.receipt` (or `execution.receipt_id`), alongside NullClear's `result.preflight.provenance.attestationSha256`.

## Safety boundary

- `agoragentic_execute` sends spend only up to the explicit caller-passed `maxCost` when `AGORAGENTIC_API_KEY` is set.
- NullClear pre-flight calls default to read-only free tier (no private key, no wallet spend) and fail closed before `agoragentic_execute` on critical trap verdicts.
- `nullclear/nullclear_adapter.test.mjs` mocks `fetch` completely offline with zero network calls and zero spend.
