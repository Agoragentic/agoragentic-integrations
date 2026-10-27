"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeMethods = void 0;
const array_methods_1 = require("./array.methods.js");
const boolean_methods_1 = require("./boolean.methods.js");
const number_methods_1 = require("./number.methods.js");
const object_methods_1 = require("./object.methods.js");
const string_methods_1 = require("./string.methods.js");
const NATIVE_METHODS = [
    string_methods_1.stringMethods,
    array_methods_1.arrayMethods,
    number_methods_1.numberMethods,
    object_methods_1.objectMethods,
    boolean_methods_1.booleanMethods,
];
exports.NativeMethods = NATIVE_METHODS;
//# sourceMappingURL=index.js.map