/**
 * Serialized error sentinel returned by host-side bridge callbacks.
 * When a callback throws, the bridge catches the error and returns this
 * sentinel instead of letting it cross the isolate boundary (which strips
 * custom class identity and properties).
 */
export interface ErrorSentinel {
    __isError: true;
    name: string;
    message: string;
    stack?: string;
    extra?: Record<string, unknown>;
}
interface ObjectMetadata {
    __isObject: true;
    __keys: string[];
}
interface ArrayMetadata {
    __isArray: true;
    __length: number;
}
export declare function isObjectMetadata(value: unknown): value is ObjectMetadata;
export declare function isArrayMetadata(value: unknown): value is ArrayMetadata;
/**
 * If `value` is an error sentinel from a host-side callback, throw it
 * directly. The isolate's outer try-catch will detect __isError and
 * return it as the result. Error reconstruction happens on the host only.
 */
export declare function throwIfErrorSentinel(value: unknown): void;
/** Returns true if `obj` is a deep lazy proxy created by createDeepLazyProxy. */
export declare function isLazyProxy(obj: unknown): boolean;
/** Returns the basePath the proxy was created with, or undefined if not a proxy. */
export declare function getProxyPath(obj: object): string[] | undefined;
/**
 * Tagged-union shape descriptor for a deep lazy proxy.
 *
 * - `object` proxies wrap a plain object target. `keys` is optional —
 *   when omitted, ownKeys/Object.keys() trigger a lazy `getValueAtPath`
 *   round-trip to fetch them.
 * - `array` proxies wrap an array target so `Array.isArray(proxy)` is `true`
 *   and structured clone / `Array.prototype.map` iterate indices correctly.
 */
export type ProxyMeta = {
    kind: 'object';
    keys?: string[];
} | {
    kind: 'array';
    length: number;
};
/**
 * Creates a deep lazy-loading proxy for workflow data.
 *
 * This proxy system enables on-demand loading of nested properties across
 * the isolate boundary using metadata-driven callbacks.
 *
 * Pattern:
 * 1. When property accessed: Call getValueAtPath([path]) to get metadata
 * 2. Metadata indicates type: primitive, object, or array
 * 3. For objects/arrays: Create nested proxy (shape-matched) for lazy loading
 * 4. Cache all fetched values in target to avoid repeated callbacks
 *
 * Callable host bindings (`$('Foo').first()`, `$items()`, etc.) do not flow
 * through this proxy — they are wired as in-isolate stubs on `target` that
 * route through the typed-RPC dispatcher (`callHost`).
 *
 * @param basePath - Current path in object tree (e.g., ['$json', 'user'])
 * @param meta - Optional shape descriptor (object/array + known keys/length)
 * @param callbacks - ivm.Reference callbacks for cross-isolate communication
 * @returns Proxy object with lazy loading behavior
 */
export declare function createDeepLazyProxy(basePath?: string[], meta?: ProxyMeta, callbacks?: {
    getValueAtPath: any;
    getArrayElement: any;
}): Record<string | symbol, unknown>;
export {};
//# sourceMappingURL=lazy-proxy.d.ts.map