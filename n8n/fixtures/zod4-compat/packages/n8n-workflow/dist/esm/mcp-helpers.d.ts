/** Covers `mcpOAuth2Api` and registry-specific variants like `notionMcpOAuth2Api`. */
export type McpOAuth2CredentialType = 'mcpOAuth2Api' | `${string}McpOAuth2Api`;
/**
 * Returns `true` for `mcpOAuth2Api` and any credential type ending in
 * `McpOAuth2Api` (e.g. `notionMcpOAuth2Api`, `githubMcpOAuth2Api`).
 */
export declare function isMcpOAuth2Authentication(authentication: string): authentication is McpOAuth2CredentialType;
//# sourceMappingURL=mcp-helpers.d.ts.map