"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEnvProviderState = createEnvProviderState;
exports.createEnvProvider = createEnvProvider;
const expression_error_1 = require("./errors/expression.error.js");
/**
 * Captures a snapshot of the environment variables and configuration
 * that can be used to initialize an environment provider.
 */
function createEnvProviderState() {
    const isProcessAvailable = typeof process !== 'undefined';
    const isEnvAccessBlocked = isProcessAvailable
        ? process.env.N8N_BLOCK_ENV_ACCESS_IN_NODE !== 'false'
        : false;
    const env = !isProcessAvailable || isEnvAccessBlocked ? {} : process.env;
    return {
        isProcessAvailable,
        isEnvAccessBlocked,
        env,
    };
}
/**
 * Creates a proxy that provides access to the environment variables
 * in the `WorkflowDataProxy`. Use the `createEnvProviderState` to
 * create the default state object that is needed for the proxy,
 * unless you need something specific.
 *
 * @example
 * createEnvProvider(
 *   runIndex,
 *   itemIndex,
 *   createEnvProviderState(),
 * )
 */
function createEnvProvider(runIndex, itemIndex, providerState) {
    return new Proxy({}, {
        has() {
            return true;
        },
        get(_, name) {
            if (name === 'isProxy')
                return true;
            if (!providerState.isProcessAvailable) {
                throw new expression_error_1.ExpressionError('not accessible via UI, please run node', {
                    runIndex,
                    itemIndex,
                });
            }
            if (providerState.isEnvAccessBlocked) {
                throw new expression_error_1.ExpressionError('access to env vars denied', {
                    causeDetailed: 'If you need access please contact the administrator to remove the environment variable ‘N8N_BLOCK_ENV_ACCESS_IN_NODE‘',
                    runIndex,
                    itemIndex,
                });
            }
            return providerState.env[name.toString()];
        },
    });
}
//# sourceMappingURL=workflow-data-proxy-env-provider.js.map