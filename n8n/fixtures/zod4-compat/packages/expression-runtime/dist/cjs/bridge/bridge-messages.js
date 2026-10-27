"use strict";
/**
 * Schemas for messages the in-isolate runtime sends to the host via the
 * `callHost` typed-RPC dispatcher.
 *
 * The isolate is an untrusted source: anything that crosses the bridge must
 * be validated for shape and types at the boundary. We do that with zod
 * rather than relying on TypeScript discriminated unions, because TS types
 * are erased at runtime and contribute zero security.
 *
 * Each operation has its own schema. The dispatcher entry validates the
 * envelope against the discriminated union, throws on any deviation
 * (unknown `type`, missing/typo'd fields, wrong field types), and then
 * delegates to a handler that operates on the parsed (statically narrowed)
 * message.
 *
 * Each additional typed RPC lands as a new schema here plus a new `case`
 * in the bridge's dispatcher switch.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.bridgeMessageSchema = exports.getPairedItemMessage = exports.evaluateExpressionMessage = exports.getNodeItemMessage = exports.getNodeItemMatchingMessage = exports.getNodePairedItemMessage = exports.fromAiMessage = exports.getItemsMessage = exports.getInputAllMessage = exports.getInputLastMessage = exports.getInputFirstMessage = exports.getNodeAllMessage = exports.getNodeLastMessage = exports.getNodeFirstMessage = void 0;
const zod_1 = require("zod");
/**
 * `$('NodeName').first(branchIndex?, runIndex?)` — fetch the first item of
 * a named node's most recent execution data.
 */
exports.getNodeFirstMessage = zod_1.z
    .object({
    type: zod_1.z.literal('getNodeFirst'),
    nodeName: zod_1.z.string(),
    branchIndex: zod_1.z.number().int().nonnegative().optional(),
    runIndex: zod_1.z.number().int().nonnegative().optional(),
})
    .strict();
/**
 * `$('NodeName').last(branchIndex?, runIndex?)` — fetch the last item of
 * a named node's most recent execution data.
 */
exports.getNodeLastMessage = zod_1.z
    .object({
    type: zod_1.z.literal('getNodeLast'),
    nodeName: zod_1.z.string(),
    branchIndex: zod_1.z.number().int().nonnegative().optional(),
    runIndex: zod_1.z.number().int().nonnegative().optional(),
})
    .strict();
/**
 * `$('NodeName').all(branchIndex?, runIndex?)` — fetch every item of a
 * named node's most recent execution data as an array.
 */
exports.getNodeAllMessage = zod_1.z
    .object({
    type: zod_1.z.literal('getNodeAll'),
    nodeName: zod_1.z.string(),
    branchIndex: zod_1.z.number().int().nonnegative().optional(),
    runIndex: zod_1.z.number().int().nonnegative().optional(),
})
    .strict();
/**
 * `$input.first()` — fetch the first item of the current node's input.
 * Host enforces zero arguments; the schema has no fields besides `type`.
 */
exports.getInputFirstMessage = zod_1.z.object({ type: zod_1.z.literal('getInputFirst') }).strict();
/**
 * `$input.last()` — fetch the last item of the current node's input.
 */
exports.getInputLastMessage = zod_1.z.object({ type: zod_1.z.literal('getInputLast') }).strict();
/**
 * `$input.all()` — fetch every item of the current node's input.
 */
exports.getInputAllMessage = zod_1.z.object({ type: zod_1.z.literal('getInputAll') }).strict();
/**
 * `$items(nodeName?, outputIndex?, runIndex?)` — fetch the execution data of
 * a node by name (or the current node's input if `nodeName` is omitted).
 *
 * `runIndex` accepts negative values: the host uses `-1` as a sentinel for
 * "latest run" (see `WorkflowDataProxy.$items` —
 * `runIndex === undefined ? -1 : runIndex`). The schema uses
 * `z.number().int()` without `.nonnegative()` so expressions can pass `-1`
 * explicitly if they need to.
 */
exports.getItemsMessage = zod_1.z
    .object({
    type: zod_1.z.literal('getItems'),
    nodeName: zod_1.z.string().optional(),
    outputIndex: zod_1.z.number().int().nonnegative().optional(),
    runIndex: zod_1.z.number().int().optional(),
})
    .strict();
/**
 * `$fromAI(name, description?, type?, defaultValue?)` — the AI-builder
 * placeholder accessor (aliases: `$fromAi`, `$fromai`).
 *
 * Two deliberate looseness points in this schema, both to preserve host
 * contract / parity:
 *
 * 1. `name` is `z.string().optional()` (not required) so a call missing
 *    the argument or passing an empty string reaches the host, which
 *    throws the user-friendly `ExpressionError("Add a key, e.g. $fromAI('placeholder_name')")`.
 *    Requiring it here would replace that error with a generic zod
 *    message. The host also validates the regex `[a-zA-Z0-9_-]{0,64}`;
 *    we don't pre-empt that either.
 * 2. `defaultValue` is `z.unknown()` because the host accepts any value
 *    as the fallback return (`handleFromAi` returns it directly via
 *    `??`). Structured-clone at the bridge boundary still prevents
 *    functions and other non-cloneable values from crossing.
 *
 * `description` and `type` are forwarded even though the host currently
 * ignores them (`_description`, `_type`), so the protocol matches the
 * documented call signature.
 */
exports.fromAiMessage = zod_1.z
    .object({
    type: zod_1.z.literal('fromAi'),
    name: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    valueType: zod_1.z.string().optional(),
    // Zod 4 requires an explicit optional property to preserve omission.
    defaultValue: zod_1.z.unknown().optional(),
})
    .strict();
/**
 * `$('NodeName').pairedItem(itemIndex?)` / `.itemMatching(itemIndex)` /
 * `.item` — resolve the paired item for a referenced node.
 *
 * All three host-side surface forms share one internal resolver
 * (`pairedItemMethod` in `WorkflowDataProxy`), but the resolver closes
 * over the literal property name the bridge accessed on the host proxy
 * — so the error message and getter-vs-method form depend on *which*
 * property the bridge reads. Three separate discriminators, each
 * mapping a handler to a fixed literal property name, are the only way
 * to preserve the host's friendly errors (e.g. "Missing item index for
 * .itemMatching()") and the `.item` getter semantics without
 * duplicating logic in-isolate.
 *
 * `itemIndex` is optional on all three at the schema level; the host
 * throws the appropriate `ExpressionError` when it's missing for
 * `.itemMatching()`, and applies the current-itemIndex default for
 * `.pairedItem` and `.item`.
 */
exports.getNodePairedItemMessage = zod_1.z
    .object({
    type: zod_1.z.literal('getNodePairedItem'),
    nodeName: zod_1.z.string(),
    itemIndex: zod_1.z.number().int().nonnegative().optional(),
})
    .strict();
/**
 * `itemIndex` is `.optional()` even though `.itemMatching()` requires it
 * at the host. The host's `pairedItemMethod` closure throws the friendly
 * `"Missing item index for .itemMatching()"` error when the field is
 * absent — keeping the schema permissive lets that host error surface
 * verbatim instead of being replaced by a generic zod parse failure.
 */
exports.getNodeItemMatchingMessage = zod_1.z
    .object({
    type: zod_1.z.literal('getNodeItemMatching'),
    nodeName: zod_1.z.string(),
    itemIndex: zod_1.z.number().int().nonnegative().optional(),
})
    .strict();
exports.getNodeItemMessage = zod_1.z
    .object({
    type: zod_1.z.literal('getNodeItem'),
    nodeName: zod_1.z.string(),
})
    .strict();
/**
 * `$evaluateExpression(expression, itemIndex?)` — evaluate a nested
 * expression string at runtime against the same execution context.
 *
 * The host recursively invokes the expression engine on the `expression`
 * string — under the VM engine this re-enters the bridge with a fresh
 * evaluation. `itemIndex` is optional and defaults to the current item;
 * the schema mirrors the existing "nonnegative int" constraint used by
 * the node-data RPCs.
 */
exports.evaluateExpressionMessage = zod_1.z
    .object({
    type: zod_1.z.literal('evaluateExpression'),
    expression: zod_1.z.string(),
    itemIndex: zod_1.z.number().int().nonnegative().optional(),
})
    .strict();
/**
 * `ISourceData` — the source record that accompanies a paired-item
 * traversal step. Mirrors the host interface used by
 * `WorkflowDataProxy.getPairedItem`.
 */
const sourceDataSchema = zod_1.z
    .object({
    previousNode: zod_1.z.string(),
    previousNodeOutput: zod_1.z.number().int().nonnegative().optional(),
    previousNodeRun: zod_1.z.number().int().nonnegative().optional(),
})
    .strict();
/**
 * `IPairedItemData` — one paired-item record. `sourceOverwrite` lets a
 * node override the upstream source while the helper walks the ancestry
 * chain; the field is optional and recurses through the same schema.
 */
const pairedItemDataSchema = zod_1.z
    .object({
    item: zod_1.z.number().int().nonnegative(),
    input: zod_1.z.number().int().nonnegative().optional(),
    sourceOverwrite: sourceDataSchema.optional(),
})
    .strict();
/**
 * `$getPairedItem(destinationNodeName, incomingSourceData, initialPairedItem)` —
 * traverse the paired-item ancestry chain back to the named upstream node
 * and return the matching execution item.
 *
 * Two host-side fields are deliberately omitted from the schema:
 * - `usedMethodName` defaults to `$getPairedItem` on the host; the isolate
 *   has no reason to spoof a different method name in the error path.
 * - `nodeBeforeLast` is an internal recursion argument; only the host
 *   itself sets it during the recursive walk.
 *
 * `incomingSourceData` is nullable because the host's signature accepts
 * `ISourceData | null` (and throws a paired-item-not-found error when null).
 */
exports.getPairedItemMessage = zod_1.z
    .object({
    type: zod_1.z.literal('getPairedItem'),
    destinationNodeName: zod_1.z.string(),
    incomingSourceData: sourceDataSchema.nullable(),
    initialPairedItem: pairedItemDataSchema,
})
    .strict();
/**
 * The full set of messages the bridge will accept. Discriminator is `type`.
 *
 * Use `.strict()` on each member so unknown fields are rejected rather than
 * silently ignored — this catches typos in the runtime stubs and keeps the
 * protocol surface tight.
 */
exports.bridgeMessageSchema = zod_1.z.discriminatedUnion('type', [
    exports.getNodeFirstMessage,
    exports.getNodeLastMessage,
    exports.getNodeAllMessage,
    exports.getInputFirstMessage,
    exports.getInputLastMessage,
    exports.getInputAllMessage,
    exports.getItemsMessage,
    exports.fromAiMessage,
    exports.getNodePairedItemMessage,
    exports.getNodeItemMatchingMessage,
    exports.getNodeItemMessage,
    exports.evaluateExpressionMessage,
    exports.getPairedItemMessage,
]);
//# sourceMappingURL=bridge-messages.js.map