"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toResult = exports.createResultError = exports.createResultOk = void 0;
const errors_1 = require("./errors/index.js");
const createResultOk = (data) => ({
    ok: true,
    result: data,
});
exports.createResultOk = createResultOk;
const createResultError = (error) => ({
    ok: false,
    error,
});
exports.createResultError = createResultError;
/**
 * Executes the given function and converts it to a Result object.
 *
 * @example
 * const result = toResult(() => fs.writeFileSync('file.txt', 'Hello, World!'));
 */
const toResult = (fn) => {
    try {
        return (0, exports.createResultOk)(fn());
    }
    catch (e) {
        const error = (0, errors_1.ensureError)(e);
        return (0, exports.createResultError)(error);
    }
};
exports.toResult = toResult;
//# sourceMappingURL=result.js.map