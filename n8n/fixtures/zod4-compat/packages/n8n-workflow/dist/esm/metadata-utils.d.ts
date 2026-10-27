import type { IExecuteFunctions, ITaskMetadata } from "./index.js";
type ISubWorkflowMetadata = Required<Pick<ITaskMetadata, 'subExecution' | 'subExecutionsCount'>>;
export declare function accumulateTokenUsage(context: IExecuteFunctions, inputTokens: number, outputTokens: number): void;
export declare function parseErrorMetadata(error: unknown): ISubWorkflowMetadata | undefined;
export {};
//# sourceMappingURL=metadata-utils.d.ts.map