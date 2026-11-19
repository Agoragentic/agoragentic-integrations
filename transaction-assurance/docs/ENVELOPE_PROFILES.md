# Transaction Assurance envelope profiles

The current library writes `agoragentic.transaction-assurance-envelope.v2`. It reads historical v1 records through the existing evaluator path. The package remains an unpublished source-only alpha; this profile change does not publish, install, deploy or activate a hosted consumer.

## Why the profiles differ

The preserved [public v1 schema](../schema/transaction-assurance-envelope.v1.json) is a closed historical contract. Current library output includes identity evidence, verifier and revocation metadata, budget-usage evidence, and explicit unverified redaction. Those fields and the optional evaluation, TOPLOC and external-verification groups require a separate [closed v2 schema](../schema/transaction-assurance-envelope.v2.json).

The schema identifier is an identifier, not evidence that an HTTP endpoint serves it or accepts its records. The schemas are included in this package and available through its `./schema/*` export. Existing public v1 discovery URLs and source artifacts remain unchanged.

## Producers and readers

- `buildTransactionAssuranceEnvelope()` writes v2 and checks its complete output shape.
- `evaluateTransactionAssuranceEnvelope()` accepts the explicit v1 and v2 tags. Malformed v2 shapes add the hard-deny blocker `envelope_schema_invalid`; the existing authority, budget, replay and hash checks still run.
- `attachEvaluationEvidence()`, `attachToplocEvidence()` and `bindExternalVerification()` verify the source hash, return a v2 clone, recompute its hash and check the resulting shape.
- Unknown wire-version tags are refused. No implicit downgrade or lossy public-v1 projection is provided.

Each optional attachment family is absent or contains both its entries/reference array and its summary/verification object:

| Entries or references | Paired result |
| --- | --- |
| `evaluation_evidence` | `evaluation_summary` |
| `inference_attestations` | `inference_attestation_summary` |
| `external_action_refs` | `external_verification` |

V2 also permits the existing bounded `authenticated_action_ref` as an opaque reference. Preserving that value does not authenticate an action or reinterpret its issuer, provenance or authority.

## Historical input and hash continuity

Promotion creates a separate clone. The input object, original schema tag and original hash remain unchanged. Missing identity/verifier/revocation/budget fields receive explicit conservative defaults: unknown references and usage values are `null`, and verifier trust mode is `none`. The library does not infer principal or agent verification evidence from a matching identifier.

The clone records `evidence.profile_source` with the source v1 tag, envelope ID and original envelope hash. Retain the original bytes wherever an original signature or provenance chain must be checked. This reference does not verify those bytes or signatures on its own.

The hash recipe is unchanged: canonicalize the entire record with only `evidence.envelope_hash` replaced by `null`, then hash the UTF-8 bytes with SHA-256. The new tag, defaults, lineage reference and attachments participate in the derived record's hash. An original v1 hash is not replaced with a supposed equivalent v2 hash.

A self-hash is not an authorization signature. A caller able to rewrite and rehash JSON can produce another self-consistent record; trusted verifier provenance remains a separate process-local boundary.

## Trust and privacy

New builder output keeps all authority flags false, `evidence.complete_chain_verified` false, redaction verification `not_verified`, and exclusion declarations false. A historical input can retain its original exclusion declarations in the new clone, but they remain explicitly unverified. Neither schema validation nor promotion scans strings for secrets or establishes public safety.

Evaluation and TOPLOC attachment clones retain their existing loss of process-local WeakMap provenance. They do not acquire trusted authority from a serialized hash. External binding retains its existing explicit source-binding transfer only from the actual source object; serialized data cannot manufacture that binding. Derived external records clear complete-chain claims and do not upgrade delivery, payment or reconciliation.

Evaluation/TOPLOC entry verifiers and external in-process callbacks retain their existing contracts. JSON Schema checks structure, bounds and false constants; it cannot establish signature validity, canonical source bytes, summary truth, report freshness, external issuer identity or actual provider/runtime results. Serialized source-artifact hashes are not independent provenance proof.

This change does not alter signer rules, custody, admission, payment execution, hosted private/public views or Interchange release holds. Historical adopter artifacts remain evidence for their pinned historical suite and do not qualify the new profile.

## Maintainer checks

The v2 schema is generated from the byte-pinned historical v1 schema and explicit current-library extensions:

```bash
node scripts/generate-envelope-schema.mjs --check
node --test test/envelope-profiles.test.mjs
npm test
npm run check
```

After an intentional owning-generator change, regenerate only v2:

```bash
node scripts/generate-envelope-schema.mjs --write
```

Preserve the legacy schema and example bytes. Never change their expected digest to hide drift, weaken false-authority assertions, or use schema acceptance as release or live-runtime evidence.
