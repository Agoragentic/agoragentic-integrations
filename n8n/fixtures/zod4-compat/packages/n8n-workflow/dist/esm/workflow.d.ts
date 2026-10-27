import { WorkflowExpression } from "./workflow-expression.js";
import type { IConnections, INode, INodeExecutionData, INodes, INodeType, INodeTypes, IPinData, IWorkflowSettings, IConnection, IConnectedNode, IDataObject, INodeConnection, NodeParameterValueType, NodeConnectionType } from "./interfaces.js";
export interface WorkflowParameters {
    id?: string;
    name?: string;
    nodes: INode[];
    connections: IConnections;
    active: boolean;
    nodeTypes: INodeTypes;
    staticData?: IDataObject;
    settings?: IWorkflowSettings;
    pinData?: IPinData;
}
export declare class Workflow {
    id: string;
    name: string | undefined;
    nodes: INodes;
    connectionsBySourceNode: IConnections;
    connectionsByDestinationNode: IConnections;
    nodeTypes: INodeTypes;
    expression: WorkflowExpression;
    active: boolean;
    settings: IWorkflowSettings;
    readonly timezone: string;
    staticData: IDataObject;
    testStaticData: IDataObject | undefined;
    pinData?: IPinData;
    constructor(parameters: WorkflowParameters);
    setNodes(nodes: INode[]): void;
    setConnections(connections: IConnections): void;
    setPinData(pinData: IPinData | undefined): void;
    setSettings(settings: IWorkflowSettings): void;
    overrideStaticData(staticData?: IDataObject): void;
    static getConnectionsByDestination(connections: IConnections): IConnections;
    /**
     * Returns the static data of the workflow.
     * It gets saved with the workflow and will be the same for
     * all workflow-executions.
     *
     * @param {string} type The type of data to return ("global"|"node")
     * @param {INode} [node] If type is set to "node" then the node has to be provided
     */
    getStaticData(type: string, node?: INode): IDataObject;
    setTestStaticData(testStaticData: IDataObject): void;
    /**
     * Returns all the trigger nodes in the workflow.
     *
     */
    getTriggerNodes(): INode[];
    /**
     * Returns all the poll nodes in the workflow
     *
     */
    getPollNodes(): INode[];
    /**
     * Returns all the nodes in the workflow for which the given
     * checkFunction return true
     *
     * @param {(nodeType: INodeType) => boolean} checkFunction
     */
    queryNodes(checkFunction: (nodeType: INodeType) => boolean): INode[];
    /**
     * Returns the node with the given name if it exists else null
     *
     * @param {string} nodeName Name of the node to return
     */
    getNode(nodeName: string): INode | null;
    /**
     * Returns the nodes with the given names if they exist.
     * If a node cannot be found it will be ignored, meaning the returned array
     * of nodes can be smaller than the array of names.
     */
    getNodes(nodeNames: string[]): INode[];
    /**
     * Returns the pinData of the node with the given name if it exists
     *
     * @param {string} nodeName Name of the node to return the pinData of
     */
    getPinDataOfNode(nodeName: string): INodeExecutionData[] | undefined;
    renameNodeInParameterValue(parameterValue: NodeParameterValueType, currentName: string, newName: string, { hasRenamableContent }?: {
        hasRenamableContent: boolean;
    }): NodeParameterValueType;
    /**
     * Rename a node in the workflow
     *
     * @param {string} currentName The current name of the node
     * @param {string} newName The new name
     */
    renameNode(currentName: string, newName: string): void;
    /**
     * Finds the highest parent nodes of the node with the given name
     *
     * @param {NodeConnectionType} [type='main']
     */
    getHighestNode(nodeName: string, nodeConnectionIndex?: number, checkedNodes?: string[]): string[];
    /**
     * Returns all the after the given one
     *
     * @param {string} [type='main']
     * @param {*} [depth=-1]
     */
    getChildNodes(nodeName: string, type?: NodeConnectionType | 'ALL' | 'ALL_NON_MAIN', depth?: number): string[];
    /**
     * Returns all the nodes before the given one
     *
     * @param {NodeConnectionType} [type='main']
     * @param {*} [depth=-1]
     */
    getParentNodes(nodeName: string, type?: NodeConnectionType | 'ALL' | 'ALL_NON_MAIN', depth?: number): string[];
    /**
     * Gets all the nodes which are connected nodes starting from
     * the given one
     *
     * @param {NodeConnectionType} [type='main']
     * @param {*} [depth=-1]
     */
    getConnectedNodes(connections: IConnections, nodeName: string, connectionType?: NodeConnectionType | 'ALL' | 'ALL_NON_MAIN', depth?: number): string[];
    /**
     * Returns all the nodes before the given one
     *
     * @param {*} [maxDepth=-1]
     */
    getParentNodesByDepth(nodeName: string, maxDepth?: number): IConnectedNode[];
    /**
     * Gets all the nodes which are connected nodes starting from
     * the given one
     * Uses BFS traversal
     *
     * @param {*} [maxDepth=-1]
     */
    searchNodesBFS(connections: IConnections, sourceNode: string, maxDepth?: number): IConnectedNode[];
    getParentMainInputNode(node: INode): INode;
    /**
     * Returns via which output of the parent-node and index the current node
     * they are connected
     *
     * @param {string} nodeName The node to check how it is connected with parent node
     * @param {string} parentNodeName The parent node to get the output index of
     * @param {string} [type='main']
     */
    getNodeConnectionIndexes(nodeName: string, parentNodeName: string, type?: NodeConnectionType): INodeConnection | undefined;
    /**
     * Returns from which of the given nodes the workflow should get started from
     *
     * @param {string[]} nodeNames The potential start nodes
     */
    __getStartNode(nodeNames: string[]): INode | undefined;
    /**
     * Returns the start node to start the workflow from
     *
     */
    getStartNode(destinationNode?: string): INode | undefined;
    getConnectionsBetweenNodes(sources: string[], targets: string[]): Array<[IConnection, IConnection]>;
}
//# sourceMappingURL=workflow.d.ts.map