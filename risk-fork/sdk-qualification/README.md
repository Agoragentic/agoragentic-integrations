# Optional E2B SDK qualification

This private development package installs exact E2B 2.63.0 on Node >=22.19.0.
It is excluded from the core npm tarball. Core remains Node >=20 and does not
install E2B. Run from a source checkout:

```sh
npm --prefix risk-fork ci --ignore-scripts --no-audit --no-fund
npm --prefix risk-fork/sdk-qualification ci --engine-strict --ignore-scripts --no-audit --no-fund
npm --prefix risk-fork/sdk-qualification audit
npm --prefix risk-fork/sdk-qualification test
```

Tests retain SDK closure/provenance and process-boundary refusals, exact v2 API
serialization, and envd access-token binding through loopback only. Synthetic
build/live gate tests make no provider calls. They do not establish live E2B
qualification or permission to use a provider. See [migration notes](../E2B_SDK_MIGRATION.md).
