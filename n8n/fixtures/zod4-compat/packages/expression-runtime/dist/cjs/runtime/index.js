"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const luxon_1 = require("luxon");
const extend_1 = require("../extensions/extend.js");
const safe_globals_1 = require("./safe-globals.js");
const lazy_proxy_1 = require("./lazy-proxy.js");
const context_1 = require("./context.js");
const serialize_1 = require("./serialize.js");
// ============================================================================
// Library Setup
// ============================================================================
// Expose globals required by tournament-transformed expressions
globalThis.extend = extend_1.extend;
globalThis.extendOptional = extend_1.extendOptional;
globalThis.DateTime = luxon_1.DateTime;
globalThis.Duration = luxon_1.Duration;
globalThis.Interval = luxon_1.Interval;
// ============================================================================
// Expose security globals and runtime functions
// ============================================================================
globalThis.SafeObject = safe_globals_1.SafeObject;
globalThis.SafeError = safe_globals_1.SafeError;
globalThis.ExpressionError = safe_globals_1.ExpressionError;
globalThis.createDeepLazyProxy = lazy_proxy_1.createDeepLazyProxy;
globalThis.buildContext = context_1.buildContext;
globalThis.__prepareForTransfer = serialize_1.__prepareForTransfer;
//# sourceMappingURL=index.js.map