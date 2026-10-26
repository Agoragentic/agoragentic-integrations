import { WorkflowActivationError } from "./workflow-activation.error.js";
export class WebhookPathTakenError extends WorkflowActivationError {
    constructor(nodeName, cause) {
        super(`The URL path that the "${nodeName}" node uses is already taken. Please change it to something else.`, { level: 'warning', cause });
    }
}
//# sourceMappingURL=webhook-taken.error.js.map