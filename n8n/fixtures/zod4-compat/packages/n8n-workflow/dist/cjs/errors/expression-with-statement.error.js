"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpressionWithStatementError = void 0;
const expression_error_1 = require("./expression.error.js");
class ExpressionWithStatementError extends expression_error_1.ExpressionError {
    constructor() {
        super('Cannot use "with" statements due to security concerns');
    }
}
exports.ExpressionWithStatementError = ExpressionWithStatementError;
//# sourceMappingURL=expression-with-statement.error.js.map