import { ExecutionBaseError } from "./abstract/execution-base.error.js";
/**
 * Class for instantiating an workflow activation error
 */
export class WorkflowActivationError extends ExecutionBaseError {
    node;
    workflowId;
    constructor(message, { cause, node, level, workflowId } = {}) {
        let error = cause;
        if (cause instanceof ExecutionBaseError) {
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
//# sourceMappingURL=workflow-activation.error.js.map