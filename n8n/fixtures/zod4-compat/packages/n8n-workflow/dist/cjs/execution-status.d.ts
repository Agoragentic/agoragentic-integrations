export declare const ExecutionStatusList: readonly ["canceled", "crashed", "error", "new", "running", "success", "unknown", "waiting"];
export type ExecutionStatus = (typeof ExecutionStatusList)[number];
export type CompletedExecutionStatus = 'crashed' | 'error' | 'success';
export type TerminalExecutionStatus = CompletedExecutionStatus | 'canceled';
export declare function isCompletedExecutionStatus(status: ExecutionStatus): status is CompletedExecutionStatus;
/**
 * Statuses that may be overwritten to `crashed` by recovery. These are the in-progress
 * and indeterminate states; `waiting` and the terminal statuses are deliberately excluded
 * so a legitimately paused or finished execution is never marked as crashed.
 */
export declare const CRASHABLE_EXECUTION_STATUSES: readonly ["new", "running", "unknown"];
export declare function isTerminalExecutionStatus(status: ExecutionStatus | undefined): status is TerminalExecutionStatus;
//# sourceMappingURL=execution-status.d.ts.map