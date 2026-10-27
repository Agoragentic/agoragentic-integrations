"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationalError = void 0;
const base_error_1 = require("./base.error.js");
/**
 * Error that indicates a transient issue, like a network request failing,
 * a database query timing out, etc. These are expected to happen, are
 * transient by nature and should be handled gracefully.
 *
 * Default level: warning
 */
class OperationalError extends base_error_1.BaseError {
    constructor(message, opts = {}) {
        opts.level = opts.level ?? 'warning';
        super(message, opts);
    }
}
exports.OperationalError = OperationalError;
//# sourceMappingURL=operational.error.js.map