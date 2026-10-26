export { ExpressionEvaluator } from "./evaluator/expression-evaluator.js";
export { IsolatedVmBridge } from "./bridge/isolated-vm-bridge.js";
export type { IExpressionEvaluator, EvaluatorConfig, WorkflowData, EvaluateOptions, ExecuteOptions, RuntimeBridge, BridgeConfig, Logger, ObservabilityProvider, MetricsAPI, TracesAPI, Span, LogsAPI, } from "./types/index.js";
export { ExpressionError, MemoryLimitError, TimeoutError, SecurityViolationError, SyntaxError, } from "./types/index.js";
export { IsolateError } from "@n8n/errors";
export { NoOpProvider } from "./observability/noop-provider.js";
export { EXPRESSION_METRICS } from "./observability/metrics.js";
export type { ExpressionMetricDef, ExpressionMetricKey, MetricDef } from "./observability/metrics.js";
export { classifyExpressionError } from "./evaluator/error-classification.js";
export type { ExpressionErrorType } from "./evaluator/error-classification.js";
export { extend, extendOptional, EXTENSION_OBJECTS } from "./extensions/extend.js";
export { ExpressionExtensionError } from "./extensions/expression-extension-error.js";
//# sourceMappingURL=index.d.ts.map