# Agoragentic + NullClear

## What this adapter does

Pairs Agoragentic router `agoragentic_match()` and `agoragentic_execute()` with an advisory NullClear token scan. A separate helper requests calldata analysis. The guarded helper requires an affirmative token recommendation and an explicit router budget before routing work.

## Install

Requires Node.js 18+ and has zero external runtime dependencies. Run the mocked tests from the repository root:

```bash
node --test nullclear/nullclear_adapter.test.mjs
```

## Configure

Set `AGORAGENTIC_API_KEY` through your environment or secret manager. Never commit a key. It is sent only to the configured Agoragentic router. NullClear scan and decode requests do not receive that header.

The router defaults to `https://agoragentic.com`; `AGORAGENTIC_BASE_URL` overrides it. `nullclearUrl` defaults to `https://api.nullclear.dev`. Custom origins are trusted caller/deployment configuration and must be controlled by the operator. Requests reject redirects and use a ten-second client timeout.

NullClear controls endpoint availability, quotas and pricing. HTTP 402 is returned as `nullclear_x402_required` with no payment, wallet access, automatic retry or x402 header generation. The external `@nullclear/x402-arbiter` package is not installed or invoked by this adapter.

## Example

```js
import { agoragentic_match, nullclear_guarded_execute } from './agoragentic_adapter.mjs';

// 1. Preview providers via Agoragentic Router
const preview = await agoragentic_match('token security scan');
console.log(preview);

// 2. Gate a routed task on an advisory token scan and an explicit budget.
const result = await nullclear_guarded_execute(
  'summarize',
  { text: 'Verify Base USDC safety before action' },
  {
    chain: 'base',
    targetAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    maxCost: 0, // Free router listings only. Use an approved nonzero limit for paid work.
  },
);
console.log(result.preflight?.recommendedAgentAction, result.execution?.receipt);
```

## Supported tools

- `agoragentic_match` — Canonical router provider preview
- `agoragentic_execute` — Canonical router execution; a supplied `maxCost` must be a finite non-negative number
- `nullclear_preflight_token` — Calls `GET /v1/scan/:chain/:address` and returns the provider's advisory JSON
- `nullclear_decode_calldata` — Calls `POST /v1/decode` separately and returns the provider's advisory JSON
- `nullclear_guarded_execute` — Requires nonblank task, chain and target, plus an explicit finite non-negative `maxCost`. Routes only for the exact pair `recommendedAgentAction: EXECUTE_SAFE` and `verdict: VERIFIED CLEAR`, with no error/failure marker. Named aborts, caution, missing/unknown/conflicting decisions and malformed JSON block routing.

Guarded execution calls only the token scan. It does not call the calldata decoder, simulate a transaction, or establish that a routed task/input matches the scanned contract. Callers must perform the separate action-specific checks their workflow requires.

The accepted action/verdict pair follows the provider's [versioned scan result contract](https://github.com/Nullclear-Protocol/nullclear/blob/ed0e90f02536907a35a8713fe4db2cc6b5d4932c/packages/worker-arbiter/src/services/forensics-engine.ts). That source reference does not establish the version currently deployed by the provider.

## Receipt location

The router response is returned on `result.execution`; any receipt fields remain in that response. The scan response is returned unchanged on `result.preflight`. A provider-supplied `provenance.attestationSha256` is an unverified reference; the adapter does not verify signatures, report freshness or target/action binding.

## Safety boundary

- The guarded helper requires an explicit `maxCost` and sends it as `constraints.max_cost`. The server applies its own authorization, wallet policy and listing-price checks. The direct `agoragentic_execute` helper retains optional `maxCost`; omission uses server account/default limits.
- Scan labels are provider recommendations. A successful HTTP response can contain fallback data; it is not proof that every upstream source responded or that a contract or transaction is safe. This adapter grants no authority and does not verify custody, settlement or a complete transaction chain.
- HTTP errors and transport/timeouts stop the guarded flow. `retryable` describes an error; the adapter never retries execution automatically.
- Tests mock `fetch` completely offline, use synthetic credentials and perform no provider, wallet or payment calls. Hosted validation runs the focused suite on Node 18/22/24 and in required `validate` on Node 20.
