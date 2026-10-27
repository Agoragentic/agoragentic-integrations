import z, { type ZodType } from "zod/v4";
/**
 * JSON-shaped value type — what survives an encrypt → JSON serialize →
 * decrypt → JSON parse round-trip. Used as the leaf type for secure artifacts.
 */
type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | {
    [key: string]: JsonValue;
} | JsonValue[];
declare const SecureArtifactsSchemaV1: z.ZodObject<{
    version: z.ZodLiteral<1>;
    artifacts: z.ZodRecord<z.ZodString, z.ZodType<JsonValue, unknown, z.core.$ZodTypeInternals<JsonValue, unknown>>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export type ISecureArtifactsV1 = z.output<typeof SecureArtifactsSchemaV1>;
export declare const SecureArtifactsSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    version: z.ZodLiteral<1>;
    artifacts: z.ZodRecord<z.ZodString, z.ZodType<JsonValue, unknown, z.core.$ZodTypeInternals<JsonValue, unknown>>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>], "version">;
/**
 * Decrypted structure of the `secureArtifacts` field on the execution context.
 * Carries values produced by context-establishment hooks (e.g. trigger
 * stripping) for later consumption by node backends. Always encrypted as a
 * single string when stored on `IExecutionContext`; only exists in this
 * structured form on `PlaintextExecutionContext` during runtime.
 *
 * @see PlaintextExecutionContext.secureArtifacts
 */
export type ISecureArtifacts = z.output<typeof SecureArtifactsSchema>;
declare const CredentialContextSchemaV1: z.ZodObject<{
    version: z.ZodLiteral<1>;
    identity: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export type ICredentialContextV1 = z.output<typeof CredentialContextSchemaV1>;
export declare const CredentialContextSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    version: z.ZodLiteral<1>;
    identity: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>], "version">;
/**
 * Decrypted structure of credentials field
 * Never stored in this form - always encrypted in IExecutionContext
 */
export type ICredentialContext = z.output<typeof CredentialContextSchema>;
export declare const WorkflowExecuteModeList: readonly ["cli", "error", "integrated", "internal", "manual", "retry", "trigger", "webhook", "evaluation", "chat", "agent"];
export type WorkflowExecuteModeValues = (typeof WorkflowExecuteModeList)[number];
declare const RedactionSettingSchemaV1: z.ZodObject<{
    version: z.ZodLiteral<1>;
    policy: z.ZodUnion<readonly [z.ZodLiteral<"none">, z.ZodLiteral<"all">, z.ZodLiteral<"non-manual">, z.ZodLiteral<"manual-only">]>;
}, z.core.$strip>;
export type IRedactionSettingV1 = z.output<typeof RedactionSettingSchemaV1>;
declare const RedactionSourceSchema: z.ZodUnion<readonly [z.ZodLiteral<"workflow">, z.ZodLiteral<"instance">]>;
export type RedactionSource = z.output<typeof RedactionSourceSchema>;
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
declare const RedactionSettingSchemaV2: z.ZodObject<{
    version: z.ZodLiteral<2>;
    production: z.ZodBoolean;
    manual: z.ZodBoolean;
    source: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"workflow">, z.ZodLiteral<"instance">]>>;
}, z.core.$strip>;
export type IRedactionSettingV2 = z.output<typeof RedactionSettingSchemaV2>;
/**
 * Redaction snapshot, versioned by shape. V1 stored a single policy enum; V2 stores
 * independent production/manual channels. Both shapes must keep parsing so execution
 * data persisted before the V2 migration remains readable.
 */
declare const RedactionSettingSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    version: z.ZodLiteral<1>;
    policy: z.ZodUnion<readonly [z.ZodLiteral<"none">, z.ZodLiteral<"all">, z.ZodLiteral<"non-manual">, z.ZodLiteral<"manual-only">]>;
}, z.core.$strip>, z.ZodObject<{
    version: z.ZodLiteral<2>;
    production: z.ZodBoolean;
    manual: z.ZodBoolean;
    source: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"workflow">, z.ZodLiteral<"instance">]>>;
}, z.core.$strip>], "version">;
export type IRedactionSetting = z.output<typeof RedactionSettingSchema>;
declare const ExecutionContextSchemaV1: z.ZodObject<{
    version: z.ZodLiteral<1>;
    establishedAt: z.ZodNumber;
    source: z.ZodEnum<{
        error: "error";
        internal: "internal";
        manual: "manual";
        chat: "chat";
        agent: "agent";
        cli: "cli";
        integrated: "integrated";
        retry: "retry";
        trigger: "trigger";
        webhook: "webhook";
        evaluation: "evaluation";
    }>;
    triggerNode: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodString;
    }, z.core.$strip>>;
    parentExecutionId: z.ZodOptional<z.ZodString>;
    credentials: z.ZodOptional<z.ZodString>;
    secureArtifacts: z.ZodOptional<z.ZodString>;
    redaction: z.ZodOptional<z.ZodDiscriminatedUnion<[z.ZodObject<{
        version: z.ZodLiteral<1>;
        policy: z.ZodUnion<readonly [z.ZodLiteral<"none">, z.ZodLiteral<"all">, z.ZodLiteral<"non-manual">, z.ZodLiteral<"manual-only">]>;
    }, z.core.$strip>, z.ZodObject<{
        version: z.ZodLiteral<2>;
        production: z.ZodBoolean;
        manual: z.ZodBoolean;
        source: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"workflow">, z.ZodLiteral<"instance">]>>;
    }, z.core.$strip>], "version">>;
    executedByUserId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type IExecutionContextV1 = z.output<typeof ExecutionContextSchemaV1>;
export declare const ExecutionContextSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    version: z.ZodLiteral<1>;
    establishedAt: z.ZodNumber;
    source: z.ZodEnum<{
        error: "error";
        internal: "internal";
        manual: "manual";
        chat: "chat";
        agent: "agent";
        cli: "cli";
        integrated: "integrated";
        retry: "retry";
        trigger: "trigger";
        webhook: "webhook";
        evaluation: "evaluation";
    }>;
    triggerNode: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodString;
    }, z.core.$strip>>;
    parentExecutionId: z.ZodOptional<z.ZodString>;
    credentials: z.ZodOptional<z.ZodString>;
    secureArtifacts: z.ZodOptional<z.ZodString>;
    redaction: z.ZodOptional<z.ZodDiscriminatedUnion<[z.ZodObject<{
        version: z.ZodLiteral<1>;
        policy: z.ZodUnion<readonly [z.ZodLiteral<"none">, z.ZodLiteral<"all">, z.ZodLiteral<"non-manual">, z.ZodLiteral<"manual-only">]>;
    }, z.core.$strip>, z.ZodObject<{
        version: z.ZodLiteral<2>;
        production: z.ZodBoolean;
        manual: z.ZodBoolean;
        source: z.ZodOptional<z.ZodUnion<readonly [z.ZodLiteral<"workflow">, z.ZodLiteral<"instance">]>>;
    }, z.core.$strip>], "version">>;
    executedByUserId: z.ZodOptional<z.ZodString>;
}, z.core.$strip>], "version">;
/**
 * Execution context carries per-execution metadata throughout workflow lifecycle
 * Established at execution start and propagated to sub-workflows/error workflows
 */
export type IExecutionContext = z.output<typeof ExecutionContextSchema>;
/**
 * Runtime representation of execution context with decrypted credential data.
 *
 * This type is identical to IExecutionContext except the `credentials` field
 * contains the decrypted ICredentialContext object instead of an encrypted string.
 *
 * **Usage contexts:**
 * - Hook execution: Hooks work with plaintext context to extract/merge credential data
 * - Credential resolution: Resolvers need decrypted identity tokens
 * - Internal processing: Runtime operations that need access to credential context
 *
 * **Security notes:**
 * - Never persist this type to database - use IExecutionContext with encrypted credentials
 * - Never expose in API responses or logs
 * - Only exists in-memory during workflow execution
 * - Should be cleared from memory after use
 *
 * **Lifecycle:**
 * 1. Load IExecutionContext from storage (credentials encrypted)
 * 2. Decrypt credentials field → PlaintextExecutionContext (runtime only)
 * 3. Use for hook execution, credential resolution, etc.
 * 4. Encrypt credentials → IExecutionContext before persistence
 *
 * @see IExecutionContext - Persisted form with encrypted credentials
 * @see ICredentialContext - Decrypted credential structure
 * @see IExecutionContextUpdate - Partial updates during hook execution
 *
 * @example
 * ```typescript
 * // During hook execution:
 * const plaintextContext: PlaintextExecutionContext = {
 *   ...context,
 *   credentials: decryptCredentials(context.credentials) // Decrypt for runtime use
 * };
 *
 * // Hook can now access plaintext credential data
 * const identity = plaintextContext.credentials?.identity;
 *
 * // Before storage, re-encrypt:
 * const storableContext: IExecutionContext = {
 *   ...plaintextContext,
 *   credentials: encryptCredentials(plaintextContext.credentials)
 * };
 * ```
 */
export type PlaintextExecutionContext = Omit<IExecutionContext, 'credentials' | 'secureArtifacts'> & {
    credentials?: ICredentialContext;
    secureArtifacts?: ISecureArtifacts;
};
export declare const safeParse: <T extends ZodType>(value: string | object, schema: T) => z.core.output<T>;
/**
 * Safely parses an execution context from an
 * @param obj
 * @returns
 */
export declare const toExecutionContext: (value: string | object) => IExecutionContext;
/**
 * Safely parses a credential context from either an object or a string to an
 * ICredentialContext. This can be used to safely parse a decrypted context for
 * example.
 * @param value The object or string to be parsed
 * @returns ICredentialContext
 * @throws Error in case parsing fails for any reason
 */
export declare const toCredentialContext: (value: string | object) => ICredentialContext;
export declare const toSecureArtifacts: (value: string | object) => ISecureArtifacts;
export {};
//# sourceMappingURL=execution-context.d.ts.map