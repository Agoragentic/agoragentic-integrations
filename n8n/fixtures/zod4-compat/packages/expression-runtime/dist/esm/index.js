// Main exports
export { ExpressionEvaluator } from "./evaluator/expression-evaluator.js";
// Bridge exports — IsolatedVmBridge lazy-loads isolated-vm internally,
// so this value re-export does NOT pull in the native binary at import time.
export { IsolatedVmBridge } from "./bridge/isolated-vm-bridge.js";
// Error types
export { ExpressionError, MemoryLimitError, TimeoutError, SecurityViolationError, SyntaxError, } from "./types/index.js";
export { IsolateError } from "@n8n/errors";
export { NoOpProvider } from "./observability/noop-provider.js";
export { EXPRESSION_METRICS } from "./observability/metrics.js";
export { classifyExpressionError } from "./evaluator/error-classification.js";
// Extension runtime exports
export { extend, extendOptional, EXTENSION_OBJECTS } from "./extensions/extend.js";
export { ExpressionExtensionError } from "./extensions/expression-extension-error.js";
//# sourceMappingURL=index.js.map