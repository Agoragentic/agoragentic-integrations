"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpressionExtensionError = void 0;
class ExpressionExtensionError extends Error {
    description;
    constructor(message, options) {
        super(message);
        this.name = 'ExpressionExtensionError';
        if (options?.description !== undefined) {
            this.description = options.description;
        }
    }
}
exports.ExpressionExtensionError = ExpressionExtensionError;
//# sourceMappingURL=expression-extension-error.js.map