"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChildNodes = getChildNodes;
const get_connected_nodes_1 = require("./get-connected-nodes.js");
const interfaces_1 = require("../interfaces.js");
function getChildNodes(connectionsBySourceNode, nodeName, type = interfaces_1.NodeConnectionTypes.Main, depth = -1) {
    return (0, get_connected_nodes_1.getConnectedNodes)(connectionsBySourceNode, nodeName, type, depth);
}
//# sourceMappingURL=get-child-nodes.js.map