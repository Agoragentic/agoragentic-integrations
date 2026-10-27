"use strict";
/**
 * Expression Runtime Types
 *
 * This module exports all TypeScript interfaces and types for the expression runtime.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyntaxError = exports.SecurityViolationError = exports.TimeoutError = exports.MemoryLimitError = exports.ExpressionError = exports.RuntimeError = exports.DEFAULT_BRIDGE_CONFIG = void 0;
var bridge_1 = require("./bridge.js");
Object.defineProperty(exports, "DEFAULT_BRIDGE_CONFIG", { enumerable: true, get: function () { return bridge_1.DEFAULT_BRIDGE_CONFIG; } });
// Runtime types
var runtime_1 = require("./runtime.js");
Object.defineProperty(exports, "RuntimeError", { enumerable: true, get: function () { return runtime_1.RuntimeError; } });
var evaluator_1 = require("./evaluator.js");
Object.defineProperty(exports, "ExpressionError", { enumerable: true, get: function () { return evaluator_1.ExpressionError; } });
Object.defineProperty(exports, "MemoryLimitError", { enumerable: true, get: function () { return evaluator_1.MemoryLimitError; } });
Object.defineProperty(exports, "TimeoutError", { enumerable: true, get: function () { return evaluator_1.TimeoutError; } });
Object.defineProperty(exports, "SecurityViolationError", { enumerable: true, get: function () { return evaluator_1.SecurityViolationError; } });
Object.defineProperty(exports, "SyntaxError", { enumerable: true, get: function () { return evaluator_1.SyntaxError; } });
//# sourceMappingURL=index.js.map