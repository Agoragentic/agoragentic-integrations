import { WorkflowOperationError } from "./workflow-operation.error.js";
export declare class SubworkflowOperationError extends WorkflowOperationError {
    description: string;
    cause: Error;
    constructor(message: string, description: string);
}
//# sourceMappingURL=subworkflow-operation.error.d.ts.map