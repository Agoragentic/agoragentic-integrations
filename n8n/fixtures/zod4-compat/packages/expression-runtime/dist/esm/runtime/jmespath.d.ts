/**
 * In-isolate `$jmespath` / `$jmesPath` implementation.
 *
 * In-isolate counterpart of the host-side wrapper in
 * `packages/workflow/src/workflow-data-proxy.ts`, so that expressions
 * resolve `$jmespath` from the in-isolate runtime via Tournament's
 * polyfill. `$jmespath` is a pure utility — it takes its data as an
 * argument and runs a query on it, with no need for host context.
 * Keeping it in-isolate means it does not appear as a host-callable on
 * the bridge, which shrinks the host-callable surface the isolate can
 * reach.
 *
 * Relationship to the host wrapper — same observable contract,
 * deliberately different internals:
 *   - Throws `ExpressionError` (same name) when args are wrong.
 *   - Rejects queries that contain unsafe property tokens.
 *   - Does NOT spread `data` before querying. Host-side, the top-level
 *     spread exists to strip proxies off the data before handing it to
 *     jmespath; in-isolate that is a no-op (nested values stay lazy
 *     proxies either way, and the isolate boundary already prevents
 *     host-object leakage), while spreading a lazy proxy (e.g. `$json`)
 *     would cost one synchronous host roundtrip per top-level key
 *     before the query even runs.
 *
 * Note on lazy proxies: when `data` is a lazy proxy (e.g. `$json`), each
 * property access during `jmespath.search` triggers a synchronous host
 * roundtrip via `getValueAtPath`. Functional but slow for deep traversals.
 * Performance optimisation (e.g. bulk pre-fetch of the queried subtree) is
 * a follow-up.
 */
export declare function jmesPath(data: unknown, query: string): unknown;
//# sourceMappingURL=jmespath.d.ts.map