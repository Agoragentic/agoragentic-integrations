# n8n Toolchain Audit

Original toolchain audit: 2026-09-13 (supersedes 2026-09-01)

Dependency-fixture refresh: 2026-09-30. Rechecked the manifest and lockfile,
peer ranges, clean install, tests, lint, build, dependency audits, and package
contents. Historical CLI compatibility and Creator Portal acceptance were not
revalidated.

## Toolchain patch candidate - 2026-10-28

The direct TypeScript ESLint stack moves from 8.70.0 to 8.72.0 and Prettier
from 3.9.6 to 3.9.10. The exact ESLint 9.29.0 community-plugin peer and the
TypeScript 5.9.2 compiler remain unchanged. The lock also resolves the
TypeScript ESLint `ignore` dependency to 7.0.14.

On Windows with Node 24, the clean npm install completed, but npm reported
three lifecycle scripts not covered by its existing allowScripts policy.
Fixture reproduction verified 300 source files and 1,193 artifacts and passed
the strict installed-consumer proof. The test suite passed 63 tests and skipped
one symlink-creation test because of EPERM; lint and build passed. Production
and complete development audits were clean, and the post-build pack dry run
contained the expected compiled assets. Hosted CI and approval remain pending.
These checks do not qualify native isolated-vm execution, an installed n8n
host, Creator Portal acceptance, n8n Cloud eligibility, or production behavior.

## Current candidate — 2026-10-26

The maintained Zod 4 consumer fixture has passed local `--write` regeneration
and a byte-for-byte `--check` reproduction: 300 verified source files and 1,193
generated artifact files. The staged installed-consumer proof passed strict
NodeNext CJS/ESM declaration checks with `skipLibCheck:false`. The full local
suite reports 51/51 tests with zero skips; lint, build, production-only audit,
development audit, dedicated build-closure audit at all severities, staged
consumer audit, and `npm pack --dry-run` all passed.

These are repository-local results only. No runtime calls were made; native
isolated-vm execution, an installed n8n host, Creator Portal acceptance, n8n
Cloud eligibility, payments, and production behavior remain unqualified.
Hosted CI and approval must be checked separately on the exact PR head.

The fixture is a development-only source migration, not a published n8n
runtime or vendor reproduction. It binds the official registry packages and
the official pinned source archive separately, compiles full workflow and
expression-runtime sources into CJS and ESM roots, regenerates expression
bundles, retains Zod legacy/v3 bytes, disables lifecycle scripts during fixture
installs, and records source/patch/toolchain/bundle/artifact evidence.

## Historical security recheck: 2026-10-24

The September audit results below are historical. A fresh audit of the unchanged
lockfile now fails the complete development gate: **four high findings**, all
attributed to [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5).
The production-only lockfile audit reports zero vulnerabilities. This does not
qualify an installed n8n host or clear the development/release gate.

Reproduction with Node.js 24.13.0 and npm 11.6.2:

```text
npm audit --package-lock-only --json --audit-level=low --include=dev
exit 1; high: 4

npm audit --package-lock-only --json --audit-level=low --omit=dev
exit 0; total: 0
```

These are lockfile-only security checks, not a fresh install or behavioral
qualification. The resolved copy is `zod@3.25.67`. Both
`n8n-workflow@2.28.4` (exact peer) and `@n8n/expression-runtime@0.19.1`
(exact dependency) require it; `@n8n/eslint-plugin-community-nodes@0.32.0`
adds the workflow dependency through its `>=2` peer. These four audit entries
describe one advisory propagating through the dependency graph, not four
independent vulnerabilities.

The advisory's patched range starts at Zod 4.6.6. Checked upstream workflow
releases 2.44.2 and 2.45.1 still pin Zod 3.25.76, as do their expression-runtime
releases 0.35.0 and 0.36.1. The current fixture exposes Zod 3 declarations and
root imports alongside explicit `zod/v4` imports. Specifically, workflow's
`dist/cjs/message-event-bus.d.ts` supplies five generic arguments to
`z.ZodObject`; Zod 4.6.7's root `ZodObject` accepts two. A major override needs
a consumer declaration/source migration and validation, not just a different
lock entry. Routing the
root imports through `zod/v3` also does not establish remediation: the
[upstream security patch](https://github.com/colinhacks/zod/commit/a0ebf970f2d752e5f58527cd2942ff48be4f46bd)
changes the v4 implementation only.

npm's alternative workflow downgrade to 1.75.1 conflicts with the retained
community lint plugin's `n8n-workflow >=2` peer. Downgrading the plugin as well
would change the validation contract and requires separate qualification;
removing its checks is not a security fix. No override, audit exception,
dependency downgrade, or manifest/lockfile change is included in this recheck.

The gate remains blocking. A compatible upstream patched release is the
preferred resolution. A maintained upstream/backport fork or a replacement
toolchain is a separate design decision requiring consumer type, schema,
expression-boundary, lint, build, package and security qualification. This
investigation does not claim that such a migration is impossible or completed.

## Candidate implementation detail

The maintained Zod 4 consumer fixture is a development-only source migration,
not a published n8n runtime or vendor reproduction. It binds the official
registry tarballs (`n8n-workflow@2.28.4`, `@n8n/expression-runtime@0.19.1`,
and `zod@4.6.7`) separately from the official n8n source archive at commit
`955be3ef2131afb9ecba5482024d045e710e4f20` / tag `n8n@2.28.7`, SHA-256
`0ddad00a619a7df13ad16fedc1b67d8bb66239f0aa68a9ac71a5f90ce89d1b4d`.

The full workflow and expression-runtime sources are compiled into CJS and
ESM public roots with a dedicated locked compiler closure. The fixture applies
the reviewed Zod 4 record/credentials/default changes, preserves generated JSON
metadata, handles Zod 4 `PropertyKey` issue paths, derives the exact `LogScope`
tuple from pinned `LOG_SCOPES`, and regenerates expression bundles with pinned
esbuild inputs. The Zod package retains its published legacy and `v3` bytes;
the fixture consumer selects the Zod 4 root. Lifecycle scripts are disabled
for fixture installs. Native isolated-vm execution, installed-host behavior,
Creator Portal acceptance, n8n Cloud eligibility, payments, and production
behavior are excluded.

The builder's default/check/test modes verify committed bytes without replacing
them; only explicit `--write` updates generated artifacts. The strict consumer
checker uses the dedicated TypeScript 5.9.2 compiler with NodeNext resolution,
`skipLibCheck:false`, and positive/negative public type contracts.

The local results are summarized at the top of this audit. CI remains pending;
no live-host or production claim is made here.

## Historical candidate — October 26 offline node regression coverage

### October 26 offline node regression coverage

The following records the prior development-fixture state and is retained for
audit continuity; it is not evidence for the current Zod 4 candidate.

The maintained-fixture investigation added behavioral tests that execute the
real node source with `fetch` stubbed and the installed workflow error classes.
Two tests reproduced missing validation for non-finite maximum prices and
malformed catalog prices. Quote and call operations now require finite,
non-negative numeric amounts while retaining valid numeric strings, zero-price
services and the existing zero-cap semantics. Missing catalog prices no longer
default to zero.

Twelve behavioral tests, lint and the node build passed against the prior
development fixture. They cover credential rejection before network access,
both x402 legs without router-credential forwarding, exact payment headers,
no automatic retry, price/payload rejection, request-body values, HTTP/transport
errors and paired-item continuation. These are offline fixture results; no
payment, provider call, published release or installed n8n host was exercised.
The separate consumer migration, strict declaration checks and complete
development audit must also pass before qualification. Historical byte-identical
build comparisons below predate this deliberate runtime validation correction.

- Package: `n8n-nodes-agoragentic@0.1.4`
- Builder: repository-local `scripts/build.mjs`
- Community lint plugin: `@n8n/eslint-plugin-community-nodes@0.32.0`
- Base lint rules: `eslint-plugin-n8n-nodes-base@2.0.0`
- Type-aware lint stack: `typescript-eslint@8.70.0`
- Linter: `eslint@9.29.0`
- Formatter: `prettier@3.9.6`
- Compiler: `typescript@5.9.2`
- Development host fixture: `n8n-workflow@2.28.4`
- Exact workflow peer fixture: `zod@3.25.67`
- Minimum consumer Node.js: 20.19
- Locked development and publishing Node.js: 24
- Install mode: committed lockfile plus `npm ci`

npm currently serves `n8n-nodes-agoragentic@0.1.3` from the existing
`n8n-v0.1.3` release. This audited source candidate is 0.1.4 and must be
reviewed and merged before the exact `n8n-v0.1.4` tag can invoke the trusted
publishing workflow.

## Coordinated compatibility decision

The 2.39.1 fixture and available 2.41.1 stable / 2.42.1 beta releases pin
`axios@1.18.0` exactly. Seven newly reported Axios advisories require 1.20.0;
substituting a lock entry cannot satisfy that pin, and overrides remain prohibited.
Use the latest pre-Axios 2.28 patch fixture, 2.28.4, with its exact Zod peer
3.25.67. Its complete development graph audited clean on September 30. Clean installation, tests,
lint, build, runtime imports and the offline error boundary pass. All eleven
generated code, declaration and static-asset files are byte-identical to the
2.39.1 build. This changes the development fixture only: package version,
runtime peer, Node consumer floor, node source and audit policy are unchanged.
Requalify a newer fixture once its published dependency graph is patched.

Every available `@n8n/node-cli` line checked from 0.40.0 through the current
stable and beta releases pulls an AI/template-only dependency branch through
`@n8n/ai-node-sdk`. That branch pins `@langchain/classic@1.0.27` and
`@langchain/community@1.1.27`, which resolve vulnerable `uuid@10.0.0`. The n8n
community-node rules correctly reject package-manager `overrides`, so the
candidate removes the all-in-one CLI instead of bypassing that policy.

The replacement keeps the CLI 0.44.4 validation behavior used by this package:

- `eslint.config.mjs` reproduces the official cloud-support configuration with
  `@eslint/js`, TypeScript ESLint, the community-node plugin, import resolution,
  `eslint-plugin-n8n-nodes-base`, package metadata rules, and the same targeted
  credential/node rule exceptions;
- `scripts/build.mjs` removes `dist`, invokes the pinned local TypeScript
  compiler, and copies PNG, SVG, and `__schema__` JSON assets; and
- the direct lint dependencies are pinned as one compatibility set and every
  version change must repeat the clean-install, lint, build, audit, and package
  checks below before merge.

The community plugin at 0.32.0 retains the exact `eslint@9.29.0` peer and the
`n8n-workflow@>=2` peer used by this candidate. This update therefore does not
broaden the rejected ESLint 10 boundary or the published runtime peer.

The base lint-rules plugin at 2.0.0 accepts ESLint 8.40 and newer. Its ESLint
10 support does not require this candidate to move past the community plugin's
exact ESLint 9.29.0 peer.

The TypeScript ESLint stack at 8.70.0 accepts ESLint 9 and TypeScript versions
from 4.8.4 through the 5.x line. The candidate's exact ESLint 9.29.0 and
TypeScript 5.9.2 pins remain inside those peer ranges.

The unused interactive `dev` and local `release` helpers were removed with the
CLI. Trusted publishing is unchanged: `.github/workflows/publish-n8n.yml` still
runs the fail-closed check and audit gates before publishing with provenance.

This is an explicit support boundary. n8n's public documentation is
inconsistent about whether verified-node authors must or should retain
`n8n-node`; the open-source scanner applies the package rules independently and
does not require that dependency by name. The direct toolchain passes the same
source lint and produces the same code/static assets locally, but closed Creator
Portal acceptance has not been exercised. Do not claim n8n Cloud verification
eligibility until a provenance-published artifact passes the real scanner and
Portal review.

The rejected dependency majors remain incoherent with this source candidate:

- ESLint 10 fails the pinned n8n community lint rules; the community plugin
  declares an exact ESLint 9.29.0 peer.
- TypeScript 7 is outside the supported range of the pinned TypeScript ESLint
  stack.

The release-contract test pins the complete supported set so a future isolated
major bump cannot look valid after changing only one manifest line.

`n8n-workflow@2.28.4` is the pinned development fixture, not a runtime
constraint. Its exact peer is satisfied by `zod@3.25.67`. The published peer
remains `n8n-workflow: "*"`, so host n8n versions are not narrowed. These
fixtures keep clean-install build tests deterministic and are not shipped in
the package tarball.

The pinned workflow fixture's development graph includes `isolated-vm@6.2.0`.
The published community node does not ship that fixture, so the consumer floor
remains Node.js 20.19; repository validation and trusted publishing continue to
use Node.js 24 without ignoring engine metadata.

## Security boundary

Historical September 30 results for both production-only and complete development
audits (superseded by the current security recheck above):

```text
npm audit --omit=dev --audit-level=moderate
found 0 vulnerabilities

npm audit --audit-level=low
found 0 vulnerabilities
```

The CLI/AI/LangChain branch and `uuid@10.0.0` are absent from the lockfile. The
only resolved `uuid` is patched `uuid@11.1.1` beneath the pinned workflow
fixture. The vulnerable Axios dependency branch is absent from this fixture.
These lock entries are development-only. `npm run audit:dev`
rejects any advisory at any severity; there is no development allowlist.

The prior `brace-expansion`, `ip-address`, and `undici` findings remain resolved
in this lockfile. None of the development dependencies are included in the
package `files` allowlist or npm tarball.

## Validation

- `npm ci`
- npm 10 Linux/x64 lock generation with optional dependencies included
- `npm test`
- `npm run lint`
- `npm run build`
- exact dependency and peer-tree inspection
- `npm audit --omit=dev --audit-level=moderate`
- `npm run audit:dev`
- `npm pack --dry-run`
- generated code/static-asset comparison against the prior CLI build

Pull-request validation and trusted publishing repeat the lint, build, audit,
and package checks.

## External references

- [n8n development requirements](https://docs.n8n.io/connect/create-nodes/build-your-node/set-up-your-development-environment)
- [n8n verification guidelines](https://docs.n8n.io/connect/create-nodes/build-your-node/reference/verification-guidelines)
- [n8n automated package scanner](https://github.com/n8n-io/n8n/blob/master/packages/@n8n/scan-community-package/scanner/scanner.mjs)
- [n8n community rule prohibiting overrides](https://github.com/n8n-io/n8n/blob/master/packages/@n8n/eslint-plugin-community-nodes/src/rules/no-overrides-field.ts)
