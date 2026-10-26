import { average as aAverage } from "./array-extensions.js";
import { ExpressionExtensionError } from "./expression-extension-error.js";
const min = Math.min;
const max = Math.max;
const numberList = (start, end) => {
    const size = Math.abs(start - end) + 1;
    const arr = new Array(size);
    let curr = start;
    for (let i = 0; i < size; i++) {
        if (start < end) {
            arr[i] = curr++;
        }
        else {
            arr[i] = curr--;
        }
    }
    return arr;
};
const zip = (keys, values) => {
    if (!Array.isArray(keys) || !Array.isArray(values)) {
        throw new ExpressionExtensionError('keys and values must be arrays');
    }
    if (keys.length !== values.length) {
        throw new ExpressionExtensionError('keys and values not of equal length');
    }
    const result = {};
    for (let i = 0; i < keys.length; i++) {
        result[keys[i]] = values[i];
    }
    return result;
};
const average = (...args) => {
    return aAverage(args);
};
const not = (value) => {
    return !value;
};
function ifEmpty(value, defaultValue) {
    if (arguments.length !== 2) {
        // DIVERGENCE from packages/workflow/src/extensions/extended-functions.ts:
        // The original throws ExpressionError (from ExecutionBaseError). The runtime
        // uses ExpressionExtensionError because the full ExpressionError class is not
        // available in the extensions layer — only a minimal shim exists in safe-globals.
        throw new ExpressionExtensionError('expected two arguments (value, defaultValue) for this function');
    }
    if (value === undefined || value === null || value === '') {
        return defaultValue;
    }
    if (typeof value === 'object') {
        if (Array.isArray(value) && !value.length) {
            return defaultValue;
        }
        if (!Object.keys(value).length) {
            return defaultValue;
        }
    }
    return value;
}
ifEmpty.doc = {
    name: 'ifEmpty',
    description: 'Returns the default value if the value is empty. Empty values are undefined, null, empty strings, arrays without elements and objects without keys.',
    returnType: 'any',
    args: [
        { name: 'value', type: 'any' },
        { name: 'defaultValue', type: 'any' },
    ],
    docURL: 'https://docs.n8n.io/code/builtin/convenience',
};
export const extendedFunctions = {
    min,
    max,
    not,
    average,
    numberList,
    zip,
    $min: min,
    $max: max,
    $average: average,
    $not: not,
    $ifEmpty: ifEmpty,
};
//# sourceMappingURL=function-extensions.js.map