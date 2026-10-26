import type { IConnections, INode, IPinData, IWorkflowGroup, IWorkflowSettings } from "./interfaces.js";
/**
 * Data structure containing workflow fields used for checksum calculation.
 * Excludes id, versionId, active, timestamps, etc.
 */
export interface WorkflowSnapshot {
    name?: string;
    description?: string | null;
    nodes?: INode[];
    connections?: IConnections;
    settings?: IWorkflowSettings;
    meta?: unknown;
    pinData?: IPinData;
    isArchived?: boolean;
    activeVersionId?: string | null;
    nodeGroups?: IWorkflowGroup[];
}
export declare const WORKFLOW_CHECKSUM_FIELDS: readonly ["name", "description", "nodes", "connections", "settings", "meta", "pinData", "isArchived", "activeVersionId", "nodeGroups"];
/**
 * Calculates SHA-256 checksum of workflow content fields for conflict detection.
 * Excludes: id, versionId, timestamps, staticData, relations.
 *
 * Uses WebCrypto when available (e.g. browser in secure context), and falls back to a pure-JS SHA-256
 * implementation to also work in environments where WebCrypto is unavailable (e.g. HTTP/insecure contexts).
 */
export declare function calculateWorkflowChecksum(workflow: WorkflowSnapshot): Promise<string>;
//# sourceMappingURL=workflow-checksum.d.ts.map