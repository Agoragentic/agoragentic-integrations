import { ApplicationError, type ErrorLevel } from "@n8n/errors";
import type { INode } from "../interfaces.js";
interface TriggerCloseErrorOptions extends ErrorOptions {
    level: ErrorLevel;
}
export declare class TriggerCloseError extends ApplicationError {
    readonly node: INode;
    constructor(node: INode, { cause, level }: TriggerCloseErrorOptions);
}
export {};
//# sourceMappingURL=trigger-close.error.d.ts.map