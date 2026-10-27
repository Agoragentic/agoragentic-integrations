export type EnvProviderState = {
    isProcessAvailable: boolean;
    isEnvAccessBlocked: boolean;
    env: Record<string, string>;
};
/**
 * Captures a snapshot of the environment variables and configuration
 * that can be used to initialize an environment provider.
 */
export declare function createEnvProviderState(): EnvProviderState;
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
export declare function createEnvProvider(runIndex: number, itemIndex: number, providerState: EnvProviderState): Record<string, string>;
//# sourceMappingURL=workflow-data-proxy-env-provider.d.ts.map