"use strict";
/**
 * Contains all the data which is needed to execute a workflow and so also to
 * restart it again if it fails.
 * RunData, ExecuteData and WaitForExecution contain often the same data.
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateRunExecutionData = migrateRunExecutionData;
const run_execution_data_v1_1 = require("./run-execution-data.v1.js");
const __brand = Symbol('brand');
function migrateRunExecutionData(data) {
    switch (data.version) {
        case 0:
        case undefined: // Missing version means version 0
            data = (0, run_execution_data_v1_1.runExecutionDataV0ToV1)(data);
        // Fall through to subsequent versions as they're added.
    }
    if (data.version !== 1) {
        throw new Error(`Unsupported IRunExecutionData version: ${data.version}`);
    }
    return data;
}
//# sourceMappingURL=run-execution-data.js.map