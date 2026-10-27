"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParentNodes = getParentNodes;
const get_connected_nodes_1 = require("./get-connected-nodes.js");
const interfaces_1 = require("../interfaces.js");
/**
 * Returns all the nodes before the given one
 *
 * @param {NodeConnectionType} [type='main']
 * @param {*} [depth=-1]
 */
function getParentNodes(connectionsByDestinationNode, nodeName, type = interfaces_1.NodeConnectionTypes.Main, depth = -1) {
    return (0, get_connected_nodes_1.getConnectedNodes)(connectionsByDestinationNode, nodeName, type, depth);
}
//# sourceMappingURL=get-parent-nodes.js.map