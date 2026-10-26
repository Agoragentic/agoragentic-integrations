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
export const NoOpProvider = {
    metrics: noopMetrics,
    traces: noopTraces,
    logs: noopLogs,
};
//# sourceMappingURL=noop-provider.js.map