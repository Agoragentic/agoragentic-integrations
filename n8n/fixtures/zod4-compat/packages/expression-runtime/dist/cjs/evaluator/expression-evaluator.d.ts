import type { IExpressionEvaluator, EvaluatorConfig, WorkflowData, EvaluateOptions } from "../types/index.js";
export declare class ExpressionEvaluator implements IExpressionEvaluator {
    private config;
    private disposed;
    private tournament?;
    private codeCache;
    private pool;
    private bridgesByCaller;
    private readonly createBridge;
    constructor(config: EvaluatorConfig);
    initialize(): Promise<void>;
    acquire(caller: object): Promise<void>;
    evaluate(expression: string, data: WorkflowData, caller: object, options?: EvaluateOptions): unknown;
    private getBridge;
    release(caller: object): Promise<void>;
    waitForReplenishment(): Promise<void>;
    /**
     * Transform a template expression to executable JavaScript via tournament.
     *
     * Input:  "{{ $json.email }}"
     * Output: JavaScript string with tournament security transforms applied
     *         ($json → this.$json, computed access wrapped in this.__sanitize(), etc.)
     *
     * Result is cached by expression string (tournament AST parsing is expensive).
     */
    private getTransformedCode;
    dispose(): Promise<void>;
    isDisposed(): boolean;
}
//# sourceMappingURL=expression-evaluator.d.ts.map