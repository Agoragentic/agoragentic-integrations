"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpressionDestructuringError = void 0;
const expression_error_1 = require("./expression.error.js");
class ExpressionDestructuringError extends expression_error_1.ExpressionError {
    constructor(property) {
        super(`Cannot destructure "${property}" due to security concerns`);
    }
}
exports.ExpressionDestructuringError = ExpressionDestructuringError;
//# sourceMappingURL=expression-destructuring.error.js.map