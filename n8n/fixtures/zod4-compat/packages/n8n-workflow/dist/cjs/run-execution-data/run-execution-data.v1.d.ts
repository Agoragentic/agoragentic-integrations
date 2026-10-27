import type { ExecutionError, IDestinationNode, IExecuteContextData, IExecuteData, IExecutionContext, IPinData, IRedactedErrorInfo, IRunData, ITaskMetadata, IWaitingForExecution, IWaitingForExecutionSource, IWorkflowExecutionDataProcess, RelatedExecution, StartNodeData } from "../index.js";
import type { IRunExecutionDataV0 } from "./run-execution-data.v0.js";
export interface RedactionInfo {
    isRedacted: boolean;
    reason: string;
    canReveal: boolean;
}
export interface IRunExecutionDataV1 {
    version: 1;
    startData?: {
        startNodes?: StartNodeData[];
        destinationNode?: IDestinationNode;
        originalDestinationNode?: IDestinationNode;
        runNodeFilter?: string[];
    };
    resultData: {
        error?: ExecutionError;
        /**
         * When present, indicates `error` was redacted.
         * Contains only non-PII technical metadata from the original error.
         */
        redactedError?: IRedactedErrorInfo;
        runData: IRunData;
        pinData?: IPinData;
        lastNodeExecuted?: string;
        metadata?: Record<string, string>;
        /**
         * Nodes whose output was simulated (mocked via per-execution pin data)
         * instead of executed, keyed by node name. Set for AI-driven workflow
         * verification runs so the editor can label simulated outputs.
         */
        simulation?: Record<string, {
            reason: string;
        }>;
    };
    executionData?: {
        contextData: IExecuteContextData;
        runtimeData?: IExecutionContext;
        nodeExecutionStack: IExecuteData[];
        metadata: {
            [key: string]: ITaskMetadata[];
        };
        waitingExecution: IWaitingForExecution;
        waitingExecutionSource: IWaitingForExecutionSource | null;
    };
    parentExecution?: RelatedExecution;
    /**
     * Random token used to validate waiting webhook/form requests.
     * Generated when execution starts. Presence signals validation is required.
     */
    resumeToken?: string;
    waitTill?: Date;
    pushRef?: string;
    /** Data needed for a worker to run a manual execution. */
    manualData?: Pick<IWorkflowExecutionDataProcess, 'dirtyNodeNames' | 'triggerToStartFrom' | 'userId'>;
    /** Metadata about whether and how this execution's data was redacted. */
    redactionInfo?: RedactionInfo;
}
export declare function runExecutionDataV0ToV1(data: IRunExecutionDataV0): IRunExecutionDataV1;
//# sourceMappingURL=run-execution-data.v1.d.ts.map