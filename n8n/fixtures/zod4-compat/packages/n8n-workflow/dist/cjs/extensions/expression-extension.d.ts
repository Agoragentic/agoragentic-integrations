import type { ExtensionMap } from "./extensions.js";
export declare const EXTENSION_OBJECTS: ExtensionMap[];
export declare const hasExpressionExtension: (str: string) => boolean;
export declare const hasNativeMethod: (method: string) => boolean;
/**
 * A function to inject an extender function call into the AST of an expression.
 * This uses recast to do the transform.
 *
 * This function also polyfills optional chaining if using extended functions.
 *
 * ```ts
 * 'a'.method('x') // becomes
 * extend('a', 'method', ['x']);
 *
 * 'a'.first('x').second('y') // becomes
 * extend(extend('a', 'first', ['x']), 'second', ['y']));
 * ```
 */
export declare const extendTransform: (expression: string) => {
    code: string;
} | undefined;
/**
 * Extender function injected by expression extension plugin to allow calls to extensions.
 *
 * ```ts
 * extend(input, "functionName", [...args]);
 * ```
 */
export declare function extend(input: unknown, functionName: string, args: unknown[]): any;
export declare function extendOptional(input: unknown, functionName: string): Function | undefined;
export declare function extendSyntax(bracketedExpression: string, forceExtend?: boolean): string;
//# sourceMappingURL=expression-extension.d.ts.map