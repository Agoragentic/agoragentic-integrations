import type { INodes, INodeType } from "./interfaces.js";
export interface INodeTypesGetter {
    getByNameAndVersion(nodeType: string, version?: number): INodeType | undefined;
}
/**
 * Validates that a workflow has at least one trigger-like node (trigger, webhook, or polling node).
 * A workflow can only be activated if it has a node that can start the workflow execution.
 *
 * @param nodes - The workflow nodes to validate
 * @param nodeTypes - Node types getter to retrieve node definitions
 * @param ignoreNodeTypes - Optional array of node types to ignore (e.g., manual trigger, start node)
 * @returns Object with isValid flag and error message if invalid
 */
export declare function validateWorkflowHasTriggerLikeNode(nodes: INodes, nodeTypes: INodeTypesGetter, ignoreNodeTypes?: string[]): {
    isValid: boolean;
    error?: string;
};
//# sourceMappingURL=workflow-validation.d.ts.map