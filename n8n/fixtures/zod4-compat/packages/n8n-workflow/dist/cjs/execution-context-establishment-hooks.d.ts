import z from "zod/v4";
declare const ExecutionContextEstablishmentHookParameterSchemaV1: z.ZodObject<{
    executionsHooksVersion: z.ZodLiteral<1>;
    contextEstablishmentHooks: z.ZodObject<{
        hooks: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
            hookName: z.ZodString;
            isAllowedToFail: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        }, z.core.$loose>>>>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type ExecutionContextEstablishmentHookParameterV1 = z.output<typeof ExecutionContextEstablishmentHookParameterSchemaV1>;
export declare const ExecutionContextEstablishmentHookParameterSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    executionsHooksVersion: z.ZodLiteral<1>;
    contextEstablishmentHooks: z.ZodObject<{
        hooks: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
            hookName: z.ZodString;
            isAllowedToFail: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        }, z.core.$loose>>>>;
    }, z.core.$strip>;
}, z.core.$strip>], "executionsHooksVersion">;
export type ExecutionContextEstablishmentHookParameter = z.output<typeof ExecutionContextEstablishmentHookParameterSchema>;
/**
 * Safely parses an execution context establishment hook parameters
 * @param obj
 * @returns
 */
export declare const toExecutionContextEstablishmentHookParameter: (value: unknown) => z.ZodSafeParseResult<{
    executionsHooksVersion: 1;
    contextEstablishmentHooks: {
        hooks: {
            [x: string]: unknown;
            hookName: string;
            isAllowedToFail: boolean;
        }[];
    };
}> | null;
export {};
//# sourceMappingURL=execution-context-establishment-hooks.d.ts.map