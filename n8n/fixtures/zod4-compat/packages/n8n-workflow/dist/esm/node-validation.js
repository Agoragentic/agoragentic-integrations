import { displayParameter } from "./node-helpers.js";
/**
 * Validates that all required credentials are set for a node.
 * Respects displayOptions to only validate credentials that should be shown.
 */
export function validateNodeCredentials(node, nodeType) {
    const issues = [];
    const credentialDescriptions = nodeType.description?.credentials || [];
    for (const credDesc of credentialDescriptions) {
        if (!credDesc.required)
            continue;
        // Check if this credential should be displayed based on displayOptions
        const shouldDisplay = displayParameter(node.parameters, credDesc, node, nodeType.description);
        if (!shouldDisplay)
            continue;
        const credentialName = credDesc.name;
        const nodeCredential = node.credentials?.[credentialName];
        const displayName = credDesc.displayName ?? credentialName;
        if (!nodeCredential) {
            issues.push({
                type: 'missing',
                displayName,
                credentialName,
            });
            continue;
        }
        if (!nodeCredential.id && !nodeCredential.__aiGatewayManaged) {
            issues.push({
                type: 'not-configured',
                displayName,
                credentialName,
            });
        }
    }
    return issues;
}
/**
 * Checks if a node has any incoming or outgoing connections.
 */
export function isNodeConnected(nodeName, connections, connectionsByDestination) {
    // Check outgoing connections
    if (connections[nodeName] && Object.keys(connections[nodeName]).length > 0) {
        return true;
    }
    // Check incoming connections
    if (connectionsByDestination[nodeName] &&
        Object.keys(connectionsByDestination[nodeName]).length > 0) {
        return true;
    }
    return false;
}
/**
 * Checks if a node type is a trigger-like node (trigger, webhook, or poll).
 * These nodes are workflow entry points and should always be validated.
 */
export function isTriggerLikeNode(nodeType) {
    return (nodeType.trigger !== undefined || nodeType.webhook !== undefined || nodeType.poll !== undefined);
}
//# sourceMappingURL=node-validation.js.map