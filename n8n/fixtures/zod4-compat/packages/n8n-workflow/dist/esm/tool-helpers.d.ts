import type { INode } from "./interfaces.js";
/**
 * Converts a node name to a valid tool name by replacing special characters with underscores,
 * collapsing consecutive underscores into a single one, and truncating to 64 characters
 * (which is the maximum length allowed by OpenAI's API).
 */
export declare function nodeNameToToolName(nodeOrName: INode | string): string;
//# sourceMappingURL=tool-helpers.d.ts.map