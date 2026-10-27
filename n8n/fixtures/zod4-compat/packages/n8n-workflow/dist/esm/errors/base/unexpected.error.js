import { BaseError } from "./base.error.js";
/**
 * Error that indicates something is wrong in the code: logic mistakes,
 * unhandled cases, assertions that fail. These are not recoverable and
 * should be brought to developers' attention.
 *
 * Default level: error
 */
export class UnexpectedError extends BaseError {
    constructor(message, opts = {}) {
        opts.level = opts.level ?? 'error';
        super(message, opts);
    }
}
//# sourceMappingURL=unexpected.error.js.map