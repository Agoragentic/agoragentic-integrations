/**
 * Checks if the given value is an expression. An expression is a string that
 * starts with '='.
 */
export const isExpression = (expr) => {
    if (typeof expr !== 'string')
        return false;
    return expr.charAt(0) === '=';
};
//# sourceMappingURL=expression-helpers.js.map