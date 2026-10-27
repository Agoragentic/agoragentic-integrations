"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpressionComputedDestructuringError = void 0;
const expression_error_1 = require("./expression.error.js");
class ExpressionComputedDestructuringError extends expression_error_1.ExpressionError {
    constructor() {
        super('Computed property names in destructuring are not allowed due to security concerns');
    }
}
exports.ExpressionComputedDestructuringError = ExpressionComputedDestructuringError;
//# sourceMappingURL=expression-computed-destructuring.error.js.map