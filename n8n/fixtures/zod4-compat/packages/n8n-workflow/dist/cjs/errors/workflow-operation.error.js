"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowOperationError = void 0;
const execution_base_error_1 = require("./abstract/execution-base.error.js");
/**
 * Class for instantiating an operational error, e.g. a timeout error.
 */
class WorkflowOperationError extends execution_base_error_1.ExecutionBaseError {
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
exports.WorkflowOperationError = WorkflowOperationError;
//# sourceMappingURL=workflow-operation.error.js.map