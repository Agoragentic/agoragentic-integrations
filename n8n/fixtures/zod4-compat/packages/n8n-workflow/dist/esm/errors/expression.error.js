import { ExecutionBaseError } from "./abstract/execution-base.error.js";
/**
 * Class for instantiating an expression error
 */
export class ExpressionError extends ExecutionBaseError {
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
//# sourceMappingURL=expression.error.js.map