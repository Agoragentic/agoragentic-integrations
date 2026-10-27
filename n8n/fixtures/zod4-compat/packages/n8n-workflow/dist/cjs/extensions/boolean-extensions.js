"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.booleanExtensions = void 0;
exports.toBoolean = toBoolean;
exports.toInt = toInt;
exports.toDateTime = toDateTime;
function toBoolean(value) {
    return value;
}
function toInt(value) {
    return value ? 1 : 0;
}
function toDateTime() {
    return undefined;
}
const toFloat = toInt;
const toNumber = toInt.bind({});
toNumber.doc = {
    name: 'toNumber',
    description: 'Converts <code>true</code> to <code>1</code> and <code>false</code> to <code>0</code>.',
    examples: [
        { example: 'true.toNumber()', evaluated: '1' },
        { example: 'false.toNumber()', evaluated: '0' },
    ],
    section: 'cast',
    returnType: 'number',
    docURL: 'https://docs.n8n.io/code/builtin/data-transformation-functions/booleans/#boolean-toNumber',
};
exports.booleanExtensions = {
    typeName: 'Boolean',
    functions: {
        toBoolean,
        toInt,
        toFloat,
        toNumber,
        toDateTime,
    },
};
//# sourceMappingURL=boolean-extensions.js.map