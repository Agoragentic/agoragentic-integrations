import { ApplicationError } from "@n8n/errors";
export class ExecutionBaseError extends ApplicationError {
    description;
    cause;
    errorResponse;
    timestamp;
    context = {};
    lineNumber;
    functionality = 'regular';
    constructor(message, options = {}) {
        super(message, options);
        this.name = this.constructor.name;
        this.timestamp = Date.now();
        const { cause, errorResponse } = options;
        if (cause instanceof ExecutionBaseError) {
            this.context = cause.context;
        }
        else if (cause && !(cause instanceof Error)) {
            this.cause = cause;
        }
        if (errorResponse)
            this.errorResponse = errorResponse;
    }
    toJSON() {
        return {
            message: this.message,
            lineNumber: this.lineNumber,
            timestamp: this.timestamp,
            name: this.name,
            description: this.description,
            context: this.context,
            cause: this.cause,
        };
    }
}
//# sourceMappingURL=execution-base.error.js.map