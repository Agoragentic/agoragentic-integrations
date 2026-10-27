import { BaseError } from "./base.error.js";
/**
 * Error that indicates a transient issue, like a network request failing,
 * a database query timing out, etc. These are expected to happen, are
 * transient by nature and should be handled gracefully.
 *
 * Default level: warning
 */
export class OperationalError extends BaseError {
    constructor(message, opts = {}) {
        opts.level = opts.level ?? 'warning';
        super(message, opts);
    }
}
//# sourceMappingURL=operational.error.js.map