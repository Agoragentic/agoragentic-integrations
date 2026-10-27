import type { BinaryFileType, IDisplayOptions, INodeProperties, JsonObject } from "./interfaces.js";
/**
 * Type guard for plain objects suitable for key-based traversal/serialization.
 *
 * Returns `true` for objects whose prototype is `Object.prototype` (object literals)
 * or `null` (`Object.create(null)`), and `false` for arrays and non-plain objects
 * such as `Date`, `Map`, `Set`, and class instances.
 */
export declare function isObject(value: unknown): value is Record<string, unknown>;
export declare const isObjectEmpty: (obj: object | null | undefined) => boolean;
export type Primitives = string | number | boolean | bigint | symbol | null | undefined;
export declare const deepCopy: <T extends ((object | Date) & {
    toJSON?: () => string;
}) | Primitives>(source: T, hash?: WeakMap<object, any>, path?: string) => T;
type MutuallyExclusive<T, U> = (T & {
    [k in Exclude<keyof U, keyof T>]?: never;
}) | (U & {
    [k in Exclude<keyof T, keyof U>]?: never;
});
type JSONParseOptions<T> = {
    acceptJSObject?: boolean;
    repairJSON?: boolean;
} & MutuallyExclusive<{
    errorMessage?: string;
}, {
    fallbackValue?: T;
}>;
/**
 * Parses a JSON string into an object with optional error handling and recovery mechanisms.
 *
 * @param {string} jsonString - The JSON string to parse.
 * @param {Object} [options] - Optional settings for parsing the JSON string. Either `fallbackValue` or `errorMessage` can be set, but not both.
 * @param {boolean} [options.acceptJSObject=false] - If true, attempts to recover from common JSON format errors by parsing the JSON string as a JavaScript Object.
 * @param {boolean} [options.repairJSON=false] - If true, attempts to repair common JSON format errors by repairing the JSON string.
 * @param {string} [options.errorMessage] - A custom error message to throw if the JSON string cannot be parsed.
 * @param {*} [options.fallbackValue] - A fallback value to return if the JSON string cannot be parsed.
 * @returns {Object} - The parsed object, or the fallback value if parsing fails and `fallbackValue` is set.
 */
export declare const jsonParse: <T>(jsonString: string, options?: JSONParseOptions<T>) => T;
type JSONStringifyOptions = {
    replaceCircularRefs?: boolean;
};
/**
 * Decodes a Base64 string with proper UTF-8 character handling.
 *
 * @param str - The Base64 string to decode
 * @returns The decoded UTF-8 string
 */
export declare const base64DecodeUTF8: (str: string) => string;
export declare const replaceCircularReferences: <T>(value: T, knownObjects?: WeakSet<object>) => T;
export declare const jsonStringify: (obj: unknown, options?: JSONStringifyOptions) => string;
export declare const sleep: (ms: number) => Promise<void>;
export declare const sleepWithAbort: (ms: number, abortSignal?: AbortSignal) => Promise<void>;
export declare function fileTypeFromMimeType(mimeType: string): BinaryFileType | undefined;
export declare function assert<T>(condition: T, msg?: string): asserts condition;
export declare const isTraversableObject: (value: any) => value is JsonObject;
export declare const removeCircularRefs: (obj: JsonObject, seen?: Set<unknown>) => void;
export declare function updateDisplayOptions(displayOptions: IDisplayOptions, properties: INodeProperties[]): {
    displayOptions: IDisplayOptions;
    displayName: string;
    name: string;
    type: import("./interfaces.js").NodePropertyTypes;
    typeOptions?: import("./interfaces.js").INodePropertyTypeOptions;
    default: import("./interfaces.js").NodeParameterValueType;
    description?: string;
    hint?: string;
    builderHint?: import("./interfaces.js").IParameterBuilderHint;
    disabledOptions?: IDisplayOptions;
    envFeatureFlag?: Uppercase<string>;
    options?: Array<import("./interfaces.js").INodePropertyOptions | INodeProperties | import("./interfaces.js").INodePropertyCollection>;
    placeholder?: string;
    isNodeSetting?: boolean;
    noDataExpression?: boolean;
    required?: boolean;
    routing?: import("./interfaces.js").INodePropertyRouting;
    credentialTypes?: Array<"extends:oAuth2Api" | "extends:oAuth1Api" | "has:authenticate" | "has:genericAuth">;
    extractValue?: import("./interfaces.js").INodePropertyValueExtractor;
    modes?: import("./interfaces.js").INodePropertyMode[];
    requiresDataPath?: "single" | "multiple";
    doNotInherit?: boolean;
    validateType?: import("./interfaces.js").FieldType;
    ignoreValidationDuringExecution?: boolean;
    allowArbitraryValues?: boolean;
    resolvableField?: boolean;
}[];
export declare function randomInt(max: number): number;
export declare function randomInt(min: number, max: number): number;
export declare function randomString(length: number): string;
export declare function randomString(minLength: number, maxLength: number): string;
/**
 * Checks if a value is an object with a specific key and provides a type guard for the key.
 */
export declare function hasKey<T extends PropertyKey>(value: unknown, key: T): value is Record<T, unknown>;
/**
 * Checks if a property key is safe to use on an object, preventing prototype pollution.
 * setting untrusted properties can alter the object's prototype chain and introduce vulnerabilities.
 *
 * @see setSafeObjectProperty
 */
export declare function isSafeObjectProperty(property: string): boolean;
export declare function containsUnsafeObjectPropertyToken(input: string): boolean;
/**
 * Safely sets a property on an object, preventing prototype pollution.
 *
 * @see isSafeObjectProperty
 */
export declare function setSafeObjectProperty(target: Record<string, unknown>, property: string, value: unknown): void;
export declare function sanitizeXmlName(name: string): string;
export declare function isCommunityPackageName(packageName: string): boolean;
export declare function dedupe<T>(arr: T[]): T[];
/**
 * Extracts a safe filename from a path or filename string.
 *
 * Handles both Unix and Windows path separators, removing directory
 * components and null bytes to return just the filename.
 *
 * @param fileName - The filename or path to sanitize
 * @returns The extracted filename without path components
 *
 * @example
 * sanitizeFilename('path/to/file.txt') // returns 'file.txt'
 * sanitizeFilename('/tmp/upload/doc.pdf') // returns 'doc.pdf'
 * sanitizeFilename('C:\\Users\\file.txt') // returns 'file.txt'
 * sanitizeFilename('../../../etc/passwd') // returns 'passwd'
 */
export declare function sanitizeFilename(fileName: string): string;
/** Generates a cryptographically secure 64-character hex token (256 bits). */
export declare function generateSecureToken(): string;
export {};
//# sourceMappingURL=utils.d.ts.map