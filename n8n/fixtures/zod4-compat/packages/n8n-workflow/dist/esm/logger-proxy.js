const noOp = () => { };
export let error = noOp;
export let warn = noOp;
export let info = noOp;
export let debug = noOp;
export const init = (logger) => {
    error = (message, meta) => logger.error(message, meta);
    warn = (message, meta) => logger.warn(message, meta);
    info = (message, meta) => logger.info(message, meta);
    debug = (message, meta) => logger.debug(message, meta);
};
//# sourceMappingURL=logger-proxy.js.map