import { ApplicationError } from "@n8n/errors";
export type DbConnectionTimeoutErrorOpts = {
    configuredTimeoutInMs: number;
    cause: Error;
};
export declare class DbConnectionTimeoutError extends ApplicationError {
    constructor(opts: DbConnectionTimeoutErrorOpts);
}
//# sourceMappingURL=db-connection-timeout-error.d.ts.map