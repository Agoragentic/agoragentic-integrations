import type { INode, INodeType, IConnections } from "./interfaces.js";
export interface NodeValidationIssue {
    credential?: string;
    parameter?: string;
}
export interface NodeCredentialIssue {
    type: 'missing' | 'not-configured';
    displayName: string;
    credentialName: string;
}
/**
 * Validates that all required credentials are set for a node.
 * Respects displayOptions to only validate credentials that should be shown.
 */
export declare function validateNodeCredentials(node: INode, nodeType: INodeType): NodeCredentialIssue[];
/**
 * Checks if a node has any incoming or outgoing connections.
 */
export declare function isNodeConnected(nodeName: string, connections: IConnections, connectionsByDestination: IConnections): boolean;
/**
 * Checks if a node type is a trigger-like node (trigger, webhook, or poll).
 * These nodes are workflow entry points and should always be validated.
 */
export declare function isTriggerLikeNode(nodeType: INodeType): boolean;
//# sourceMappingURL=node-validation.d.ts.map