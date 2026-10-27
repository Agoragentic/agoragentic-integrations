"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setGlobalState = setGlobalState;
exports.getGlobalState = getGlobalState;
const utils_1 = require("./utils.js");
let globalState = { defaultTimezone: 'America/New_York' };
function setGlobalState(state) {
    globalState = state;
}
function getGlobalState() {
    return (0, utils_1.deepCopy)(globalState);
}
//# sourceMappingURL=global-state.js.map