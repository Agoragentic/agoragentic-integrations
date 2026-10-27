"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeSslError = void 0;
const execution_base_error_1 = require("./abstract/execution-base.error.js");
class NodeSslError extends execution_base_error_1.ExecutionBaseError {
    constructor(cause) {
        super("SSL Issue: consider using the 'Ignore SSL issues' option", { cause });
    }
}
exports.NodeSslError = NodeSslError;
//# sourceMappingURL=node-ssl.error.js.map