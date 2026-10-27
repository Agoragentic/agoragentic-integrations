import type { ExtensionMap } from "./extensions.js";
export declare const EXTENSION_OBJECTS: ExtensionMap[];
/**
 * Property names that must never be accessed via expression extensions.
 * Matches the host-side blocklist in packages/workflow/src/utils.ts.
 */
export declare const UNSAFE_PROPERTY_NAMES: Set<string>;
/**
 * Extender function injected by expression extension plugin to allow calls to extensions.
 *
 * ```ts
 * extend(input, "functionName", [...args]);
 * ```
 */
export declare function extend(input: unknown, functionName: string, args: unknown[]): any;
export declare function extendOptional(input: unknown, functionName: string): Function | undefined;
//# sourceMappingURL=extend.d.ts.map