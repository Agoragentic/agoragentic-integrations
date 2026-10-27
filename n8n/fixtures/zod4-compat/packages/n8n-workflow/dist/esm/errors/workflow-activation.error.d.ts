import { ExecutionBaseError } from "./abstract/execution-base.error.js";
import type { ApplicationError } from "@n8n/errors";
import type { INode } from "../interfaces.js";
interface WorkflowActivationErrorOptions {
    cause?: Error;
    node?: INode;
    level?: ApplicationError['level'];
    workflowId?: string;
}
/**
 * Class for instantiating an workflow activation error
 */
export declare class WorkflowActivationError extends ExecutionBaseError {
    node: INode | undefined;
    workflowId: string | undefined;
    constructor(message: string, { cause, node, level, workflowId }?: WorkflowActivationErrorOptions);
    private setLevel;
}
export {};
//# sourceMappingURL=workflow-activation.error.d.ts.map