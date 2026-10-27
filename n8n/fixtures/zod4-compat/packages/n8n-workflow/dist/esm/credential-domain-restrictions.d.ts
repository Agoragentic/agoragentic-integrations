import type { ICredentialDataDecryptedObject, ICredentialType, INode, INodeProperties } from "./interfaces.js";
export type DomainRestrictionMode = 'all' | 'domains' | 'none';
export declare const DOMAIN_RESTRICTION_FIELDS: INodeProperties[];
/** Idempotent — safe to call repeatedly. */
export declare function injectDomainRestrictionFields(credentialType: ICredentialType): INodeProperties[];
/** `*.example.com` matches subdomains only, never the bare domain. */
export declare function isDomainAllowed(options: {
    url: string;
    allowedDomains: string;
}): boolean;
/** Throws `UserError` when `node` is omitted, so callers without an `INode` (axios helper) get a wrappable error. */
export declare function assertUrlAllowed(options: {
    url: string;
    allowedDomains?: string;
    node?: INode;
}): void;
/** Returns the allowlist for forwarding to per-hop redirect checks; `undefined` means allow-all. */
export declare function getCredentialAllowedDomains(options: {
    node: INode;
    credentialData: ICredentialDataDecryptedObject;
    surface?: string;
}): string | undefined;
/**
 * Passing `pinnedUrl` switches `'none'` mode from "block all" to "allow only
 * the pinned URL" — for surfaces like OpenAI where the credential pins a base
 * URL but the user may override it. A falsy `pinnedUrl` makes `'none'` a no-op.
 */
export declare function assertCredentialAllowsUrl(options: {
    node: INode;
    credentialData: ICredentialDataDecryptedObject;
    url: string;
    pinnedUrl?: string;
    surface?: string;
}): string | undefined;
//# sourceMappingURL=credential-domain-restrictions.d.ts.map