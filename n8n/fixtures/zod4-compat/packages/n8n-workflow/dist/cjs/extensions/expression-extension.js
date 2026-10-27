"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extendTransform = exports.hasNativeMethod = exports.hasExpressionExtension = exports.EXTENSION_OBJECTS = void 0;
exports.extend = extend;
exports.extendOptional = extendOptional;
exports.extendSyntax = extendSyntax;
const esprima_next_1 = require("esprima-next");
const luxon_1 = require("luxon");
const recast_1 = require("recast");
const util_1 = require("recast/lib/util.js");
const array_extensions_1 = require("./array-extensions.js");
const boolean_extensions_1 = require("./boolean-extensions.js");
const date_extensions_1 = require("./date-extensions.js");
const expression_parser_1 = require("./expression-parser.js");
const number_extensions_1 = require("./number-extensions.js");
const object_extensions_1 = require("./object-extensions.js");
const string_extensions_1 = require("./string-extensions.js");
const utils_1 = require("./utils.js");
const expression_extension_error_1 = require("../errors/expression-extension.error.js");
const utils_2 = require("../utils.js");
const EXPRESSION_EXTENDER = 'extend';
const EXPRESSION_EXTENDER_OPTIONAL = 'extendOptional';
function isEmpty(value) {
    return value === null || value === undefined || !value;
}
function isNotEmpty(value) {
    return !isEmpty(value);
}
exports.EXTENSION_OBJECTS = [
    array_extensions_1.arrayExtensions,
    date_extensions_1.dateExtensions,
    number_extensions_1.numberExtensions,
    object_extensions_1.objectExtensions,
    string_extensions_1.stringExtensions,
    boolean_extensions_1.booleanExtensions,
];
// eslint-disable-next-line @typescript-eslint/no-restricted-types
const genericExtensions = {
    isEmpty,
    isNotEmpty,
};
const EXPRESSION_EXTENSION_METHODS = Array.from(new Set([
    ...Object.keys(string_extensions_1.stringExtensions.functions),
    ...Object.keys(number_extensions_1.numberExtensions.functions),
    ...Object.keys(date_extensions_1.dateExtensions.functions),
    ...Object.keys(array_extensions_1.arrayExtensions.functions),
    ...Object.keys(object_extensions_1.objectExtensions.functions),
    ...Object.keys(boolean_extensions_1.booleanExtensions.functions),
    ...Object.keys(genericExtensions),
]));
const EXPRESSION_EXTENSION_REGEX = new RegExp(`(\\$if|\\.(${EXPRESSION_EXTENSION_METHODS.join('|')})\\s*(\\?\\.)?)\\s*\\(`);
const isExpressionExtension = (str) => EXPRESSION_EXTENSION_METHODS.some((m) => m === str);
const hasExpressionExtension = (str) => EXPRESSION_EXTENSION_REGEX.test(str);
exports.hasExpressionExtension = hasExpressionExtension;
const hasNativeMethod = (method) => {
    if ((0, exports.hasExpressionExtension)(method)) {
        return false;
    }
    const methods = method
        .replace(/[^\w\s]/gi, ' ')
        .split(' ')
        .filter(Boolean); // DateTime.now().toLocaleString().format() => [DateTime,now,toLocaleString,format]
    return methods.every((methodName) => {
        return [String.prototype, Array.prototype, Number.prototype, Date.prototype].some((nativeType) => {
            if (methodName in nativeType) {
                return true;
            }
            return false;
        });
    });
};
exports.hasNativeMethod = hasNativeMethod;
// /**
//  * recast's types aren't great and we need to use a lot of anys
//  */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseWithEsprimaNext(source, options) {
    const ast = (0, esprima_next_1.parse)(source, {
        loc: true,
        locations: true,
        comment: true,
        range: (0, util_1.getOption)(options, 'range', false),
        tolerant: (0, util_1.getOption)(options, 'tolerant', true),
        tokens: true,
        jsx: (0, util_1.getOption)(options, 'jsx', false),
        sourceType: (0, util_1.getOption)(options, 'sourceType', 'module'),
    });
    return ast;
}
/**
 * A function to inject an extender function call into the AST of an expression.
 * This uses recast to do the transform.
 *
 * This function also polyfills optional chaining if using extended functions.
 *
 * ```ts
 * 'a'.method('x') // becomes
 * extend('a', 'method', ['x']);
 *
 * 'a'.first('x').second('y') // becomes
 * extend(extend('a', 'first', ['x']), 'second', ['y']));
 * ```
 */
const extendTransform = (expression) => {
    try {
        const ast = (0, recast_1.parse)(expression, { parser: { parse: parseWithEsprimaNext } });
        let currentChain = 1;
        // Polyfill optional chaining
        (0, recast_1.visit)(ast, {
            // eslint-disable-next-line complexity
            visitChainExpression(path) {
                this.traverse(path);
                const chainNumber = currentChain;
                currentChain += 1;
                // This is to match behavior in our original expression evaluator (tmpl)
                const globalIdentifier = recast_1.types.builders.identifier(typeof window !== 'object' ? 'global' : 'window');
                // We want to define all of our commonly used identifiers and member
                // expressions now so we don't have to create multiple instances
                const undefinedIdentifier = recast_1.types.builders.identifier('undefined');
                const cancelIdentifier = recast_1.types.builders.identifier(`chainCancelToken${chainNumber}`);
                const valueIdentifier = recast_1.types.builders.identifier(`chainValue${chainNumber}`);
                const cancelMemberExpression = recast_1.types.builders.memberExpression(globalIdentifier, cancelIdentifier);
                const valueMemberExpression = recast_1.types.builders.memberExpression(globalIdentifier, valueIdentifier);
                const patchedStack = [];
                // This builds the cancel check. This lets us slide to the end of the expression
                // if it's undefined/null at any of the optional points of the chain.
                const buildCancelCheckWrapper = (node) => {
                    return recast_1.types.builders.conditionalExpression(recast_1.types.builders.binaryExpression('===', cancelMemberExpression, recast_1.types.builders.booleanLiteral(true)), undefinedIdentifier, node);
                };
                // This is just a quick small wrapper to create the assignment expression
                // for the running value.
                const buildValueAssignWrapper = (node) => {
                    return recast_1.types.builders.assignmentExpression('=', valueMemberExpression, node);
                };
                // This builds what actually does the comparison. It wraps the current
                // chunk of the expression with a nullish coalescing operator that returns
                // undefined if it's null or undefined. We do this because optional chains
                // always return undefined if they fail part way, even if the value they
                // fail on is null.
                const buildOptionalWrapper = (node) => {
                    return recast_1.types.builders.binaryExpression('===', recast_1.types.builders.logicalExpression('??', buildValueAssignWrapper(node), undefinedIdentifier), undefinedIdentifier);
                };
                // Another small wrapper, but for assigning to the cancel token this time.
                const buildCancelAssignWrapper = (node) => {
                    return recast_1.types.builders.assignmentExpression('=', cancelMemberExpression, node);
                };
                let currentNode = path.node.expression;
                let currentPatch = null;
                let patchTop = null;
                let wrapNextTopInOptionalExtend = false;
                // This patches the previous node to use our current one as it's left hand value.
                // It takes `window.chainValue1.test1` and `window.chainValue1.test2` and turns it
                // into `window.chainValue1.test2.test1`.
                const updatePatch = (toPatch, node) => {
                    if (toPatch.type === 'MemberExpression' || toPatch.type === 'OptionalMemberExpression') {
                        toPatch.object = node;
                    }
                    else if (toPatch.type === 'CallExpression' ||
                        toPatch.type === 'OptionalCallExpression') {
                        toPatch.callee = node;
                    }
                };
                // This loop walks down an optional chain from the top. This will walk
                // from right to left through an optional chain. We keep track of our current
                // top of the chain (furthest right) and create a chain below it. This chain
                // contains all of the (member and call) expressions that we need. These are
                // patched versions that reference our current chain value. We then push this
                // chain onto a stack when we hit an optional point in our chain.
                while (true) {
                    // This should only ever be these types but you can optional chain on
                    // JSX nodes, which we don't support.
                    if (currentNode.type === 'MemberExpression' ||
                        currentNode.type === 'OptionalMemberExpression' ||
                        currentNode.type === 'CallExpression' ||
                        currentNode.type === 'OptionalCallExpression') {
                        let patchNode;
                        // Here we take the current node and extract the parts we actually care
                        // about.
                        // In the case of a member expression we take the property it's trying to
                        // access and make the object it's accessing be our chain value.
                        if (currentNode.type === 'MemberExpression' ||
                            currentNode.type === 'OptionalMemberExpression') {
                            patchNode = recast_1.types.builders.memberExpression(valueMemberExpression, currentNode.property);
                            // In the case of a call expression we take the arguments and make the
                            // callee our chain value.
                        }
                        else {
                            patchNode = recast_1.types.builders.callExpression(valueMemberExpression, currentNode.arguments);
                        }
                        // If we have a previous node we patch it here.
                        if (currentPatch) {
                            updatePatch(currentPatch, patchNode);
                        }
                        // If we have no top patch (first run, or just pushed onto the stack) we
                        // note it here.
                        if (!patchTop) {
                            patchTop = patchNode;
                        }
                        currentPatch = patchNode;
                        // This is an optional in our chain. In here we'll push the node onto the
                        // stack. We also do a polyfill if the top of the stack is function call
                        // that might be a extended function.
                        if (currentNode.optional) {
                            // Implement polyfill described below
                            if (wrapNextTopInOptionalExtend) {
                                wrapNextTopInOptionalExtend = false;
                                // This shouldn't ever happen
                                if (patchTop.type === 'MemberExpression' &&
                                    patchTop.property.type === 'Identifier') {
                                    patchTop = recast_1.types.builders.callExpression(recast_1.types.builders.identifier(EXPRESSION_EXTENDER_OPTIONAL), [patchTop.object, recast_1.types.builders.stringLiteral(patchTop.property.name)]);
                                }
                            }
                            patchedStack.push(patchTop);
                            patchTop = null;
                            currentPatch = null;
                            // Attempting to optional chain on an extended function. If we don't
                            // polyfill this most calls will always be undefined. Marking that the
                            // next part of the chain should be wrapped in our polyfill.
                            if ((currentNode.type === 'CallExpression' ||
                                currentNode.type === 'OptionalCallExpression') &&
                                (currentNode.callee.type === 'MemberExpression' ||
                                    currentNode.callee.type === 'OptionalMemberExpression') &&
                                currentNode.callee.property.type === 'Identifier' &&
                                isExpressionExtension(currentNode.callee.property.name)) {
                                wrapNextTopInOptionalExtend = true;
                            }
                        }
                        // Finally we get the next point AST to walk down.
                        if (currentNode.type === 'MemberExpression' ||
                            currentNode.type === 'OptionalMemberExpression') {
                            currentNode = currentNode.object;
                        }
                        else {
                            currentNode = currentNode.callee;
                        }
                    }
                    else {
                        // We update the final patch to point to the first part of the optional chain
                        // which is probably an identifier for an object.
                        if (currentPatch) {
                            updatePatch(currentPatch, currentNode);
                            if (!patchTop) {
                                patchTop = currentPatch;
                            }
                        }
                        if (wrapNextTopInOptionalExtend) {
                            wrapNextTopInOptionalExtend = false;
                            // This shouldn't ever happen
                            if (patchTop?.type === 'MemberExpression' &&
                                patchTop.property.type === 'Identifier') {
                                patchTop = recast_1.types.builders.callExpression(recast_1.types.builders.identifier(EXPRESSION_EXTENDER_OPTIONAL), [patchTop.object, recast_1.types.builders.stringLiteral(patchTop.property.name)]);
                            }
                        }
                        // Push the first part of our chain to stack.
                        if (patchTop) {
                            patchedStack.push(patchTop);
                        }
                        else {
                            patchedStack.push(currentNode);
                        }
                        break;
                    }
                }
                // Since we're working from right to left we need to flip the stack
                // for the correct order of operations
                patchedStack.reverse();
                // Walk the node stack and wrap all our expressions in cancel/assignment
                // wrappers.
                for (let i = 0; i < patchedStack.length; i++) {
                    let node = patchedStack[i];
                    // We don't wrap the last expression in an assignment wrapper because
                    // it's going to be returned anyway. We just wrap it in a cancel check
                    // wrapper.
                    if (i !== patchedStack.length - 1) {
                        node = buildCancelAssignWrapper(buildOptionalWrapper(node));
                    }
                    // Don't wrap the first part in a cancel wrapper because the cancel
                    // token will always be undefined.
                    if (i !== 0) {
                        node = buildCancelCheckWrapper(node);
                    }
                    // Replace the node in the stack with our wrapped one
                    patchedStack[i] = node;
                }
                // Put all our expressions in a sequence expression (also called a
                // group operator). These will all be executed in order and the value
                // of the final expression will be returned.
                const sequenceNode = recast_1.types.builders.sequenceExpression(patchedStack);
                path.replace(sequenceNode);
            },
        });
        // Extended functions
        (0, recast_1.visit)(ast, {
            visitCallExpression(path) {
                this.traverse(path);
                if (path.node.callee.type === 'MemberExpression' &&
                    path.node.callee.property.type === 'Identifier' &&
                    isExpressionExtension(path.node.callee.property.name)) {
                    path.replace(recast_1.types.builders.callExpression(recast_1.types.builders.identifier(EXPRESSION_EXTENDER), [
                        path.node.callee.object,
                        recast_1.types.builders.stringLiteral(path.node.callee.property.name),
                        recast_1.types.builders.arrayExpression(path.node.arguments),
                    ]));
                }
                else if (path.node.callee.type === 'Identifier' &&
                    path.node.callee.name === '$if' &&
                    path.node.arguments.every((v) => v.type !== 'SpreadElement')) {
                    if (path.node.arguments.length < 2) {
                        throw new expression_extension_error_1.ExpressionExtensionError('$if requires at least 2 parameters: test, value_if_true[, and value_if_false]');
                    }
                    const test = path.node.arguments[0];
                    const consequent = path.node.arguments[1];
                    const alternative = path.node.arguments[2] === undefined
                        ? recast_1.types.builders.booleanLiteral(false)
                        : path.node.arguments[2];
                    path.replace(recast_1.types.builders.conditionalExpression(
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
                    test, 
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
                    consequent, 
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
                    alternative));
                }
            },
        });
        return (0, recast_1.print)(ast);
    }
    catch (e) {
        return;
    }
};
exports.extendTransform = extendTransform;
function isDate(input) {
    if (typeof input !== 'string' || !input.length) {
        return false;
    }
    if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(input)) {
        return false;
    }
    const d = new Date(input);
    return d instanceof Date && !isNaN(d.valueOf()) && d.toISOString() === input;
}
function findExtendedFunction(input, functionName) {
    // Coerce to string early so the name is stable for the property check below
    const name = typeof functionName === 'string' ? functionName : String(functionName);
    // Ensure the property name is in the allowed set before looking it up
    if (!(0, utils_2.isSafeObjectProperty)(name)) {
        throw new expression_extension_error_1.ExpressionExtensionError(`Cannot access "${name}" via expression extension due to security concerns`);
    }
    // eslint-disable-next-line @typescript-eslint/no-restricted-types
    let foundFunction;
    if (Array.isArray(input)) {
        foundFunction = array_extensions_1.arrayExtensions.functions[name];
    }
    else if (isDate(input) && name !== 'toDate' && name !== 'toDateTime') {
        // If it's a string date (from $json), convert it to a Date object,
        // unless that function is `toDate`, since `toDate` does something
        // very different on date objects
        input = new Date(input);
        foundFunction = date_extensions_1.dateExtensions.functions[name];
    }
    else if (typeof input === 'string') {
        foundFunction = string_extensions_1.stringExtensions.functions[name];
    }
    else if (typeof input === 'number') {
        foundFunction = number_extensions_1.numberExtensions.functions[name];
    }
    else if (input && (luxon_1.DateTime.isDateTime(input) || input instanceof Date)) {
        foundFunction = date_extensions_1.dateExtensions.functions[name];
    }
    else if (input !== null && typeof input === 'object') {
        foundFunction = object_extensions_1.objectExtensions.functions[name];
    }
    else if (typeof input === 'boolean') {
        foundFunction = boolean_extensions_1.booleanExtensions.functions[name];
    }
    // Look for generic or builtin
    if (!foundFunction) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const inputAny = input;
        // This is likely a builtin we're implementing for another type
        // (e.g. toLocaleString). We'll return that instead
        if (inputAny && name && typeof inputAny[name] === 'function') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            return { type: 'native', function: inputAny[name] };
        }
        // Use a generic version if available
        foundFunction = genericExtensions[name];
    }
    if (!foundFunction) {
        return undefined;
    }
    return { type: 'extended', function: foundFunction };
}
/**
 * Extender function injected by expression extension plugin to allow calls to extensions.
 *
 * ```ts
 * extend(input, "functionName", [...args]);
 * ```
 */
function extend(input, functionName, args) {
    const foundFunction = findExtendedFunction(input, functionName);
    // No type specific or generic function found. Check to see if
    // any types have a function with that name. Then throw an error
    // letting the user know the available types.
    if (!foundFunction) {
        (0, utils_1.checkIfValueDefinedOrThrow)(input, functionName);
        const haveFunction = exports.EXTENSION_OBJECTS.filter((v) => functionName in v.functions);
        if (!haveFunction.length) {
            // This shouldn't really be possible but we should cover it anyway
            throw new expression_extension_error_1.ExpressionExtensionError(`Unknown expression function: ${functionName}`);
        }
        if (haveFunction.length > 1) {
            const lastType = `"${haveFunction.pop().typeName}"`;
            const typeNames = `${haveFunction.map((v) => `"${v.typeName}"`).join(', ')}, and ${lastType}`;
            throw new expression_extension_error_1.ExpressionExtensionError(`${functionName}() is only callable on types ${typeNames}`);
        }
        else {
            throw new expression_extension_error_1.ExpressionExtensionError(`${functionName}() is only callable on type "${haveFunction[0].typeName}"`);
        }
    }
    if (foundFunction.type === 'native') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return foundFunction.function.apply(input, args);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return foundFunction.function(input, args);
}
function extendOptional(input, functionName) {
    const foundFunction = findExtendedFunction(input, functionName);
    if (!foundFunction) {
        return undefined;
    }
    if (foundFunction.type === 'native') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return foundFunction.function.bind(input);
    }
    return (...args) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return foundFunction.function(input, args);
    };
}
const EXTENDED_SYNTAX_CACHE = {};
function extendSyntax(bracketedExpression, forceExtend = false) {
    const chunks = (0, expression_parser_1.splitExpression)(bracketedExpression);
    const codeChunks = chunks
        .filter((c) => c.type === 'code')
        .map((c) => c.text.replace(/("|').*?("|')/, '').trim());
    if ((!codeChunks.some(exports.hasExpressionExtension) || (0, exports.hasNativeMethod)(bracketedExpression)) &&
        !forceExtend) {
        return bracketedExpression;
    }
    // If we've seen this expression before grab it from the cache
    if (bracketedExpression in EXTENDED_SYNTAX_CACHE) {
        return EXTENDED_SYNTAX_CACHE[bracketedExpression];
    }
    const extendedChunks = chunks.map((chunk) => {
        if (chunk.type === 'code') {
            let output = (0, exports.extendTransform)(chunk.text);
            // esprima fails to parse bare objects (e.g. `{ data: something }`), we can
            // work around this by wrapping it in an parentheses
            if (!output?.code && chunk.text.trim()[0] === '{') {
                output = (0, exports.extendTransform)(`(${chunk.text})`);
            }
            if (!output?.code) {
                throw new expression_extension_error_1.ExpressionExtensionError('invalid syntax');
            }
            let text = output.code;
            // We need to cut off any trailing semicolons. These cause issues
            // with certain types of expression and cause the whole expression
            // to fail.
            if (text.trim().endsWith(';')) {
                text = text.trim().slice(0, -1);
            }
            return {
                ...chunk,
                text,
            };
        }
        return chunk;
    });
    const expression = (0, expression_parser_1.joinExpression)(extendedChunks);
    // Cache the expression so we don't have to do this transform again
    EXTENDED_SYNTAX_CACHE[bracketedExpression] = expression;
    return expression;
}
//# sourceMappingURL=expression-extension.js.map