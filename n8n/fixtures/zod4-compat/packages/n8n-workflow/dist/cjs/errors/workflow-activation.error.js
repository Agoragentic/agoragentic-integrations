"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowActivationError = void 0;
const execution_base_error_1 = require("./abstract/execution-base.error.js");
/**
 * Class for instantiating an workflow activation error
 */
class WorkflowActivationError extends execution_base_error_1.ExecutionBaseError {
    node;
    workflowId;
    constructor(message, { cause, node, level, workflowId } = {}) {
        let error = cause;
        if (cause instanceof execution_base_error_1.ExecutionBaseError) {
            error = new Error(cause.message);
            error.constructor = cause.constructor;
            error.name = cause.name;
            error.stack = cause.stack;
        }
        super(message, { cause: error });
        this.node = node;
        this.workflowId = workflowId;
        this.message = message;
        this.setLevel(level);
    }
    setLevel(level) {
        if (level) {
            this.level = level;
            return;
        }
        if ([
            'etimedout', // Node.js
            'econnrefused', // Node.js
            'eauth', // OAuth
            'temporary authentication failure', // IMAP server
            'invalid credentials',
        ].some((str) => this.message.toLowerCase().includes(str))) {
            this.level = 'warning';
            return;
        }
        this.level = 'error';
    }
}
exports.WorkflowActivationError = WorkflowActivationError;
//# sourceMappingURL=workflow-activation.error.js.map