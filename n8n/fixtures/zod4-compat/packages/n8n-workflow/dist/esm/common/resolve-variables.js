/**
 * Resolves variables to a flat key→value map.
 *
 * Globals are applied first, then variables belonging to `projectId` overwrite
 * them. This makes project variables win over same-key globals regardless of
 * the input order, which would otherwise leave the result dependent on
 * database row or store insertion order.
 *
 * @param variables Global and project-scoped variables, in any order
 * @param projectId Project whose variables take precedence, if any
 */
export function resolveVariables(variables, projectId) {
    const resolved = {};
    for (const variable of variables) {
        if (!variable.project) {
            resolved[variable.key] = variable.value;
        }
    }
    for (const variable of variables) {
        if (projectId && variable.project?.id === projectId) {
            resolved[variable.key] = variable.value;
        }
    }
    return resolved;
}
//# sourceMappingURL=resolve-variables.js.map