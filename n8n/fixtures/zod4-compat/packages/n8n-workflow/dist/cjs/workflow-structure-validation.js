"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowStructureValidationError = exports.formatWorkflowStructureIssuePath = void 0;
exports.safeParseWorkflowStructure = safeParseWorkflowStructure;
exports.parseWorkflowStructure = parseWorkflowStructure;
const zod_1 = require("zod");
/**
 * Workflow Structure Validation
 *
 * Single source of truth for validating workflow **structure** — the minimum
 * shape that the editor and runtime assume is always present and correctly
 * formed. Intentionally separate from activation/publish validation
 * (WorkflowValidationService) which checks semantic correctness (trigger
 * presence, known node types, credential issues, etc.).
 *
 * Lives in n8n-workflow so it can be shared by:
 *   - Backend: create/update/import reject malformed payloads (400)
 *   - Frontend: open path warns but still renders; import path blocks
 *
 * Validates:
 *   - Required node fields (name, type, position)
 *   - Position is a 2-number tuple
 *   - Connection entries have valid node/type/index
 *   - No duplicate node names
 *   - Connection source/target keys reference existing nodes
 *
 * Does NOT validate:
 *   - Whether a node type is installed
 *   - Node parameter correctness
 *   - Credential validity
 *   - Activation readiness
 *
 */
const workflowNodeStructureSchema = zod_1.z
    .object({
    name: zod_1.z.string().min(1),
    type: zod_1.z.string().min(1),
    position: zod_1.z.tuple([zod_1.z.number(), zod_1.z.number()]),
    parameters: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
    id: zod_1.z.string().optional(),
    typeVersion: zod_1.z.number().optional(),
    disabled: zod_1.z.boolean().optional(),
})
    .passthrough();
const connectionEntrySchema = zod_1.z
    .object({
    node: zod_1.z.string().min(1),
    type: zod_1.z.string().min(1),
    index: zod_1.z.number().int().min(0),
})
    .passthrough();
// Buckets can be null when a multi-output node has unused output slots.
// Matches NodeInputConnections type.
const connectionBucketSchema = zod_1.z.array(connectionEntrySchema).nullable().optional();
const workflowConnectionsStructureSchema = zod_1.z.record(zod_1.z.string(), zod_1.z.record(zod_1.z.string(), zod_1.z.array(connectionBucketSchema)));
const workflowStructureSchema = zod_1.z.object({
    nodes: zod_1.z.array(workflowNodeStructureSchema),
    connections: workflowConnectionsStructureSchema,
});
const formatWorkflowStructureIssuePath = (path) => {
    if (path.length === 0)
        return 'workflow';
    return path.reduce((acc, segment) => {
        if (typeof segment === 'number')
            return `${acc}[${segment}]`;
        const label = String(segment);
        return acc ? `${acc}.${label}` : label;
    }, '');
};
exports.formatWorkflowStructureIssuePath = formatWorkflowStructureIssuePath;
const formatIssuesDescription = (issues) => issues
    .map(({ path, message }) => `${(0, exports.formatWorkflowStructureIssuePath)(path)}: ${message}`)
    .join('\n');
class WorkflowStructureValidationError extends Error {
    issues;
    name = 'WorkflowStructureValidationError';
    description;
    constructor(issues) {
        super('Invalid workflow structure');
        this.issues = issues;
        this.description = formatIssuesDescription(issues);
    }
}
exports.WorkflowStructureValidationError = WorkflowStructureValidationError;
function safeParseWorkflowStructure(input) {
    const parsed = workflowStructureSchema.safeParse(input);
    if (!parsed.success) {
        return {
            success: false,
            issues: parsed.error.issues,
        };
    }
    const { nodes, connections } = parsed.data;
    const issues = [];
    const nodeNames = new Set();
    for (const [index, node] of nodes.entries()) {
        if (nodeNames.has(node.name)) {
            issues.push({
                path: ['nodes', index, 'name'],
                message: `Duplicate node name "${node.name}"`,
                code: 'duplicate_node_name',
            });
            continue;
        }
        nodeNames.add(node.name);
    }
    for (const sourceNodeName of Object.keys(connections)) {
        if (!nodeNames.has(sourceNodeName)) {
            issues.push({
                path: ['connections', sourceNodeName],
                message: `Connection source "${sourceNodeName}" does not reference an existing node`,
                code: 'unknown_connection_source',
            });
        }
        const connectionTypes = connections[sourceNodeName];
        for (const connectionType of Object.keys(connectionTypes)) {
            const buckets = connectionTypes[connectionType];
            for (const [sourceIndex, bucket] of buckets.entries()) {
                for (const [targetIndex, connection] of (bucket ?? []).entries()) {
                    if (!nodeNames.has(connection.node)) {
                        issues.push({
                            path: [
                                'connections',
                                sourceNodeName,
                                connectionType,
                                sourceIndex,
                                targetIndex,
                                'node',
                            ],
                            message: `Connection target "${connection.node}" does not reference an existing node`,
                            code: 'unknown_connection_target',
                        });
                    }
                }
            }
        }
    }
    if (issues.length > 0) {
        return { success: false, issues };
    }
    return {
        success: true,
        data: parsed.data,
    };
}
function parseWorkflowStructure(input) {
    const result = safeParseWorkflowStructure(input);
    if (!result.success) {
        throw new WorkflowStructureValidationError(result.issues);
    }
    return result.data;
}
//# sourceMappingURL=workflow-structure-validation.js.map