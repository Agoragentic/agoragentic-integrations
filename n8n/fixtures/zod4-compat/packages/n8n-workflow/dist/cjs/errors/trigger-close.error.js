"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TriggerCloseError = void 0;
const errors_1 = require("@n8n/errors");
class TriggerCloseError extends errors_1.ApplicationError {
    node;
    constructor(node, { cause, level }) {
        super('Trigger Close Failed', { cause, extra: { nodeName: node.name } });
        this.node = node;
        this.level = level;
    }
}
exports.TriggerCloseError = TriggerCloseError;
//# sourceMappingURL=trigger-close.error.js.map