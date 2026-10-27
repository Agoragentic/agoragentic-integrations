"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.jmesPath = jmesPath;
const jmespath = __importStar(require("jmespath"));
const safe_globals_1 = require("./safe-globals.js");
const unsafeJmespathProperties = [
    '__proto__',
    'prototype',
    'constructor',
    'getPrototypeOf',
    'setPrototypeOf',
    'getOwnPropertyDescriptor',
    'getOwnPropertyDescriptors',
    'defineProperty',
    'defineProperties',
    'mainModule',
    'binding',
    '_linkedBinding',
    '_load',
    'prepareStackTrace',
    '__lookupGetter__',
    '__lookupSetter__',
    '__defineGetter__',
    '__defineSetter__',
    'caller',
    'arguments',
    'getBuiltinModule',
    'dlopen',
    'execve',
    'loadEnvFile',
];
const unsafeJmespathPropertyPattern = new RegExp(`\\b(?:${unsafeJmespathProperties.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`);
/**
 * In-isolate `$jmespath` / `$jmesPath` implementation.
 *
 * In-isolate counterpart of the host-side wrapper in
 * `packages/workflow/src/workflow-data-proxy.ts`, so that expressions
 * resolve `$jmespath` from the in-isolate runtime via Tournament's
 * polyfill. `$jmespath` is a pure utility — it takes its data as an
 * argument and runs a query on it, with no need for host context.
 * Keeping it in-isolate means it does not appear as a host-callable on
 * the bridge, which shrinks the host-callable surface the isolate can
 * reach.
 *
 * Relationship to the host wrapper — same observable contract,
 * deliberately different internals:
 *   - Throws `ExpressionError` (same name) when args are wrong.
 *   - Rejects queries that contain unsafe property tokens.
 *   - Does NOT spread `data` before querying. Host-side, the top-level
 *     spread exists to strip proxies off the data before handing it to
 *     jmespath; in-isolate that is a no-op (nested values stay lazy
 *     proxies either way, and the isolate boundary already prevents
 *     host-object leakage), while spreading a lazy proxy (e.g. `$json`)
 *     would cost one synchronous host roundtrip per top-level key
 *     before the query even runs.
 *
 * Note on lazy proxies: when `data` is a lazy proxy (e.g. `$json`), each
 * property access during `jmespath.search` triggers a synchronous host
 * roundtrip via `getValueAtPath`. Functional but slow for deep traversals.
 * Performance optimisation (e.g. bulk pre-fetch of the queried subtree) is
 * a follow-up.
 */
function jmesPath(data, query) {
    if (typeof data !== 'object' || typeof query !== 'string') {
        throw new safe_globals_1.ExpressionError('expected two arguments (Object, string) for this function');
    }
    // jmespath decodes escape sequences inside quoted identifiers, so the
    // token check must run against an unescaped query. Reject any backslash
    // up front to keep the property-name match meaningful.
    if (query.includes('\\') || unsafeJmespathPropertyPattern.test(query)) {
        throw new safe_globals_1.ExpressionError('Cannot access this property in a jmespath query due to security concerns');
    }
    return jmespath.search(data, query);
}
//# sourceMappingURL=jmespath.js.map