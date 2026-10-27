/**
 * SafeObject - Blocks dangerous Object methods that could lead to RCE
 *
 * Blocked methods:
 * - defineProperty, setPrototypeOf: Prevent prototype pollution
 * - getOwnPropertyDescriptor: Prevent property descriptor manipulation
 * - __defineGetter__, __defineSetter__: Legacy descriptor manipulation
 */
export declare const SafeObject: ObjectConstructor;
/**
 * SafeError - Blocks stack manipulation methods on Error constructor.
 */
export declare const SafeError: ErrorConstructor;
/**
 * Creates a safe wrapper for Error subclasses (TypeError, SyntaxError, etc.)
 * Blocks the same dangerous properties as SafeError for defense in depth.
 */
export declare function createSafeErrorSubclass<T extends ErrorConstructor>(ErrorClass: T): T;
export declare class ExpressionError extends Error {
    constructor(message: string);
}
export declare function __sanitize(value: unknown): unknown;
//# sourceMappingURL=safe-globals.d.ts.map