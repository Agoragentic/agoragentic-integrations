"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isExpression = void 0;
/**
 * Checks if the given value is an expression. An expression is a string that
 * starts with '='.
 */
const isExpression = (expr) => {
    if (typeof expr !== 'string')
        return false;
    return expr.charAt(0) === '=';
};
exports.isExpression = isExpression;
//# sourceMappingURL=expression-helpers.js.map