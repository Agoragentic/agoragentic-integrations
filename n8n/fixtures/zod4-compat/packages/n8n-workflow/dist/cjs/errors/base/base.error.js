"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseError = void 0;
const callsites_1 = __importDefault(require("callsites"));
/**
 * Base class for all errors
 */
class BaseError extends Error {
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
            const filePath = (0, callsites_1.default)()[2].getFileName() ?? '';
            const match = /packages\/([^\/]+)\//.exec(filePath)?.[1];
            if (match)
                this.tags.packageName = match;
        }
        catch { }
    }
}
exports.BaseError = BaseError;
//# sourceMappingURL=base.error.js.map