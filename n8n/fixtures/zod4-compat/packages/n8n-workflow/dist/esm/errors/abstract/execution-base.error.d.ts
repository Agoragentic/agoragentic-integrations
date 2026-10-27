import { ApplicationError, type ReportingOptions } from "@n8n/errors";
import type { Functionality, IDataObject, JsonObject } from "../../interfaces.js";
interface ExecutionBaseErrorOptions extends ReportingOptions {
    cause?: Error;
    errorResponse?: JsonObject;
}
export declare abstract class ExecutionBaseError extends ApplicationError {
    description: string | null | undefined;
    cause?: Error;
    errorResponse?: JsonObject;
    timestamp: number;
    context: IDataObject;
    lineNumber: number | undefined;
    functionality: Functionality;
    constructor(message: string, options?: ExecutionBaseErrorOptions);
    toJSON?(): {
        message: string;
        lineNumber: number | undefined;
        timestamp: number;
        name: string;
        description: string | null | undefined;
        context: IDataObject;
        cause: Error | undefined;
    };
}
export {};
//# sourceMappingURL=execution-base.error.d.ts.map