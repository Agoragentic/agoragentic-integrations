"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToDateTime = void 0;
exports.checkIfValueDefinedOrThrow = checkIfValueDefinedOrThrow;
const luxon_1 = require("luxon");
const expression_extension_error_1 = require("./expression-extension-error.js");
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