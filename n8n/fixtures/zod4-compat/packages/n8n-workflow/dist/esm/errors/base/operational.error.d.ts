import type { BaseErrorOptions } from "./base.error.js";
import { BaseError } from "./base.error.js";
export type OperationalErrorOptions = Omit<BaseErrorOptions, 'level'> & {
    level?: 'info' | 'warning' | 'error';
};
/**
 * Error that indicates a transient issue, like a network request failing,
 * a database query timing out, etc. These are expected to happen, are
 * transient by nature and should be handled gracefully.
 *
 * Default level: warning
 */
export declare class OperationalError extends BaseError {
    constructor(message: string, opts?: OperationalErrorOptions);
}
//# sourceMappingURL=operational.error.d.ts.map