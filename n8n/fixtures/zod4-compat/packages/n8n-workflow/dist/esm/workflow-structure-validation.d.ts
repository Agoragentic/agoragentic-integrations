import { z } from "zod";
declare const workflowStructureSchema: z.ZodObject<{
    nodes: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodString;
        position: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
        parameters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        id: z.ZodOptional<z.ZodString>;
        typeVersion: z.ZodOptional<z.ZodNumber>;
        disabled: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$loose>>;
    connections: z.ZodRecord<z.ZodString, z.ZodRecord<z.ZodString, z.ZodArray<z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodObject<{
        node: z.ZodString;
        type: z.ZodString;
        index: z.ZodNumber;
    }, z.core.$loose>>>>>>>;
}, z.core.$strip>;
type WorkflowStructureData = z.infer<typeof workflowStructureSchema>;
type WorkflowStructureGraphIssueCode = 'duplicate_node_name' | 'unknown_connection_source' | 'unknown_connection_target';
type WorkflowStructureGraphIssue = {
    code: WorkflowStructureGraphIssueCode;
    path: ReadonlyArray<PropertyKey>;
    message: string;
};
export type WorkflowStructureIssue = z.ZodIssue | WorkflowStructureGraphIssue;
type WorkflowStructureValidationSuccess = {
    success: true;
    data: WorkflowStructureData;
};
type WorkflowStructureValidationFailure = {
    success: false;
    issues: WorkflowStructureIssue[];
};
export type WorkflowStructureValidationResult = WorkflowStructureValidationSuccess | WorkflowStructureValidationFailure;
export declare const formatWorkflowStructureIssuePath: (path: ReadonlyArray<PropertyKey>) => string;
export declare class WorkflowStructureValidationError extends Error {
    readonly issues: WorkflowStructureIssue[];
    name: string;
    readonly description: string;
    constructor(issues: WorkflowStructureIssue[]);
}
export declare function safeParseWorkflowStructure(input: unknown): WorkflowStructureValidationResult;
export declare function parseWorkflowStructure(input: unknown): WorkflowStructureData;
export {};
//# sourceMappingURL=workflow-structure-validation.d.ts.map