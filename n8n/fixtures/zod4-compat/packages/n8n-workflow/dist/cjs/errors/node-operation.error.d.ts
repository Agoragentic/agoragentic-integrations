import { NodeError } from "./abstract/node.error.js";
import type { NodeOperationErrorOptions } from "./node-api.error.js";
import type { INode, JsonObject } from "../interfaces.js";
/**
 * Class for instantiating an operational error, e.g. an invalid credentials error.
 */
export declare class NodeOperationError extends NodeError {
    type: string | undefined;
    constructor(node: INode, error: Error | string | JsonObject, options?: NodeOperationErrorOptions);
}
//# sourceMappingURL=node-operation.error.d.ts.map