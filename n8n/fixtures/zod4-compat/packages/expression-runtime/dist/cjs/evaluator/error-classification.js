"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.classifyExpressionError = classifyExpressionError;
const types_1 = require("../types/index.js");
function classifyExpressionError(error) {
    if (error instanceof types_1.TimeoutError)
        return 'timeout';
    if (error instanceof types_1.MemoryLimitError)
        return 'memory_limit';
    if (error instanceof types_1.SecurityViolationError)
        return 'security';
    if (error instanceof types_1.SyntaxError)
        return 'syntax';
    return 'unknown';
}
//# sourceMappingURL=error-classification.js.map