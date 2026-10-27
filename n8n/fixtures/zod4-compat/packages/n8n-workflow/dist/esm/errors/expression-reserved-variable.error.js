import { ExpressionError } from "./expression.error.js";
export class ExpressionReservedVariableError extends ExpressionError {
    constructor(variableName) {
        super(`Cannot use "${variableName}" due to security concerns`);
    }
}
//# sourceMappingURL=expression-reserved-variable.error.js.map