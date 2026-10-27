import { BaseError } from "./base.error.js";
/**
 * Error that indicates the user performed an action that caused an error.
 * E.g. provided invalid input, tried to access a resource they’re not
 * authorized to, or violates a business rule.
 *
 * Default level: info
 */
export class UserError extends BaseError {
    constructor(message, opts = {}) {
        opts.level = opts.level ?? 'info';
        super(message, opts);
    }
}
//# sourceMappingURL=user.error.js.map