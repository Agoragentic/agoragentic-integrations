"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpressionClassExtensionError = void 0;
const expression_error_1 = require("./expression.error.js");
class ExpressionClassExtensionError extends expression_error_1.ExpressionError {
    constructor(baseClass) {
        super(`Cannot extend "${baseClass}" due to security concerns`);
    }
}
exports.ExpressionClassExtensionError = ExpressionClassExtensionError;
//# sourceMappingURL=expression-class-extension.error.js.map