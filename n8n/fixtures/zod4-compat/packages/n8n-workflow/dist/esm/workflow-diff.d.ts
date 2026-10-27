import type { IConnections, INode, INodeParameters, IWorkflowBase, IWorkflowGroup, NodeParameterValueType } from "./index.js";
import { type ConnectionsDiff } from "./connections-diff.js";
export type WorkflowDiffBase = Omit<IWorkflowBase, 'id' | 'active' | 'activeVersionId' | 'isArchived' | 'name'> & {
    name: string | null;
};
export type DiffableNode = Pick<INode, 'id' | 'parameters' | 'name'>;
export type DiffableWorkflow<N extends DiffableNode = DiffableNode> = {
    nodes: N[];
    connections: IConnections;
    createdAt: Date;
    authors?: string;
    nodeGroups?: IWorkflowGroup[];
};
export declare const enum NodeDiffStatus {
    Eq = "equal",
    Modified = "modified",
    Added = "added",
    Deleted = "deleted"
}
export type NodeDiff<T> = {
    status: NodeDiffStatus;
    node: T;
};
export type WorkflowDiff<T> = Map<INode['id'], NodeDiff<T>>;
export declare function compareNodes<T extends DiffableNode>(base: T | undefined, target: T | undefined): boolean;
export declare function compareWorkflowsNodes<T extends DiffableNode>(base: T[], target: T[], nodesEqual?: (base: T | undefined, target: T | undefined) => boolean): WorkflowDiff<T>;
export declare class WorkflowChangeSet<T extends DiffableNode> {
    readonly nodes: WorkflowDiff<T>;
    readonly connections: ConnectionsDiff;
    constructor(from: DiffableWorkflow<T>, to: DiffableWorkflow<T>);
}
/**
 * Returns true if `s` contains all characters of `substr` in order
 * e.g. s='abcde'
 * substr:
 *  'abde' -> true
 *  'abcd' -> false
 *  'abced' -> false
 */
export declare function stringContainsParts(s: string, substr: string): boolean;
export declare function parametersAreSuperset(prev: unknown, next: unknown): boolean;
declare function mergeAdditiveChanges<N extends DiffableNode = DiffableNode>(prev: DiffableWorkflow<N>, next: DiffableWorkflow<N>, diff: WorkflowChangeSet<N>): boolean;
declare function makeMergeDependingOnSizeRule<W extends DiffableWorkflow>(mapping: Map<number, number>): <N extends DiffableNode = DiffableNode>(prev: DiffableWorkflow<N>, next: DiffableWorkflow<N>, _wcs: WorkflowChangeSet<N>, metaData: DiffMetaData) => boolean;
declare function skipDifferentUsers<N extends DiffableNode = DiffableNode>(prev: DiffableWorkflow<N>, next: DiffableWorkflow<N>): boolean;
export declare const RULES: {
    mergeAdditiveChanges: typeof mergeAdditiveChanges;
    makeMergeDependingOnSizeRule: typeof makeMergeDependingOnSizeRule;
};
export declare const SKIP_RULES: {
    makeSkipTimeDifference: (timeDiffMs: number) => <N extends DiffableNode = DiffableNode>(prev: DiffableWorkflow<N>, next: DiffableWorkflow<N>) => boolean;
    skipDifferentUsers: typeof skipDifferentUsers;
};
export type DiffMetaData = Partial<{
    workflowSizeScore: number;
}>;
export type DiffRule<W extends WorkflowDiffBase = WorkflowDiffBase, N extends W['nodes'][number] = W['nodes'][number]> = (prev: W, next: W, diff: WorkflowChangeSet<N>, metaData: Partial<DiffMetaData>) => boolean;
export declare function determineNodeSize(parameters: INodeParameters | NodeParameterValueType): number;
export declare function groupWorkflows<W extends WorkflowDiffBase = WorkflowDiffBase>(workflows: W[], rules: Array<DiffRule<W>>, skipRules?: Array<DiffRule<W>>, metaDataFields?: Partial<Record<keyof DiffMetaData, boolean>>): {
    removed: W[];
    remaining: W[];
};
/**
 * Checks if workflows have non-positional differences (changes to nodes or connections,
 * excluding position changes).
 * Returns true if there are meaningful changes, false if only positions changed.
 */
export declare function hasNonPositionalChanges(oldNodes: INode[], newNodes: INode[], oldConnections: IConnections, newConnections: IConnections): boolean;
/**
 * Checks if any credential IDs changed between old and new workflow nodes.
 * Compares node by node - returns true if for any node:
 * - A credential was added (new credential type not in old node)
 * - A credential was removed (old credential type not in new node)
 * - A credential was changed (same credential type but different credential ID)
 */
export declare function hasCredentialChanges(oldNodes: INode[], newNodes: INode[]): boolean;
export {};
//# sourceMappingURL=workflow-diff.d.ts.map