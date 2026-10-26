"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSecureArtifacts = exports.toCredentialContext = exports.toExecutionContext = exports.safeParse = exports.ExecutionContextSchema = exports.WorkflowExecuteModeList = exports.CredentialContextSchema = exports.SecureArtifactsSchema = void 0;
const v4_1 = __importDefault(require("zod/v4"));
const utils_1 = require("./utils.js");
const JsonValueSchema = v4_1.default.lazy(() => v4_1.default.union([
    v4_1.default.string(),
    v4_1.default.number(),
    v4_1.default.boolean(),
    v4_1.default.null(),
    v4_1.default.record(v4_1.default.string(), JsonValueSchema),
    v4_1.default.array(JsonValueSchema),
]));
const SecureArtifactsSchemaV1 = v4_1.default.object({
    version: v4_1.default.literal(1),
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
    artifacts: v4_1.default.record(v4_1.default.string(), JsonValueSchema),
    /**
     * Optional metadata produced by the hook (e.g. provenance, hook id).
     */
    metadata: v4_1.default.record(v4_1.default.string(), v4_1.default.unknown()).optional(),
});
exports.SecureArtifactsSchema = v4_1.default
    .discriminatedUnion('version', [SecureArtifactsSchemaV1])
    .meta({
    title: 'ISecureArtifacts',
});
const CredentialContextSchemaV1 = v4_1.default.object({
    version: v4_1.default.literal(1),
    /**
     * Identity token/value used for credential resolution
     * Could be JWT, API key, session token, user ID, etc.
     */
    identity: v4_1.default.string(),
    /**
     * Optional metadata for credential resolution
     */
    metadata: v4_1.default.record(v4_1.default.string(), v4_1.default.unknown()).optional(),
});
exports.CredentialContextSchema = v4_1.default
    .discriminatedUnion('version', [CredentialContextSchemaV1])
    .meta({
    title: 'ICredentialContext',
});
exports.WorkflowExecuteModeList = [
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
const WorkflowExecuteModeSchema = v4_1.default.enum(exports.WorkflowExecuteModeList);
const RedactionPolicySchema = v4_1.default.union([
    v4_1.default.literal('none'),
    v4_1.default.literal('all'),
    v4_1.default.literal('non-manual'),
    v4_1.default.literal('manual-only'),
]);
const RedactionSettingSchemaV1 = v4_1.default.object({
    version: v4_1.default.literal(1),
    policy: RedactionPolicySchema,
});
const RedactionSourceSchema = v4_1.default.union([v4_1.default.literal('workflow'), v4_1.default.literal('instance')]);
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
const RedactionSettingSchemaV2 = v4_1.default.object({
    version: v4_1.default.literal(2),
    production: v4_1.default.boolean(),
    manual: v4_1.default.boolean(),
    source: RedactionSourceSchema.optional(),
});
/**
 * Redaction snapshot, versioned by shape. V1 stored a single policy enum; V2 stores
 * independent production/manual channels. Both shapes must keep parsing so execution
 * data persisted before the V2 migration remains readable.
 */
const RedactionSettingSchema = v4_1.default.discriminatedUnion('version', [
    RedactionSettingSchemaV1,
    RedactionSettingSchemaV2,
]);
const ExecutionContextSchemaV1 = v4_1.default.object({
    version: v4_1.default.literal(1),
    /**
     * When the context was established (Unix timestamp in milliseconds)
     */
    establishedAt: v4_1.default.number(),
    /**
     * The mode in which the workflow is being executed
     */
    source: WorkflowExecuteModeSchema,
    /**
     * Optional node where execution started
     */
    triggerNode: v4_1.default
        .object({
        name: v4_1.default.string(),
        type: v4_1.default.string(),
    })
        .optional(),
    /**
     * Optional ID of the parent execution, if this is set this
     * execution context inherited from the mentioned parent execution context.
     */
    parentExecutionId: v4_1.default.string().optional(),
    /**
     * Encrypted credential context for dynamic credential resolution
     * Always encrypted when stored, decrypted on-demand by credential resolver
     * @see ICredentialContext for decrypted structure
     */
    credentials: v4_1.default.string().optional().meta({
        description: 'Encrypted credential context for dynamic credential resolution Always encrypted when stored, decrypted on-demand by credential resolver @see ICredentialContext for decrypted structure',
    }),
    /**
     * Encrypted artifacts produced by context-establishment hooks
     * (e.g. a trigger stripper) for later consumption by node backends.
     * Always encrypted when stored, decrypted on demand by
     * `ExecutionContextService`.
     * @see ISecureArtifacts for the decrypted structure.
     */
    secureArtifacts: v4_1.default.string().optional().meta({
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
    executedByUserId: v4_1.default.string().optional(),
});
exports.ExecutionContextSchema = v4_1.default
    .discriminatedUnion('version', [ExecutionContextSchemaV1])
    .meta({
    title: 'IExecutionContext',
});
const safeParse = (value, schema) => {
    const typeName = schema.meta()?.title ?? 'Object';
    try {
        const normalizedObject = typeof value === 'string' ? (0, utils_1.jsonParse)(value) : value;
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
exports.safeParse = safeParse;
/**
 * Safely parses an execution context from an
 * @param obj
 * @returns
 */
const toExecutionContext = (value) => {
    // here we could implement a mgiration policy for migrating old execution context versions to newer ones
    return (0, exports.safeParse)(value, exports.ExecutionContextSchema);
};
exports.toExecutionContext = toExecutionContext;
/**
 * Safely parses a credential context from either an object or a string to an
 * ICredentialContext. This can be used to safely parse a decrypted context for
 * example.
 * @param value The object or string to be parsed
 * @returns ICredentialContext
 * @throws Error in case parsing fails for any reason
 */
const toCredentialContext = (value) => {
    // here we could implement a mgiration policy for migrating old credential context versions to newer ones
    return (0, exports.safeParse)(value, exports.CredentialContextSchema);
};
exports.toCredentialContext = toCredentialContext;
const toSecureArtifacts = (value) => {
    // here we could implement a migration policy for migrating old secure artifacts versions to newer ones
    return (0, exports.safeParse)(value, exports.SecureArtifactsSchema);
};
exports.toSecureArtifacts = toSecureArtifacts;
//# sourceMappingURL=execution-context.js.map