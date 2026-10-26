import type { IConnections, INode, INodesGraphResult, IWorkflowBase, INodeTypes, IRunData, IRun } from "./interfaces.js";
export declare function getNodeTypeForName(workflow: IWorkflowBase, nodeName: string): INode | undefined;
export declare function isNumber(value: unknown): value is number;
export declare function getDomainBase(raw: string, urlParts?: RegExp): string;
export declare const ANONYMIZATION_CHARACTER = "*";
/**
 * Return pathname plus query string from URL, anonymizing IDs in route and query params.
 */
export declare function getDomainPath(raw: string, urlParts?: RegExp): string;
export declare function generateNodesGraph(workflow: Partial<IWorkflowBase>, nodeTypes: INodeTypes, options?: {
    sourceInstanceId?: string;
    nodeIdMap?: {
        [curr: string]: string;
    };
    isCloudDeployment?: boolean;
    runData?: IRunData;
}): INodesGraphResult;
export declare function extractLastExecutedNodeCredentialData(runData: IRun): null | {
    credentialId: string;
    credentialType: string;
};
export declare const userInInstanceRanOutOfFreeAiCredits: (runData: IRun) => boolean;
export type FromAICount = {
    aiNodeCount: number;
    aiToolCount: number;
    fromAIOverrideCount: number;
    fromAIExpressionCount: number;
};
export declare function resolveAIMetrics(nodes: INode[], nodeTypes: INodeTypes): FromAICount | {};
export type VectorStoreMetrics = {
    insertedIntoVectorStore: boolean;
    queriedDataFromVectorStore: boolean;
};
export declare function resolveVectorStoreMetrics(nodes: INode[], nodeTypes: INodeTypes, run: IRun): VectorStoreMetrics | {};
type AgentNodeStructuredOutputErrorInfo = {
    output_parser_fail_reason?: string;
    model_name?: string;
    num_tools?: number;
};
/**
 * Extract additional debug information if the last executed node was an agent node
 */
export declare function extractLastExecutedNodeStructuredOutputErrorInfo(workflow: IWorkflowBase, nodeTypes: INodeTypes, runData: IRun): AgentNodeStructuredOutputErrorInfo;
export type NodeRole = 'trigger' | 'terminal' | 'internal';
/**
 * Determines the role of a node in a workflow based on its connections.
 *
 * @param nodeName - The name of the node to check
 * @param connections - The workflow connections (connectionsBySourceNode format)
 * @param nodeTypes - The node types registry
 * @param nodes - The workflow nodes
 * @returns The role of the node:
 *   - 'trigger': Has no incoming main connections and is not a subnode
 *   - 'terminal': Has no outgoing connections
 *   - 'internal': Has both incoming and outgoing connections, or is a subnode
 */
export declare function getNodeRole(nodeName: string, connections: IConnections, nodeTypes: INodeTypes, nodes: INode[]): NodeRole;
export {};
//# sourceMappingURL=telemetry-helpers.d.ts.map