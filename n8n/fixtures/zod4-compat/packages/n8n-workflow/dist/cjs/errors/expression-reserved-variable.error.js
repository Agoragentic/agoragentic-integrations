"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpressionReservedVariableError = void 0;
const expression_error_1 = require("./expression.error.js");
class ExpressionReservedVariableError extends expression_error_1.ExpressionError {
    constructor(variableName) {
        super(`Cannot use "${variableName}" due to security concerns`);
    }
}
exports.ExpressionReservedVariableError = ExpressionReservedVariableError;
//# sourceMappingURL=expression-reserved-variable.error.js.map