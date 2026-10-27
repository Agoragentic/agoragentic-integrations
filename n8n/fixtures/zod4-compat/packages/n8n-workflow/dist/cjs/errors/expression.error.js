"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpressionError = void 0;
const execution_base_error_1 = require("./abstract/execution-base.error.js");
/**
 * Class for instantiating an expression error
 */
class ExpressionError extends execution_base_error_1.ExecutionBaseError {
    constructor(message, options) {
        super(message, { cause: options?.cause, level: 'warning' });
        if (options?.description !== undefined) {
            this.description = options.description;
        }
        const allowedKeys = [
            'causeDetailed',
            'descriptionTemplate',
            'descriptionKey',
            'itemIndex',
            'messageTemplate',
            'nodeCause',
            'parameter',
            'runIndex',
            'type',
        ];
        if (options !== undefined) {
            if (options.functionality !== undefined) {
                this.functionality = options.functionality;
            }
            Object.keys(options).forEach((key) => {
                if (allowedKeys.includes(key)) {
                    this.context[key] = options[key];
                }
            });
        }
    }
}
exports.ExpressionError = ExpressionError;
//# sourceMappingURL=expression.error.js.map