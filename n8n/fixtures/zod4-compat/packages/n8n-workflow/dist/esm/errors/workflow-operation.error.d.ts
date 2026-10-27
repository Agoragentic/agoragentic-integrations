import type { INode } from "../interfaces.js";
import { ExecutionBaseError } from "./abstract/execution-base.error.js";
/**
 * Class for instantiating an operational error, e.g. a timeout error.
 */
export declare class WorkflowOperationError extends ExecutionBaseError {
    node: INode | undefined;
    timestamp: number;
    constructor(message: string, node?: INode, description?: string);
}
//# sourceMappingURL=workflow-operation.error.d.ts.map