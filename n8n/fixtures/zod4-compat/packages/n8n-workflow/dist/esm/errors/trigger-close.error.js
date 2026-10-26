import { ApplicationError } from "@n8n/errors";
export class TriggerCloseError extends ApplicationError {
    node;
    constructor(node, { cause, level }) {
        super('Trigger Close Failed', { cause, extra: { nodeName: node.name } });
        this.node = node;
        this.level = level;
    }
}
//# sourceMappingURL=trigger-close.error.js.map