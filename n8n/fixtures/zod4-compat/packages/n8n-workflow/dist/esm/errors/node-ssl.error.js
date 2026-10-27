import { ExecutionBaseError } from "./abstract/execution-base.error.js";
export class NodeSslError extends ExecutionBaseError {
    constructor(cause) {
        super("SSL Issue: consider using the 'Ignore SSL issues' option", { cause });
    }
}
//# sourceMappingURL=node-ssl.error.js.map