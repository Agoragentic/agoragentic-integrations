import { NodeError } from "./abstract/node.error.js";
import type { ErrorLevel } from "@n8n/errors";
import type { INode, JsonObject, Functionality, RelatedExecution } from "../interfaces.js";
export interface NodeOperationErrorOptions {
    message?: string;
    description?: string;
    runIndex?: number;
    itemIndex?: number;
    level?: ErrorLevel;
    messageMapping?: {
        [key: string]: string;
    };
    functionality?: Functionality;
    type?: string;
    metadata?: {
        subExecution?: RelatedExecution;
        parentExecution?: RelatedExecution;
    };
}
interface NodeApiErrorOptions extends NodeOperationErrorOptions {
    message?: string;
    httpCode?: string;
    parseXml?: boolean;
}
/**
 * Class for instantiating an error in an API response, e.g. a 404 Not Found response,
 * with an HTTP error code, an error message and a description.
 */
export declare class NodeApiError extends NodeError {
    httpCode: string | null;
    constructor(node: INode, errorResponse: JsonObject, { message, description, httpCode, parseXml, runIndex, itemIndex, level, functionality, messageMapping, }?: NodeApiErrorOptions);
    private setDescriptionFromXml;
    /**
     * Set the error's message based on the HTTP status code.
     */
    private setDefaultStatusCodeMessage;
}
export {};
//# sourceMappingURL=node-api.error.d.ts.map