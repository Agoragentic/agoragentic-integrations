export class VersionedNodeType {
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
//# sourceMappingURL=versioned-node-type.js.map