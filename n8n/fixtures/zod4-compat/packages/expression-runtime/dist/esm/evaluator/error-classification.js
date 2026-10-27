import { MemoryLimitError, SecurityViolationError, SyntaxError, TimeoutError } from "../types/index.js";
export function classifyExpressionError(error) {
    if (error instanceof TimeoutError)
        return 'timeout';
    if (error instanceof MemoryLimitError)
        return 'memory_limit';
    if (error instanceof SecurityViolationError)
        return 'security';
    if (error instanceof SyntaxError)
        return 'syntax';
    return 'unknown';
}
//# sourceMappingURL=error-classification.js.map