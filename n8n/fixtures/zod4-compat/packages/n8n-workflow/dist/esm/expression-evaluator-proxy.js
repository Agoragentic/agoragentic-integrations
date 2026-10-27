import { Tournament } from "@n8n/tournament";
import { DollarSignValidator, ThisSanitizer, PrototypeSanitizer } from "./expression-sandboxing.js";
const errorHandler = () => { };
const tournamentEvaluator = new Tournament(errorHandler, undefined, undefined, {
    before: [ThisSanitizer],
    after: [PrototypeSanitizer, DollarSignValidator],
});
const evaluator = tournamentEvaluator.execute.bind(tournamentEvaluator);
export const setErrorHandler = (handler) => {
    tournamentEvaluator.errorHandler = handler;
};
export const evaluateExpression = (expr, data) => {
    return evaluator(expr, data);
};
//# sourceMappingURL=expression-evaluator-proxy.js.map