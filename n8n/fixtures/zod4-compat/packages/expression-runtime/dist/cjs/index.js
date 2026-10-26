"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpressionExtensionError = exports.EXTENSION_OBJECTS = exports.extendOptional = exports.extend = exports.classifyExpressionError = exports.EXPRESSION_METRICS = exports.NoOpProvider = exports.IsolateError = exports.SyntaxError = exports.SecurityViolationError = exports.TimeoutError = exports.MemoryLimitError = exports.ExpressionError = exports.IsolatedVmBridge = exports.ExpressionEvaluator = void 0;
// Main exports
var expression_evaluator_1 = require("./evaluator/expression-evaluator.js");
Object.defineProperty(exports, "ExpressionEvaluator", { enumerable: true, get: function () { return expression_evaluator_1.ExpressionEvaluator; } });
// Bridge exports — IsolatedVmBridge lazy-loads isolated-vm internally,
// so this value re-export does NOT pull in the native binary at import time.
var isolated_vm_bridge_1 = require("./bridge/isolated-vm-bridge.js");
Object.defineProperty(exports, "IsolatedVmBridge", { enumerable: true, get: function () { return isolated_vm_bridge_1.IsolatedVmBridge; } });
// Error types
var types_1 = require("./types/index.js");
Object.defineProperty(exports, "ExpressionError", { enumerable: true, get: function () { return types_1.ExpressionError; } });
Object.defineProperty(exports, "MemoryLimitError", { enumerable: true, get: function () { return types_1.MemoryLimitError; } });
Object.defineProperty(exports, "TimeoutError", { enumerable: true, get: function () { return types_1.TimeoutError; } });
Object.defineProperty(exports, "SecurityViolationError", { enumerable: true, get: function () { return types_1.SecurityViolationError; } });
Object.defineProperty(exports, "SyntaxError", { enumerable: true, get: function () { return types_1.SyntaxError; } });
var errors_1 = require("@n8n/errors");
Object.defineProperty(exports, "IsolateError", { enumerable: true, get: function () { return errors_1.IsolateError; } });
var noop_provider_1 = require("./observability/noop-provider.js");
Object.defineProperty(exports, "NoOpProvider", { enumerable: true, get: function () { return noop_provider_1.NoOpProvider; } });
var metrics_1 = require("./observability/metrics.js");
Object.defineProperty(exports, "EXPRESSION_METRICS", { enumerable: true, get: function () { return metrics_1.EXPRESSION_METRICS; } });
var error_classification_1 = require("./evaluator/error-classification.js");
Object.defineProperty(exports, "classifyExpressionError", { enumerable: true, get: function () { return error_classification_1.classifyExpressionError; } });
// Extension runtime exports
var extend_1 = require("./extensions/extend.js");
Object.defineProperty(exports, "extend", { enumerable: true, get: function () { return extend_1.extend; } });
Object.defineProperty(exports, "extendOptional", { enumerable: true, get: function () { return extend_1.extendOptional; } });
Object.defineProperty(exports, "EXTENSION_OBJECTS", { enumerable: true, get: function () { return extend_1.EXTENSION_OBJECTS; } });
var expression_extension_error_1 = require("./extensions/expression-extension-error.js");
Object.defineProperty(exports, "ExpressionExtensionError", { enumerable: true, get: function () { return expression_extension_error_1.ExpressionExtensionError; } });
//# sourceMappingURL=index.js.map