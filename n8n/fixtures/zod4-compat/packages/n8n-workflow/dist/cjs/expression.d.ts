import type { ObservabilityProvider } from "@n8n/expression-runtime";
import type { IDataObject, INodeParameters, IWorkflowDataProxyData, NodeParameterValue } from "./interfaces.js";
export declare class Expression {
    private readonly timezone;
    private static expressionEngine;
    private static vmEvaluator?;
    constructor(timezone: string);
    /**
     * Check if VM evaluator should be used for evaluation.
     * @private
     */
    private static shouldUseVm;
    /**
     * Initialize the VM evaluator (if feature flag is enabled).
     * Should be called once during application startup.
     * Only available in Node.js environments (not in browser).
     */
    static initExpressionEngine(options: {
        engine: 'legacy' | 'vm';
        bridgeTimeout: number;
        bridgeMemoryLimit: number;
        poolSize: number;
        maxCodeCacheSize: number;
        observability?: ObservabilityProvider;
        idleTimeoutMs?: number;
    }): Promise<void>;
    acquireIsolate(): Promise<void>;
    releaseIsolate(): Promise<void>;
    /**
     * Dispose the VM evaluator and release resources.
     * Should be called during application shutdown or test teardown.
     */
    static disposeExpressionEngine(): Promise<void>;
    /**
     * Get the active expression evaluation implementation.
     * Used for testing and verification.
     */
    static getActiveImplementation(): 'legacy' | 'vm';
    /**
     * Set the expression engine programmatically.
     *
     * WARNING: This is a global setting — switching engines mid-execution could
     * cause a workflow to evaluate some expressions with one engine and some with
     * another. Only use this in benchmarks and tests, never in production code.
     * In production, set `N8N_EXPRESSION_ENGINE` before process startup instead.
     */
    static setExpressionEngine(engine: 'legacy' | 'vm'): void;
    static initializeGlobalContext(data: IDataObject): void;
    static resolveWithoutWorkflow(expression: string, data?: IDataObject): string | (() => unknown) | null;
    /**
     * Converts an object to a string in a way to make it clear that
     * the value comes from an object
     *
     */
    convertObjectValueToString(value: object): string;
    /**
     * Resolves the parameter value.  If it is an expression it will execute it and
     * return the result. For everything simply the supplied value will be returned.
     *
     * @param {NodeParameterValue} parameterValue - The parameter value to resolve
     * @param {IWorkflowDataProxyData} data - The workflow data proxy data
     * @param {boolean} [returnObjectAsString=false] - Whether to convert objects to strings
     */
    resolveSimpleParameterValue(parameterValue: NodeParameterValue, data: IWorkflowDataProxyData, returnObjectAsString?: boolean): NodeParameterValue | INodeParameters | NodeParameterValue[] | INodeParameters[];
    private renderExpression;
}
//# sourceMappingURL=expression.d.ts.map