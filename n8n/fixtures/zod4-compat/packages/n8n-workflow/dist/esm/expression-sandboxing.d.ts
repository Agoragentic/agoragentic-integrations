import { type ASTAfterHook, type ASTBeforeHook } from "@n8n/tournament";
export declare const sanitizerName = "__sanitize";
export declare const DOLLAR_SIGN_ERROR = "Cannot access \"$\" without calling it as a function";
/**
 * Prevents regular functions from binding their `this` to the Node.js global.
 */
export declare const ThisSanitizer: ASTBeforeHook;
/**
 * Validates that the $ identifier is only used in allowed contexts.
 * This prevents user errors like `{{ $ }}` which would return the function object itself.
 *
 * Allowed contexts:
 * - As a function call: $()
 * - As a property name: obj.$ (where $ is a valid property name in JavaScript)
 *
 * Disallowed contexts:
 * - Bare identifier: $
 * - As object in member expression: $.property
 * - In expressions: "prefix" + $, [1, 2, $], etc.
 */
export declare const DollarSignValidator: ASTAfterHook;
export declare const PrototypeSanitizer: ASTAfterHook;
export declare const sanitizer: (value: unknown) => unknown;
//# sourceMappingURL=expression-sandboxing.d.ts.map