import type { INodeTypeBaseDescription, IVersionedNodeType, INodeType } from "./interfaces.js";
export declare class VersionedNodeType implements IVersionedNodeType {
    currentVersion: number;
    nodeVersions: IVersionedNodeType['nodeVersions'];
    description: INodeTypeBaseDescription;
    constructor(nodeVersions: IVersionedNodeType['nodeVersions'], description: INodeTypeBaseDescription);
    getLatestVersion(): number;
    getNodeType(version?: number): INodeType;
}
//# sourceMappingURL=versioned-node-type.d.ts.map