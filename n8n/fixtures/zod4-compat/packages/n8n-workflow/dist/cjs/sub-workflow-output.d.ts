import type { INodeExecutionData, ITaskData } from "./interfaces.js";
/**
 * For each output branch, concatenate items from every run in the order they were produced.
 */
export declare function mergeRunsPerBranch(runs: ITaskData[]): Array<INodeExecutionData[] | null>;
//# sourceMappingURL=sub-workflow-output.d.ts.map