import type { IConnections, NodeConnectionType } from "../interfaces.js";
/**
 * Returns the names of all nodes reachable from `nodeName` by following the
 * given connection type, excluding `nodeName` itself. Each node appears once,
 * ordered deepest-descendant first. Cycles are safe — a node is never listed as
 * its own descendant.
 *
 * @param {NodeConnectionType} [connectionType='main'] a specific type, or 'ALL' / 'ALL_NON_MAIN'
 * @param {number} [depth=-1] how many hops to follow; -1 for unlimited
 */
export declare function getConnectedNodes(connections: IConnections, nodeName: string, connectionType?: NodeConnectionType | 'ALL' | 'ALL_NON_MAIN', depth?: number): string[];
//# sourceMappingURL=get-connected-nodes.d.ts.map