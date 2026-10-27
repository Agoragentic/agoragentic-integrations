"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdleScalingPool = void 0;
const metrics_1 = require("../observability/metrics.js");
const isolate_pool_1 = require("./isolate-pool.js");
/**
 * Wraps an `IsolatePool`, disposing it after a configured idle period and
 * recreating it on the next acquire. The inner pool either fully exists or
 * does not; callers never observe a partial state.
 */
class IdleScalingPool {
    createBridge;
    size;
    idleTimeoutMs;
    onReplenishFailed;
    logger;
    observability;
    innerPool = null;
    pendingScaleUp = null;
    pendingScaleDown = null;
    idleTimer;
    disposed = false;
    disposePromise;
    constructor(createBridge, size, idleTimeoutMs, onReplenishFailed, logger, observability) {
        this.createBridge = createBridge;
        this.size = size;
        this.idleTimeoutMs = idleTimeoutMs;
        this.onReplenishFailed = onReplenishFailed;
        this.logger = logger;
        this.observability = observability;
    }
    async initialize() {
        this.innerPool = this.createInnerPool();
        await this.innerPool.initialize();
        this.resetIdleTimer();
    }
    acquire() {
        if (this.disposed)
            throw new isolate_pool_1.PoolDisposedError();
        if (!this.innerPool) {
            this.triggerScaleUp();
            throw new isolate_pool_1.PoolExhaustedError();
        }
        this.resetIdleTimer();
        return this.innerPool.acquire();
    }
    async release(bridge) {
        if (this.innerPool && !this.disposed) {
            // Pool is live: delegate so the inner pool disposes and replenishes.
            await this.innerPool.release(bridge);
        }
        else if (!bridge.isDisposed()) {
            // Pool is idle, disposed, or the bridge came from cold-start fallback:
            // no pool to delegate to, just dispose to free the V8 isolate.
            await bridge.dispose();
        }
    }
    async dispose() {
        return (this.disposePromise ??= this.doDispose());
    }
    async doDispose() {
        this.disposed = true;
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
            this.idleTimer = undefined;
        }
        await this.drainPendingTransitions();
        if (this.innerPool) {
            const toDispose = this.innerPool;
            this.innerPool = null;
            await toDispose.dispose();
        }
    }
    async waitForReplenishment() {
        await this.drainPendingTransitions();
        if (this.innerPool)
            await this.innerPool.waitForReplenishment();
    }
    async drainPendingTransitions() {
        // Snapshot both fields before awaiting so a transition starting between reads
        // can't be missed. Waits for transitions in flight now, not ones started later.
        const promises = [];
        if (this.pendingScaleUp)
            promises.push(this.pendingScaleUp.catch(() => { }));
        if (this.pendingScaleDown)
            promises.push(this.pendingScaleDown.catch(() => { }));
        await Promise.all(promises);
    }
    createInnerPool() {
        return new isolate_pool_1.IsolatePool(this.createBridge, this.size, this.onReplenishFailed, this.logger);
    }
    resetIdleTimer() {
        if (this.idleTimeoutMs === undefined)
            return;
        if (this.idleTimer)
            clearTimeout(this.idleTimer);
        this.idleTimer = setTimeout(() => this.triggerScaleDown(), this.idleTimeoutMs);
        this.idleTimer.unref();
    }
    triggerScaleUp() {
        if (this.pendingScaleUp || this.innerPool || this.disposed)
            return;
        this.logger?.debug('[IdleScalingPool] Scaling up from idle');
        this.observability?.metrics.counter(metrics_1.EXPRESSION_METRICS.poolScaledUp.name, 1);
        const newInner = this.createInnerPool();
        this.pendingScaleUp = newInner
            .initialize()
            .then(async () => {
            if (this.disposed) {
                await newInner.dispose();
                return;
            }
            this.innerPool = newInner;
            this.resetIdleTimer();
        })
            .catch(async (error) => {
            this.logger?.error('[IdleScalingPool] Scale-up failed', { error });
            await newInner.dispose().catch(() => { });
        })
            .finally(() => {
            this.pendingScaleUp = null;
        });
    }
    triggerScaleDown() {
        if (this.pendingScaleDown || this.pendingScaleUp || !this.innerPool || this.disposed)
            return;
        this.logger?.debug('[IdleScalingPool] Scaling to 0 after inactivity', {
            idleTimeoutMs: this.idleTimeoutMs,
        });
        this.observability?.metrics.counter(metrics_1.EXPRESSION_METRICS.poolScaledToZero.name, 1);
        const oldInner = this.innerPool;
        this.innerPool = null;
        this.pendingScaleDown = oldInner
            .dispose()
            .catch((error) => {
            this.logger?.error('[IdleScalingPool] Scale-down dispose failed', { error });
        })
            .finally(() => {
            this.pendingScaleDown = null;
        });
    }
}
exports.IdleScalingPool = IdleScalingPool;
//# sourceMappingURL=idle-scaling-pool.js.map