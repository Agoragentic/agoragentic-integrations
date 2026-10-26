"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureError = ensureError;
/** Ensures `error` is an `Error */
function ensureError(error) {
    return error instanceof Error
        ? error
        : new Error('Error that was not an instance of Error was thrown', {
            // We should never throw anything except something that derives from Error
            cause: error,
        });
}
//# sourceMappingURL=ensure-error.js.map