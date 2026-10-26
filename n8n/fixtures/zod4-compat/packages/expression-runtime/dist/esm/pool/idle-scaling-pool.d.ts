import type { ObservabilityProvider, RuntimeBridge } from "../types/index.js";
import type { Logger } from "../types/bridge.js";
import type { IPool } from "./isolate-pool.js";
/**
 * Wraps an `IsolatePool`, disposing it after a configured idle period and
 * recreating it on the next acquire. The inner pool either fully exists or
 * does not; callers never observe a partial state.
 */
export declare class IdleScalingPool implements IPool {
    private readonly createBridge;
    private readonly size;
    private readonly idleTimeoutMs?;
    private readonly onReplenishFailed?;
    private readonly logger?;
    private readonly observability?;
    private innerPool;
    private pendingScaleUp;
    private pendingScaleDown;
    private idleTimer?;
    private disposed;
    private disposePromise?;
    constructor(createBridge: () => Promise<RuntimeBridge>, size: number, idleTimeoutMs?: number | undefined, onReplenishFailed?: ((error: unknown) => void) | undefined, logger?: Logger | undefined, observability?: ObservabilityProvider | undefined);
    initialize(): Promise<void>;
    acquire(): RuntimeBridge;
    release(bridge: RuntimeBridge): Promise<void>;
    dispose(): Promise<void>;
    private doDispose;
    waitForReplenishment(): Promise<void>;
    private drainPendingTransitions;
    private createInnerPool;
    private resetIdleTimer;
    private triggerScaleUp;
    private triggerScaleDown;
}
//# sourceMappingURL=idle-scaling-pool.d.ts.map