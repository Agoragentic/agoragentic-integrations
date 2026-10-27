"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HIGHLIGHTED_SESSION_KEY = void 0;
exports.getHighlightedInputKey = getHighlightedInputKey;
exports.getHighlightedResponseKey = getHighlightedResponseKey;
const snakeCase_1 = __importDefault(require("lodash/snakeCase.js"));
function getHighlightedInputKey(nodeName) {
    return `input_${(0, snakeCase_1.default)(nodeName)}`;
}
function getHighlightedResponseKey(nodeName) {
    return `response_${(0, snakeCase_1.default)(nodeName)}`;
}
exports.HIGHLIGHTED_SESSION_KEY = 'session_id';
//# sourceMappingURL=highlighted-data.js.map