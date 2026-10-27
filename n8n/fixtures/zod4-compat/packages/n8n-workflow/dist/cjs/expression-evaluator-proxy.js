"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateExpression = exports.setErrorHandler = void 0;
const tournament_1 = require("@n8n/tournament");
const expression_sandboxing_1 = require("./expression-sandboxing.js");
const errorHandler = () => { };
const tournamentEvaluator = new tournament_1.Tournament(errorHandler, undefined, undefined, {
    before: [expression_sandboxing_1.ThisSanitizer],
    after: [expression_sandboxing_1.PrototypeSanitizer, expression_sandboxing_1.DollarSignValidator],
});
const evaluator = tournamentEvaluator.execute.bind(tournamentEvaluator);
const setErrorHandler = (handler) => {
    tournamentEvaluator.errorHandler = handler;
};
exports.setErrorHandler = setErrorHandler;
const evaluateExpression = (expr, data) => {
    return evaluator(expr, data);
};
exports.evaluateExpression = evaluateExpression;
//# sourceMappingURL=expression-evaluator-proxy.js.map