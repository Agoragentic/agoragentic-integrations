"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMcpOAuth2Authentication = isMcpOAuth2Authentication;
/**
 * Returns `true` for `mcpOAuth2Api` and any credential type ending in
 * `McpOAuth2Api` (e.g. `notionMcpOAuth2Api`, `githubMcpOAuth2Api`).
 */
function isMcpOAuth2Authentication(authentication) {
    return authentication === 'mcpOAuth2Api' || authentication.endsWith('McpOAuth2Api');
}
//# sourceMappingURL=mcp-helpers.js.map