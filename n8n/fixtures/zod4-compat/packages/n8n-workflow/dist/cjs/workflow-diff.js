"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SKIP_RULES = exports.RULES = exports.WorkflowChangeSet = void 0;
exports.compareNodes = compareNodes;
exports.compareWorkflowsNodes = compareWorkflowsNodes;
exports.stringContainsParts = stringContainsParts;
exports.parametersAreSuperset = parametersAreSuperset;
exports.determineNodeSize = determineNodeSize;
exports.groupWorkflows = groupWorkflows;
exports.hasNonPositionalChanges = hasNonPositionalChanges;
exports.hasCredentialChanges = hasCredentialChanges;
const isEqual_1 = __importDefault(require("lodash/isEqual.js"));
const pick_1 = __importDefault(require("lodash/pick.js"));
const connections_diff_1 = require("./connections-diff.js");
function compareNodes(base, target) {
    const propsToCompare = ['name', 'type', 'typeVersion', 'webhookId', 'credentials', 'parameters'];
    const baseNode = (0, pick_1.default)(base, propsToCompare);
    const targetNode = (0, pick_1.default)(target, propsToCompare);
    return (0, isEqual_1.default)(baseNode, targetNode);
}
function compareWorkflowsNodes(base, target, nodesEqual = compareNodes) {
    const baseNodes = base.reduce((acc, node) => {
        acc.set(node.id, node);
        return acc;
    }, new Map());
    const targetNodes = target.reduce((acc, node) => {
        acc.set(node.id, node);
        return acc;
    }, new Map());
    const diff = new Map();
    for (const [id, node] of baseNodes.entries()) {
        if (!targetNodes.has(id)) {
            diff.set(id, { status: "deleted" /* NodeDiffStatus.Deleted */, node });
        }
        else if (!nodesEqual(baseNodes.get(id), targetNodes.get(id))) {
            diff.set(id, { status: "modified" /* NodeDiffStatus.Modified */, node });
        }
        else {
            diff.set(id, { status: "equal" /* NodeDiffStatus.Eq */, node });
        }
    }
    for (const [id, node] of targetNodes.entries()) {
        if (!baseNodes.has(id)) {
            diff.set(id, { status: "added" /* NodeDiffStatus.Added */, node });
        }
    }
    return diff;
}
class WorkflowChangeSet {
    nodes;
    connections;
    constructor(from, to) {
        if (from === to) {
            // avoid expensive deep comparison
            this.nodes = new Map(from.nodes.map((node) => [node.id, { node, status: "equal" /* NodeDiffStatus.Eq */ }]));
            this.connections = { added: {}, removed: {} };
        }
        else {
            this.nodes = compareWorkflowsNodes(from.nodes, to.nodes);
            this.connections = (0, connections_diff_1.compareConnections)(from.connections, to.connections);
        }
    }
}
exports.WorkflowChangeSet = WorkflowChangeSet;
/**
 * Returns true if `s` contains all characters of `substr` in order
 * e.g. s='abcde'
 * substr:
 *  'abde' -> true
 *  'abcd' -> false
 *  'abced' -> false
 */
function stringContainsParts(s, substr) {
    if (substr.length > s.length)
        return false;
    const diffSize = s.length - substr.length;
    let marker = 0;
    for (let i = 0; i < s.length; ++i) {
        if (substr[marker] === s[i])
            marker++;
        if (i - marker > diffSize)
            return false;
    }
    return marker >= substr.length;
}
function parametersAreSuperset(prev, next) {
    if (typeof prev !== typeof next)
        return false;
    if (typeof prev !== 'object' || !prev || !next) {
        if (typeof prev === 'string') {
            // We assert above that these are the same type
            return stringContainsParts(next, prev);
        }
        return prev === next;
    }
    if (Array.isArray(prev)) {
        if (!Array.isArray(next))
            return false;
        if (prev.length !== next.length)
            return false;
        return prev.every((v, i) => parametersAreSuperset(v, next[i]));
    }
    const params = Object.keys(prev);
    if (params.length !== Object.keys(next).length)
        return false;
    // abort if keys differ
    if (params.some((x) => !Object.prototype.hasOwnProperty.call(next, x)))
        return false;
    return params.every((key) => parametersAreSuperset(prev[key], next[key]));
}
/**
 * Determines whether the second node is a "superset" of the first one, i.e. whether no data
 * is lost if we were to replace `prev` with `next`.
 *
 * Specifically this is the case if
 * - Both nodes have the exact same keys
 * - All values are either strings where `next.x` contains `prev.x`, or hold the exact same value
 */
function nodeIsSuperset(prevNode, nextNode) {
    const { parameters: prevParams, ...prev } = prevNode;
    const { parameters: nextParams, ...next } = nextNode;
    // abort if the nodes don't match besides parameters
    if (!compareNodes({ ...prev, parameters: {} }, { ...next, parameters: {} }))
        return false;
    return parametersAreSuperset(prevParams, nextParams);
}
/**
 * Group changes are additive if they only add groups or group members,
 * i.e. no existing group, group name or group member may be removed.
 */
function nodeGroupChangesAreAdditive(prev, next) {
    const nextGroupsById = new Map((next.nodeGroups ?? []).map((group) => [group.id, group]));
    for (const prevGroup of prev.nodeGroups ?? []) {
        const nextGroup = nextGroupsById.get(prevGroup.id);
        if (!nextGroup || nextGroup.name !== prevGroup.name) {
            return false;
        }
        const nextNodeIds = new Set(nextGroup.nodeIds);
        if (!prevGroup.nodeIds.every((id) => nextNodeIds.has(id))) {
            return false;
        }
    }
    return true;
}
function mergeAdditiveChanges(prev, next, diff) {
    for (const d of diff.nodes.values()) {
        if (d.status === "deleted" /* NodeDiffStatus.Deleted */)
            return false;
        if (d.status === "added" /* NodeDiffStatus.Added */)
            continue;
        const nextNode = next.nodes.find((x) => x.id === d.node.id);
        if (!nextNode)
            throw new Error('invariant broken - no next node');
        if (d.status === "modified" /* NodeDiffStatus.Modified */ && !nodeIsSuperset(d.node, nextNode))
            return false;
    }
    if (Object.keys(diff.connections.removed).length > 0)
        return false;
    if (!nodeGroupChangesAreAdditive(prev, next))
        return false;
    return true;
}
// We want to avoid merging versions from different editing "sessions"
//
const makeSkipTimeDifference = (timeDiffMs) => {
    return (prev, next) => {
        const timeDifference = next.createdAt.getTime() - prev.createdAt.getTime();
        return Math.abs(timeDifference) > timeDiffMs;
    };
};
const makeMergeShortTimeSpan = (timeDiffMs) => {
    return (prev, next) => {
        const timeDifference = next.createdAt.getTime() - prev.createdAt.getTime();
        return Math.abs(timeDifference) < timeDiffMs;
    };
};
// Takes a mapping from minimumSize to the minimum time between versions and
// applies the largest one applicable to the given workflow
function makeMergeDependingOnSizeRule(mapping) {
    const pairs = [...mapping.entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([count, time]) => [count, makeMergeShortTimeSpan(time)]);
    return (prev, next, _wcs, metaData) => {
        if (metaData.workflowSizeScore === undefined) {
            console.warn('Called mergeDependingOnSizeRule rule without providing required metaData');
            return false;
        }
        for (const [count, time] of pairs) {
            if (metaData.workflowSizeScore > count)
                return time(prev, next);
        }
        return false;
    };
}
function skipDifferentUsers(prev, next) {
    return next.authors !== prev.authors;
}
exports.RULES = {
    mergeAdditiveChanges,
    makeMergeDependingOnSizeRule,
};
exports.SKIP_RULES = {
    makeSkipTimeDifference,
    skipDifferentUsers,
};
// Rough estimation of a node's size in abstract "character" count
// Does not care about key names which do technically factor in when stringified
function determineNodeSize(parameters) {
    if (!parameters)
        return 1;
    if (typeof parameters === 'string') {
        return parameters.length;
    }
    else if (typeof parameters !== 'object' || parameters instanceof Date) {
        return 1;
    }
    else if (Array.isArray(parameters)) {
        return parameters.reduce((acc, v) => acc + determineNodeSize(v), 1);
    }
    else {
        // Record case
        return Object.values(parameters).reduce((acc, v) => acc + determineNodeSize(v), 1);
    }
}
function determineNodeParametersSize(workflow) {
    return workflow.nodes.reduce((acc, x) => acc + determineNodeSize(x.parameters), 0);
}
function groupWorkflows(workflows, rules, skipRules = [], metaDataFields) {
    if (workflows.length === 0)
        return { removed: [], remaining: [] };
    if (workflows.length === 1) {
        return {
            removed: [],
            remaining: workflows,
        };
    }
    const remaining = [...workflows];
    const removed = [];
    const n = remaining.length;
    const metaData = {
        // check latest and an "average" workflow to get a somewhat accurate representation
        // without counting through the entire history
        workflowSizeScore: metaDataFields?.workflowSizeScore
            ? Math.max(determineNodeParametersSize(workflows[Math.floor(workflows.length / 2)]), determineNodeParametersSize(workflows[workflows.length - 1]))
            : undefined,
    };
    diffLoop: for (let i = n - 1; i > 0; --i) {
        const wcs = new WorkflowChangeSet(remaining[i - 1], remaining[i]);
        for (const shouldSkip of skipRules) {
            if (shouldSkip(remaining[i - 1], remaining[i], wcs, metaData))
                continue diffLoop;
        }
        for (const rule of rules) {
            const shouldMerge = rule(remaining[i - 1], remaining[i], wcs, metaData);
            if (shouldMerge) {
                const left = remaining.splice(i - 1, 1)[0];
                removed.push(left);
                break;
            }
        }
    }
    return { removed, remaining };
}
/**
 * Checks if workflows have non-positional differences (changes to nodes or connections,
 * excluding position changes).
 * Returns true if there are meaningful changes, false if only positions changed.
 */
function hasNonPositionalChanges(oldNodes, newNodes, oldConnections, newConnections) {
    // Check for node changes (compareNodes already excludes position)
    const nodesDiff = compareWorkflowsNodes(oldNodes, newNodes);
    for (const diff of nodesDiff.values()) {
        if (diff.status !== "equal" /* NodeDiffStatus.Eq */) {
            return true;
        }
    }
    // Check for connection changes (connections don't have position data)
    if (!(0, isEqual_1.default)(oldConnections, newConnections)) {
        return true;
    }
    return false;
}
/**
 * Checks if any credential IDs changed between old and new workflow nodes.
 * Compares node by node - returns true if for any node:
 * - A credential was added (new credential type not in old node)
 * - A credential was removed (old credential type not in new node)
 * - A credential was changed (same credential type but different credential ID)
 */
function hasCredentialChanges(oldNodes, newNodes) {
    const newNodesMap = new Map(newNodes.map((node) => [node.id, node]));
    for (const oldNode of oldNodes) {
        const newNode = newNodesMap.get(oldNode.id);
        // Skip nodes that were deleted - deletion is not a credential change
        if (!newNode)
            continue;
        const oldCreds = oldNode.credentials ?? {};
        const newCreds = newNode.credentials ?? {};
        const oldCredTypes = Object.keys(oldCreds);
        const newCredTypes = Object.keys(newCreds);
        // Check for removed credentials (in old but not in new)
        for (const credType of oldCredTypes) {
            if (!(credType in newCreds)) {
                return true; // Credential removed
            }
            // Check for changed credentials (same type but different ID)
            if (oldCreds[credType]?.id !== newCreds[credType]?.id) {
                return true; // Credential changed
            }
        }
        // Check for added credentials (in new but not in old)
        for (const credType of newCredTypes) {
            if (!(credType in oldCreds)) {
                return true; // Credential added
            }
        }
    }
    return false;
}
//# sourceMappingURL=workflow-diff.js.map