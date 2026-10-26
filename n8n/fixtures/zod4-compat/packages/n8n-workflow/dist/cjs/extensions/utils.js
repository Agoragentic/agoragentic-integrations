"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToDateTime = void 0;
exports.checkIfValueDefinedOrThrow = checkIfValueDefinedOrThrow;
// NOTE: This file is intentionally mirrored in @n8n/expression-runtime/src/extensions/
// for use inside the isolated VM. Changes here must be reflected there and vice versa.
// TODO: Eliminate the duplication. The blocker is that @n8n/expression-runtime is
// Vite-stubbed for browser builds (to exclude isolated-vm), which prevents n8n-workflow
// from importing these extension utilities directly from the runtime package. Fix by
// splitting @n8n/expression-runtime into a browser-safe extensions subpath (not stubbed)
// and a node-only VM entry (stubbed).
const luxon_1 = require("luxon");
const expression_extension_error_1 = require("../errors/expression-extension.error.js");
// Utility functions and type guards for expression extensions
const convertToDateTime = (value) => {
    let converted;
    if (typeof value === 'string') {
        converted = luxon_1.DateTime.fromJSDate(new Date(value));
        if (converted.invalidReason !== null) {
            return;
        }
    }
    else if (value instanceof Date) {
        converted = luxon_1.DateTime.fromJSDate(value);
    }
    else if (luxon_1.DateTime.isDateTime(value)) {
        converted = value;
    }
    return converted;
};
exports.convertToDateTime = convertToDateTime;
function checkIfValueDefinedOrThrow(value, functionName) {
    if (value === undefined || value === null) {
        throw new expression_extension_error_1.ExpressionExtensionError(`${functionName} can't be used on ${String(value)} value`, {
            description: `To ignore this error, add a ? to the variable before this function, e.g. my_var?.${functionName}`,
        });
    }
}
//# sourceMappingURL=utils.js.map