"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemShutdownExecutionCancelledError = exports.TimeoutExecutionCancelledError = exports.ManualExecutionCancelledError = exports.ExecutionCancelledError = void 0;
const execution_base_error_1 = require("./abstract/execution-base.error.js");
class ExecutionCancelledError extends execution_base_error_1.ExecutionBaseError {
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
exports.ExecutionCancelledError = ExecutionCancelledError;
class ManualExecutionCancelledError extends ExecutionCancelledError {
    constructor(executionId) {
        super(executionId, 'manual');
        this.message = 'The execution was cancelled manually';
    }
}
exports.ManualExecutionCancelledError = ManualExecutionCancelledError;
class TimeoutExecutionCancelledError extends ExecutionCancelledError {
    constructor(executionId) {
        super(executionId, 'timeout');
        this.message = 'The execution was cancelled because it timed out';
    }
}
exports.TimeoutExecutionCancelledError = TimeoutExecutionCancelledError;
class SystemShutdownExecutionCancelledError extends ExecutionCancelledError {
    constructor(executionId) {
        super(executionId, 'shutdown');
        this.message = 'The execution was cancelled because the system is shutting down';
    }
}
exports.SystemShutdownExecutionCancelledError = SystemShutdownExecutionCancelledError;
//# sourceMappingURL=execution-cancelled.error.js.map