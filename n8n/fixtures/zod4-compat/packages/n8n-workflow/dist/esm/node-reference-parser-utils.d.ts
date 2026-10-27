import type { INode } from "./interfaces.js";
export declare function hasDotNotationBannedChar(nodeName: string): boolean;
export declare function backslashEscape(nodeName: string): string;
export declare function dollarEscape(nodeName: string): string;
export declare function applyAccessPatterns(expression: string, previousName: string, newName: string): string;
/**
 * Extracts references to nodes in `nodeNames` from the nodes in `subGraph`.
 *
 * @returns an object with two keys:
 * 		- nodes: Transformed copies of nodes in `subGraph`, ready for use in a sub-workflow
 *    - variables: A map from variable name in the sub-workflow to the replaced expression
 *
 * @throws if the startNodeName already exists in `nodeNames`
 * @throws if `nodeNames` does not include all node names in `subGraph`
 */
export declare function extractReferencesInNodeExpressions(subGraph: INode[], nodeNames: string[], insertedStartName: string, graphInputNodeNames?: string[]): {
    nodes: INode[];
    variables: Map<string, string>;
};
//# sourceMappingURL=node-reference-parser-utils.d.ts.map