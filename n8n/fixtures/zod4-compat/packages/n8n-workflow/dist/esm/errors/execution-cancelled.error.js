import { ExecutionBaseError } from "./abstract/execution-base.error.js";
export class ExecutionCancelledError extends ExecutionBaseError {
    reason;
    // NOTE: prefer one of the more specific
    constructor(executionId, reason) {
        super('The execution was cancelled', {
            level: 'warning',
            extra: { executionId },
        });
        this.reason = reason;
    }
}
export class ManualExecutionCancelledError extends ExecutionCancelledError {
    constructor(executionId) {
        super(executionId, 'manual');
        this.message = 'The execution was cancelled manually';
    }
}
export class TimeoutExecutionCancelledError extends ExecutionCancelledError {
    constructor(executionId) {
        super(executionId, 'timeout');
        this.message = 'The execution was cancelled because it timed out';
    }
}
export class SystemShutdownExecutionCancelledError extends ExecutionCancelledError {
    constructor(executionId) {
        super(executionId, 'shutdown');
        this.message = 'The execution was cancelled because the system is shutting down';
    }
}
//# sourceMappingURL=execution-cancelled.error.js.map