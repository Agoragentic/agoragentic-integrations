import type { IConnections, NodeConnectionType } from "../interfaces.js";
/**
 * Returns all the nodes before the given one
 *
 * @param {NodeConnectionType} [type='main']
 * @param {*} [depth=-1]
 */
export declare function getParentNodes(connectionsByDestinationNode: IConnections, nodeName: string, type?: NodeConnectionType | 'ALL' | 'ALL_NON_MAIN', depth?: number): string[];
//# sourceMappingURL=get-parent-nodes.d.ts.map