import { ExecutionBaseError } from "./execution-base.error.js";
import type { INode, JsonObject } from "../../interfaces.js";
/**
 * Base class for specific NodeError-types, with functionality for finding
 * a value recursively inside an error object.
 */
export declare abstract class NodeError extends ExecutionBaseError {
    readonly node: INode;
    messages: string[];
    constructor(node: INode, error: Error | JsonObject);
    /**
     * Finds property through exploration based on potential keys and traversal keys.
     * Depth-first approach.
     *
     * This method iterates over `potentialKeys` and, if the value at the key is a
     * truthy value, the type of the value is checked:
     * (1) if a string or number, the value is returned as a string; or
     * (2) if an array,
     * 		its string or number elements are collected as a long string,
     * 		its object elements are traversed recursively (restart this function
     *    with each object as a starting point), or
     * (3) if it is an object, it traverses the object and nested ones recursively
     * 		based on the `potentialKeys` and returns a string if found.
     *
     * If nothing found via `potentialKeys` this method iterates over `traversalKeys` and
     * if the value at the key is a traversable object, it restarts with the object as the
     * new starting point (recursion).
     * If nothing found for any of the `traversalKeys`, exploration continues with remaining
     * `traversalKeys`.
     *
     * Otherwise, if all the paths have been exhausted and no value is eligible, `null` is
     * returned.
     *
     */
    protected findProperty(jsonError: JsonObject, potentialKeys: string[], traversalKeys?: string[]): string | null;
    /**
     * Preserve the original error message before setting the new one
     */
    protected addToMessages(message: string): void;
    /**
     * Set descriptive error message if code is provided or if message contains any of the common errors,
     * update description to include original message plus the description
     */
    protected setDescriptiveErrorMessage(message: string, messages: string[], code?: string | null, messageMapping?: {
        [key: string]: string;
    }): [string, string[]];
}
//# sourceMappingURL=node.error.d.ts.map