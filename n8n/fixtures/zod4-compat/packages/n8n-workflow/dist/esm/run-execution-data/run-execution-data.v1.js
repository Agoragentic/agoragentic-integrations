export function runExecutionDataV0ToV1(data) {
    const destinationNodeV0 = data.startData?.destinationNode;
    const originalDestinationNodeV0 = data.startData?.originalDestinationNode;
    return {
        ...data,
        version: 1,
        startData: {
            ...data.startData,
            destinationNode: destinationNodeV0
                ? {
                    nodeName: destinationNodeV0,
                    mode: 'inclusive',
                }
                : undefined,
            originalDestinationNode: originalDestinationNodeV0
                ? {
                    nodeName: originalDestinationNodeV0,
                    mode: 'inclusive',
                }
                : undefined,
        },
    };
}
//# sourceMappingURL=run-execution-data.v1.js.map