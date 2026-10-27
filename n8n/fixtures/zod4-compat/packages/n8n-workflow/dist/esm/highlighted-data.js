import snakeCase from "lodash/snakeCase.js";
export function getHighlightedInputKey(nodeName) {
    return `input_${snakeCase(nodeName)}`;
}
export function getHighlightedResponseKey(nodeName) {
    return `response_${snakeCase(nodeName)}`;
}
export const HIGHLIGHTED_SESSION_KEY = 'session_id';
//# sourceMappingURL=highlighted-data.js.map