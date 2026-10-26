"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toExecutionContextEstablishmentHookParameter = exports.ExecutionContextEstablishmentHookParameterSchema = void 0;
const v4_1 = __importDefault(require("zod/v4"));
const ExecutionContextEstablishmentHookParameterSchemaV1 = v4_1.default.object({
    executionsHooksVersion: v4_1.default.literal(1),
    contextEstablishmentHooks: v4_1.default.object({
        hooks: v4_1.default
            .array(v4_1.default
            .object({
            hookName: v4_1.default.string(),
            isAllowedToFail: v4_1.default.boolean().optional().default(false),
        })
            .loose())
            .optional()
            .default([]),
    }),
});
exports.ExecutionContextEstablishmentHookParameterSchema = v4_1.default
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
const toExecutionContextEstablishmentHookParameter = (value) => {
    if (value === null || value === undefined || typeof value !== 'object') {
        return null;
    }
    // Quick check to avoid unnecessary parsing attempts
    if (!('executionsHooksVersion' in value)) {
        return null;
    }
    return exports.ExecutionContextEstablishmentHookParameterSchema.safeParse(value);
};
exports.toExecutionContextEstablishmentHookParameter = toExecutionContextEstablishmentHookParameter;
//# sourceMappingURL=execution-context-establishment-hooks.js.map