import { getConnectedNodes } from "./get-connected-nodes.js";
import { NodeConnectionTypes } from "../interfaces.js";
/**
 * Returns all the nodes before the given one
 *
 * @param {NodeConnectionType} [type='main']
 * @param {*} [depth=-1]
 */
export function getParentNodes(connectionsByDestinationNode, nodeName, type = NodeConnectionTypes.Main, depth = -1) {
    return getConnectedNodes(connectionsByDestinationNode, nodeName, type, depth);
}
//# sourceMappingURL=get-parent-nodes.js.map