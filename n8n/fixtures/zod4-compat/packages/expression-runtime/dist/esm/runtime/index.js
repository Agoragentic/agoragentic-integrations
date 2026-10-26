import { DateTime, Duration, Interval } from "luxon";
import { extend, extendOptional } from "../extensions/extend.js";
import { SafeObject, SafeError, ExpressionError } from "./safe-globals.js";
import { createDeepLazyProxy } from "./lazy-proxy.js";
import { buildContext } from "./context.js";
import { __prepareForTransfer } from "./serialize.js";
// ============================================================================
// Library Setup
// ============================================================================
// Expose globals required by tournament-transformed expressions
globalThis.extend = extend;
globalThis.extendOptional = extendOptional;
globalThis.DateTime = DateTime;
globalThis.Duration = Duration;
globalThis.Interval = Interval;
// ============================================================================
// Expose security globals and runtime functions
// ============================================================================
globalThis.SafeObject = SafeObject;
globalThis.SafeError = SafeError;
globalThis.ExpressionError = ExpressionError;
globalThis.createDeepLazyProxy = createDeepLazyProxy;
globalThis.buildContext = buildContext;
globalThis.__prepareForTransfer = __prepareForTransfer;
//# sourceMappingURL=index.js.map