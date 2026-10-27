"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeRunsPerBranch = mergeRunsPerBranch;
/**
 * For each output branch, concatenate items from every run in the order they were produced.
 */
function mergeRunsPerBranch(runs) {
    const branchCount = runs.reduce((max, run) => Math.max(max, run.data?.main?.length ?? 0), 0);
    return Array.from({ length: branchCount }, (_, branch) => runs.flatMap((run) => run.data?.main?.[branch] ?? []));
}
//# sourceMappingURL=sub-workflow-output.js.map