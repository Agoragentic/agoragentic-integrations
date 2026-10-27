import { NodeError } from "./abstract/node.error.js";
import { ApplicationError } from "@n8n/errors";
/**
 * Class for instantiating an operational error, e.g. an invalid credentials error.
 */
export class NodeOperationError extends NodeError {
    type;
    constructor(node, error, options = {}) {
        if (error instanceof NodeOperationError) {
            return error;
        }
        if (typeof error === 'string') {
            error = new ApplicationError(error, { level: options.level ?? 'warning' });
        }
        super(node, error);
        if (error instanceof NodeError && error?.messages?.length) {
            error.messages.forEach((message) => this.addToMessages(message));
        }
        if (options.message)
            this.message = options.message;
        this.level = options.level ?? 'warning';
        if (options.functionality)
            this.functionality = options.functionality;
        if (options.type)
            this.type = options.type;
        if (options.description)
            this.description = options.description;
        else if ('description' in error && typeof error.description === 'string')
            this.description = error.description;
        this.context.runIndex = options.runIndex;
        this.context.itemIndex = options.itemIndex;
        this.context.metadata = options.metadata;
        if (this.message === this.description) {
            this.description = undefined;
        }
        [this.message, this.messages] = this.setDescriptiveErrorMessage(this.message, this.messages, undefined, options.messageMapping);
    }
}
//# sourceMappingURL=node-operation.error.js.map