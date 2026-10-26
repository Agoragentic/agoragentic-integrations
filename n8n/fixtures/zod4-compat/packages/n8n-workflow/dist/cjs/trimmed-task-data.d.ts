import type { INodeExecutionData, IPinData } from "./interfaces.js";
/**
 * The placeholder is FE-only and meant to be transient. If it ever appears in
 * pinData, the workflow's stored state has been corrupted (the placeholder
 * round-tripped through pinData → engine → DB), and any subsequent run will
 * reproduce the corruption. Use these helpers to detect and refuse it.
 */
export declare function isTrimmedNodeExecutionData(data: INodeExecutionData[] | null | undefined): boolean;
export declare function getTrimmedPinDataNodeNames(pinData: IPinData | undefined): string[];
//# sourceMappingURL=trimmed-task-data.d.ts.map