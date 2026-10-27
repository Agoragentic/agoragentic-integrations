"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpressionEvaluator = void 0;
const tournament_1 = require("@n8n/tournament");
const bridge_1 = require("../types/bridge.js");
const errors_1 = require("@n8n/errors");
const idle_scaling_pool_1 = require("../pool/idle-scaling-pool.js");
const isolate_pool_1 = require("../pool/isolate-pool.js");
const metrics_1 = require("../observability/metrics.js");
const error_classification_1 = require("./error-classification.js");
const lru_cache_1 = require("./lru-cache.js");
function recordOutcome(observability, start, status, error) {
    if (!observability)
        return;
    const durationSeconds = (performance.now() - start) / 1000;
    const errorType = error !== undefined ? (0, error_classification_1.classifyExpressionError)(error) : undefined;
    observability.metrics.histogram(metrics_1.EXPRESSION_METRICS.evaluationDuration.name, durationSeconds, {
        status,
        type: errorType ?? 'none',
    });
}
class ExpressionEvaluator {
    config;
    disposed = false;
    // Lazy-initialized tournament instance (expensive to create, reused across evaluations)
    tournament;
    // Cache: template expression → tournament-transformed JavaScript code
    // Cache hit rate in production: ~99.9% (same expressions repeat within a workflow)
    codeCache;
    pool;
    bridgesByCaller = new WeakMap();
    createBridge;
    constructor(config) {
        this.config = config;
        this.codeCache = new lru_cache_1.LruCache(config.maxCodeCacheSize, () => {
            this.config.observability?.metrics.counter(metrics_1.EXPRESSION_METRICS.codeCacheEviction.name, 1);
        });
        const logger = config.logger ?? bridge_1.DEFAULT_BRIDGE_CONFIG.logger;
        this.createBridge = async () => {
            const bridge = config.createBridge();
            await bridge.initialize();
            return bridge;
        };
        const onReplenishFailed = (error) => {
            logger.error('[IsolatePool] Failed to replenish bridge', { error });
            config.observability?.metrics.counter(metrics_1.EXPRESSION_METRICS.poolReplenishFailed.name, 1);
        };
        this.pool =
            config.idleTimeoutMs === undefined
                ? new isolate_pool_1.IsolatePool(this.createBridge, config.poolSize ?? 1, onReplenishFailed, logger)
                : new idle_scaling_pool_1.IdleScalingPool(this.createBridge, config.poolSize ?? 1, config.idleTimeoutMs, onReplenishFailed, logger, config.observability);
    }
    async initialize() {
        await this.pool.initialize();
    }
    async acquire(caller) {
        if (this.bridgesByCaller.has(caller))
            return;
        let bridge;
        try {
            bridge = this.pool.acquire();
        }
        catch (error) {
            if (error instanceof isolate_pool_1.PoolDisposedError)
                throw error;
            if (!(error instanceof isolate_pool_1.PoolExhaustedError))
                throw error;
            bridge = await this.createBridge();
        }
        this.config.observability?.metrics.counter(metrics_1.EXPRESSION_METRICS.poolAcquired.name, 1);
        this.bridgesByCaller.set(caller, bridge);
    }
    evaluate(expression, data, caller, options) {
        if (this.disposed)
            throw new errors_1.IsolateError('Evaluator disposed');
        const bridge = this.getBridge(caller);
        // Transform template expression → sanitized JavaScript (cached)
        const transformedCode = this.getTransformedCode(expression);
        const { observability } = this.config;
        const start = performance.now();
        try {
            const result = bridge.execute(transformedCode, data, {
                timezone: options?.timezone,
            });
            recordOutcome(observability, start, 'success');
            return result;
        }
        catch (error) {
            recordOutcome(observability, start, 'error', error);
            throw error;
        }
    }
    getBridge(caller) {
        const bridge = this.bridgesByCaller.get(caller);
        if (!bridge) {
            throw new errors_1.IsolateError('No bridge acquired for this context. Call acquire() first.');
        }
        // If the isolate died mid-execution (e.g. OOM), all remaining expressions
        // in this execution are expected to fail. Recovery is per-execution, not per-expression.
        if (bridge.isDisposed()) {
            throw new errors_1.IsolateError('Isolate for this caller is no longer available');
        }
        return bridge;
    }
    async release(caller) {
        const bridge = this.bridgesByCaller.get(caller);
        if (!bridge)
            return;
        this.bridgesByCaller.delete(caller);
        await this.pool.release(bridge);
    }
    async waitForReplenishment() {
        await this.pool.waitForReplenishment();
    }
    /**
     * Transform a template expression to executable JavaScript via tournament.
     *
     * Input:  "{{ $json.email }}"
     * Output: JavaScript string with tournament security transforms applied
     *         ($json → this.$json, computed access wrapped in this.__sanitize(), etc.)
     *
     * Result is cached by expression string (tournament AST parsing is expensive).
     */
    getTransformedCode(expression) {
        const cached = this.codeCache.get(expression);
        if (cached !== undefined) {
            this.config.observability?.metrics.counter(metrics_1.EXPRESSION_METRICS.codeCacheHit.name, 1);
            return cached;
        }
        this.config.observability?.metrics.counter(metrics_1.EXPRESSION_METRICS.codeCacheMiss.name, 1);
        if (!this.tournament) {
            // Tournament requires an errorHandler but we only use getExpressionCode()
            // for AST transformation — we never call tournament.execute(), so this
            // handler is never invoked. Runtime errors are handled by the bridge's
            // own E() injection in injectErrorHandler().
            const errorHandler = () => { };
            this.tournament = new tournament_1.Tournament(errorHandler, undefined, undefined, {
                before: this.config.hooks?.before ?? [],
                after: this.config.hooks?.after ?? [],
            });
        }
        const [transformedCode] = this.tournament.getExpressionCode(expression);
        this.codeCache.set(expression, transformedCode);
        this.config.observability?.metrics.gauge(metrics_1.EXPRESSION_METRICS.codeCacheSize.name, this.codeCache.size);
        return transformedCode;
    }
    async dispose() {
        this.disposed = true;
        this.codeCache.clear();
        this.config.observability?.metrics.gauge(metrics_1.EXPRESSION_METRICS.codeCacheSize.name, 0);
        await this.pool.dispose();
    }
    isDisposed() {
        return this.disposed;
    }
}
exports.ExpressionEvaluator = ExpressionEvaluator;
//# sourceMappingURL=expression-evaluator.js.map