import { type ExtractableErrorResult, type ExtractableSubgraphData } from "./graph/graph-utils.js";
import { type IConnections, type INode, type INodeInputConfiguration, type INodeOutputConfiguration, type INodeTypeDescription, type IWorkflowGroup, type NodeConnectionType } from "./interfaces.js";
export type NodeGroupingValidationInput<TNode extends INode = INode> = {
    nodes: TNode[];
    connectionsBySourceNode: IConnections;
    getNodeType: (node: TNode) => INodeTypeDescription | null | undefined;
    existingNodeGroups?: IWorkflowGroup[];
    getNodeInputs?: (node: TNode, nodeType: INodeTypeDescription) => Array<NodeConnectionType | INodeInputConfiguration>;
    getNodeOutputs?: (node: TNode, nodeType: INodeTypeDescription) => Array<NodeConnectionType | INodeOutputConfiguration>;
};
export type NodeSelectionValidationResult<TNode extends INode = INode> = {
    valid: true;
    subGraph: TNode[];
    subGraphData: ExtractableSubgraphData;
} | {
    valid: false;
    reason: 'trigger-selected';
    triggers: string[];
} | {
    valid: false;
    reason: 'invalid-subgraph';
    errors: ExtractableErrorResult[];
} | {
    valid: false;
    reason: 'multiple-input-branches';
    node: string;
} | {
    valid: false;
    reason: 'multiple-output-branches';
    node: string;
};
export type NodeGroupValidationResult<TNode extends INode = INode> = NodeSelectionValidationResult<TNode> | {
    valid: false;
    reason: 'node-already-grouped';
    nodeIds: string[];
} | {
    valid: false;
    reason: 'non-main-boundary';
    connection: {
        source: string;
        target: string;
        type: string;
    };
};
export declare function validateNodeSelectionForExtraction<TNode extends INode>(input: NodeGroupingValidationInput<TNode>): NodeSelectionValidationResult<TNode>;
export declare function validateNodeSelectionForGrouping<TNode extends INode>(input: NodeGroupingValidationInput<TNode>): NodeGroupValidationResult<TNode>;
//# sourceMappingURL=node-grouping-validation.d.ts.map