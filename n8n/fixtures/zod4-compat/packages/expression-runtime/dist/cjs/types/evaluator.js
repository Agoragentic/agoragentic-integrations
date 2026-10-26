"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyntaxError = exports.SecurityViolationError = exports.TimeoutError = exports.MemoryLimitError = exports.ExpressionError = void 0;
// ============================================================================
// Phase 1.4: Error Handling (IMPLEMENT WITH EVALUATOR)
//
// These error types provide structured error information.
// Start with basic Error, add these types in Phase 1.4.
// ============================================================================
/**
 * Expression evaluation error.
 */
class ExpressionError extends Error {
    context;
    constructor(message, context) {
        super(message);
        this.context = context;
        this.name = 'ExpressionError';
    }
}
exports.ExpressionError = ExpressionError;
/**
 * Specific error types.
 */
class MemoryLimitError extends ExpressionError {
}
exports.MemoryLimitError = MemoryLimitError;
class TimeoutError extends ExpressionError {
}
exports.TimeoutError = TimeoutError;
class SecurityViolationError extends ExpressionError {
}
exports.SecurityViolationError = SecurityViolationError;
class SyntaxError extends ExpressionError {
}
exports.SyntaxError = SyntaxError;
//# sourceMappingURL=evaluator.js.map