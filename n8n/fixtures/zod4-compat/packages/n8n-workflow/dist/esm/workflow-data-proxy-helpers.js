export function getPinDataIfManualExecution(workflow, nodeName, mode) {
    if (mode !== 'manual') {
        return undefined;
    }
    return workflow.getPinDataOfNode(nodeName);
}
//# sourceMappingURL=workflow-data-proxy-helpers.js.map