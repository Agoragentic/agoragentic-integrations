"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UNSAFE_PROPERTY_NAMES = exports.EXTENSION_OBJECTS = void 0;
exports.extend = extend;
exports.extendOptional = extendOptional;
const luxon_1 = require("luxon");
const array_extensions_1 = require("./array-extensions.js");
const boolean_extensions_1 = require("./boolean-extensions.js");
const date_extensions_1 = require("./date-extensions.js");
const expression_extension_error_1 = require("./expression-extension-error.js");
const number_extensions_1 = require("./number-extensions.js");
const object_extensions_1 = require("./object-extensions.js");
const string_extensions_1 = require("./string-extensions.js");
const utils_1 = require("./utils.js");
function isEmpty(value) {
    return value === null || value === undefined || !value;
}
function isNotEmpty(value) {
    return !isEmpty(value);
}
exports.EXTENSION_OBJECTS = [
    array_extensions_1.arrayExtensions,
    date_extensions_1.dateExtensions,
    number_extensions_1.numberExtensions,
    object_extensions_1.objectExtensions,
    string_extensions_1.stringExtensions,
    boolean_extensions_1.booleanExtensions,
];
// eslint-disable-next-line @typescript-eslint/no-restricted-types
const genericExtensions = {
    isEmpty,
    isNotEmpty,
};
function isDate(input) {
    if (typeof input !== 'string' || !input.length) {
        return false;
    }
    if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(input)) {
        return false;
    }
    const d = new Date(input);
    return d instanceof Date && !isNaN(d.valueOf()) && d.toISOString() === input;
}
/**
 * Property names that must never be accessed via expression extensions.
 * Matches the host-side blocklist in packages/workflow/src/utils.ts.
 */
exports.UNSAFE_PROPERTY_NAMES = new Set([
    '__proto__',
    'prototype',
    'constructor',
    'getPrototypeOf',
    'mainModule',
    'binding',
    '_linkedBinding',
    '_load',
    'prepareStackTrace',
    '__lookupGetter__',
    '__lookupSetter__',
    '__defineGetter__',
    '__defineSetter__',
    'caller',
    'arguments',
    'getBuiltinModule',
    'dlopen',
    'execve',
    'loadEnvFile',
]);
function findExtendedFunction(input, functionName) {
    const name = typeof functionName === 'string' ? functionName : String(functionName);
    if (exports.UNSAFE_PROPERTY_NAMES.has(name)) {
        throw new expression_extension_error_1.ExpressionExtensionError(`Cannot access "${name}" via expression extension due to security concerns`);
    }
    // eslint-disable-next-line @typescript-eslint/no-restricted-types
    let foundFunction;
    if (Array.isArray(input)) {
        foundFunction = array_extensions_1.arrayExtensions.functions[name];
    }
    else if (isDate(input) && name !== 'toDate' && name !== 'toDateTime') {
        // If it's a string date (from $json), convert it to a Date object,
        // unless that function is `toDate`, since `toDate` does something
        // very different on date objects
        input = new Date(input);
        foundFunction = date_extensions_1.dateExtensions.functions[name];
    }
    else if (typeof input === 'string') {
        foundFunction = string_extensions_1.stringExtensions.functions[name];
    }
    else if (typeof input === 'number') {
        foundFunction = number_extensions_1.numberExtensions.functions[name];
    }
    else if (input && (luxon_1.DateTime.isDateTime(input) || input instanceof Date)) {
        foundFunction = date_extensions_1.dateExtensions.functions[name];
    }
    else if (input !== null && typeof input === 'object') {
        foundFunction = object_extensions_1.objectExtensions.functions[name];
    }
    else if (typeof input === 'boolean') {
        foundFunction = boolean_extensions_1.booleanExtensions.functions[name];
    }
    // Look for generic or builtin
    if (!foundFunction) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const inputAny = input;
        // This is likely a builtin we're implementing for another type
        // (e.g. toLocaleString). We'll return that instead
        if (inputAny && name && typeof inputAny[name] === 'function') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            return { type: 'native', function: inputAny[name] };
        }
        // Use a generic version if available
        foundFunction = genericExtensions[name];
    }
    if (!foundFunction) {
        return undefined;
    }
    return { type: 'extended', function: foundFunction };
}
/**
 * Extender function injected by expression extension plugin to allow calls to extensions.
 *
 * ```ts
 * extend(input, "functionName", [...args]);
 * ```
 */
function extend(input, functionName, args) {
    const foundFunction = findExtendedFunction(input, functionName);
    // No type specific or generic function found. Check to see if
    // any types have a function with that name. Then throw an error
    // letting the user know the available types.
    if (!foundFunction) {
        (0, utils_1.checkIfValueDefinedOrThrow)(input, functionName);
        const haveFunction = exports.EXTENSION_OBJECTS.filter((v) => functionName in v.functions);
        if (!haveFunction.length) {
            // This shouldn't really be possible but we should cover it anyway
            throw new expression_extension_error_1.ExpressionExtensionError(`Unknown expression function: ${functionName}`);
        }
        if (haveFunction.length > 1) {
            const lastType = `"${haveFunction.pop().typeName}"`;
            const typeNames = `${haveFunction.map((v) => `"${v.typeName}"`).join(', ')}, and ${lastType}`;
            throw new expression_extension_error_1.ExpressionExtensionError(`${functionName}() is only callable on types ${typeNames}`);
        }
        else {
            throw new expression_extension_error_1.ExpressionExtensionError(`${functionName}() is only callable on type "${haveFunction[0].typeName}"`);
        }
    }
    if (foundFunction.type === 'native') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return foundFunction.function.apply(input, args);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return foundFunction.function(input, args);
}
function extendOptional(input, functionName) {
    const foundFunction = findExtendedFunction(input, functionName);
    if (!foundFunction) {
        return undefined;
    }
    if (foundFunction.type === 'native') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return foundFunction.function.bind(input);
    }
    return (...args) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return foundFunction.function(input, args);
    };
}
//# sourceMappingURL=extend.js.map