# Development-only parser consumer fixture

This is a maintained, unpublished consumer copy of the official
`@typescript-eslint/typescript-estree@8.72.2` npm artifact. It is not an upstream
release or a replacement n8n runtime. The community-node tarball excludes it.

Stable TypeScript ESLint 8.72.2 requires affected minimatch 10. The upstream
[fix](https://github.com/typescript-eslint/typescript-eslint/commit/837401e92d7379a8623ccf6a0883250f4e706ad7)
changes its dependency range to `^11.0.1`, without parser code changes. This
fixture carries that exact range change while retaining the current compiler,
ESLint, community plugin, TypeScript ESLint rules and peer contracts. The lock
resolves minimatch 11.0.8. No npm override, forced peer, audit exception or
prerelease version is used.

## Artifact custody and permitted changes

The upstream npm archive is
`https://registry.npmjs.org/@typescript-eslint/typescript-estree/-/typescript-estree-8.72.2.tgz`.
Its SHA512 integrity is recorded in `manifest.json` and pinned independently
in `../../scripts/verify-lint-parser.mjs`. `upstream-package.json` is the exact
manifest from that archive. `artifact-inventory.json` binds all 90 remaining
files: published JavaScript, declarations, maps, README and MIT license are
unchanged byte-for-byte. This is verified published code; no reproduction of
upstream's compilation or full monorepo test suite is claimed.

Only the consumer package manifest changes:

- minimatch becomes `^11.0.1`, matching the upstream fix;
- the version is labeled `8.72.2+agoragentic.minimatch.1` and `private:true`;
- upstream monorepo-only `scripts` and `devDependencies` are removed. Those
  tools are not needed to execute a normal installation of the published,
  precompiled package. They are not executed by this fixture. All runtime
  dependencies, exports, engines and TypeScript peers are retained.

Build metadata preserves semver compatibility with the existing exact 8.72.2
consumer requirements while identifying the local package. Normal npm
resolution and `npm ls --all` must pass; do not force a rejected dependency
tree. The verifier also checks that all four relevant consumers resolve this
exact package and that no nested original parser or affected minimatch is
hidden in the lock. The full development audit remains mandatory.

## Reproduction and qualification

After `npm ci --ignore-scripts` in `n8n`, obtain the official archive using
`npm pack @typescript-eslint/typescript-estree@8.72.2 --ignore-scripts` into a
temporary directory. From `n8n`, run
`node scripts/verify-lint-parser.mjs --archive /absolute/path/to/archive.tgz`
to verify its identity and the committed package. Extract only that verified
archive into a temporary directory, compare the 90 unmodified files with
`artifact-inventory.json`, and compare its `package.json` with
`upstream-package.json`. Applying the four manifest changes above must produce
the committed consumer manifest. Do not execute the extracted monorepo scripts.

`npm run check` now verifies this package before the existing full Zod fixture
reproduction, tests, lint and build. New regressions reject artifact changes,
missing/extra files, dependency and lifecycle-script substitutions, and false
upstream attribution. They exercise unsafe-code lint diagnostics and the
parser's actual project-service default-project allowlist.

Local Windows/Node24 qualification passed; all effective rule configurations
for node, credential and package sources were unchanged, as were diagnostics
for eleven positive/negative comparison inputs. This does not qualify native
isolated-vm execution, installed n8n behavior, Creator Portal acceptance or
production. Independent review and exact-head CI remain required.

## Maintenance and removal

This fixture adds a maintenance obligation: review upstream parser and
minimatch advisories, preserve archive attribution and all byte/integrity
checks, and audit the complete installed closure. Prefer removing the fixture
when a compatible stable TypeScript ESLint release includes the fix. Restore
the registry dependency, regenerate the lock normally, compare the full lint
configuration/diagnostics, and rerun the existing complete qualification before
removing this verifier. A clean audit alone is insufficient evidence of lint
equivalence or source identity.
