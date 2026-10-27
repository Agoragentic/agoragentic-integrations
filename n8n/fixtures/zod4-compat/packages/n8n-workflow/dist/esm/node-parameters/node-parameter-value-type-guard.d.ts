import type { AssignmentCollectionValue, INodeParameters, NodeParameterValue, NodeParameterValueType } from "../interfaces.js";
/**
 * Type guard for primitive NodeParameterValue types.
 * Checks if a value is string, number, boolean, undefined, or null.
 */
export declare function isNodeParameterValue(value: unknown): value is NodeParameterValue;
/**
 * Type guard for AssignmentCollectionValue.
 * Checks if a value has the structure of an assignment collection.
 */
export declare function isAssignmentCollectionValue(value: unknown): value is AssignmentCollectionValue;
/**
 * Type guard for INodeParameters.
 * Recursively validates that all values in the object are valid NodeParameterValueType.
 */
export declare function isNodeParameters(value: unknown): value is INodeParameters;
/**
 * Comprehensive type guard for NodeParameterValueType.
 * Validates that a value matches any of the valid node parameter value types.
 *
 * @param value - The value to check
 * @returns true if the value is a valid NodeParameterValueType
 *
 * @example
 * ```typescript
 * const value: unknown = { foo: 'bar' };
 * if (isValidNodeParameterValueType(value)) {
 *   // value is now typed as NodeParameterValueType
 * }
 * ```
 */
export declare function isValidNodeParameterValueType(value: unknown): value is NodeParameterValueType;
/**
 * Assertion function that throws if the value is not a valid NodeParameterValueType.
 * Useful for runtime validation with TypeScript type narrowing.
 *
 * @param value - The value to validate
 * @param errorMessage - Optional custom error message
 * @throws Error if the value is not a valid NodeParameterValueType
 *
 * @example
 * ```typescript
 * const value: unknown = getData();
 * assertIsValidNodeParameterValueType(value);
 * // value is now typed as NodeParameterValueType
 * ```
 */
export declare function assertIsValidNodeParameterValueType(value: unknown, errorMessage?: string): asserts value is NodeParameterValueType;
//# sourceMappingURL=node-parameter-value-type-guard.d.ts.map