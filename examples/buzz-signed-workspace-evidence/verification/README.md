# Local Buzz event signature verification

This opt-in verifier recomputes the canonical NIP-01 event ID and checks the
BIP-340 signature over that 32-byte ID against the event's x-only public key.
Supply a parsed event object from a local JSON export.

```bash
cd examples/buzz-signed-workspace-evidence/verification
npm ci --ignore-scripts
npm test
```

```js
import { verifyBuzzEventSignature } from './verify-event.mjs';

const signatureValid = await verifyBuzzEventSignature(event);
```

A successful result binds the supplied key to the canonical NIP-01 fields.
Pass the seven-field wire event. Keep relay or export metadata separate.
A well-formed
event with an invalid signature returns `false`. Invalid input, an inconsistent
event ID, or an oversized event raises a typed evidence error. Callers should
treat errors as an unavailable verification result.

The verifier performs no relay or credential I/O. The compiler continues to
treat signature, principal and audit attestations as separate unverified
references. Relay acceptance, audit persistence, key ownership, principal
binding, revocation and action authority require their own evidence and checks.

The test data projects only public verification fields from the pinned
[BIP-340 vectors](https://github.com/bitcoin/bips/blob/200f9b26fe0a2f235a2af8b30c4be9f12f6bc9cb/bip-0340/test-vectors.csv).
`bip340-verification-vectors.json` records the upstream file SHA-256.
