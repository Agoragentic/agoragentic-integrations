"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnexpectedError = void 0;
const base_error_1 = require("./base.error.js");
/**
 * Error that indicates something is wrong in the code: logic mistakes,
 * unhandled cases, assertions that fail. These are not recoverable and
 * should be brought to developers' attention.
 *
 * Default level: error
 */
class UnexpectedError extends base_error_1.BaseError {
    constructor(message, opts = {}) {
        opts.level = opts.level ?? 'error';
        super(message, opts);
    }
}
exports.UnexpectedError = UnexpectedError;
//# sourceMappingURL=unexpected.error.js.map