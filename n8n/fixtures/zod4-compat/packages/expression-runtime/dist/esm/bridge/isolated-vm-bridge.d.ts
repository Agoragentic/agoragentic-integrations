import type { RuntimeBridge, BridgeConfig, ExecuteOptions, WorkflowData } from "../types/index.js";
/**
 * IsolatedVmBridge - Runtime bridge using isolated-vm for secure expression evaluation.
 *
 * This bridge creates a V8 isolate with:
 * - Hard memory limit (128MB default)
 * - No access to Node.js APIs
 * - Timeout enforcement
 * - Complete isolation from host process
 *
 * Context reuse pattern: Create isolate/context once, reset state between evaluations.
 */
export declare class IsolatedVmBridge implements RuntimeBridge {
    private isolate;
    private context?;
    private initialized;
    private disposed;
    private config;
    private logger;
    constructor(config?: BridgeConfig);
    /**
     * Initialize the isolate and create execution context.
     *
     * Steps:
     * 1. Create context
     * 2. Set up basic globals (global reference)
     * 3. Load runtime bundle (DateTime, extend, proxy system)
     * 4. Verify proxy system
     *
     * Must be called before execute().
     */
    initialize(): Promise<void>;
    /**
     * Load runtime bundle into the isolate.
     *
     * The runtime bundle includes:
     * - DateTime, extend, extendOptional (expression engine globals)
     * - SafeObject and SafeError wrappers
     * - createDeepLazyProxy function
     * - buildContext function
     *
     * @private
     * @throws {Error} If context not initialized or bundle loading fails
     */
    private loadVendorLibraries;
    /**
     * Verify the proxy system loaded correctly.
     *
     * The proxy system is loaded as part of the runtime bundle in loadVendorLibraries().
     * This method verifies all required components are available.
     *
     * @private
     * @throws {Error} If context not initialized or proxy system verification fails
     */
    private verifyProxySystem;
    /**
     * Inject the E() error handler into the isolate context.
     *
     * There are two exception-handling layers inside the isolate:
     *
     * 1. **Inner layer (this handler, `E()`)** — Tournament wraps each
     *    expression with try-catch that calls `E(error, this)`. This handler
     *    must match the legacy engine's behavior (set in expression.ts via
     *    setErrorHandler):
     *    - Re-throw ExpressionError / ExpressionExtensionError
     *    - Swallow everything else (TypeErrors, generic Errors, etc.)
     *
     * 2. **Outer layer (`wrappedCode` try-catch in `execute()`)** — Catches
     *    anything that escaped `E()` (e.g. re-thrown ExpressionErrors) and
     *    serializes it into a sentinel object so the host can reconstruct it.
     *
     * Inside the isolate, errors from host callbacks arrive as sentinel
     * objects ({ __isError, name, message, ... }) rather than class instances,
     * so we match by name instead of instanceof.
     *
     * @private
     * @throws {Error} If context not initialized
     */
    private injectErrorHandler;
    /**
     * Create an ivm.Reference callback for getting value/metadata at a path.
     *
     * Used by createDeepLazyProxy when accessing properties. Returns metadata
     * markers for arrays and objects, or the primitive value directly.
     *
     * Function-typed values are returned as `undefined` — every callable on
     * the host data surface (`$('Foo').first()`, `$items()`, `$fromAI()`,
     * `$evaluateExpression()`, `$getPairedItem()`) is wired in-isolate via
     * the typed-RPC dispatcher (`callHost`). No expression form should
     * reach a function through this path.
     *
     * @param data - Current workflow data to use for callback responses
     * @private
     */
    private createGetValueAtPathRef;
    /**
     * Create an ivm.Reference callback for getting array elements at an index.
     *
     * Used by array proxy when accessing numeric indices.
     *
     * @param data - Current workflow data to use for callback responses
     * @private
     */
    private createGetArrayElementRef;
    /**
     * Create the single typed-RPC dispatcher.
     *
     * The isolate sends one envelope per typed RPC invocation:
     *   `callHost({ type: 'getNodeFirst', nodeName, branchIndex?, runIndex? })`
     *
     * Inputs cross a trust boundary, so the dispatcher parses every envelope
     * with the host-side zod schema (`bridgeMessageSchema`) before any
     * dispatch happens. Anything that deviates from the declared shape —
     * unknown `type`, missing required fields, extra unexpected fields,
     * wrong field types — fails the parse and an error sentinel is returned
     * to the caller.
     *
     * After parsing, `switch (msg.type)` dispatches to a private handler with
     * a fully narrowed message type. The operation set is exactly the cases
     * in this switch; the `type` field selects a static branch in source,
     * not a property lookup on a runtime object.
     *
     * @param data - Current workflow data
     * @private
     */
    private createCallHostRef;
    /**
     * Handlers for the `$('Foo').{first,last,all}` typed RPCs.
     *
     * Each handler reads a fixed literal property name off the host-side node
     * proxy — the isolate cannot influence which property is dereferenced.
     * Eliminating `data.$` as a host-callable entirely would require reaching
     * the `WorkflowDataProxy` internals (e.g. `getNodeExecutionOrPinnedData`)
     * rather than the public `$()` API; that's a follow-up.
     *
     * `data.$` is a host-wired function (`WorkflowDataProxy`'s `$`). If it
     * ever isn't, optional chaining short-circuits to `undefined` — the same
     * observable result the runtime's `E()` handler produces from any thrown
     * error here.
     *
     * @private
     */
    private handleGetNodeFirst;
    private handleGetNodeLast;
    private handleGetNodeAll;
    /**
     * Handlers for the `$input.{first,last,all}` typed RPCs.
     *
     * Each reads a fixed literal property name off `data.$input` (the host's
     * `WorkflowDataProxy` input proxy). The host enforces zero arguments on
     * these methods — the schemas have no fields besides `type`, so the
     * isolate cannot pass anything that would trigger the "should have no
     * arguments" error path on the host side.
     *
     * @private
     */
    private handleGetInputFirst;
    private handleGetInputLast;
    private handleGetInputAll;
    /**
     * Handler for `$items(nodeName?, outputIndex?, runIndex?)` — the
     * global accessor for a node's execution data. Reads the literal
     * `$items` property off `data` (host-wired by `WorkflowDataProxy`)
     * and forwards the validated args verbatim. The host applies its own
     * defaults when fields are `undefined`.
     *
     * @private
     */
    private handleGetItems;
    /**
     * Handler for `$fromAI(name, description?, type?, defaultValue?)` and its
     * `$fromAi` / `$fromai` aliases. Reads the literal `$fromAI` property
     * off `data` (host-wired) and forwards the args. The host validates
     * `name` (required + regex) and applies its own resolution / fallback
     * logic, so empty / invalid names surface as the host's structured
     * `ExpressionError` rather than a generic zod parse error.
     *
     * Note: `msg.valueType` maps to the host's third positional parameter
     * (`_type` in `WorkflowDataProxy.handleFromAi`). The bridge protocol
     * renames it to avoid collision with the `type` discriminator on the
     * envelope — the host parameter currently goes unused, but if it ever
     * gains a name (`type`), this mapping should stay explicit.
     *
     * @private
     */
    private handleFromAi;
    /**
     * Handlers for the `$('Foo').pairedItem(itemIndex?)` / `.itemMatching(...)` /
     * `.item` cluster. Three separate typed RPCs, each reading exactly one
     * literal property off the host node proxy.
     *
     * The split is load-bearing: the host's `pairedItemMethod` closure
     * captures which property name the proxy `get` trap saw, and uses
     * that to pick the right error message (e.g. "Missing item index for
     * .itemMatching()") and to decide between method-call vs getter
     * semantics for `.item`. Reading the matching property here lets
     * those host-side branches fire exactly as they do in the legacy
     * engine; no in-isolate validation needed.
     *
     * @private
     */
    private handleGetNodePairedItem;
    private handleGetNodeItemMatching;
    private handleGetNodeItem;
    /**
     * Handler for `$evaluateExpression(expression, itemIndex?)`. Forwards
     * the string to the host's nested-evaluation helper, which re-enters
     * the expression engine on the inner expression. Under the VM engine
     * this round-trips through the bridge again on a fresh evaluation
     * cycle, which is the same shape the legacy engine supports.
     *
     * @private
     */
    private handleEvaluateExpression;
    /**
     * Handler for `$getPairedItem(destinationNodeName, incomingSourceData,
     * initialPairedItem)`. Forwards directly to the host binding, which
     * walks the paired-item ancestry chain back to the named upstream node
     * and returns the matching execution item.
     *
     * The two trailing host parameters — `usedMethodName` and
     * `nodeBeforeLast` — are deliberately not part of the wire protocol:
     * the host's default for `usedMethodName` is already `$getPairedItem`,
     * and `nodeBeforeLast` is an internal recursion argument the host sets
     * during traversal.
     *
     * @private
     */
    private handleGetPairedItem;
    /**
     * Execute JavaScript code in the isolated context.
     *
     * Flow:
     * 1. Create three ivm.Reference callbacks scoped to the current data:
     *    `getValueAtPath`, `getArrayElement`, `callHost`.
     * 2. Use evalClosureSync to run the code in a closure where `$0`/`$1`/`$2`
     *    are the callback references — no global mutable state.
     * 3. buildContext() inside the isolate creates a fresh evaluation context
     *    from the closure-scoped references.
     *
     * Each call gets its own closure, so nested and concurrent evaluations
     * cannot interfere with each other.
     *
     * @param code - JavaScript expression to evaluate
     * @param data - Workflow data (e.g., { $json: {...}, $runIndex: 0 })
     * @returns Result of the expression
     * @throws {Error} If bridge not initialized or execution fails
     */
    execute(code: string, data: WorkflowData, options?: ExecuteOptions): unknown;
    /**
     * Reconstruct an error from serialized isolate data.
     *
     * Maps error names back to their host-side classes and restores
     * custom properties that would otherwise be lost crossing the boundary.
     */
    private reconstructError;
    /**
     * Dispose of the isolate and free resources.
     *
     * After disposal, the bridge cannot be used again.
     */
    dispose(): Promise<void>;
    /**
     * Check if the bridge has been disposed.
     *
     * @returns true if disposed, false otherwise
     */
    isDisposed(): boolean;
}
//# sourceMappingURL=isolated-vm-bridge.d.ts.map