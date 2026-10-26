"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeCircularRefs = exports.isTraversableObject = exports.sleepWithAbort = exports.sleep = exports.jsonStringify = exports.replaceCircularReferences = exports.base64DecodeUTF8 = exports.jsonParse = exports.deepCopy = exports.isObjectEmpty = void 0;
exports.isObject = isObject;
exports.fileTypeFromMimeType = fileTypeFromMimeType;
exports.assert = assert;
exports.updateDisplayOptions = updateDisplayOptions;
exports.randomInt = randomInt;
exports.randomString = randomString;
exports.hasKey = hasKey;
exports.isSafeObjectProperty = isSafeObjectProperty;
exports.containsUnsafeObjectPropertyToken = containsUnsafeObjectPropertyToken;
exports.setSafeObjectProperty = setSafeObjectProperty;
exports.sanitizeXmlName = sanitizeXmlName;
exports.isCommunityPackageName = isCommunityPackageName;
exports.dedupe = dedupe;
exports.sanitizeFilename = sanitizeFilename;
exports.generateSecureToken = generateSecureToken;
const esprima_next_1 = require("esprima-next");
const form_data_1 = __importDefault(require("form-data"));
const jsonrepair_1 = require("jsonrepair");
const merge_1 = __importDefault(require("lodash/merge.js"));
const path_1 = __importDefault(require("path"));
const constants_1 = require("./constants.js");
const user_error_1 = require("./errors/base/user.error.js");
const execution_cancelled_error_1 = require("./errors/execution-cancelled.error.js");
const LoggerProxy = __importStar(require("./logger-proxy.js"));
const readStreamClasses = new Set(['ReadStream', 'Readable', 'ReadableStream']);
// NOTE: BigInt.prototype.toJSON is not available, which causes JSON.stringify to throw an error
// as well as the flatted stringify method. This is a workaround for that.
BigInt.prototype.toJSON = function () {
    return this.toString();
};
/**
 * Type guard for plain objects suitable for key-based traversal/serialization.
 *
 * Returns `true` for objects whose prototype is `Object.prototype` (object literals)
 * or `null` (`Object.create(null)`), and `false` for arrays and non-plain objects
 * such as `Date`, `Map`, `Set`, and class instances.
 */
function isObject(value) {
    if (value === null || typeof value !== 'object')
        return false;
    if (Array.isArray(value))
        return false;
    if (Object.prototype.toString.call(value) !== '[object Object]')
        return false;
    return Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null;
}
const isObjectEmpty = (obj) => {
    if (obj === undefined || obj === null)
        return true;
    if (typeof obj === 'object') {
        if (obj instanceof form_data_1.default)
            return obj.getLengthSync() === 0;
        if (Array.isArray(obj))
            return obj.length === 0;
        if (obj instanceof Set || obj instanceof Map)
            return obj.size === 0;
        if (ArrayBuffer.isView(obj) || obj instanceof ArrayBuffer)
            return obj.byteLength === 0;
        if (Symbol.iterator in obj || readStreamClasses.has(obj.constructor.name))
            return false;
        return Object.keys(obj).length === 0;
    }
    return true;
};
exports.isObjectEmpty = isObjectEmpty;
// Property keys that must never be copied onto a clone: assigning `__proto__`
// reassigns the clone's prototype, and `constructor`/`prototype` can shadow
// built-ins. Source data parsed from JSON can carry these as own properties.
const reservedCopyKeys = new Set(['__proto__', 'constructor', 'prototype']);
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
const deepCopy = (source, hash = new WeakMap(), path = '') => {
    const hasOwnProp = Object.prototype.hasOwnProperty.bind(source);
    // Primitives & Null & Function
    if (typeof source !== 'object' || source === null || typeof source === 'function') {
        return source;
    }
    // Date and other objects with toJSON method
    // TODO: remove this when other code parts not expecting objects with `.toJSON` method called and add back checking for Date and cloning it properly
    if (typeof source.toJSON === 'function') {
        return source.toJSON();
    }
    if (hash.has(source)) {
        return hash.get(source);
    }
    // Array
    if (Array.isArray(source)) {
        const clone = [];
        const len = source.length;
        for (let i = 0; i < len; i++) {
            clone[i] = (0, exports.deepCopy)(source[i], hash, path + `[${i}]`);
        }
        return clone;
    }
    // Object
    const clone = Object.create(Object.getPrototypeOf({}));
    hash.set(source, clone);
    for (const i in source) {
        if (hasOwnProp(i) && !reservedCopyKeys.has(i)) {
            clone[i] = (0, exports.deepCopy)(source[i], hash, path + `.${i}`);
        }
    }
    return clone;
};
exports.deepCopy = deepCopy;
// eslint-enable
function syntaxNodeToValue(expression) {
    switch (expression?.type) {
        case esprima_next_1.Syntax.ObjectExpression:
            return Object.fromEntries(expression.properties
                .filter((prop) => prop.type === esprima_next_1.Syntax.Property)
                .map(({ key, value }) => [syntaxNodeToValue(key), syntaxNodeToValue(value)]));
        case esprima_next_1.Syntax.Identifier:
            return expression.name;
        case esprima_next_1.Syntax.Literal:
            return expression.value;
        case esprima_next_1.Syntax.ArrayExpression:
            return expression.elements.map((exp) => syntaxNodeToValue(exp));
        case esprima_next_1.Syntax.UnaryExpression: {
            const value = syntaxNodeToValue(expression.argument);
            if (typeof value === 'number' && expression.operator === '-') {
                return -value;
            }
            return value;
        }
        default:
            return undefined;
    }
}
/**
 * Parse any JavaScript ObjectExpression, including:
 * - single quoted keys
 * - unquoted keys
 */
function parseJSObject(objectAsString) {
    const jsExpression = (0, esprima_next_1.parse)(`(${objectAsString})`).body.find((node) => node.type === esprima_next_1.Syntax.ExpressionStatement && node.expression.type === esprima_next_1.Syntax.ObjectExpression);
    return syntaxNodeToValue(jsExpression?.expression);
}
/**
 * Parses a JSON string into an object with optional error handling and recovery mechanisms.
 *
 * @param {string} jsonString - The JSON string to parse.
 * @param {Object} [options] - Optional settings for parsing the JSON string. Either `fallbackValue` or `errorMessage` can be set, but not both.
 * @param {boolean} [options.acceptJSObject=false] - If true, attempts to recover from common JSON format errors by parsing the JSON string as a JavaScript Object.
 * @param {boolean} [options.repairJSON=false] - If true, attempts to repair common JSON format errors by repairing the JSON string.
 * @param {string} [options.errorMessage] - A custom error message to throw if the JSON string cannot be parsed.
 * @param {*} [options.fallbackValue] - A fallback value to return if the JSON string cannot be parsed.
 * @returns {Object} - The parsed object, or the fallback value if parsing fails and `fallbackValue` is set.
 */
const jsonParse = (jsonString, options) => {
    try {
        return JSON.parse(jsonString);
    }
    catch (error) {
        if (options?.acceptJSObject) {
            try {
                const jsonStringCleaned = parseJSObject(jsonString);
                return jsonStringCleaned;
            }
            catch (e) {
                // Ignore this error and return the original error or the fallback value
            }
        }
        if (options?.repairJSON) {
            try {
                const jsonStringCleaned = (0, jsonrepair_1.jsonrepair)(jsonString);
                return JSON.parse(jsonStringCleaned);
            }
            catch (e) {
                // Ignore this error and return the original error or the fallback value
            }
        }
        if (options?.fallbackValue !== undefined) {
            if (options.fallbackValue instanceof Function) {
                return options.fallbackValue();
            }
            return options.fallbackValue;
        }
        else if (options?.errorMessage) {
            throw new user_error_1.UserError(options.errorMessage);
        }
        throw error;
    }
};
exports.jsonParse = jsonParse;
/**
 * Decodes a Base64 string with proper UTF-8 character handling.
 *
 * @param str - The Base64 string to decode
 * @returns The decoded UTF-8 string
 */
const base64DecodeUTF8 = (str) => {
    try {
        // Use modern TextDecoder for proper UTF-8 handling
        const bytes = new Uint8Array(atob(str)
            .split('')
            .map((char) => char.charCodeAt(0)));
        return new TextDecoder('utf-8').decode(bytes);
    }
    catch (error) {
        // Fallback method for older browsers
        console.warn('TextDecoder not available, using fallback method');
        return atob(str);
    }
};
exports.base64DecodeUTF8 = base64DecodeUTF8;
const replaceCircularReferences = (value, knownObjects = new WeakSet()) => {
    if (typeof value !== 'object' || value === null || value instanceof RegExp)
        return value;
    if ('toJSON' in value && typeof value.toJSON === 'function')
        return value.toJSON();
    if (knownObjects.has(value))
        return '[Circular Reference]';
    knownObjects.add(value);
    const copy = (Array.isArray(value) ? [] : {});
    for (const key in value) {
        if (reservedCopyKeys.has(key))
            continue;
        try {
            copy[key] = (0, exports.replaceCircularReferences)(value[key], knownObjects);
        }
        catch (error) {
            if (error instanceof TypeError &&
                error.message.includes('Cannot assign to read only property')) {
                LoggerProxy.error('Error while replacing circular references: ' + error.message, { error });
                continue; // Skip properties that cannot be assigned to (readonly, non-configurable, etc.)
            }
            throw error;
        }
    }
    knownObjects.delete(value);
    return copy;
};
exports.replaceCircularReferences = replaceCircularReferences;
const jsonStringify = (obj, options = {}) => {
    return JSON.stringify(options?.replaceCircularRefs ? (0, exports.replaceCircularReferences)(obj) : obj);
};
exports.jsonStringify = jsonStringify;
const sleep = async (ms) => await new Promise((resolve) => {
    setTimeout(resolve, ms);
});
exports.sleep = sleep;
const sleepWithAbort = async (ms, abortSignal) => await new Promise((resolve, reject) => {
    if (abortSignal?.aborted) {
        reject(new execution_cancelled_error_1.ManualExecutionCancelledError(''));
        return;
    }
    const timeout = setTimeout(resolve, ms);
    const abortHandler = () => {
        clearTimeout(timeout);
        reject(new execution_cancelled_error_1.ManualExecutionCancelledError(''));
    };
    abortSignal?.addEventListener('abort', abortHandler, { once: true });
});
exports.sleepWithAbort = sleepWithAbort;
function fileTypeFromMimeType(mimeType) {
    if (mimeType.startsWith('application/json'))
        return 'json';
    if (mimeType.startsWith('text/html'))
        return 'html';
    if (mimeType.startsWith('image/'))
        return 'image';
    if (mimeType.startsWith('audio/'))
        return 'audio';
    if (mimeType.startsWith('video/'))
        return 'video';
    if (mimeType.startsWith('text/') || mimeType.startsWith('application/javascript'))
        return 'text';
    if (mimeType.startsWith('application/pdf'))
        return 'pdf';
    return;
}
function assert(condition, msg) {
    if (!condition) {
        const error = new Error(msg ?? 'Invalid assertion');
        // hide assert stack frame if supported
        if (Error.hasOwnProperty('captureStackTrace')) {
            // V8 only - https://nodejs.org/api/errors.html#errors_error_capturestacktrace_targetobject_constructoropt
            Error.captureStackTrace(error, assert);
        }
        else if (error.stack) {
            // fallback for IE and Firefox
            error.stack = error.stack
                .split('\n')
                .slice(1) // skip assert function from stack frames
                .join('\n');
        }
        throw error;
    }
}
const isTraversableObject = (value) => {
    return value && typeof value === 'object' && !Array.isArray(value) && !!Object.keys(value).length;
};
exports.isTraversableObject = isTraversableObject;
const removeCircularRefs = (obj, seen = new Set()) => {
    seen.add(obj);
    Object.entries(obj).forEach(([key, value]) => {
        if ((0, exports.isTraversableObject)(value)) {
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            seen.has(value) ? (obj[key] = { circularReference: true }) : (0, exports.removeCircularRefs)(value, seen);
            return;
        }
        if (Array.isArray(value)) {
            value.forEach((val, index) => {
                if (seen.has(val)) {
                    value[index] = { circularReference: true };
                    return;
                }
                if ((0, exports.isTraversableObject)(val)) {
                    (0, exports.removeCircularRefs)(val, seen);
                }
            });
        }
    });
};
exports.removeCircularRefs = removeCircularRefs;
function updateDisplayOptions(displayOptions, properties) {
    return properties.map((nodeProperty) => {
        return {
            ...nodeProperty,
            displayOptions: (0, merge_1.default)({}, nodeProperty.displayOptions, displayOptions),
        };
    });
}
/**
 * Generates a random integer within a specified range.
 *
 * @param {number} min - The lower bound of the range. If `max` is not provided, this value is used as the upper bound and the lower bound is set to 0.
 * @param {number} [max] - The upper bound of the range, not inclusive.
 * @returns {number} A random integer within the specified range.
 */
function randomInt(min, max) {
    if (max === undefined) {
        max = min;
        min = 0;
    }
    const range = max - min;
    const maxUint32 = 0x1_0000_0000;
    if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || !Number.isSafeInteger(range) || range <= 0 || range > maxUint32) {
        throw new RangeError('randomInt bounds must be safe integers with a positive range no larger than 2^32');
    }
    const bucketSize = Math.floor(maxUint32 / range);
    const limit = bucketSize * range;
    let random;
    do {
        random = crypto.getRandomValues(new Uint32Array(1))[0];
    } while (random >= limit);
    return min + Math.floor(random / bucketSize);
}
/**
 * Generates a random alphanumeric string of a specified length, or within a range of lengths.
 *
 * @param {number} minLength - If `maxLength` is not provided, this is the length of the string to generate. Otherwise, this is the lower bound of the range of possible lengths.
 * @param {number} [maxLength] - The upper bound of the range of possible lengths. If provided, the actual length of the string will be a random number between `minLength` and `maxLength`, inclusive.
 * @returns {string} A random alphanumeric string of the specified length or within the specified range of lengths.
 */
function randomString(minLength, maxLength) {
    const length = maxLength === undefined ? minLength : randomInt(minLength, maxLength + 1);
    if (!Number.isInteger(length) || length < 0)
        throw new RangeError('randomString length must be a non-negative integer');
    if (length > 16_384) {
        const error = typeof DOMException === 'function' ? new DOMException('The requested length exceeds the Web Crypto quota', 'QuotaExceededError') : Object.assign(new RangeError('The requested length exceeds the Web Crypto quota'), { name: 'QuotaExceededError' });
        throw error;
    }
    return Array.from({ length }, () => constants_1.ALPHABET[randomInt(constants_1.ALPHABET.length)]).join('');
}
/**
 * Checks if a value is an object with a specific key and provides a type guard for the key.
 */
function hasKey(value, key) {
    return value !== null && typeof value === 'object' && value.hasOwnProperty(key);
}
const unsafeObjectProperties = new Set([
    '__proto__',
    'prototype',
    'constructor',
    'getPrototypeOf',
    'setPrototypeOf',
    'getOwnPropertyDescriptor',
    'getOwnPropertyDescriptors',
    'defineProperty',
    'defineProperties',
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
/**
 * Checks if a property key is safe to use on an object, preventing prototype pollution.
 * setting untrusted properties can alter the object's prototype chain and introduce vulnerabilities.
 *
 * @see setSafeObjectProperty
 */
function isSafeObjectProperty(property) {
    return !unsafeObjectProperties.has(property);
}
const unsafeObjectPropertyTokenPattern = new RegExp(`\\b(?:${[...unsafeObjectProperties]
    .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')})\\b`);
function containsUnsafeObjectPropertyToken(input) {
    return unsafeObjectPropertyTokenPattern.test(input);
}
/**
 * Safely sets a property on an object, preventing prototype pollution.
 *
 * @see isSafeObjectProperty
 */
function setSafeObjectProperty(target, property, value) {
    if (isSafeObjectProperty(property)) {
        target[property] = value;
    }
}
const DANGEROUS_XML_NAMES = new Set(['__proto__', 'constructor', 'prototype']);
function sanitizeXmlName(name) {
    if (DANGEROUS_XML_NAMES.has(name))
        return `sanitized_${name}`;
    return name;
}
const COMMUNITY_PACKAGE_NAME_REGEX = /^(?!@n8n\/)(@[\w.-]+\/)?n8n-nodes-(?!base\b)\b\w+/g;
function isCommunityPackageName(packageName) {
    COMMUNITY_PACKAGE_NAME_REGEX.lastIndex = 0;
    // Community packages names start with <@username/>n8n-nodes- not followed by word 'base'
    const nameMatch = COMMUNITY_PACKAGE_NAME_REGEX.exec(packageName);
    return !!nameMatch;
}
function dedupe(arr) {
    return [...new Set(arr)];
}
/**
 * Extracts a safe filename from a path or filename string.
 *
 * Handles both Unix and Windows path separators, removing directory
 * components and null bytes to return just the filename.
 *
 * @param fileName - The filename or path to sanitize
 * @returns The extracted filename without path components
 *
 * @example
 * sanitizeFilename('path/to/file.txt') // returns 'file.txt'
 * sanitizeFilename('/tmp/upload/doc.pdf') // returns 'doc.pdf'
 * sanitizeFilename('C:\\Users\\file.txt') // returns 'file.txt'
 * sanitizeFilename('../../../etc/passwd') // returns 'passwd'
 */
function sanitizeFilename(fileName) {
    // Normalize to forward slashes first to handle Windows paths on Unix
    const normalized = fileName.replace(/\\/g, '/');
    // Extract just the filename, stripping all directory components
    let sanitized = path_1.default.basename(normalized);
    // Remove null bytes which could be used for null byte injection attacks
    sanitized = sanitized.replace(/\0/g, '');
    // If the result is empty or just dots, use a default name
    if (!sanitized || /^\.+$/.test(sanitized)) {
        sanitized = 'untitled';
    }
    return sanitized;
}
/** Generates a cryptographically secure 64-character hex token (256 bits). */
function generateSecureToken() {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return bytes.reduce((hex, byte) => hex + byte.toString(16).padStart(2, '0'), '');
}
//# sourceMappingURL=utils.js.map