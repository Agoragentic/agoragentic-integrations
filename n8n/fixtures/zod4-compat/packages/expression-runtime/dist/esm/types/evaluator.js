// ============================================================================
// Phase 1.4: Error Handling (IMPLEMENT WITH EVALUATOR)
//
// These error types provide structured error information.
// Start with basic Error, add these types in Phase 1.4.
// ============================================================================
/**
 * Expression evaluation error.
 */
export class ExpressionError extends Error {
    context;
    constructor(message, context) {
        super(message);
        this.context = context;
        this.name = 'ExpressionError';
    }
}
/**
 * Specific error types.
 */
export class MemoryLimitError extends ExpressionError {
}
export class TimeoutError extends ExpressionError {
}
export class SecurityViolationError extends ExpressionError {
}
export class SyntaxError extends ExpressionError {
}
//# sourceMappingURL=evaluator.js.map