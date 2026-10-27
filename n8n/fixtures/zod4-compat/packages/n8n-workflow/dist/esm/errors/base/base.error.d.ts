import type { Event } from "@sentry/node";
import type { ErrorTags, ErrorLevel, ReportingOptions } from "@n8n/errors";
export type BaseErrorOptions = {
    description?: string | undefined | null;
} & ErrorOptions & ReportingOptions;
/**
 * Base class for all errors
 */
export declare abstract class BaseError extends Error {
    /**
     * Error level. Defines which level the error should be logged/reported
     * @default 'error'
     */
    level: ErrorLevel;
    /**
     * Whether the error should be reported to Sentry.
     * @default true
     */
    readonly shouldReport: boolean;
    readonly description: string | null | undefined;
    readonly tags: ErrorTags;
    readonly extra?: Event['extra'];
    readonly packageName?: string;
    constructor(message: string, { level, description, shouldReport, tags, extra, ...rest }?: BaseErrorOptions);
}
//# sourceMappingURL=base.error.d.ts.map