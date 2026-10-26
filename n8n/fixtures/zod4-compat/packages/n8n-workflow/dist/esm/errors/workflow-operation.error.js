import { ExecutionBaseError } from "./abstract/execution-base.error.js";
/**
 * Class for instantiating an operational error, e.g. a timeout error.
 */
export class WorkflowOperationError extends ExecutionBaseError {
    node;
    timestamp;
    constructor(message, node, description) {
        super(message, { cause: undefined });
        this.level = 'warning';
        this.name = this.constructor.name;
        if (description)
            this.description = description;
        this.node = node;
        this.timestamp = Date.now();
    }
}
//# sourceMappingURL=workflow-operation.error.js.map