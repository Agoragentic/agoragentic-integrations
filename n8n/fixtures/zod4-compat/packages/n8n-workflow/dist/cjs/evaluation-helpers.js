"use strict";
/**
 * Evaluation-related utility functions
 *
 * This file contains utilities that need to be shared between different packages
 * to avoid circular dependencies. For example, the evaluation test-runner (in CLI package)
 * and the Evaluation node (in nodes-base package) both need to know which metrics
 * require AI model connections, but they can't import from each other directly.
 *
 * By placing shared utilities here in the workflow package (which both packages depend on),
 * we avoid circular dependency issues.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_EVALUATION_METRIC = void 0;
exports.metricRequiresModelConnection = metricRequiresModelConnection;
/**
 * Default metric type used in evaluations
 */
exports.DEFAULT_EVALUATION_METRIC = 'correctness';
/**
 * Determines if a given evaluation metric requires an AI model connection
 * @param metric The metric name to check
 * @returns true if the metric requires an AI model connection
 */
function metricRequiresModelConnection(metric) {
    return ['correctness', 'helpfulness'].includes(metric);
}
//# sourceMappingURL=evaluation-helpers.js.map