"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.numberExtensions = void 0;
exports.toDateTime = toDateTime;
const luxon_1 = require("luxon");
const expression_extension_error_1 = require("./expression-extension-error.js");
// DIVERGENCE from packages/workflow/src/extensions/number-extensions.ts:
// The original uses Intl.NumberFormat which is a Web API unavailable inside the
// V8 isolate. toLocaleString is an ECMAScript built-in available in all V8
// contexts and produces the same output.
function format(value, extraArgs) {
    const [locales = 'en-US', config = {}] = extraArgs;
    try {
        return value.toLocaleString(locales, config);
    }
    catch {
        return String(value);
    }
}
function isEven(value) {
    if (!Number.isInteger(value)) {
        throw new expression_extension_error_1.ExpressionExtensionError('isEven() is only callable on integers');
    }
    return value % 2 === 0;
}
function isOdd(value) {
    if (!Number.isInteger(value)) {
        throw new expression_extension_error_1.ExpressionExtensionError('isOdd() is only callable on integers');
    }
    return Math.abs(value) % 2 === 1;
}
function floor(value) {
    return Math.floor(value);
}
function ceil(value) {
    return Math.ceil(value);
}
function abs(value) {
    return Math.abs(value);
}
function isInteger(value) {
    return Number.isInteger(value);
}
function round(value, extraArgs) {
    const [decimalPlaces = 0] = extraArgs;
    return +value.toFixed(decimalPlaces);
}
function toBoolean(value) {
    return value !== 0;
}
function toInt(value) {
    return round(value, []);
}
function toFloat(value) {
    return value;
}
function toDateTime(value, extraArgs) {
    const [valueFormat = 'ms'] = extraArgs;
    if (!['ms', 's', 'us', 'excel'].includes(valueFormat)) {
        throw new expression_extension_error_1.ExpressionExtensionError(`Unsupported format '${String(valueFormat)}'. toDateTime() supports 'ms', 's', 'us' and 'excel'.`);
    }
    switch (valueFormat) {
        // Excel format is days since 1900
        // There is a bug where 1900 is incorrectly treated as a leap year
        case 'excel': {
            const DAYS_BETWEEN_1900_1970 = 25567;
            const DAYS_LEAP_YEAR_BUG_ADJUST = 2;
            const SECONDS_IN_DAY = 86_400;
            return luxon_1.DateTime.fromSeconds((value - (DAYS_BETWEEN_1900_1970 + DAYS_LEAP_YEAR_BUG_ADJUST)) * SECONDS_IN_DAY);
        }
        case 's':
            return luxon_1.DateTime.fromSeconds(value);
        case 'us':
            return luxon_1.DateTime.fromMillis(value / 1000);
        case 'ms':
        default:
            return luxon_1.DateTime.fromMillis(value);
    }
}
ceil.doc = {
    name: 'ceil',
    description: 'Rounds the number up to the next whole number',
    examples: [{ example: '(1.234).ceil()', evaluated: '2' }],
    returnType: 'number',
    docURL: 'https://docs.n8n.io/code/builtin/data-transformation-functions/numbers/#number-ceil',
};
floor.doc = {
    name: 'floor',
    description: 'Rounds the number down to the nearest whole number',
    examples: [{ example: '(1.234).floor()', evaluated: '1' }],
    returnType: 'number',
    docURL: 'https://docs.n8n.io/code/builtin/data-transformation-functions/numbers/#number-floor',
};
isEven.doc = {
    name: 'isEven',
    description: "Returns <code>true</code> if the number is even or <code>false</code> if not. Throws an error if the number isn't a whole number.",
    examples: [
        { example: '(33).isEven()', evaluated: 'false' },
        { example: '(42).isEven()', evaluated: 'true' },
    ],
    returnType: 'boolean',
    docURL: 'https://docs.n8n.io/code/builtin/data-transformation-functions/numbers/#number-isEven',
};
isOdd.doc = {
    name: 'isOdd',
    description: "Returns <code>true</code> if the number is odd or <code>false</code> if not. Throws an error if the number isn't a whole number.",
    examples: [
        { example: '(33).isOdd()', evaluated: 'true' },
        { example: '(42).isOdd()', evaluated: 'false' },
    ],
    returnType: 'boolean',
    docURL: 'https://docs.n8n.io/code/builtin/data-transformation-functions/numbers/#number-isOdd',
};
format.doc = {
    name: 'format',
    description: 'Returns a formatted string representing the number. Useful for formatting for a specific language or currency. The same as <a target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat"><code>Intl.NumberFormat()</code></a>.',
    examples: [
        { example: "(123456.789).format('de-DE')", evaluated: '123.456,789' },
        {
            example: "(123456.789).format('de-DE', {'style': 'currency', 'currency': 'EUR'})",
            evaluated: '123.456,79 €',
        },
    ],
    returnType: 'string',
    args: [
        {
            name: 'locale',
            optional: true,
            description: 'A <a target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#locales_argument">locale tag</a> for formatting the number, e.g. <code>fr-FR</code>, <code>en-GB</code>, <code>pr-BR</code>',
            default: '"en-US"',
            type: 'string',
        },
        {
            name: 'options',
            optional: true,
            description: 'Configuration options for number formatting. <a target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat" target="_blank">More info</a>',
            type: 'object',
        },
    ],
    docURL: 'https://docs.n8n.io/code/builtin/data-transformation-functions/numbers/#number-format',
};
round.doc = {
    name: 'round',
    description: 'Rounds the number to the nearest integer (or decimal place)',
    examples: [
        { example: '(1.256).round()', evaluated: '1' },
        { example: '(1.256).round(1)', evaluated: '1.3' },
        { example: '(1.256).round(2)', evaluated: '1.26' },
    ],
    returnType: 'number',
    args: [
        {
            name: 'decimalPlaces',
            optional: true,
            description: 'The number of decimal places to round to',
            default: '0',
            type: 'number',
        },
    ],
    docURL: 'https://docs.n8n.io/code/builtin/data-transformation-functions/numbers/#number-round',
};
toBoolean.doc = {
    name: 'toBoolean',
    description: 'Returns <code>false</code> for <code>0</code> and <code>true</code> for any other number (including negative numbers).',
    examples: [
        { example: '(12).toBoolean()', evaluated: 'true' },
        { example: '(0).toBoolean()', evaluated: 'false' },
        { example: '(-1.3).toBoolean()', evaluated: 'true' },
    ],
    section: 'cast',
    returnType: 'boolean',
    docURL: 'https://docs.n8n.io/code/builtin/data-transformation-functions/numbers/#number-toBoolean',
};
toDateTime.doc = {
    name: 'toDateTime',
    description: 'Converts a numerical timestamp into a <a target="_blank" href="https://moment.github.io/luxon/api-docs/">Luxon</a> DateTime. The format of the timestamp must be specified if it\'s not in milliseconds. Uses the timezone specified in workflow settings if available; otherwise, it defaults to the timezone set for the instance.',
    examples: [
        { example: "(1708695471).toDateTime('s')", evaluated: '2024-02-23T14:37:51.000+01:00' },
        { example: "(1708695471000).toDateTime('ms')", evaluated: '2024-02-23T14:37:51.000+01:00' },
        { example: "(1708695471000000).toDateTime('us')", evaluated: '2024-02-23T14:37:51.000+01:00' },
        { example: "(45345).toDateTime('excel')", evaluated: '2024-02-23T01:00:00.000+01:00' },
    ],
    section: 'cast',
    returnType: 'DateTime',
    args: [
        {
            name: 'format',
            optional: true,
            description: 'The type of timestamp to convert. Options are <code>ms</code> (for Unix timestamp in milliseconds), <code>s</code> (for Unix timestamp in seconds), <code>us</code> (for Unix timestamp in microseconds) or <code>excel</code> (for days since 1900).',
            default: '"ms"',
            type: 'string',
        },
    ],
    docURL: 'https://docs.n8n.io/code/builtin/data-transformation-functions/numbers/#number-toDateTime',
};
abs.doc = {
    name: 'abs',
    description: "Returns the number's absolute value, i.e. removes any minus sign",
    examples: [
        { example: '(-1.7).abs()', evaluated: '1.7' },
        { example: '(1.7).abs()', evaluated: '1.7' },
    ],
    returnType: 'number',
    docURL: 'https://docs.n8n.io/code/builtin/data-transformation-functions/numbers/#number-abs',
};
isInteger.doc = {
    name: 'isInteger',
    description: 'Returns <code>true</code> if the number is a whole number',
    examples: [
        { example: '(4).isInteger()', evaluated: 'true' },
        { example: '(4.12).isInteger()', evaluated: 'false' },
        { example: '(-4).isInteger()', evaluated: 'true' },
    ],
    returnType: 'boolean',
    docURL: 'https://docs.n8n.io/code/builtin/data-transformation-functions/numbers/#number-isInteger',
};
exports.numberExtensions = {
    typeName: 'Number',
    functions: {
        ceil,
        floor,
        format,
        round,
        abs,
        isInteger,
        isEven,
        isOdd,
        toBoolean,
        toInt,
        toFloat,
        toDateTime,
    },
};
//# sourceMappingURL=number-extensions.js.map