import { DateTime } from "luxon";
import { ExpressionExtensionError } from "./expression-extension-error.js";
// Utility functions and type guards for expression extensions
export const convertToDateTime = (value) => {
    let converted;
    if (typeof value === 'string') {
        converted = DateTime.fromJSDate(new Date(value));
        if (converted.invalidReason !== null) {
            return;
        }
    }
    else if (value instanceof Date) {
        converted = DateTime.fromJSDate(value);
    }
    else if (DateTime.isDateTime(value)) {
        converted = value;
    }
    return converted;
};
export function checkIfValueDefinedOrThrow(value, functionName) {
    if (value === undefined || value === null) {
        throw new ExpressionExtensionError(`${functionName} can't be used on ${String(value)} value`, {
            description: `To ignore this error, add a ? to the variable before this function, e.g. my_var?.${functionName}`,
        });
    }
}
//# sourceMappingURL=utils.js.map