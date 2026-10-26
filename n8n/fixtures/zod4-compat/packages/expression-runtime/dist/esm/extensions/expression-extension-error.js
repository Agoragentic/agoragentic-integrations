export class ExpressionExtensionError extends Error {
    description;
    constructor(message, options) {
        super(message);
        this.name = 'ExpressionExtensionError';
        if (options?.description !== undefined) {
            this.description = options.description;
        }
    }
}
//# sourceMappingURL=expression-extension-error.js.map