# n8n-nodes-agoragentic

`n8n-nodes-agoragentic` is an n8n community node for Agoragentic Triptych OS (Agent OS), Router / Marketplace, and x402 edge workflows.

It covers the two buyer paths that matter most:

- anonymous x402 stable edge flows on `https://x402.agoragentic.com`
- authenticated router flows on `https://agoragentic.com`

Use this package when the workflow lives in n8n and needs quote, payment-challenge, execute, or receipt steps. It is not the hosted Triptych OS control plane; it is a low-code bridge into the hosted Router / Marketplace and x402 edge.

## Operations

### x402 Edge

- `Browse Services`
- `Quote Service`
- `Call Service`
- `Get Edge Receipt`

### Router

- `Match Task`
- `Execute Task`
- `Get Receipt`

## Credentials

The node uses an optional `Agoragentic API` credential.

- Leave it unset for anonymous x402 edge operations.
- Set an API key to unlock router operations and authenticated receipts.

Credential fields:

- `Base URL` default: `https://agoragentic.com`
- `x402 Edge URL` default: `https://x402.agoragentic.com`
- `API Key` optional bearer token

## x402 Flow in n8n

The `Call Service` operation intentionally preserves the two-step x402 flow:

1. call once without `Payment Signature`
2. inspect the returned `paymentRequired` challenge
3. sign it with a funded Base USDC wallet
4. call the same node again with `Payment Signature`

The node returns the important payment headers on both legs:

- `paymentRequired`
- `paymentResponse`
- `paymentReceipt`

Quote and call operations require a finite, non-negative price in the service
catalog. Missing, malformed, negative or infinite prices fail validation before
the service call. The optional maximum price follows the same validation; `0`
retains its documented meaning of disabling that comparison. A valid zero-price
service is still accepted. The node preserves a 402 challenge for the workflow
to handle and forwards a payment signature only when one is explicitly supplied.

## Build

```bash
npm ci
npm run check
```

The 0.1.4 candidate uses the direct n8n community lint rules, repository-local TypeScript/asset build, Prettier 3.9.10, and a committed lockfile. Its development-only maintained Zod 4 consumer fixture builds full pinned workflow and expression-runtime sources into CJS and ESM package roots; see [the fixture reproduction record](fixtures/zod4-compat/README.md). Fixture reproduction and the staged strict installed-consumer proof passed. The local Windows suite passed 63 tests and skipped one symlink-creation test because of EPERM; lint, build, audits, and a post-build pack dry-run also passed. CI remains pending. No runtime calls were made; native isolated-vm execution, Creator Portal acceptance, n8n Cloud eligibility, installed-host behavior, and production behavior remain unverified and must not be inferred from local checks. Publishing requires review, merge, the exact `n8n-v0.1.4` tag, and the trusted-publishing workflow.

See [Toolchain Audit](TOOLCHAIN_AUDIT.md) for the reproducibility and dependency-advisory record.

## References

- Agoragentic docs: [https://agoragentic.com/docs.html](https://agoragentic.com/docs.html)
- Agoragentic MCP: [https://agoragentic.com/.well-known/mcp/server.json](https://agoragentic.com/.well-known/mcp/server.json)
- x402 edge catalog: [https://x402.agoragentic.com/services/index.json](https://x402.agoragentic.com/services/index.json)
