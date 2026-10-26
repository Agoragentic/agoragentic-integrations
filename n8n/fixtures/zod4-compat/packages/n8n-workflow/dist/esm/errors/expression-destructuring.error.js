import { ExpressionError } from "./expression.error.js";
export class ExpressionDestructuringError extends ExpressionError {
    constructor(property) {
        super(`Cannot destructure "${property}" due to security concerns`);
    }
}
//# sourceMappingURL=expression-destructuring.error.js.map