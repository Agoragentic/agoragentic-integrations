/**
 * Contains all the data which is needed to execute a workflow and so also to
 * restart it again if it fails.
 * RunData, ExecuteData and WaitForExecution contain often the same data.
 *
 */
import type { IRunExecutionDataV0 } from "./run-execution-data.v0.js";
import { type IRunExecutionDataV1 } from "./run-execution-data.v1.js";
export type { RedactionInfo } from "./run-execution-data.v1.js";
/**
 * All the versions of the interface.
 * !!! Only used at the data access layer to handle records saved under older versions. !!!
 * !!! All other code should use the current version, below. !!!
 */
export type IRunExecutionDataAll = IRunExecutionDataV0 | IRunExecutionDataV1;
declare const __brand: unique symbol;
/**
 * Current version of IRunExecutionData.
 */
export type IRunExecutionData = IRunExecutionDataV1 & {
    [__brand]: 'Use createRunExecutionData factory instead of constructing manually';
};
export declare function migrateRunExecutionData(data: IRunExecutionDataAll): IRunExecutionData;
//# sourceMappingURL=run-execution-data.d.ts.map