import { ensureError } from "./errors/index.js";
export const createResultOk = (data) => ({
    ok: true,
    result: data,
});
export const createResultError = (error) => ({
    ok: false,
    error,
});
/**
 * Executes the given function and converts it to a Result object.
 *
 * @example
 * const result = toResult(() => fs.writeFileSync('file.txt', 'Hello, World!'));
 */
export const toResult = (fn) => {
    try {
        return createResultOk(fn());
    }
    catch (e) {
        const error = ensureError(e);
        return createResultError(error);
    }
};
//# sourceMappingURL=result.js.map