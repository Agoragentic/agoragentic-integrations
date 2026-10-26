# Maintained n8n Zod 4 consumer fixture

This directory is a development-only maintained consumer fixture. It is not
an n8n release, does not replace an installed n8n host, and is excluded from
the published community-node package.

## Provenance

The fixture combines two independently identified inputs:

- Official npm package tarballs: `n8n-workflow@2.28.4` and
  `@n8n/expression-runtime@0.19.1`. Their registry SHA-512 integrities are
  recorded in `manifest.json`; `zod@4.6.7` is resolved from the locked npm
  build closure and its registry integrity is also bound there.
- Official n8n source commit `955be3ef2131afb9ecba5482024d045e710e4f20`, tag
  `n8n@2.28.7`, from the codeload archive with SHA-256
  `0ddad00a619a7df13ad16fedc1b67d8bb66239f0aa68a9ac71a5f90ce89d1b4d`.

The package tarballs and source archive are separate provenance identities;
this fixture does not claim to reproduce an upstream vendor build. The builder
verifies the archive, selected source bytes, registry tarball integrities,
source patch, compiler/toolchain lock, bundle inputs, and generated artifact
inventory before accepting a committed output.

## Maintained source migration

The full workflow and expression-runtime source trees are compiled into both
the CJS and ESM public package roots. The maintained Zod 4 changes include:

- explicit string keys for affected `z.record` schemas and optional
  credentials records;
- omitted `$fromAI` `defaultValue` represented as optional while present
  values remain arbitrary;
- `prefault` for supplied defaults so invalid defaults are still rejected and
  falsy values such as `false` and `0` remain present;
- preservation of generated JSON metadata through the Zod 4 schema definition;
- Zod 4 `PropertyKey` issue paths, including symbol formatting;
- a source-bound `LogScope` type generated verbatim from the pinned
  `LOG_SCOPES` tuple; and
- explicit `node:http` typing required by the full source declaration build.

The exact tuple is generated from the pinned upstream source and preserved in
the generated [`source-changes.patch`](source-changes.patch) evidence; this
README intentionally does not duplicate the tuple and risk drifting from that
source-bound artifact.

The Zod 4 package retains its published legacy and `v3` bytes for package
compatibility. The maintained consumer imports the Zod 4 root; it does not
modify or delete those compatibility subpaths.

## Reproduction and boundaries

The dedicated fixture toolchain is locked under `build/`, uses the pinned
compiler and bundler, installs with lifecycle scripts disabled, and audits the
complete closure. Runtime expression bundles are regenerated from the pinned
source/configuration and their input graph is recorded. Native `isolated-vm`
execution, an installed n8n host, Creator Portal acceptance, n8n Cloud
eligibility, payments, and production behavior are outside this fixture.

Verification modes do not replace committed artifacts. Use an explicit write
only when intentionally regenerating the fixture:

```text
node n8n/scripts/build-zod4-fixture.mjs --check --source-archive PATH
node n8n/scripts/build-zod4-fixture.mjs --write --source-archive PATH
```

If no archive path is supplied, the builder downloads the pinned official
codeload archive and verifies its SHA-256. The authoritative strict
installed-consumer proof runs inside the builder after it stages regenerated
artifacts and performs the locked install. A standalone checker is available
for an already-installed fixture, but it does not itself regenerate or refresh
those artifacts:

```text
node n8n/scripts/check-zod4-consumer.mjs
```

## Current candidate status — 2026-10-26

Local `--write` regeneration and byte-for-byte `--check` reproduction passed
for 300 verified source files and 1,193 generated artifacts. The staged strict
installed-consumer proof passed NodeNext CJS/ESM declaration checks with
`skipLibCheck:false`; the full local suite reports 51/51 tests with zero skips.
Lint, build, production-only audit, development audit, dedicated closure audit,
staged consumer audit, and pack dry-run also passed. Hosted CI and approval
must also pass on the exact reviewed head. These checks made no runtime calls and do not qualify an installed host,
isolated-vm execution, Creator Portal, n8n Cloud, payments, or production.
