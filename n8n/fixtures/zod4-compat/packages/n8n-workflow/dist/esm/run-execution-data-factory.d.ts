import type { IExecutionContext } from "./execution-context.js";
import type { IRunData, IPinData, IExecuteContextData, IExecuteData, ITaskMetadata, IWaitingForExecution, IWaitingForExecutionSource, StartNodeData, ExecutionError, RelatedExecution, INode } from "./interfaces.js";
import type { IRunExecutionData } from "./run-execution-data/run-execution-data.js";
import type { RedactionInfo } from "./run-execution-data/run-execution-data.v1.js";
export interface CreateFullRunExecutionDataOptions {
    startData?: {
        startNodes?: StartNodeData[];
        destinationNode?: NonNullable<IRunExecutionData['startData']>['destinationNode'];
        originalDestinationNode?: NonNullable<IRunExecutionData['startData']>['originalDestinationNode'];
        runNodeFilter?: string[];
    };
    resultData?: {
        error?: ExecutionError;
        runData?: IRunData | null;
        pinData?: IPinData;
        lastNodeExecuted?: string;
        metadata?: Record<string, string>;
    };
    executionData?: {
        contextData?: IExecuteContextData;
        nodeExecutionStack?: IExecuteData[];
        metadata?: Record<string, ITaskMetadata[]>;
        waitingExecution?: IWaitingForExecution;
        waitingExecutionSource?: IWaitingForExecutionSource | null;
        runtimeData?: IExecutionContext;
    } | null;
    parentExecution?: RelatedExecution;
    resumeToken?: string;
    waitTill?: Date;
    manualData?: IRunExecutionData['manualData'];
    pushRef?: IRunExecutionData['pushRef'];
    redactionInfo?: RedactionInfo;
}
/**
 * Creates a complete IRunExecutionData object with all properties initialized.
 * You can pass `executionData: null` and `resultData.runData: null` if you
 * don't want them initialized.
 */
export declare function createRunExecutionData(options?: CreateFullRunExecutionDataOptions): IRunExecutionData;
/**
 * Creates a minimal IRunExecutionData object. It only contains an empty
 * `runData` field. Used when we are not actually executing a workflow, but
 * need the run data. E.g. in expression evaluations.
 */
export declare function createEmptyRunExecutionData(): IRunExecutionData;
/**
 * Creates an IRunExecutionData object for error execution scenarios.
 * Used when creating execution records for failed nodes with specific
 * error data and execution context.
 *
 * @param node - The node that failed.
 * @param error - The error that occurred.
 */
export declare function createErrorExecutionData(node: INode, error: ExecutionError): IRunExecutionData;
//# sourceMappingURL=run-execution-data-factory.d.ts.map