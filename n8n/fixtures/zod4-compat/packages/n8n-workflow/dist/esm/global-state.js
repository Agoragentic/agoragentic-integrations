import { deepCopy } from "./utils.js";
let globalState = { defaultTimezone: 'America/New_York' };
export function setGlobalState(state) {
    globalState = state;
}
export function getGlobalState() {
    return deepCopy(globalState);
}
//# sourceMappingURL=global-state.js.map