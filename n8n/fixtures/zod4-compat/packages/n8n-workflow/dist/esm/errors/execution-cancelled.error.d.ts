import { ExecutionBaseError } from "./abstract/execution-base.error.js";
export type CancellationReason = 'manual' | 'timeout' | 'shutdown';
export declare abstract class ExecutionCancelledError extends ExecutionBaseError {
    readonly reason: CancellationReason;
    constructor(executionId: string, reason: CancellationReason);
}
export declare class ManualExecutionCancelledError extends ExecutionCancelledError {
    constructor(executionId: string);
}
export declare class TimeoutExecutionCancelledError extends ExecutionCancelledError {
    constructor(executionId: string);
}
export declare class SystemShutdownExecutionCancelledError extends ExecutionCancelledError {
    constructor(executionId: string);
}
//# sourceMappingURL=execution-cancelled.error.d.ts.map