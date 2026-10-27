type Evaluator = (expr: string, data: unknown) => string | null | (() => unknown);
type ErrorHandler = (error: Error) => void;
export declare const setErrorHandler: (handler: ErrorHandler) => void;
export declare const evaluateExpression: Evaluator;
export {};
//# sourceMappingURL=expression-evaluator-proxy.d.ts.map