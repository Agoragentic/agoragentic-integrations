import { z } from "zod";
import type { INodeProperties } from "./interfaces.js";
/**
 * This file contains the logic for parsing node parameters and extracting $fromAI calls
 */
export type FromAIArgumentType = 'string' | 'number' | 'boolean' | 'json';
export type FromAIArgument = {
    key: string;
    description?: string;
    type?: FromAIArgumentType;
    defaultValue?: string | number | boolean | Record<string, unknown>;
};
/**
 * Generates a Zod schema based on the provided FromAIArgument placeholder.
 * @param placeholder The FromAIArgument object containing key, type, description, and defaultValue.
 * @returns A Zod schema corresponding to the placeholder's type and constraints.
 */
export declare function generateZodSchema(placeholder: FromAIArgument): z.ZodTypeAny;
/**
 * Extracts all $fromAI calls from a given string
 * @param str The string to search for $fromAI calls.
 * @returns An array of FromAIArgument objects.
 *
 * This method uses a regular expression to find the start of each $fromAI function call
 * in the input string. It then employs a character-by-character parsing approach to
 * accurately extract the arguments of each call, handling nested parentheses and quoted strings.
 *
 * The parsing process:
 * 1. Finds the starting position of a $fromAI call using regex.
 * 2. Iterates through characters, keeping track of parentheses depth and quote status.
 * 3. Handles escaped characters within quotes to avoid premature quote closing.
 * 4. Builds the argument string until the matching closing parenthesis is found.
 * 5. Parses the extracted argument string into a FromAIArgument object.
 * 6. Repeats the process for all $fromAI calls in the input string.
 *
 */
export declare function extractFromAICalls(str: string): FromAIArgument[];
/**
 * Recursively traverses the nodeParameters object to find all $fromAI calls.
 * @param payload The current object or value being traversed.
 * @param collectedArgs The array collecting FromAIArgument objects.
 */
export declare function traverseNodeParameters(payload: unknown, collectedArgs: FromAIArgument[]): void;
export declare function traverseNodeParametersWithParamNames(payload: unknown, collectedArgs: Map<string, FromAIArgument>, name?: string): void;
/**
 * Checks whether an expression string contains only a single `$fromAI()` call
 * with literal arguments and nothing else.
 *
 * Only `$fromAI()` expressions are supported in chat hub tool parameters.
 * Arguments must be literals (strings, numbers, booleans) — nested function
 * calls like `$fromAI(evil())` are not supported.
 */
export declare function isFromAIOnlyExpression(expr: string): boolean;
/**
 * Recursively collects all expression default values from node type properties.
 * Recurses into `options` (which can be INodeProperties[] or INodePropertyCollection[]).
 */
export declare function collectExpressionDefaults(properties: INodeProperties[]): Set<string>;
export type ExpressionViolation = {
    path: string;
    value: string;
};
/**
 * Recursively traverses node parameters and finds all string values that are
 * expressions other than supported `$fromAI()`-only expressions supported on Chat hub.
 * Returns an array of violations with their dot-notation paths.
 *
 * When `allowedExpressions` is provided, expressions matching a known node-description
 * default are not flagged as violations.
 */
export declare function findDisallowedChatToolExpressions(payload: unknown, path?: string, allowedExpressions?: Set<string>): ExpressionViolation[];
//# sourceMappingURL=from-ai-parse-utils.d.ts.map