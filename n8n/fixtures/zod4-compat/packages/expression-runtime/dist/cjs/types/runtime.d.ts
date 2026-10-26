/**
 * Runtime error thrown inside isolated context.
 *
 * These errors are thrown by the runtime code when something goes wrong during
 * expression evaluation. The bridge must catch these and translate them to the
 * appropriate ExpressionError subclass (see evaluator.ts).
 *
 * Translation mapping:
 * - code: 'MEMORY_LIMIT' → MemoryLimitError
 * - code: 'TIMEOUT' → TimeoutError
 * - code: 'SECURITY_VIOLATION' → SecurityViolationError
 * - code: 'SYNTAX_ERROR' → SyntaxError
 * - other → ExpressionError
 */
export declare class RuntimeError extends Error {
    code: string;
    details?: Record<string, unknown> | undefined;
    constructor(message: string, code: string, details?: Record<string, unknown> | undefined);
}
//# sourceMappingURL=runtime.d.ts.map