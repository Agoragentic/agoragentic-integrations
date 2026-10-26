"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Workflow = void 0;
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-for-in-array */
const common_1 = require("./common/index.js");
const constants_1 = require("./constants.js");
const errors_1 = require("./errors/index.js");
const workflow_expression_1 = require("./workflow-expression.js");
const global_state_1 = require("./global-state.js");
const interfaces_1 = require("./interfaces.js");
const NodeHelpers = __importStar(require("./node-helpers.js"));
const rename_node_utils_1 = require("./node-parameters/rename-node-utils.js");
const node_reference_parser_utils_1 = require("./node-reference-parser-utils.js");
const ObservableObject = __importStar(require("./observable-object.js"));
const utils_1 = require("./utils.js");
class Workflow {
    id;
    name;
    nodes = {};
    connectionsBySourceNode = {};
    connectionsByDestinationNode = {};
    nodeTypes;
    expression;
    active;
    settings = {};
    timezone;
    // To save workflow specific static data like for example
    // ids of registered webhooks of nodes
    staticData;
    testStaticData;
    pinData;
    constructor(parameters) {
        this.id = parameters.id; // @tech_debt Ensure this is not optional
        this.name = parameters.name;
        this.nodeTypes = parameters.nodeTypes;
        let nodeType;
        for (const node of parameters.nodes) {
            nodeType = this.nodeTypes.getByNameAndVersion(node.type, node.typeVersion);
            if (nodeType === undefined) {
                // Go on to next node when its type is not known.
                // For now do not error because that causes problems with
                // expression resolution also then when the unknown node
                // does not get used.
                continue;
                // throw new ApplicationError(`Node with unknown node type`, {
                // 	tags: { nodeType: node.type },
                // 	extra: { node },
                // });
            }
            // Add default values
            const nodeParameters = NodeHelpers.getNodeParameters(nodeType.description.properties, node.parameters, true, false, node, nodeType.description);
            node.parameters = nodeParameters !== null ? nodeParameters : {};
        }
        this.setNodes(parameters.nodes);
        this.setConnections(parameters.connections);
        this.setPinData(parameters.pinData);
        this.setSettings(parameters.settings ?? {});
        this.active = parameters.active || false;
        this.staticData = ObservableObject.create(parameters.staticData || {}, undefined, {
            ignoreEmptyOnFirstChild: true,
        });
        this.timezone = this.settings.timezone ?? (0, global_state_1.getGlobalState)().defaultTimezone;
        this.expression = new workflow_expression_1.WorkflowExpression(this);
    }
    // Save nodes in workflow as object to be able to get the nodes easily by their name.
    setNodes(nodes) {
        this.nodes = {};
        for (const node of nodes) {
            this.nodes[node.name] = node;
        }
    }
    setConnections(connections) {
        this.connectionsBySourceNode = connections;
        this.connectionsByDestinationNode = (0, common_1.mapConnectionsByDestination)(this.connectionsBySourceNode);
    }
    setPinData(pinData) {
        this.pinData = pinData;
    }
    setSettings(settings) {
        this.settings = settings;
    }
    overrideStaticData(staticData) {
        this.staticData = ObservableObject.create(staticData || {}, undefined, {
            ignoreEmptyOnFirstChild: true,
        });
        this.staticData.__dataChanged = true;
    }
    static getConnectionsByDestination(connections) {
        const returnConnection = {};
        let connectionInfo;
        let maxIndex;
        for (const sourceNode in connections) {
            if (!connections.hasOwnProperty(sourceNode)) {
                continue;
            }
            for (const type of Object.keys(connections[sourceNode])) {
                if (!connections[sourceNode].hasOwnProperty(type)) {
                    continue;
                }
                for (const inputIndex in connections[sourceNode][type]) {
                    if (!connections[sourceNode][type].hasOwnProperty(inputIndex)) {
                        continue;
                    }
                    for (connectionInfo of connections[sourceNode][type][inputIndex] ?? []) {
                        if (!returnConnection.hasOwnProperty(connectionInfo.node)) {
                            returnConnection[connectionInfo.node] = {};
                        }
                        if (!returnConnection[connectionInfo.node].hasOwnProperty(connectionInfo.type)) {
                            returnConnection[connectionInfo.node][connectionInfo.type] = [];
                        }
                        maxIndex = returnConnection[connectionInfo.node][connectionInfo.type].length - 1;
                        for (let j = maxIndex; j < connectionInfo.index; j++) {
                            returnConnection[connectionInfo.node][connectionInfo.type].push([]);
                        }
                        returnConnection[connectionInfo.node][connectionInfo.type][connectionInfo.index]?.push({
                            node: sourceNode,
                            type,
                            index: parseInt(inputIndex, 10),
                        });
                    }
                }
            }
        }
        return returnConnection;
    }
    /**
     * Returns the static data of the workflow.
     * It gets saved with the workflow and will be the same for
     * all workflow-executions.
     *
     * @param {string} type The type of data to return ("global"|"node")
     * @param {INode} [node] If type is set to "node" then the node has to be provided
     */
    getStaticData(type, node) {
        let key;
        if (type === 'global') {
            key = 'global';
        }
        else if (type === 'node') {
            if (node === undefined) {
                throw new errors_1.UnexpectedError('The request data of context type "node" the node parameter has to be set!');
            }
            key = `node:${node.name}`;
        }
        else {
            throw new errors_1.UnexpectedError('Unknown context type. Only `global` and `node` are supported.', {
                extra: { contextType: type },
            });
        }
        if (this.testStaticData?.[key])
            return this.testStaticData[key];
        if (this.staticData[key] === undefined) {
            // Create it as ObservableObject that we can easily check if the data changed
            // to know if the workflow with its data has to be saved afterwards or not.
            this.staticData[key] = ObservableObject.create({}, this.staticData);
        }
        return this.staticData[key];
    }
    setTestStaticData(testStaticData) {
        this.testStaticData = testStaticData;
    }
    /**
     * Returns all the trigger nodes in the workflow.
     *
     */
    getTriggerNodes() {
        return this.queryNodes((nodeType) => !!nodeType.trigger);
    }
    /**
     * Returns all the poll nodes in the workflow
     *
     */
    getPollNodes() {
        return this.queryNodes((nodeType) => !!nodeType.poll);
    }
    /**
     * Returns all the nodes in the workflow for which the given
     * checkFunction return true
     *
     * @param {(nodeType: INodeType) => boolean} checkFunction
     */
    queryNodes(checkFunction) {
        const returnNodes = [];
        // Check if it has any of them
        let node;
        let nodeType;
        for (const nodeName of Object.keys(this.nodes)) {
            node = this.nodes[nodeName];
            if (node.disabled === true) {
                continue;
            }
            nodeType = this.nodeTypes.getByNameAndVersion(node.type, node.typeVersion);
            if (nodeType !== undefined && checkFunction(nodeType)) {
                returnNodes.push(node);
            }
        }
        return returnNodes;
    }
    /**
     * Returns the node with the given name if it exists else null
     *
     * @param {string} nodeName Name of the node to return
     */
    getNode(nodeName) {
        return this.nodes[nodeName] ?? null;
    }
    /**
     * Returns the nodes with the given names if they exist.
     * If a node cannot be found it will be ignored, meaning the returned array
     * of nodes can be smaller than the array of names.
     */
    getNodes(nodeNames) {
        const nodes = [];
        for (const name of nodeNames) {
            const node = this.getNode(name);
            if (!node) {
                console.warn(`Could not find a node with the name ${name} in the workflow. This was passed in as a dirty node name.`);
                continue;
            }
            nodes.push(node);
        }
        return nodes;
    }
    /**
     * Returns the pinData of the node with the given name if it exists
     *
     * @param {string} nodeName Name of the node to return the pinData of
     */
    getPinDataOfNode(nodeName) {
        return this.pinData ? this.pinData[nodeName] : undefined;
    }
    renameNodeInParameterValue(parameterValue, currentName, newName, { hasRenamableContent } = { hasRenamableContent: false }) {
        if (typeof parameterValue !== 'object') {
            // Reached the actual value
            if (typeof parameterValue === 'string' &&
                (parameterValue.charAt(0) === '=' || hasRenamableContent)) {
                parameterValue = (0, node_reference_parser_utils_1.applyAccessPatterns)(parameterValue, currentName, newName);
            }
            return parameterValue;
        }
        if (Array.isArray(parameterValue)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const returnArray = [];
            for (const currentValue of parameterValue) {
                returnArray.push(this.renameNodeInParameterValue(currentValue, currentName, newName));
            }
            return returnArray;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const returnData = {};
        for (const parameterName of Object.keys(parameterValue || {})) {
            returnData[parameterName] = this.renameNodeInParameterValue(parameterValue[parameterName], currentName, newName, { hasRenamableContent });
        }
        return returnData;
    }
    /**
     * Rename a node in the workflow
     *
     * @param {string} currentName The current name of the node
     * @param {string} newName The new name
     */
    renameNode(currentName, newName) {
        // These keys are excluded to prevent accidental modification of inherited properties and
        // to avoid any issues related to JavaScript's built-in methods that can cause unexpected behavior
        const restrictedKeys = [
            'hasOwnProperty',
            'isPrototypeOf',
            'propertyIsEnumerable',
            'toLocaleString',
            'toString',
            'valueOf',
            'constructor',
            'prototype',
            '__proto__',
            '__defineGetter__',
            '__defineSetter__',
            '__lookupGetter__',
            '__lookupSetter__',
        ];
        if (restrictedKeys.map((k) => k.toLowerCase()).includes(newName.toLowerCase())) {
            throw new errors_1.UserError(`Node name "${newName}" is a restricted name.`, {
                description: `Node names cannot be any of the following: ${restrictedKeys.join(', ')}`,
            });
        }
        // Rename the node itself
        if (this.nodes[currentName] !== undefined) {
            this.nodes[newName] = this.nodes[currentName];
            this.nodes[newName].name = newName;
            delete this.nodes[currentName];
        }
        // Update the expressions which reference the node
        // with its old name
        for (const node of Object.values(this.nodes)) {
            node.parameters = this.renameNodeInParameterValue(node.parameters, currentName, newName);
            if (constants_1.NODES_WITH_RENAMABLE_CONTENT.has(node.type)) {
                node.parameters.jsCode = this.renameNodeInParameterValue(node.parameters.jsCode, currentName, newName, { hasRenamableContent: true });
            }
            if (constants_1.NODES_WITH_RENAMEABLE_TOPLEVEL_HTML_CONTENT.has(node.type)) {
                node.parameters.html = this.renameNodeInParameterValue(node.parameters.html, currentName, newName, { hasRenamableContent: true });
            }
            if (constants_1.NODES_WITH_RENAMABLE_FORM_HTML_CONTENT.has(node.type)) {
                (0, rename_node_utils_1.renameFormFields)(node, (p) => this.renameNodeInParameterValue(p, currentName, newName, {
                    hasRenamableContent: true,
                }));
            }
        }
        // Change all source connections
        if (this.connectionsBySourceNode.hasOwnProperty(currentName)) {
            this.connectionsBySourceNode[newName] = this.connectionsBySourceNode[currentName];
            delete this.connectionsBySourceNode[currentName];
        }
        // Change all destination connections
        let sourceNode;
        let type;
        let sourceIndex;
        let connectionIndex;
        let connectionData;
        for (sourceNode of Object.keys(this.connectionsBySourceNode)) {
            for (type of Object.keys(this.connectionsBySourceNode[sourceNode])) {
                for (sourceIndex of Object.keys(this.connectionsBySourceNode[sourceNode][type])) {
                    for (connectionIndex of Object.keys(this.connectionsBySourceNode[sourceNode][type][parseInt(sourceIndex, 10)] || [])) {
                        connectionData =
                            this.connectionsBySourceNode[sourceNode][type][parseInt(sourceIndex, 10)]?.[parseInt(connectionIndex, 10)];
                        if (connectionData?.node === currentName) {
                            connectionData.node = newName;
                        }
                    }
                }
            }
        }
    }
    /**
     * Finds the highest parent nodes of the node with the given name
     *
     * @param {NodeConnectionType} [type='main']
     */
    getHighestNode(nodeName, nodeConnectionIndex, checkedNodes) {
        const currentHighest = [];
        if (!(nodeName in this.nodes)) {
            // Node is not in the workflow
            return currentHighest;
        }
        if (this.nodes[nodeName].disabled === false) {
            // If the current node is not disabled itself is the highest
            currentHighest.push(nodeName);
        }
        if (!this.connectionsByDestinationNode.hasOwnProperty(nodeName)) {
            // Node does not have incoming connections
            return currentHighest;
        }
        if (!this.connectionsByDestinationNode[nodeName].hasOwnProperty(interfaces_1.NodeConnectionTypes.Main)) {
            // Node does not have incoming connections of given type
            return currentHighest;
        }
        checkedNodes = checkedNodes || [];
        if (checkedNodes.includes(nodeName)) {
            // Node got checked already before
            return currentHighest;
        }
        checkedNodes.push(nodeName);
        const returnNodes = [];
        let addNodes;
        let connectionsByIndex;
        for (let connectionIndex = 0; connectionIndex <
            this.connectionsByDestinationNode[nodeName][interfaces_1.NodeConnectionTypes.Main].length; connectionIndex++) {
            if (nodeConnectionIndex !== undefined && nodeConnectionIndex !== connectionIndex) {
                // If a connection-index is given ignore all other ones
                continue;
            }
            connectionsByIndex =
                this.connectionsByDestinationNode[nodeName][interfaces_1.NodeConnectionTypes.Main][connectionIndex];
            connectionsByIndex?.forEach((connection) => {
                if (checkedNodes.includes(connection.node)) {
                    // Node got checked already before
                    return;
                }
                // Ignore connections for nodes that don't exist in this workflow
                if (!(connection.node in this.nodes))
                    return;
                addNodes = this.getHighestNode(connection.node, undefined, checkedNodes);
                if (addNodes.length === 0) {
                    // The checked node does not have any further parents so add it
                    // if it is not disabled
                    if (this.nodes[connection.node].disabled !== true) {
                        addNodes = [connection.node];
                    }
                }
                addNodes.forEach((name) => {
                    // Only add if node is not on the list already anyway
                    if (returnNodes.indexOf(name) === -1) {
                        returnNodes.push(name);
                    }
                });
            });
        }
        return returnNodes;
    }
    /**
     * Returns all the after the given one
     *
     * @param {string} [type='main']
     * @param {*} [depth=-1]
     */
    getChildNodes(nodeName, type = interfaces_1.NodeConnectionTypes.Main, depth = -1) {
        return (0, common_1.getChildNodes)(this.connectionsBySourceNode, nodeName, type, depth);
    }
    /**
     * Returns all the nodes before the given one
     *
     * @param {NodeConnectionType} [type='main']
     * @param {*} [depth=-1]
     */
    getParentNodes(nodeName, type = interfaces_1.NodeConnectionTypes.Main, depth = -1) {
        return (0, common_1.getParentNodes)(this.connectionsByDestinationNode, nodeName, type, depth);
    }
    /**
     * Gets all the nodes which are connected nodes starting from
     * the given one
     *
     * @param {NodeConnectionType} [type='main']
     * @param {*} [depth=-1]
     */
    getConnectedNodes(connections, nodeName, connectionType = interfaces_1.NodeConnectionTypes.Main, depth = -1) {
        return (0, common_1.getConnectedNodes)(connections, nodeName, connectionType, depth);
    }
    /**
     * Returns all the nodes before the given one
     *
     * @param {*} [maxDepth=-1]
     */
    getParentNodesByDepth(nodeName, maxDepth = -1) {
        return this.searchNodesBFS(this.connectionsByDestinationNode, nodeName, maxDepth);
    }
    /**
     * Gets all the nodes which are connected nodes starting from
     * the given one
     * Uses BFS traversal
     *
     * @param {*} [maxDepth=-1]
     */
    searchNodesBFS(connections, sourceNode, maxDepth = -1) {
        const returnConns = [];
        const type = interfaces_1.NodeConnectionTypes.Main;
        let queue = [];
        queue.push({
            name: sourceNode,
            depth: 0,
            indicies: [],
        });
        const visited = {};
        let depth = 0;
        while (queue.length > 0) {
            if (maxDepth !== -1 && depth > maxDepth) {
                break;
            }
            depth++;
            const toAdd = [...queue];
            queue = [];
            toAdd.forEach((curr) => {
                if (visited[curr.name]) {
                    visited[curr.name].indicies = (0, utils_1.dedupe)(visited[curr.name].indicies.concat(curr.indicies));
                    return;
                }
                visited[curr.name] = curr;
                if (curr.name !== sourceNode) {
                    returnConns.push(curr);
                }
                if (!connections.hasOwnProperty(curr.name) ||
                    !connections[curr.name].hasOwnProperty(type)) {
                    return;
                }
                connections[curr.name][type].forEach((connectionsByIndex) => {
                    connectionsByIndex?.forEach((connection) => {
                        queue.push({
                            name: connection.node,
                            indicies: [connection.index],
                            depth,
                        });
                    });
                });
            });
        }
        return returnConns;
    }
    getParentMainInputNode(node) {
        if (node) {
            const nodeType = this.nodeTypes.getByNameAndVersion(node.type, node.typeVersion);
            if (!nodeType?.description.outputs) {
                return node;
            }
            const outputs = NodeHelpers.getNodeOutputs(this, node, nodeType.description);
            const nonMainConnectionTypes = [];
            for (const output of outputs) {
                const type = typeof output === 'string' ? output : output.type;
                if (type !== interfaces_1.NodeConnectionTypes.Main) {
                    nonMainConnectionTypes.push(type);
                }
            }
            // Sort for deterministic behavior: prevents non-deterministic selection when multiple
            // non-main outputs exist (AI agents with multiple tools). Object.keys() ordering
            // can vary across runs, causing inconsistent first-choice selection.
            nonMainConnectionTypes.sort();
            if (nonMainConnectionTypes.length > 0) {
                const nonMainNodesConnected = [];
                const nodeConnections = this.connectionsBySourceNode[node.name];
                for (const type of nonMainConnectionTypes) {
                    // Only include connection types that exist in actual execution data
                    if (nodeConnections?.[type]) {
                        const childNodes = this.getChildNodes(node.name, type);
                        if (childNodes.length > 0) {
                            nonMainNodesConnected.push(...childNodes);
                        }
                    }
                }
                if (nonMainNodesConnected.length) {
                    // Sort for deterministic behavior, then get first node
                    nonMainNodesConnected.sort();
                    const returnNode = this.getNode(nonMainNodesConnected[0]);
                    if (!returnNode) {
                        throw new errors_1.UnexpectedError(`Node "${nonMainNodesConnected[0]}" not found`);
                    }
                    return this.getParentMainInputNode(returnNode);
                }
            }
        }
        return node;
    }
    /**
     * Returns via which output of the parent-node and index the current node
     * they are connected
     *
     * @param {string} nodeName The node to check how it is connected with parent node
     * @param {string} parentNodeName The parent node to get the output index of
     * @param {string} [type='main']
     */
    getNodeConnectionIndexes(nodeName, parentNodeName, type = interfaces_1.NodeConnectionTypes.Main) {
        // This method has been optimized for performance. If you make any changes to it,
        // make sure the performance is not degraded.
        const parentNode = this.getNode(parentNodeName);
        if (parentNode === null) {
            return undefined;
        }
        const visitedNodes = new Set();
        const queue = [nodeName];
        // Cache the connections by destination node to avoid reference lookups
        const connectionsByDest = this.connectionsByDestinationNode;
        while (queue.length > 0) {
            const currentNodeName = queue.shift();
            if (visitedNodes.has(currentNodeName)) {
                continue;
            }
            visitedNodes.add(currentNodeName);
            const typeConnections = connectionsByDest[currentNodeName]?.[type];
            if (!typeConnections) {
                continue;
            }
            for (let typedConnectionIdx = 0; typedConnectionIdx < typeConnections.length; typedConnectionIdx++) {
                const connectionsByIndex = typeConnections[typedConnectionIdx];
                if (!connectionsByIndex) {
                    continue;
                }
                for (let destinationIndex = 0; destinationIndex < connectionsByIndex.length; destinationIndex++) {
                    const connection = connectionsByIndex[destinationIndex];
                    if (parentNodeName === connection.node) {
                        return {
                            sourceIndex: connection.index,
                            destinationIndex,
                        };
                    }
                    if (!visitedNodes.has(connection.node)) {
                        queue.push(connection.node);
                    }
                }
            }
        }
        return undefined;
    }
    /**
     * Returns from which of the given nodes the workflow should get started from
     *
     * @param {string[]} nodeNames The potential start nodes
     */
    __getStartNode(nodeNames) {
        // Check if there are any trigger or poll nodes and then return the first one
        let node;
        let nodeType;
        if (nodeNames.length === 1) {
            node = this.nodes[nodeNames[0]];
            if (node && !node.disabled) {
                return node;
            }
        }
        for (const nodeName of nodeNames) {
            node = this.nodes[nodeName];
            nodeType = this.nodeTypes.getByNameAndVersion(node.type, node.typeVersion);
            // TODO: Identify later differently
            if (nodeType.description.name === constants_1.MANUAL_CHAT_TRIGGER_LANGCHAIN_NODE_TYPE) {
                continue;
            }
            if (nodeType && (nodeType.trigger !== undefined || nodeType.poll !== undefined)) {
                if (node.disabled === true) {
                    continue;
                }
                return node;
            }
        }
        const sortedNodeNames = Object.values(this.nodes)
            .sort((a, b) => constants_1.STARTING_NODE_TYPES.indexOf(a.type) - constants_1.STARTING_NODE_TYPES.indexOf(b.type))
            .map((n) => n.name);
        for (const nodeName of sortedNodeNames) {
            node = this.nodes[nodeName];
            if (constants_1.STARTING_NODE_TYPES.includes(node.type)) {
                if (node.disabled === true) {
                    continue;
                }
                return node;
            }
        }
        return undefined;
    }
    /**
     * Returns the start node to start the workflow from
     *
     */
    getStartNode(destinationNode) {
        if (destinationNode) {
            // Find the highest parent nodes of the given one
            const nodeNames = this.getHighestNode(destinationNode);
            if (nodeNames.length === 0) {
                // If no parent nodes have been found then only the destination-node
                // is in the tree so add that one
                nodeNames.push(destinationNode);
            }
            // Check which node to return as start node
            const node = this.__getStartNode(nodeNames);
            if (node !== undefined) {
                return node;
            }
            // If none of the above did find anything simply return the
            // first parent node in the list
            return this.nodes[nodeNames[0]];
        }
        return this.__getStartNode(Object.keys(this.nodes));
    }
    getConnectionsBetweenNodes(sources, targets) {
        const result = [];
        for (const source of sources) {
            for (const type of Object.keys(this.connectionsBySourceNode[source] ?? {})) {
                for (const sourceIndex of Object.keys(this.connectionsBySourceNode[source][type])) {
                    for (const connectionIndex of Object.keys(this.connectionsBySourceNode[source][type][parseInt(sourceIndex, 10)] ?? [])) {
                        const targetConnectionData = this.connectionsBySourceNode[source][type][parseInt(sourceIndex, 10)]?.[parseInt(connectionIndex, 10)];
                        if (targetConnectionData && targets.includes(targetConnectionData?.node)) {
                            result.push([
                                {
                                    node: source,
                                    index: parseInt(sourceIndex, 10),
                                    type: type,
                                },
                                targetConnectionData,
                            ]);
                        }
                    }
                }
            }
        }
        return result;
    }
}
exports.Workflow = Workflow;
//# sourceMappingURL=workflow.js.map