"use strict";
// ============================================================================
// Phase 1.1: Bridge Interface (CORE - IMPLEMENT FIRST)
//
// This is the main interface all environments must implement.
// Start here for CLI/backend (IsolatedVmBridge) or frontend (WebWorkerBridge).
// ============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_BRIDGE_CONFIG = void 0;
const NO_OP_LOGGER = {
    error: () => { },
    warn: () => { },
    info: () => { },
    debug: () => { },
};
/** Default values for BridgeConfig. Bridge implementations should use this as their baseline. */
exports.DEFAULT_BRIDGE_CONFIG = {
    memoryLimit: 128,
    timeout: 5000,
    logger: NO_OP_LOGGER,
};
//# sourceMappingURL=bridge.js.map