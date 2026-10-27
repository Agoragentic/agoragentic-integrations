import z from "zod/v4";
const ExecutionContextEstablishmentHookParameterSchemaV1 = z.object({
    executionsHooksVersion: z.literal(1),
    contextEstablishmentHooks: z.object({
        hooks: z
            .array(z
            .object({
            hookName: z.string(),
            isAllowedToFail: z.boolean().optional().default(false),
        })
            .loose())
            .optional()
            .default([]),
    }),
});
export const ExecutionContextEstablishmentHookParameterSchema = z
    .discriminatedUnion('executionsHooksVersion', [
    ExecutionContextEstablishmentHookParameterSchemaV1,
])
    .meta({
    title: 'ExecutionContextEstablishmentHookParameter',
});
/**
 * Safely parses an execution context establishment hook parameters
 * @param obj
 * @returns
 */
export const toExecutionContextEstablishmentHookParameter = (value) => {
    if (value === null || value === undefined || typeof value !== 'object') {
        return null;
    }
    // Quick check to avoid unnecessary parsing attempts
    if (!('executionsHooksVersion' in value)) {
        return null;
    }
    return ExecutionContextEstablishmentHookParameterSchema.safeParse(value);
};
//# sourceMappingURL=execution-context-establishment-hooks.js.map