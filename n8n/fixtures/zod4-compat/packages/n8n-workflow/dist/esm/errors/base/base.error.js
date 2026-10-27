import callsites from "callsites";
/**
 * Base class for all errors
 */
export class BaseError extends Error {
    /**
     * Error level. Defines which level the error should be logged/reported
     * @default 'error'
     */
    level;
    /**
     * Whether the error should be reported to Sentry.
     * @default true
     */
    shouldReport;
    description;
    tags;
    extra;
    packageName;
    constructor(message, { level = 'error', description, shouldReport, tags = {}, extra, ...rest } = {}) {
        super(message, rest);
        this.level = level;
        this.shouldReport = shouldReport ?? (level === 'error' || level === 'fatal');
        this.description = description;
        this.tags = tags;
        this.extra = extra;
        try {
            const filePath = callsites()[2].getFileName() ?? '';
            const match = /packages\/([^\/]+)\//.exec(filePath)?.[1];
            if (match)
                this.tags.packageName = match;
        }
        catch { }
    }
}
//# sourceMappingURL=base.error.js.map