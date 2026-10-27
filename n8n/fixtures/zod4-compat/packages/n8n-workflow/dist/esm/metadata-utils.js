import { hasKey } from "./utils.js";
function responseHasSubworkflowData(response) {
    return ['executionId', 'workflowId'].every((x) => hasKey(response, x) && typeof response[x] === 'string');
}
function parseErrorResponseWorkflowMetadata(response) {
    if (!responseHasSubworkflowData(response))
        return undefined;
    return {
        subExecution: {
            executionId: response.executionId,
            workflowId: response.workflowId,
        },
        subExecutionsCount: 1,
    };
}
export function accumulateTokenUsage(context, inputTokens, outputTokens) {
    const prev = context.getExecuteData()?.metadata?.tokenUsage;
    context.setMetadata({
        tokenUsage: {
            inputTokens: (prev?.inputTokens ?? 0) + inputTokens,
            outputTokens: (prev?.outputTokens ?? 0) + outputTokens,
        },
    });
}
export function parseErrorMetadata(error) {
    if (hasKey(error, 'errorResponse')) {
        return parseErrorResponseWorkflowMetadata(error.errorResponse);
    }
    // This accounts for cases where the backend attaches the properties on plain errors
    // e.g. from custom nodes throwing literal `Error` or `ApplicationError` objects directly
    return parseErrorResponseWorkflowMetadata(error);
}
//# sourceMappingURL=metadata-utils.js.map