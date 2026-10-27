"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbConnectionTimeoutError = void 0;
const errors_1 = require("@n8n/errors");
class DbConnectionTimeoutError extends errors_1.ApplicationError {
    constructor(opts) {
        const numberFormat = Intl.NumberFormat();
        const errorMessage = `Could not establish database connection within the configured timeout of ${numberFormat.format(opts.configuredTimeoutInMs)} ms. Please ensure the database is configured correctly and the server is reachable. You can increase the timeout by setting the 'DB_POSTGRESDB_CONNECTION_TIMEOUT' environment variable.`;
        super(errorMessage, { cause: opts.cause });
    }
}
exports.DbConnectionTimeoutError = DbConnectionTimeoutError;
//# sourceMappingURL=db-connection-timeout-error.js.map