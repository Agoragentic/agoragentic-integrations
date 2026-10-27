"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = exports.debug = exports.info = exports.warn = exports.error = void 0;
const noOp = () => { };
exports.error = noOp;
exports.warn = noOp;
exports.info = noOp;
exports.debug = noOp;
const init = (logger) => {
    exports.error = (message, meta) => logger.error(message, meta);
    exports.warn = (message, meta) => logger.warn(message, meta);
    exports.info = (message, meta) => logger.info(message, meta);
    exports.debug = (message, meta) => logger.debug(message, meta);
};
exports.init = init;
//# sourceMappingURL=logger-proxy.js.map