import { WorkflowOperationError } from "./workflow-operation.error.js";
export class SubworkflowOperationError extends WorkflowOperationError {
    description = '';
    cause;
    constructor(message, description) {
        super(message);
        this.name = this.constructor.name;
        this.description = description;
        this.cause = {
            name: this.name,
            message,
            stack: this.stack,
        };
    }
}
//# sourceMappingURL=subworkflow-operation.error.js.map