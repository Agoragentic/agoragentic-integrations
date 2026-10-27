"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookPathTakenError = void 0;
const workflow_activation_error_1 = require("./workflow-activation.error.js");
class WebhookPathTakenError extends workflow_activation_error_1.WorkflowActivationError {
    constructor(nodeName, cause) {
        super(`The URL path that the "${nodeName}" node uses is already taken. Please change it to something else.`, { level: 'warning', cause });
    }
}
exports.WebhookPathTakenError = WebhookPathTakenError;
//# sourceMappingURL=webhook-taken.error.js.map