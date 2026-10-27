"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuntimeError = void 0;
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
class RuntimeError extends Error {
    code;
    details;
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'RuntimeError';
    }
}
exports.RuntimeError = RuntimeError;
//# sourceMappingURL=runtime.js.map