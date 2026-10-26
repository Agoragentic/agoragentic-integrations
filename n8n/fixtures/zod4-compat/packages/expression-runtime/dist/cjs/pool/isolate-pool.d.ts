import type { RuntimeBridge } from "../types/index.js";
import type { Logger } from "../types/bridge.js";
import { IsolateError } from "@n8n/errors";
export declare class PoolDisposedError extends IsolateError {
    constructor();
}
export declare class PoolExhaustedError extends IsolateError {
    constructor();
}
/** Public contract shared by IsolatePool and IdleScalingPool. */
export interface IPool {
    initialize(): Promise<void>;
    acquire(): RuntimeBridge;
    release(bridge: RuntimeBridge): Promise<void>;
    dispose(): Promise<void>;
    waitForReplenishment(): Promise<void>;
}
export declare class IsolatePool implements IPool {
    private readonly createBridge;
    private readonly size;
    private readonly onReplenishFailed?;
    private readonly logger?;
    private bridges;
    private disposed;
    /** Number of bridges currently being created. */
    private warming;
    /** In-flight isolate replenishment promises. */
    private replenishPromises;
    constructor(createBridge: () => Promise<RuntimeBridge>, size: number, onReplenishFailed?: ((error: unknown) => void) | undefined, logger?: Logger | undefined);
    initialize(): Promise<void>;
    /**
     * Pops a warm bridge from the pool. Kickstarts replenishment.
     * Throws if disposed or pool is empty. Callers are expected to handle the empty case by falling back to cold-start bridge creation.
     */
    acquire(): RuntimeBridge;
    release(bridge: RuntimeBridge): Promise<void>;
    dispose(): Promise<void>;
    private static readonly MAX_REPLENISH_RETRIES;
    private static readonly REPLENISH_RETRY_BASE_MS;
    waitForReplenishment(): Promise<void>;
    private replenish;
}
//# sourceMappingURL=isolate-pool.d.ts.map