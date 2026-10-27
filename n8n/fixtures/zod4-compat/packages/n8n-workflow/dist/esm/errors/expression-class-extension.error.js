import { ExpressionError } from "./expression.error.js";
export class ExpressionClassExtensionError extends ExpressionError {
    constructor(baseClass) {
        super(`Cannot extend "${baseClass}" due to security concerns`);
    }
}
//# sourceMappingURL=expression-class-extension.error.js.map