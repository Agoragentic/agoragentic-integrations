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
import { z } from "zod";
/**
 * `$('NodeName').first(branchIndex?, runIndex?)` — fetch the first item of
 * a named node's most recent execution data.
 */
export declare const getNodeFirstMessage: z.ZodObject<{
    type: z.ZodLiteral<"getNodeFirst">;
    nodeName: z.ZodString;
    branchIndex: z.ZodOptional<z.ZodNumber>;
    runIndex: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>;
/**
 * `$('NodeName').last(branchIndex?, runIndex?)` — fetch the last item of
 * a named node's most recent execution data.
 */
export declare const getNodeLastMessage: z.ZodObject<{
    type: z.ZodLiteral<"getNodeLast">;
    nodeName: z.ZodString;
    branchIndex: z.ZodOptional<z.ZodNumber>;
    runIndex: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>;
/**
 * `$('NodeName').all(branchIndex?, runIndex?)` — fetch every item of a
 * named node's most recent execution data as an array.
 */
export declare const getNodeAllMessage: z.ZodObject<{
    type: z.ZodLiteral<"getNodeAll">;
    nodeName: z.ZodString;
    branchIndex: z.ZodOptional<z.ZodNumber>;
    runIndex: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>;
/**
 * `$input.first()` — fetch the first item of the current node's input.
 * Host enforces zero arguments; the schema has no fields besides `type`.
 */
export declare const getInputFirstMessage: z.ZodObject<{
    type: z.ZodLiteral<"getInputFirst">;
}, z.core.$strict>;
/**
 * `$input.last()` — fetch the last item of the current node's input.
 */
export declare const getInputLastMessage: z.ZodObject<{
    type: z.ZodLiteral<"getInputLast">;
}, z.core.$strict>;
/**
 * `$input.all()` — fetch every item of the current node's input.
 */
export declare const getInputAllMessage: z.ZodObject<{
    type: z.ZodLiteral<"getInputAll">;
}, z.core.$strict>;
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
export declare const getItemsMessage: z.ZodObject<{
    type: z.ZodLiteral<"getItems">;
    nodeName: z.ZodOptional<z.ZodString>;
    outputIndex: z.ZodOptional<z.ZodNumber>;
    runIndex: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>;
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
export declare const fromAiMessage: z.ZodObject<{
    type: z.ZodLiteral<"fromAi">;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    valueType: z.ZodOptional<z.ZodString>;
    defaultValue: z.ZodOptional<z.ZodUnknown>;
}, z.core.$strict>;
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
export declare const getNodePairedItemMessage: z.ZodObject<{
    type: z.ZodLiteral<"getNodePairedItem">;
    nodeName: z.ZodString;
    itemIndex: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>;
/**
 * `itemIndex` is `.optional()` even though `.itemMatching()` requires it
 * at the host. The host's `pairedItemMethod` closure throws the friendly
 * `"Missing item index for .itemMatching()"` error when the field is
 * absent — keeping the schema permissive lets that host error surface
 * verbatim instead of being replaced by a generic zod parse failure.
 */
export declare const getNodeItemMatchingMessage: z.ZodObject<{
    type: z.ZodLiteral<"getNodeItemMatching">;
    nodeName: z.ZodString;
    itemIndex: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>;
export declare const getNodeItemMessage: z.ZodObject<{
    type: z.ZodLiteral<"getNodeItem">;
    nodeName: z.ZodString;
}, z.core.$strict>;
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
export declare const evaluateExpressionMessage: z.ZodObject<{
    type: z.ZodLiteral<"evaluateExpression">;
    expression: z.ZodString;
    itemIndex: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>;
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
export declare const getPairedItemMessage: z.ZodObject<{
    type: z.ZodLiteral<"getPairedItem">;
    destinationNodeName: z.ZodString;
    incomingSourceData: z.ZodNullable<z.ZodObject<{
        previousNode: z.ZodString;
        previousNodeOutput: z.ZodOptional<z.ZodNumber>;
        previousNodeRun: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>>;
    initialPairedItem: z.ZodObject<{
        item: z.ZodNumber;
        input: z.ZodOptional<z.ZodNumber>;
        sourceOverwrite: z.ZodOptional<z.ZodObject<{
            previousNode: z.ZodString;
            previousNodeOutput: z.ZodOptional<z.ZodNumber>;
            previousNodeRun: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>>;
    }, z.core.$strict>;
}, z.core.$strict>;
/**
 * The full set of messages the bridge will accept. Discriminator is `type`.
 *
 * Use `.strict()` on each member so unknown fields are rejected rather than
 * silently ignored — this catches typos in the runtime stubs and keeps the
 * protocol surface tight.
 */
export declare const bridgeMessageSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    type: z.ZodLiteral<"getNodeFirst">;
    nodeName: z.ZodString;
    branchIndex: z.ZodOptional<z.ZodNumber>;
    runIndex: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>, z.ZodObject<{
    type: z.ZodLiteral<"getNodeLast">;
    nodeName: z.ZodString;
    branchIndex: z.ZodOptional<z.ZodNumber>;
    runIndex: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>, z.ZodObject<{
    type: z.ZodLiteral<"getNodeAll">;
    nodeName: z.ZodString;
    branchIndex: z.ZodOptional<z.ZodNumber>;
    runIndex: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>, z.ZodObject<{
    type: z.ZodLiteral<"getInputFirst">;
}, z.core.$strict>, z.ZodObject<{
    type: z.ZodLiteral<"getInputLast">;
}, z.core.$strict>, z.ZodObject<{
    type: z.ZodLiteral<"getInputAll">;
}, z.core.$strict>, z.ZodObject<{
    type: z.ZodLiteral<"getItems">;
    nodeName: z.ZodOptional<z.ZodString>;
    outputIndex: z.ZodOptional<z.ZodNumber>;
    runIndex: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>, z.ZodObject<{
    type: z.ZodLiteral<"fromAi">;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    valueType: z.ZodOptional<z.ZodString>;
    defaultValue: z.ZodOptional<z.ZodUnknown>;
}, z.core.$strict>, z.ZodObject<{
    type: z.ZodLiteral<"getNodePairedItem">;
    nodeName: z.ZodString;
    itemIndex: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>, z.ZodObject<{
    type: z.ZodLiteral<"getNodeItemMatching">;
    nodeName: z.ZodString;
    itemIndex: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>, z.ZodObject<{
    type: z.ZodLiteral<"getNodeItem">;
    nodeName: z.ZodString;
}, z.core.$strict>, z.ZodObject<{
    type: z.ZodLiteral<"evaluateExpression">;
    expression: z.ZodString;
    itemIndex: z.ZodOptional<z.ZodNumber>;
}, z.core.$strict>, z.ZodObject<{
    type: z.ZodLiteral<"getPairedItem">;
    destinationNodeName: z.ZodString;
    incomingSourceData: z.ZodNullable<z.ZodObject<{
        previousNode: z.ZodString;
        previousNodeOutput: z.ZodOptional<z.ZodNumber>;
        previousNodeRun: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>>;
    initialPairedItem: z.ZodObject<{
        item: z.ZodNumber;
        input: z.ZodOptional<z.ZodNumber>;
        sourceOverwrite: z.ZodOptional<z.ZodObject<{
            previousNode: z.ZodString;
            previousNodeOutput: z.ZodOptional<z.ZodNumber>;
            previousNodeRun: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strict>>;
    }, z.core.$strict>;
}, z.core.$strict>], "type">;
export type BridgeMessage = z.infer<typeof bridgeMessageSchema>;
//# sourceMappingURL=bridge-messages.d.ts.map