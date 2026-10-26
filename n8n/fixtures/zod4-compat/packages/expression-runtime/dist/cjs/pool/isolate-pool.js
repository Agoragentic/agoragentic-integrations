"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IsolatePool = exports.PoolExhaustedError = exports.PoolDisposedError = void 0;
const errors_1 = require("@n8n/errors");
class PoolDisposedError extends errors_1.IsolateError {
    constructor() {
        super('Pool is disposed');
        this.name = 'PoolDisposedError';
    }
}
exports.PoolDisposedError = PoolDisposedError;
class PoolExhaustedError extends errors_1.IsolateError {
    constructor() {
        super('No isolate bridge available in pool');
        this.name = 'PoolExhaustedError';
    }
}
exports.PoolExhaustedError = PoolExhaustedError;
class IsolatePool {
    createBridge;
    size;
    onReplenishFailed;
    logger;
    bridges = [];
    disposed = false;
    /** Number of bridges currently being created. */
    warming = 0;
    /** In-flight isolate replenishment promises. */
    replenishPromises = new Set();
    constructor(createBridge, size, onReplenishFailed, logger) {
        this.createBridge = createBridge;
        this.size = size;
        this.onReplenishFailed = onReplenishFailed;
        this.logger = logger;
    }
    async initialize() {
        const results = await Promise.allSettled(Array.from({ length: this.size }, () => this.createBridge()));
        for (const result of results) {
            if (result.status === 'fulfilled') {
                this.bridges.push(result.value);
            }
            else {
                this.logger?.error('[IsolatePool] Failed to create bridge during init', {
                    error: result.reason,
                });
            }
        }
        if (this.bridges.length === 0) {
            throw new errors_1.IsolateError('IsolatePool failed to create any bridges');
        }
    }
    /**
     * Pops a warm bridge from the pool. Kickstarts replenishment.
     * Throws if disposed or pool is empty. Callers are expected to handle the empty case by falling back to cold-start bridge creation.
     */
    acquire() {
        if (this.disposed)
            throw new PoolDisposedError();
        const bridge = this.bridges.shift();
        if (!bridge)
            throw new PoolExhaustedError();
        void this.replenish();
        return bridge;
    }
    async release(bridge) {
        if (!bridge.isDisposed())
            await bridge.dispose();
        this.replenish();
    }
    async dispose() {
        this.disposed = true;
        await Promise.all([...this.replenishPromises]);
        await Promise.all(this.bridges.map((b) => b.dispose()));
        this.bridges = [];
    }
    static MAX_REPLENISH_RETRIES = 3;
    static REPLENISH_RETRY_BASE_MS = 500;
    async waitForReplenishment() {
        if (this.replenishPromises.size > 0) {
            await Promise.all([...this.replenishPromises]);
        }
    }
    replenish(attempt = 0) {
        if (this.disposed)
            return;
        if (this.bridges.length + this.warming >= this.size)
            return;
        this.warming++;
        let promise;
        promise = this.createBridge()
            .then((bridge) => {
            this.warming--;
            this.replenishPromises.delete(promise);
            if (this.disposed) {
                void bridge.dispose();
                return;
            }
            this.bridges.push(bridge);
        })
            .catch((error) => {
            this.warming--;
            this.replenishPromises.delete(promise);
            this.onReplenishFailed?.(error);
            if (attempt < IsolatePool.MAX_REPLENISH_RETRIES) {
                const delay = IsolatePool.REPLENISH_RETRY_BASE_MS * 2 ** attempt;
                setTimeout(() => this.replenish(attempt + 1), delay).unref();
            }
        });
        this.replenishPromises.add(promise);
    }
}
exports.IsolatePool = IsolatePool;
//# sourceMappingURL=isolate-pool.js.map