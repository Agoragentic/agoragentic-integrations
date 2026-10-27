export const ExecutionStatusList = [
    'canceled',
    'crashed',
    'error',
    'new',
    'running',
    'success',
    'unknown',
    'waiting',
];
export function isCompletedExecutionStatus(status) {
    return status === 'crashed' || status === 'error' || status === 'success';
}
/**
 * Statuses that may be overwritten to `crashed` by recovery. These are the in-progress
 * and indeterminate states; `waiting` and the terminal statuses are deliberately excluded
 * so a legitimately paused or finished execution is never marked as crashed.
 */
export const CRASHABLE_EXECUTION_STATUSES = ['new', 'running', 'unknown'];
export function isTerminalExecutionStatus(status) {
    return (status === 'canceled' || status === 'crashed' || status === 'error' || status === 'success');
}
//# sourceMappingURL=execution-status.js.map