import { getConnectedNodes } from "./get-connected-nodes.js";
import { NodeConnectionTypes } from "../interfaces.js";
export function getChildNodes(connectionsBySourceNode, nodeName, type = NodeConnectionTypes.Main, depth = -1) {
    return getConnectedNodes(connectionsBySourceNode, nodeName, type, depth);
}
//# sourceMappingURL=get-child-nodes.js.map