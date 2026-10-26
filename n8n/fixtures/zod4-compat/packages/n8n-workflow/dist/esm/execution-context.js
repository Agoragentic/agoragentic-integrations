import z from "zod/v4";
import { jsonParse } from "./utils.js";
const JsonValueSchema = z.lazy(() => z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.record(z.string(), JsonValueSchema),
    z.array(JsonValueSchema),
]));
const SecureArtifactsSchemaV1 = z.object({
    version: z.literal(1),
    /**
     * Artifacts produced by context-establishment hooks (e.g. a trigger
     * stripper) and consumed by node backends later in the execution.
     *
     * Keyed by the logical alias an operator assigned in the
     * `N8N_SECURITY_SENSITIVE_FIELD_RULES` configuration. The value is an
     * array of leaves extracted from the trigger items that matched the
     * rule — one entry per item that produced a value. Aliases with no
     * matching items are omitted entirely.
     */
    artifacts: z.record(z.string(), JsonValueSchema),
    /**
     * Optional metadata produced by the hook (e.g. provenance, hook id).
     */
    metadata: z.record(z.string(), z.unknown()).optional(),
});
export const SecureArtifactsSchema = z
    .discriminatedUnion('version', [SecureArtifactsSchemaV1])
    .meta({
    title: 'ISecureArtifacts',
});
const CredentialContextSchemaV1 = z.object({
    version: z.literal(1),
    /**
     * Identity token/value used for credential resolution
     * Could be JWT, API key, session token, user ID, etc.
     */
    identity: z.string(),
    /**
     * Optional metadata for credential resolution
     */
    metadata: z.record(z.string(), z.unknown()).optional(),
});
export const CredentialContextSchema = z
    .discriminatedUnion('version', [CredentialContextSchemaV1])
    .meta({
    title: 'ICredentialContext',
});
export const WorkflowExecuteModeList = [
    'cli',
    'error',
    'integrated',
    'internal',
    'manual',
    'retry',
    'trigger',
    'webhook',
    'evaluation',
    'chat',
    'agent',
];
const WorkflowExecuteModeSchema = z.enum(WorkflowExecuteModeList);
const RedactionPolicySchema = z.union([
    z.literal('none'),
    z.literal('all'),
    z.literal('non-manual'),
    z.literal('manual-only'),
]);
const RedactionSettingSchemaV1 = z.object({
    version: z.literal(1),
    policy: RedactionPolicySchema,
});
const RedactionSourceSchema = z.union([z.literal('workflow'), z.literal('instance')]);
/**
 * Per-channel redaction snapshot. Each channel records, independently, whether
 * execution data is redacted for production and manual executions. This is the
 * strictest-per-channel resolution of the workflow setting and the instance floor,
 * captured at execution time.
 *
 * `source` records which layer raised the bar:
 * - `'instance'` when the floor enforced redaction the workflow did not ask for.
 * - `'workflow'` otherwise (workflow setting met or exceeded the floor, including
 *   the floor='off' case).
 */
const RedactionSettingSchemaV2 = z.object({
    version: z.literal(2),
    production: z.boolean(),
    manual: z.boolean(),
    source: RedactionSourceSchema.optional(),
});
/**
 * Redaction snapshot, versioned by shape. V1 stored a single policy enum; V2 stores
 * independent production/manual channels. Both shapes must keep parsing so execution
 * data persisted before the V2 migration remains readable.
 */
const RedactionSettingSchema = z.discriminatedUnion('version', [
    RedactionSettingSchemaV1,
    RedactionSettingSchemaV2,
]);
const ExecutionContextSchemaV1 = z.object({
    version: z.literal(1),
    /**
     * When the context was established (Unix timestamp in milliseconds)
     */
    establishedAt: z.number(),
    /**
     * The mode in which the workflow is being executed
     */
    source: WorkflowExecuteModeSchema,
    /**
     * Optional node where execution started
     */
    triggerNode: z
        .object({
        name: z.string(),
        type: z.string(),
    })
        .optional(),
    /**
     * Optional ID of the parent execution, if this is set this
     * execution context inherited from the mentioned parent execution context.
     */
    parentExecutionId: z.string().optional(),
    /**
     * Encrypted credential context for dynamic credential resolution
     * Always encrypted when stored, decrypted on-demand by credential resolver
     * @see ICredentialContext for decrypted structure
     */
    credentials: z.string().optional().meta({
        description: 'Encrypted credential context for dynamic credential resolution Always encrypted when stored, decrypted on-demand by credential resolver @see ICredentialContext for decrypted structure',
    }),
    /**
     * Encrypted artifacts produced by context-establishment hooks
     * (e.g. a trigger stripper) for later consumption by node backends.
     * Always encrypted when stored, decrypted on demand by
     * `ExecutionContextService`.
     * @see ISecureArtifacts for the decrypted structure.
     */
    secureArtifacts: z.string().optional().meta({
        description: 'Encrypted artifacts produced by context-establishment hooks. Always encrypted when stored, decrypted on-demand by ExecutionContextService. @see ISecureArtifacts for decrypted structure',
    }),
    /**
     * Redaction setting captured at execution time.
     * Persisted so the correct redaction policy is applied when reading execution data,
     * regardless of any subsequent changes to the workflow setting.
     */
    redaction: RedactionSettingSchema.optional(),
    /**
     * The n8n user the execution ran as. Set during dynamic credential
     * resolution to the n8n user a private credential resolved to (covers manual
     * and chat-hub runs alike). Used by the redaction layer to grant that user
     * access to their own data. Absent when the resolved identity is not an n8n
     * user (external Slack/OAuth resolvers) or when no dynamic credential
     * resolved, so those executions stay redacted for everyone.
     */
    executedByUserId: z.string().optional(),
});
export const ExecutionContextSchema = z
    .discriminatedUnion('version', [ExecutionContextSchemaV1])
    .meta({
    title: 'IExecutionContext',
});
export const safeParse = (value, schema) => {
    const typeName = schema.meta()?.title ?? 'Object';
    try {
        const normalizedObject = typeof value === 'string' ? jsonParse(value) : value;
        const parseResult = schema.safeParse(normalizedObject);
        if (parseResult.error) {
            throw parseResult.error;
        }
        // here we could implement a mgiration policy for migrating old execution context versions to newer ones
        return parseResult.data;
    }
    catch (error) {
        throw new Error(`Failed to parse to valid ${typeName}`, {
            cause: error,
        });
    }
};
/**
 * Safely parses an execution context from an
 * @param obj
 * @returns
 */
export const toExecutionContext = (value) => {
    // here we could implement a mgiration policy for migrating old execution context versions to newer ones
    return safeParse(value, ExecutionContextSchema);
};
/**
 * Safely parses a credential context from either an object or a string to an
 * ICredentialContext. This can be used to safely parse a decrypted context for
 * example.
 * @param value The object or string to be parsed
 * @returns ICredentialContext
 * @throws Error in case parsing fails for any reason
 */
export const toCredentialContext = (value) => {
    // here we could implement a mgiration policy for migrating old credential context versions to newer ones
    return safeParse(value, CredentialContextSchema);
};
export const toSecureArtifacts = (value) => {
    // here we could implement a migration policy for migrating old secure artifacts versions to newer ones
    return safeParse(value, SecureArtifactsSchema);
};
//# sourceMappingURL=execution-context.js.map