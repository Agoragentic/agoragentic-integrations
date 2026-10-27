"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CRASHABLE_EXECUTION_STATUSES = exports.ExecutionStatusList = void 0;
exports.isCompletedExecutionStatus = isCompletedExecutionStatus;
exports.isTerminalExecutionStatus = isTerminalExecutionStatus;
exports.ExecutionStatusList = [
    'canceled',
    'crashed',
    'error',
    'new',
    'running',
    'success',
    'unknown',
    'waiting',
];
function isCompletedExecutionStatus(status) {
    return status === 'crashed' || status === 'error' || status === 'success';
}
/**
 * Statuses that may be overwritten to `crashed` by recovery. These are the in-progress
 * and indeterminate states; `waiting` and the terminal statuses are deliberately excluded
 * so a legitimately paused or finished execution is never marked as crashed.
 */
exports.CRASHABLE_EXECUTION_STATUSES = ['new', 'running', 'unknown'];
function isTerminalExecutionStatus(status) {
    return (status === 'canceled' || status === 'crashed' || status === 'error' || status === 'success');
}
//# sourceMappingURL=execution-status.js.map