"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionedNodeType = void 0;
class VersionedNodeType {
    currentVersion;
    nodeVersions;
    description;
    constructor(nodeVersions, description) {
        this.nodeVersions = nodeVersions;
        this.currentVersion = description.defaultVersion ?? this.getLatestVersion();
        this.description = description;
    }
    getLatestVersion() {
        return Math.max(...Object.keys(this.nodeVersions).map(Number));
    }
    getNodeType(version) {
        if (version) {
            return this.nodeVersions[version];
        }
        else {
            return this.nodeVersions[this.currentVersion];
        }
    }
}
exports.VersionedNodeType = VersionedNodeType;
//# sourceMappingURL=versioned-node-type.js.map