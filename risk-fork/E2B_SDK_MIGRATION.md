# E2B 2.63.0 source migration

Core Risk Fork and the hosted bundle continue to support Node >=20. The optional
E2B adapter now requires Node >=22.19.0 and exact `e2b@2.63.0`, matching upstream's
runtime requirement. Node 20 and Node 22.0–22.18 cannot load the SDK, construct its
process boundary, or enter build/live harnesses. Runtime checks precede option
reads and SDK imports, including inside the separately spawned SDK process.
Offline injected simulators remain available on Node 20 and cannot carry trusted
qualification or grant provider authority.

The SDK's upstream glob 14 dependency removes the affected glob/minimatch path
tracked by GHSA-3g3m-2fjr-6pw4 and GHSA-g3hv-75wg-m249. Development qualification
has its own private, engine-strict package and lockfile in `sdk-qualification/`.
There are no E2B dependency overrides or audit exceptions. The core install does
not install the optional peer automatically. Hosts choosing E2B must install the
exact SDK on a supported runtime, audit their actual full dependency graph, and
establish their own signed exact-byte closure binding.

The provider-free HTTP-refusal tests explicitly pin `undici@7.30.1` as a
development-only dependency rather than relying on the removed E2B transitive
dependency. Running this development test graph requires Node >=20.18.1; the
core production runtime remains Node >=20 and does not install Undici.

## Evidence and historical cleanup

Current evidence uses `agoragentic.risk-fork.e2b-qualification-evidence.v2`, bound
to SDK 2.63.0. The unchanged v1 JSON schema remains in the core package for
historical inspection. The current verifier rejects v1 evidence even if its SDK
field is rewritten; existing signatures and hashes cannot be migrated by editing
fields. Observer and trust envelopes retain their versions because they already
bind the entire evidence hash, including its profile and SDK closure. Their
signatures must be established again for new evidence.

The new adapter also refuses v1 historical cleanup bindings. An operator with an
existing old-profile journal must retain its exact original reviewed runtime,
signed artifacts and independent cleanup policy, or use separately authorized
provider-side reconciliation. Do not reinterpret an old journal as v2, silently
upgrade its SDK, or claim absence without observation. This source change neither
executes cleanup nor changes production credentials or installations.

## Qualification limits

Upstream SDK 2.51+ creates sandboxes through `/v2/sandboxes`; that endpoint always
uses secure envd access and no longer sends the deprecated `secure` option. The
adapter still requires `secure: true`. The real-SDK loopback test verifies the
exact v2 route, returned envd token on subsequent file access, exclusion of the
provider API key from that request, and the existing deny-all network, empty
authority and lifecycle bindings. This is wire-contract evidence, not a live
provider containment test.

The historical hackathon fake SDK and August canary records remain labelled
2.39.0. They are not renamed or used as evidence for 2.63.0. Current metadata,
schema, exact-binding tests and SDK tests are separate. Core tests run on Node
20/22/24; SDK tests run on Linux at the minimum Node 22.19.0 and current Node
22/24, plus Windows/macOS on Node 22 to retain the previous platform coverage.
All qualification is provider-free. The hard-false live activation gate,
detached pinned signatures, dependency closure, read-only custody, cancellation,
cleanup and cost gates remain mandatory. No production qualification, package
publication, deployment or live-provider authorization is established here.

Upstream references: [SDK 2.63.0 metadata](https://registry.npmjs.org/e2b/2.63.0),
[SDK changelog](https://github.com/e2b-dev/E2B/blob/main/packages/js-sdk/CHANGELOG.md),
[glob migration](https://github.com/e2b-dev/E2B/pull/2069).
