import { type BridgeCallbacks } from "./context.js";
declare global {
    namespace globalThis {
        var createDeepLazyProxy: (basePath?: string[]) => Record<string | symbol, unknown>;
        var buildContext: (callbacks: BridgeCallbacks, timezone?: string) => Record<string, unknown>;
        var SafeObject: typeof Object;
        var SafeError: typeof Error;
        var DateTime: typeof import("luxon").DateTime;
        var Duration: typeof import("luxon").Duration;
        var Interval: typeof import("luxon").Interval;
        var __prepareForTransfer: (value: unknown) => unknown;
        var extend: typeof import("../extensions/extend.js").extend;
        var extendOptional: typeof import("../extensions/extend.js").extendOptional;
    }
}
//# sourceMappingURL=index.d.ts.map