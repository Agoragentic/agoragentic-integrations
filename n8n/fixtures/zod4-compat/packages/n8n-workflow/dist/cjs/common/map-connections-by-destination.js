"use strict";
/* eslint-disable @typescript-eslint/no-for-in-array */
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapConnectionsByDestination = mapConnectionsByDestination;
function mapConnectionsByDestination(connections) {
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
                    if (!Object.prototype.hasOwnProperty.call(returnConnection, connectionInfo.node)) {
                        Object.defineProperty(returnConnection, connectionInfo.node, { value: {}, enumerable: true, configurable: true, writable: true });
                    }
                    if (!Object.prototype.hasOwnProperty.call(returnConnection[connectionInfo.node], connectionInfo.type)) {
                        Object.defineProperty(returnConnection[connectionInfo.node], connectionInfo.type, { value: [], enumerable: true, configurable: true, writable: true });
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
//# sourceMappingURL=map-connections-by-destination.js.map