/**
 * The subset of `ivm.Reference` shape the in-isolate runtime relies on.
 * Declared locally rather than importing from `isolated-vm` because this
 * module is bundled into the isolate IIFE, where the native module is
 * unavailable. The host wires real `ivm.Reference` instances which
 * structurally satisfy this interface.
 */
interface BridgeCallback {
    applySync(thisArg: unknown, args: unknown[], options?: {
        arguments?: {
            copy?: boolean;
        };
        result?: {
            copy?: boolean;
        };
    }): unknown;
}
/**
 * Bridge callbacks the in-isolate runtime can invoke synchronously via
 * `ivm.Reference.applySync`.
 *
 *   - `getValueAtPath`, `getArrayElement`: data-access primitives used by the
 *     lazy-proxy system. Hot path; one ivm.Reference each for minimum overhead.
 *   - `callHost`: typed-RPC dispatcher. The in-isolate runtime constructs
 *     an envelope (e.g. `{ type: 'getNodeFirst', nodeName, ... }`) and the
 *     host-side dispatcher validates it with zod before routing to a handler.
 *     A single ivm.Reference covers every typed operation; new operations
 *     are new schemas in `bridge/bridge-messages.ts` + new cases in the
 *     dispatcher switch. The name reflects what this is: a synchronous
 *     host RPC, not a postMessage-style async send.
 *
 * The bridge wires all three callbacks unconditionally before invoking
 * `buildContext`, so the runtime treats them as present — no defensive
 * null/undefined checks at each call site.
 */
export interface BridgeCallbacks {
    getValueAtPath: BridgeCallback;
    getArrayElement: BridgeCallback;
    callHost: BridgeCallback;
}
/**
 * Build a fresh, closure-scoped evaluation context.
 *
 * This function creates a context object that contains everything needed to
 * evaluate an expression, without touching any global mutable state
 * (except luxon's Settings.defaultZone which is process-wide).
 *
 * The returned object is used as tournament's `this` context in the
 * evalClosureSync wrapper.
 *
 * @param callbacks - Bridge callbacks (data-access primitives + typed RPCs)
 * @param timezone - Optional IANA timezone string
 * @returns A context object with all workflow data, proxies, and builtins
 */
export declare function buildContext(callbacks: BridgeCallbacks, timezone?: string): Record<string, unknown>;
export {};
//# sourceMappingURL=context.d.ts.map