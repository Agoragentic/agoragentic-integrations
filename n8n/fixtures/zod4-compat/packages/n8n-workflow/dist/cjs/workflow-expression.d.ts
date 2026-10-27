import type { IExecuteData, INode, INodeExecutionData, INodeParameterResourceLocator, INodeParameters, IWorkflowDataProxyAdditionalKeys, NodeParameterValue, NodeParameterValueType, WorkflowExecuteMode } from "./interfaces.js";
import type { IRunExecutionData } from "./run-execution-data/run-execution-data.js";
import type { Workflow } from "./workflow.js";
export declare class WorkflowExpression {
    private readonly workflow;
    private readonly expression;
    constructor(workflow: Workflow);
    /**
     * Resolves the parameter value.  If it is an expression it will execute it and
     * return the result. For everything simply the supplied value will be returned.
     */
    resolveSimpleParameterValue(parameterValue: NodeParameterValue, siblingParameters: INodeParameters, runExecutionData: IRunExecutionData | null, runIndex: number, itemIndex: number, activeNodeName: string, connectionInputData: INodeExecutionData[], mode: WorkflowExecuteMode, additionalKeys: IWorkflowDataProxyAdditionalKeys, executeData?: IExecuteData, returnObjectAsString?: boolean, selfData?: {}, contextNodeName?: string): NodeParameterValue | INodeParameters | NodeParameterValue[] | INodeParameters[];
    /**
     * Returns the resolved node parameter value. If it is an expression it will execute it and
     * return the result. If the value to resolve is an array or object it will do the same
     * for all of the items and values.
     */
    getParameterValue(parameterValue: NodeParameterValueType | INodeParameterResourceLocator, runExecutionData: IRunExecutionData | null, runIndex: number, itemIndex: number, activeNodeName: string, connectionInputData: INodeExecutionData[], mode: WorkflowExecuteMode, additionalKeys: IWorkflowDataProxyAdditionalKeys, executeData?: IExecuteData, returnObjectAsString?: boolean, selfData?: {}, contextNodeName?: string): NodeParameterValueType;
    /**
     * Resolves value of parameter. But does not work for workflow-data.
     */
    getSimpleParameterValue(node: INode, parameterValue: string | boolean | undefined, mode: WorkflowExecuteMode, additionalKeys: IWorkflowDataProxyAdditionalKeys, executeData?: IExecuteData, defaultValue?: boolean | number | string | unknown[]): boolean | number | string | undefined | unknown[];
    /**
     * Resolves value of complex parameter. But does not work for workflow-data.
     */
    getComplexParameterValue(node: INode, parameterValue: NodeParameterValue | INodeParameters | NodeParameterValue[] | INodeParameters[], mode: WorkflowExecuteMode, additionalKeys: IWorkflowDataProxyAdditionalKeys, executeData?: IExecuteData, defaultValue?: NodeParameterValueType | undefined, selfData?: {}): NodeParameterValueType | undefined;
    convertObjectValueToString(value: object): string;
    acquireIsolate(): Promise<void>;
    releaseIsolate(): Promise<void>;
}
//# sourceMappingURL=workflow-expression.d.ts.map