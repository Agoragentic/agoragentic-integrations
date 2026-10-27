export interface MetricDef {
    name: string;
    kind: 'counter' | 'gauge' | 'histogram';
    labels: readonly string[];
    help: string;
}
export declare const EXPRESSION_METRICS: {
    readonly evaluationDuration: {
        readonly name: "expression.evaluation.duration_seconds";
        readonly kind: "histogram";
        readonly labels: readonly ["status", "type"];
        readonly help: "Duration of VM-based expression evaluation in seconds.";
    };
    readonly codeCacheHit: {
        readonly name: "expression.code_cache.hit";
        readonly kind: "counter";
        readonly labels: readonly [];
        readonly help: "Expression code cache hits.";
    };
    readonly codeCacheMiss: {
        readonly name: "expression.code_cache.miss";
        readonly kind: "counter";
        readonly labels: readonly [];
        readonly help: "Expression code cache misses.";
    };
    readonly codeCacheEviction: {
        readonly name: "expression.code_cache.eviction";
        readonly kind: "counter";
        readonly labels: readonly [];
        readonly help: "Expression code cache evictions.";
    };
    readonly codeCacheSize: {
        readonly name: "expression.code_cache.size";
        readonly kind: "gauge";
        readonly labels: readonly [];
        readonly help: "Current expression code cache size.";
    };
    readonly poolAcquired: {
        readonly name: "expression.pool.acquired";
        readonly kind: "counter";
        readonly labels: readonly [];
        readonly help: "Bridges acquired from the expression pool.";
    };
    readonly poolReplenishFailed: {
        readonly name: "expression.pool.replenish_failed";
        readonly kind: "counter";
        readonly labels: readonly [];
        readonly help: "Failed pool bridge replenishments.";
    };
    readonly poolScaledUp: {
        readonly name: "expression.pool.scaled_up";
        readonly kind: "counter";
        readonly labels: readonly [];
        readonly help: "Expression pool scaled up from idle.";
    };
    readonly poolScaledToZero: {
        readonly name: "expression.pool.scaled_to_zero";
        readonly kind: "counter";
        readonly labels: readonly [];
        readonly help: "Expression pool scaled to zero after inactivity.";
    };
};
export type ExpressionMetricKey = keyof typeof EXPRESSION_METRICS;
export type ExpressionMetricDef = (typeof EXPRESSION_METRICS)[ExpressionMetricKey];
//# sourceMappingURL=metrics.d.ts.map