"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateNodeSelectionForExtraction = validateNodeSelectionForExtraction;
exports.validateNodeSelectionForGrouping = validateNodeSelectionForGrouping;
const graph_utils_1 = require("./graph/graph-utils.js");
const interfaces_1 = require("./interfaces.js");
const node_helpers_1 = require("./node-helpers.js");
function validateNodeSelectionForExtraction(input) {
    const subgraphResult = validateNodeSelectionSubgraph(input);
    if (!subgraphResult.valid)
        return subgraphResult;
    const { nodes, getNodeType, getNodeInputs, getNodeOutputs } = input;
    const { start, end } = subgraphResult.subGraphData;
    const nodesByName = new Map(nodes.map((node) => [node.name, node]));
    if (start &&
        !hasSingleMainIO(start, 'inputs', nodesByName, getNodeType, getNodeInputs, getNodeOutputs)) {
        return { valid: false, reason: 'multiple-input-branches', node: start };
    }
    if (end &&
        !hasSingleMainIO(end, 'outputs', nodesByName, getNodeType, getNodeInputs, getNodeOutputs)) {
        return { valid: false, reason: 'multiple-output-branches', node: end };
    }
    return subgraphResult;
}
function validateNodeSelectionForGrouping(input) {
    const alreadyGroupedNodeIds = findAlreadyGroupedNodeIds(input.nodes.map((node) => node.id), input.existingNodeGroups ?? []);
    if (alreadyGroupedNodeIds.length > 0) {
        return { valid: false, reason: 'node-already-grouped', nodeIds: alreadyGroupedNodeIds };
    }
    const extractableResult = validateNodeSelectionSubgraph(input);
    if (!extractableResult.valid)
        return extractableResult;
    const nodeNames = new Set(extractableResult.subGraph.map((node) => node.name));
    const boundaryConnection = findNonMainBoundaryConnection(nodeNames, input.connectionsBySourceNode);
    if (boundaryConnection) {
        return { valid: false, reason: 'non-main-boundary', connection: boundaryConnection };
    }
    return extractableResult;
}
function validateNodeSelectionSubgraph({ nodes, connectionsBySourceNode, getNodeType, }) {
    const triggers = nodes.filter((node) => {
        const nodeType = getNodeType(node);
        return nodeType ? (0, node_helpers_1.isTriggerNode)(nodeType) : false;
    });
    if (triggers.length > 0) {
        return {
            valid: false,
            reason: 'trigger-selected',
            triggers: triggers.map((node) => node.name),
        };
    }
    const adjacencyList = (0, graph_utils_1.buildAdjacencyList)(connectionsBySourceNode);
    const selectedNodeNames = new Set(nodes.map((node) => node.name));
    const selection = (0, graph_utils_1.parseExtractableSubgraphSelection)(selectedNodeNames, adjacencyList);
    if (Array.isArray(selection)) {
        return { valid: false, reason: 'invalid-subgraph', errors: selection };
    }
    const disconnectedSelectionError = findDisconnectedSelectionError(selectedNodeNames, adjacencyList);
    if (disconnectedSelectionError) {
        return { valid: false, reason: 'invalid-subgraph', errors: [disconnectedSelectionError] };
    }
    return { valid: true, subGraph: nodes, subGraphData: selection };
}
function findAlreadyGroupedNodeIds(selectionNodeIds, existingNodeGroups) {
    const groupedNodeIds = new Set(existingNodeGroups.flatMap((group) => group.nodeIds));
    return selectionNodeIds.filter((nodeId) => groupedNodeIds.has(nodeId));
}
function hasSingleMainIO(nodeName, direction, nodesByName, getNodeType, getNodeInputs, getNodeOutputs) {
    const node = nodesByName.get(nodeName);
    if (!node)
        return true;
    const nodeType = getNodeType(node);
    if (!nodeType)
        return true;
    const ios = direction === 'inputs'
        ? (getNodeInputs?.(node, nodeType) ?? nodeType.inputs)
        : (getNodeOutputs?.(node, nodeType) ?? nodeType.outputs);
    if (!Array.isArray(ios))
        return true;
    return ios.filter(isMainIo).length <= 1;
}
function isMainIo(io) {
    return typeof io === 'string'
        ? io === interfaces_1.NodeConnectionTypes.Main
        : io.type === interfaces_1.NodeConnectionTypes.Main;
}
function findDisconnectedSelectionError(nodeNames, currentAdjacencyList) {
    if (nodeNames.size <= 1)
        return null;
    const neighborsByNodeName = new Map();
    for (const nodeName of nodeNames) {
        neighborsByNodeName.set(nodeName, new Set());
    }
    for (const [sourceNodeName, connections] of currentAdjacencyList.entries()) {
        if (!nodeNames.has(sourceNodeName))
            continue;
        const sourceNeighbors = neighborsByNodeName.get(sourceNodeName);
        if (!sourceNeighbors)
            continue;
        for (const connection of connections) {
            const targetNodeName = connection.node;
            if (!nodeNames.has(targetNodeName) || targetNodeName === sourceNodeName)
                continue;
            sourceNeighbors.add(targetNodeName);
            neighborsByNodeName.get(targetNodeName)?.add(sourceNodeName);
        }
    }
    const firstNodeName = nodeNames.values().next().value;
    if (!firstNodeName)
        return null;
    const visited = new Set([firstNodeName]);
    const queue = [firstNodeName];
    while (queue.length > 0) {
        const currentNodeName = queue.shift();
        if (!currentNodeName)
            continue;
        for (const neighborNodeName of neighborsByNodeName.get(currentNodeName) ?? []) {
            if (visited.has(neighborNodeName))
                continue;
            visited.add(neighborNodeName);
            queue.push(neighborNodeName);
        }
    }
    if (visited.size === nodeNames.size)
        return null;
    const disconnectedNodeName = Array.from(nodeNames).find((nodeName) => !visited.has(nodeName));
    if (!disconnectedNodeName)
        return null;
    return {
        errorCode: 'No Continuous Path From Root To Leaf In Selection',
        start: firstNodeName,
        end: disconnectedNodeName,
    };
}
function findNonMainBoundaryConnection(nodeNames, connectionsBySourceNode) {
    for (const [sourceNodeName, sourceConnections] of Object.entries(connectionsBySourceNode)) {
        const sourceInside = nodeNames.has(sourceNodeName);
        for (const [type, connectionsByOutputIndex] of Object.entries(sourceConnections)) {
            if (type === interfaces_1.NodeConnectionTypes.Main)
                continue;
            for (const connections of connectionsByOutputIndex) {
                for (const connection of connections ?? []) {
                    if (sourceInside === nodeNames.has(connection.node))
                        continue;
                    return { source: sourceNodeName, target: connection.node, type };
                }
            }
        }
    }
    return null;
}
//# sourceMappingURL=node-grouping-validation.js.map