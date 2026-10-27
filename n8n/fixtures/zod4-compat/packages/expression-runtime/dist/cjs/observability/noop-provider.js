"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoOpProvider = void 0;
const noopSpan = {
    setStatus() { },
    setAttribute() { },
    recordException() { },
    end() { },
};
const noopMetrics = {
    counter() { },
    gauge() { },
    histogram() { },
};
const noopTraces = {
    startSpan: () => noopSpan,
};
const noopLogs = {
    error() { },
    warn() { },
    info() { },
    debug() { },
};
exports.NoOpProvider = {
    metrics: noopMetrics,
    traces: noopTraces,
    logs: noopLogs,
};
//# sourceMappingURL=noop-provider.js.map