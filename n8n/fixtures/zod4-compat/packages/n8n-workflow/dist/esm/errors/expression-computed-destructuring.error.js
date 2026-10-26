import { ExpressionError } from "./expression.error.js";
export class ExpressionComputedDestructuringError extends ExpressionError {
    constructor() {
        super('Computed property names in destructuring are not allowed due to security concerns');
    }
}
//# sourceMappingURL=expression-computed-destructuring.error.js.map