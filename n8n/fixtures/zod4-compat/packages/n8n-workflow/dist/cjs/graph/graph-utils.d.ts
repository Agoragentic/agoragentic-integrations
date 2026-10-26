import type { IConnection, IConnections } from "../interfaces.js";
type MultipleInputNodesError = {
    errorCode: 'Multiple Input Nodes';
    nodes: Set<string>;
};
type MultipleOutputNodesError = {
    errorCode: 'Multiple Output Nodes';
    nodes: Set<string>;
};
type InputEdgeToNonRootNode = {
    errorCode: 'Input Edge To Non-Root Node';
    node: string;
};
type OutputEdgeFromNonLeafNode = {
    errorCode: 'Output Edge From Non-Leaf Node';
    node: string;
};
type NoContinuousPathFromRootToLeaf = {
    errorCode: 'No Continuous Path From Root To Leaf In Selection';
    start: string;
    end: string;
};
export type ExtractableErrorResult = MultipleInputNodesError | MultipleOutputNodesError | InputEdgeToNonRootNode | OutputEdgeFromNonLeafNode | NoContinuousPathFromRootToLeaf;
export type IConnectionAdjacencyList = Map<string, Set<IConnection>>;
/**
 * Find all edges leading into the graph described in `graphIds`.
 */
export declare function getInputEdges(graphIds: Set<string>, adjacencyList: IConnectionAdjacencyList): Array<[string, IConnection]>;
/**
 * Find all edges leading out of the graph described in `graphIds`.
 */
export declare function getOutputEdges(graphIds: Set<string>, adjacencyList: IConnectionAdjacencyList): Array<[string, IConnection]>;
export declare function getRootNodes(graphIds: Set<string>, adjacencyList: IConnectionAdjacencyList): Set<string>;
export declare function getLeafNodes(graphIds: Set<string>, adjacencyList: IConnectionAdjacencyList): Set<string>;
export declare function hasPath(start: string, end: string, adjacencyList: IConnectionAdjacencyList): boolean;
export type ExtractableSubgraphData = {
    start?: string;
    end?: string;
};
export declare function buildAdjacencyList(connectionsBySourceNode: IConnections): IConnectionAdjacencyList;
/**
 * A subgraph is considered extractable if the following properties hold:
 * - 0-1 input nodes from outside the subgraph, to a root node
 * - 0-1 output nodes to outside the subgraph, from a leaf node
 * - continuous path between input and output nodes if they exist
 *
 * This also covers the requirement that all "inner" nodes between the root node
 * and the output node are selected, since this would otherwise create extra
 * input or output nodes.
 *
 * @returns An object containing optional start and end nodeIds
 *            indicating which nodes have outside connections, OR
 *          An array of errors if the selection is not valid.
 */
export declare function parseExtractableSubgraphSelection(graphIds: Set<string>, adjacencyList: IConnectionAdjacencyList): ExtractableSubgraphData | ExtractableErrorResult[];
export {};
//# sourceMappingURL=graph-utils.d.ts.map