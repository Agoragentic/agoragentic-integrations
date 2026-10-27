"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTrimmedNodeExecutionData = isTrimmedNodeExecutionData;
exports.getTrimmedPinDataNodeNames = getTrimmedPinDataNodeNames;
const constants_1 = require("./constants.js");
/**
 * The placeholder is FE-only and meant to be transient. If it ever appears in
 * pinData, the workflow's stored state has been corrupted (the placeholder
 * round-tripped through pinData → engine → DB), and any subsequent run will
 * reproduce the corruption. Use these helpers to detect and refuse it.
 */
function isTrimmedNodeExecutionData(data) {
    return !!data?.some((entry) => entry?.json?.[constants_1.TRIMMED_TASK_DATA_CONNECTIONS_KEY] === true);
}
function getTrimmedPinDataNodeNames(pinData) {
    if (!pinData)
        return [];
    return Object.entries(pinData)
        .filter(([, items]) => Array.isArray(items) && isTrimmedNodeExecutionData(items))
        .map(([nodeName]) => nodeName);
}
//# sourceMappingURL=trimmed-task-data.js.map