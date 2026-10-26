import type { IDataObject, IExecuteData, INodeExecutionData, INodeParameters, IWorkflowDataProxyAdditionalKeys, IWorkflowDataProxyData, WorkflowExecuteMode } from "./interfaces.js";
import type { IRunExecutionData } from "./run-execution-data/run-execution-data.js";
import type { Workflow } from "./workflow.js";
import type { EnvProviderState } from "./workflow-data-proxy-env-provider.js";
export declare class WorkflowDataProxy {
    private workflow;
    private runIndex;
    private itemIndex;
    private activeNodeName;
    private siblingParameters;
    private mode;
    private additionalKeys;
    private executeData?;
    private defaultReturnRunIndex;
    private selfData;
    private contextNodeName;
    private envProviderState?;
    private runExecutionData;
    private connectionInputData;
    private timezone;
    constructor(workflow: Workflow, runExecutionData: IRunExecutionData | null, runIndex: number, itemIndex: number, activeNodeName: string, connectionInputData: INodeExecutionData[], siblingParameters: INodeParameters, mode: WorkflowExecuteMode, additionalKeys: IWorkflowDataProxyAdditionalKeys, executeData?: IExecuteData | undefined, defaultReturnRunIndex?: number, selfData?: IDataObject, contextNodeName?: string, envProviderState?: EnvProviderState | undefined);
    /**
     * Returns execution data, conditionally extracting only 'json' from the item based on workflow 'binaryMode' setting.
     * When binary mode is 'combined', this method returns only the 'json' from the item unless 'fullItem' is true.
     *
     * @private
     * @param {INodeExecutionData | INodeExecutionData[]} data - The execution data to process
     * @param {boolean} fullItem - If true, always returns the complete item data
     * @returns The full execution data or only the json property, depending on workflow 'binaryMode' setting
     */
    private returnExecutionData;
    /**
     * Returns a proxy which allows to query context data of a given node
     *
     * @private
     * @param {string} nodeName The name of the node to get the context from
     */
    private nodeContextGetter;
    private selfGetter;
    private buildAgentToolInfo;
    private agentInfo;
    /**
     * Returns a proxy which allows to query parameter data of a given node
     *
     * @private
     * @param {string} nodeName The name of the node to query data from
     * @param {boolean} [resolveValue=true] If the expression value should get resolved
     */
    private nodeParameterGetter;
    private getNodeExecutionOrPinnedData;
    /**
     * Returns the node ExecutionData
     *
     * @private
     * @param {string} nodeName The name of the node query data from
     * @param {boolean} [shortSyntax=false] If short syntax got used
     * @param {number} [outputIndex] The index of the output, if not given the first one gets used
     * @param {number} [runIndex] The index of the run, if not given the current one does get used
     */
    private getNodeExecutionData;
    /**
     * Returns a proxy which allows to query data of a given node
     *
     * @private
     * @param {string} nodeName The name of the node query data from
     * @param {boolean} [shortSyntax=false] If short syntax got used
     * @param {boolean} [throwOnMissingExecutionData=true] If an error should get thrown if no execution data is available
     */
    private nodeDataGetter;
    private prevNodeGetter;
    /**
     * Returns a proxy to query data from the workflow
     *
     * @private
     */
    private workflowGetter;
    /**
     * Returns a proxy to query data of all nodes
     *
     * @private
     */
    private nodeGetter;
    /**
     * Returns the data proxy object which allows to query data from current run
     *
     */
    getDataProxy(opts?: {
        throwOnMissingExecutionData: boolean;
    }): IWorkflowDataProxyData;
}
//# sourceMappingURL=workflow-data-proxy.d.ts.map