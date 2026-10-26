"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasDotNotationBannedChar = hasDotNotationBannedChar;
exports.backslashEscape = backslashEscape;
exports.dollarEscape = dollarEscape;
exports.applyAccessPatterns = applyAccessPatterns;
exports.extractReferencesInNodeExpressions = extractReferencesInNodeExpressions;
const cloneDeep_1 = __importDefault(require("lodash/cloneDeep.js"));
const escapeRegExp_1 = __importDefault(require("lodash/escapeRegExp.js"));
const isEqual_1 = __importDefault(require("lodash/isEqual.js"));
const mapValues_1 = __importDefault(require("lodash/mapValues.js"));
const errors_1 = require("./errors/index.js");
class LazyRegExp {
    pattern;
    flags;
    regExp;
    constructor(pattern, flags) {
        this.pattern = pattern;
        this.flags = flags;
    }
    get() {
        if (!this.regExp)
            this.regExp = new RegExp(this.pattern(), this.flags);
        return this.regExp;
    }
}
const DOT_REFERENCEABLE_JS_VARIABLE = /\w[\w\d_\$]*/;
const INVALID_JS_DOT_PATH = /[^\.\w\d_\$]/;
const INVALID_JS_DOT_NAME = /[^\w\d_\$]/;
// These are the keys that are followed by one of DATA_ACCESSORS
const ITEM_TO_DATA_ACCESSORS = [
    /^first\(\)/,
    /^last\(\)/,
    /^all\(\)/,
    // The order here is relevant because `item` would match occurrences of `itemMatching`
    /^itemMatching\(\d+\)/, // We only support trivial itemMatching arguments
    /^item/,
];
const SPLIT_OUT_NODE_TYPE = 'n8n-nodes-base.splitOut';
// These we safely can convert to a normal argument
const ITEM_ACCESSORS = ['params', 'isExecuted'];
const DATA_ACCESSORS = ['json', 'binary'];
function hasDotNotationBannedChar(nodeName) {
    const DOT_NOTATION_BANNED_CHARS = /^(\d)|[\\ `!@#$%^&*()_+\-=[\]{};':"\\|,.<>?~]/g;
    return DOT_NOTATION_BANNED_CHARS.test(nodeName);
}
function backslashEscape(nodeName) {
    const BACKSLASH_ESCAPABLE_CHARS = /[.*+?^${}()|[\]\\]/g;
    return nodeName.replace(BACKSLASH_ESCAPABLE_CHARS, (char) => `\\${char}`);
}
function dollarEscape(nodeName) {
    return nodeName.replace(new RegExp('\\$', 'g'), '$$$$');
}
const ACCESS_PATTERNS = [
    {
        checkPattern: '$(',
        replacePattern: (s) => String.raw `(\$\(['"])${s}(['"]\))`,
    },
    {
        checkPattern: '$node[',
        replacePattern: (s) => String.raw `(\$node\[['"])${s}(['"]\])`,
    },
    {
        checkPattern: '$node.',
        replacePattern: (s) => String.raw `(\$node\.)${s}(\.?)`,
        customCallback: (expression, newName, escapedNewName) => {
            if (hasDotNotationBannedChar(newName)) {
                const regex = new RegExp(`.${backslashEscape(newName)}( |\\.)`, 'g');
                return expression.replace(regex, `["${escapedNewName}"]$1`);
            }
            return expression;
        },
    },
    {
        checkPattern: '$items(',
        replacePattern: (s) => String.raw `(\$items\(['"])${s}(['"],|['"]\))`,
    },
];
function prepareOldNodeName(nodeName) {
    // if node name contains literal \ -> replace with \\
    // since that's how it'll be written in a JS expression
    const doubleSlashes = nodeName.replaceAll('\\', '\\\\');
    // escape special characters for regex
    const escaped = backslashEscape(doubleSlashes);
    // quotes may or may not be escaped in the JS expression
    // so we replace literal quotes with regexes handle that
    return escaped.replace(/"/g, '(?:\\\\?")').replace(/'/g, "(?:\\\\?')");
}
function prepareNewNodeName(nodeName) {
    // escape $ for replacement regex
    const dollarEscaped = dollarEscape(nodeName);
    // escape literal \ ' " characters
    return dollarEscaped.replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll("'", "\\'");
}
function applyAccessPatterns(expression, previousName, newName) {
    // To not run the "expensive" regex stuff when it is not needed
    // make a simple check first if it contains any of the access patterns
    let noMatch = true;
    for (const pattern of ACCESS_PATTERNS) {
        if (expression.includes(pattern.checkPattern)) {
            noMatch = false;
            break;
        }
    }
    if (noMatch) {
        return expression;
    }
    const preparedOldName = prepareOldNodeName(previousName);
    const preparedNewName = prepareNewNodeName(newName);
    for (const pattern of ACCESS_PATTERNS) {
        if (expression.includes(pattern.checkPattern)) {
            expression = expression.replace(new RegExp(pattern.replacePattern(preparedOldName), 'g'), `$1${preparedNewName}$2`);
            if (pattern.customCallback) {
                expression = pattern.customCallback(expression, newName, preparedNewName);
            }
        }
    }
    return expression;
}
function convertToUniqueJsDotName(nodeName, allNodeNames) {
    let jsLegal = nodeName
        .replaceAll(' ', '_')
        .split('')
        .filter((x) => !INVALID_JS_DOT_NAME.test(x))
        .join('');
    if (nodeName === jsLegal)
        return jsLegal;
    // This accounts for theoretical cases where we collide with other reduced names
    // By adding our own index in the array we also avoid running into theoretical cases
    // where a node with the name 'ourName_27' exists for our reduced name 'ourName'
    // because we must have a different index, so therefore only one of us can be `ourName_27_27`
    //
    // The underscore prevents colliding e.g. index 1 with 11
    while (allNodeNames.includes(jsLegal))
        jsLegal += `_${allNodeNames.indexOf(nodeName)}`;
    return jsLegal;
}
function convertDataAccessorName(name) {
    const [fnName, maybeDigits] = name.split('(');
    switch (fnName.toLowerCase()) {
        case 'item':
            return fnName;
        case 'first':
        case 'last':
            return `${fnName}Item`;
        case 'all':
            return `${fnName}Items`;
    }
    // use the digits without the )
    return `${fnName}_${maybeDigits?.slice(0, -1) ?? 'unknown'}`;
}
function parseExpressionMapping(isolatedExpression, nodeNameInExpression, nodeNamePlainJs, startNodeName) {
    const splitExpr = isolatedExpression.split('.');
    // This supports literal . used in the node name
    const dotsInName = nodeNameInExpression?.split('').filter((x) => x === '.').length ?? 0;
    const dotInAccessorsOffset = isolatedExpression.startsWith('$node.') ? 1 : 0;
    const exprStart = splitExpr.slice(0, dotInAccessorsOffset + dotsInName + 1).join('.');
    const parts = splitExpr.slice(dotInAccessorsOffset + dotsInName + 1);
    // The calling code is expected to only handle $json expressions for the root node
    // As these are invalid conversions for inner nodes
    if (exprStart === '$json') {
        let partsIdx = 0;
        for (; partsIdx < parts.length; ++partsIdx) {
            if (!DOT_REFERENCEABLE_JS_VARIABLE.test(parts[partsIdx]))
                break;
        }
        return {
            nodeNameInExpression: null,
            originalExpression: `${exprStart}.${parts.slice(0, partsIdx + 1).join('.')}`, // $json.valid.until, but not ['x'] after
            replacementPrefix: `${exprStart}`, // $json
            replacementName: `${parts.slice(0, partsIdx).join('_')}`, // valid_until
        };
    }
    if (parts.length === 0) {
        // If a node is referenced by name without any accessor we return a proxy that stringifies as an empty object
        // But it can still be validly passed to other functions
        // However when passed to a sub-workflow it collapses into a true empty object
        // So lets just abort porting this and don't touch it
        return null;
    }
    // Handling `all()` is very awkward since we need to pass the value as a single parameter but
    // can't do `$('Start').all() since it would be a different node's all
    const accessorPrefix = parts[0] === 'all()' ? 'first()' : parts[0];
    if (ITEM_TO_DATA_ACCESSORS.some((x) => parts[0].match(x))) {
        if (parts.length === 1) {
            // this case is a literal use of the return value of `$('nodeName').first()`
            // Note that it's safe to rename to first, even if there is a variable of the same name
            // since we resolve duplicate names later in the process
            const originalName = parts[0];
            return {
                nodeNameInExpression,
                originalExpression: `${exprStart}.${parts[0]}`, // $('abc').first()
                replacementPrefix: `$('${startNodeName}').${accessorPrefix}.json`, //  $('Start').first().json
                replacementName: `${nodeNamePlainJs}_${convertDataAccessorName(originalName)}`, // nodeName_firstItem, nodeName_itemMatching_20
            };
        }
        else {
            if (DATA_ACCESSORS.some((x) => parts[1] === x)) {
                let partsIdx = 2;
                for (; partsIdx < parts.length; ++partsIdx) {
                    if (!DOT_REFERENCEABLE_JS_VARIABLE.test(parts[partsIdx]))
                        break;
                }
                // Use a separate name for anything except item to avoid users confusing their e.g. first() variables
                const replacementPostfix = parts[0] === 'item' ? '' : `_${convertDataAccessorName(parts[0])}`;
                return {
                    nodeNameInExpression,
                    originalExpression: `${exprStart}.${parts.slice(0, partsIdx + 1).join('.')}`, // $('abc').item.json.valid.until, but not ['x'] after
                    replacementPrefix: `$('${startNodeName}').${accessorPrefix}.${parts[1]}`, // $('Start').item.json
                    replacementName: parts.slice(2, partsIdx).join('_') + replacementPostfix, // valid_until, or valid_until_firstItem
                };
            }
            else {
                // this case covers any normal ObjectExtensions functions called on the ITEM_TO_DATA_ACCESSORS entry
                // e.g. $('nodeName').first().toJsonObject().randomJSFunction() or $('nodeName').all().map(x => ({...x, a: 3 }))
                return {
                    nodeNameInExpression,
                    originalExpression: `${exprStart}.${parts[0]}`, // $('abc').first()
                    replacementPrefix: `$('${startNodeName}').${accessorPrefix}.json`, //  $('Start').first().json.
                    replacementName: `${nodeNamePlainJs}_${convertDataAccessorName(parts[0])}`, // nodeName_firstItem
                };
            }
        }
    }
    // This covers specific metadata functions available on nodes
    const itemAccessorMatch = ITEM_ACCESSORS.flatMap((x) => (x === parts[0] ? x : []))[0];
    if (itemAccessorMatch !== undefined) {
        return {
            nodeNameInExpression,
            originalExpression: `${exprStart}.${parts[0]}`, // $('abc').isExecuted
            replacementPrefix: `$('${startNodeName}').first().json`, //  $('Start').first()
            replacementName: `${nodeNamePlainJs}_${parts[0]}`, // nodeName_isExecuted
        };
    }
    // If we end up here it means that:
    // - we have a complex `itemMatching(<expr>)` case, or
    // - the expression should be invalid, or
    // - a new function was added that we're not aware of.
    //
    // In these cases let's just not touch it and keep it as is
    return null;
}
// find `$('NodeName').item.json.path.to.x` in `{{ $('NodeName').item.json.path.to.x[someFunction()] }}`
function extractExpressionCandidate(expression, startIndex, endIndex) {
    const firstPartException = ITEM_TO_DATA_ACCESSORS.map((x) => x.exec(expression.slice(endIndex))).filter((x) => x !== null);
    // Note that by choosing match 0 we use `itemMatching` matches over `item`
    // matches by relying on the order in ITEM_TO_DATA_ACCESSORS
    let after_accessor_idx = endIndex + (firstPartException[0]?.[0].length ?? -1);
    // skip `.` to continue, but halt before other symbols like `[` in `all()[0]`
    if (expression[after_accessor_idx + 1] === '.')
        after_accessor_idx += 1;
    const after_accessor = expression.slice(after_accessor_idx);
    const firstInvalidCharMatch = INVALID_JS_DOT_PATH.exec(after_accessor);
    // we should at least find the }} closing the JS expressions in valid cases
    if (!firstInvalidCharMatch)
        return null;
    return expression.slice(startIndex, after_accessor_idx + firstInvalidCharMatch.index);
}
// Parse a given regex accessor match (e.g. `$('nodeName')`, `$node['nodeName']`)
// and extract a potential ExpressionMapping
function parseCandidateMatch(match, expression, nodeNames, startNodeName) {
    const startIndex = match.index;
    const endIndex = startIndex + match[0].length + 1;
    // this works because all access patterns define match groups
    // [fullMatch, "$('", "nodeName", "')"]
    const nodeNameInExpression = match[2];
    // This should be invalid in theory, since the regex matches should only act
    // on known node names
    if (!nodeNames.includes(nodeNameInExpression))
        return null;
    const candidate = extractExpressionCandidate(expression, startIndex, endIndex);
    if (candidate === null)
        return null;
    return parseExpressionMapping(candidate, nodeNameInExpression, convertToUniqueJsDotName(nodeNameInExpression, nodeNames), startNodeName);
}
// Handle matches of form `$json.path.to.value`, which is necessary for the selection input node
function parse$jsonMatch(match, expression, startNodeName) {
    const candidate = extractExpressionCandidate(expression, match.index, match.index + match[0].length + 1);
    if (candidate === null)
        return null;
    return parseExpressionMapping(candidate, null, null, startNodeName);
}
// Parse all references to other nodes in `expression` and return them as `ExpressionMappings`
function parseReferencingExpressions(expression, nodeRegexps, nodeNames, startNodeName, parse$json) {
    const result = [];
    for (const [pattern, regexp] of nodeRegexps) {
        if (!expression.includes(pattern))
            continue;
        const matches = [...expression.matchAll(regexp.get())];
        result.push(...matches
            .map((x) => parseCandidateMatch(x, expression, nodeNames, startNodeName))
            .filter((x) => x !== null));
    }
    if (parse$json && expression.includes('$json')) {
        for (const match of expression.matchAll(/\$json/gi)) {
            const res = parse$jsonMatch(match, expression, startNodeName);
            if (res)
                result.push(res);
        }
    }
    return result;
}
// Recursively apply `mapper` to all expressions in `parameterValue`
function applyParameterMapping(parameterValue, mapper, keyOfValue) {
    const result = {};
    if (typeof parameterValue !== 'object' || parameterValue === null) {
        if (typeof parameterValue === 'string' &&
            (parameterValue.charAt(0) === '=' || keyOfValue === 'jsCode')) {
            const mapping = mapper(parameterValue);
            return [mapping, mapping];
        }
        return [undefined, []];
    }
    const allMappings = [];
    for (const [key, value] of Object.entries(parameterValue)) {
        const [mapping, all] = applyParameterMapping(value, mapper, key);
        result[key] = mapping;
        allMappings.push(...all);
    }
    return [result, allMappings];
}
// Ensure all expressions have a unique variable name
function resolveDuplicates(data, allNodeNames) {
    // Map from candidate variableName to its expressionData
    const triggerArgumentMap = new Map();
    const originalExpressionMap = new Map();
    for (const mapping of data) {
        const { nodeNameInExpression, originalExpression, replacementPrefix } = mapping;
        let { replacementName } = mapping;
        const hasKeyAndCollides = (key) => {
            const value = triggerArgumentMap.get(key);
            if (!value)
                return false;
            return !(0, isEqual_1.default)(value, mapping);
        };
        // We need both parts in the key as we may need to pass e.g. `.first()` and `.item` separately
        // Since we cannot pass the node itself as its proxy reduces it to an empty object
        const key = () => `${replacementPrefix}.${replacementName}`;
        // This covers a realistic case where two nodes have the same path, e.g.
        //    $('original input').item.json.path.to.url
        //    $('some time later in the workflow').item.json.path.to.url
        if (hasKeyAndCollides(key()) && nodeNameInExpression) {
            replacementName = `${convertToUniqueJsDotName(nodeNameInExpression, allNodeNames)}_${replacementName}`;
        }
        // This covers all other theoretical cases, like where `${nodeName}_${variable}` might clash with another variable name
        while (hasKeyAndCollides(key()))
            replacementName += '_1';
        triggerArgumentMap.set(key(), {
            originalExpression,
            nodeNameInExpression,
            replacementName,
            replacementPrefix,
        });
        originalExpressionMap.set(originalExpression, key());
    }
    return {
        triggerArgumentMap,
        originalExpressionMap,
    };
}
// Recursively loop through the nodeProperties and apply `parameterExtractMapping` where defined
function applyExtractMappingToNode(node, parameterExtractMapping) {
    const usedMappings = [];
    const applyMapping = (parameters, mapping) => {
        if (!mapping)
            return parameters;
        if (typeof parameters !== 'object' || parameters === null) {
            if (Array.isArray(mapping) && typeof parameters === 'string') {
                for (const mapper of mapping) {
                    if (!parameters.includes(mapper.originalExpression))
                        continue;
                    parameters = parameters.replaceAll(mapper.originalExpression, `${mapper.replacementPrefix}.${mapper.replacementName}`);
                    usedMappings.push(mapper);
                }
            }
            return parameters;
        }
        // This should be an invalid state, though an explicit check makes typings easier
        if (Array.isArray(mapping)) {
            return parameters;
        }
        if (Array.isArray(parameters) && typeof mapping === 'object' && !Array.isArray(mapping)) {
            return parameters.map((x, i) => applyMapping(x, mapping[i]));
        }
        return (0, mapValues_1.default)(parameters, (v, k) => applyMapping(v, mapping[k]));
    };
    const parameters = applyMapping(node.parameters, parameterExtractMapping);
    return { result: { ...node, parameters }, usedMappings };
}
// Recursively find the finalized mapping for provisional mappings
function applyCanonicalMapping(mapping, getCanonicalData) {
    if (!mapping)
        return;
    if (Array.isArray(mapping)) {
        // Sort by longest so that we don't accidentally replace part of a longer expression
        return mapping
            .map(getCanonicalData)
            .filter((x) => x !== undefined)
            .sort((a, b) => b.originalExpression.length - a.originalExpression.length);
    }
    return (0, mapValues_1.default)(mapping, (v) => applyCanonicalMapping(v, getCanonicalData));
}
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
function extractReferencesInNodeExpressions(subGraph, nodeNames, insertedStartName, graphInputNodeNames) {
    const [start] = graphInputNodeNames ?? [];
    ////
    // STEP 1 - Validate input invariants
    ////
    const subGraphNames = subGraph.map((x) => x.name);
    if (subGraphNames.includes(insertedStartName))
        throw new errors_1.OperationalError(`StartNodeName ${insertedStartName} already exists in nodeNames: ${JSON.stringify(subGraphNames)}`);
    if (subGraphNames.some((x) => !nodeNames.includes(x))) {
        throw new errors_1.OperationalError(`extractReferencesInNodeExpressions called with node in subGraph ${JSON.stringify(subGraphNames)} whose name is not in provided 'nodeNames' list ${JSON.stringify(nodeNames)}.`);
    }
    ////
    // STEP 2 - Compile all candidate regexp patterns
    ////
    // This looks scary for large workflows, but RegExp should support >1 million characters and
    // it's a very linear pattern.
    const namesRegexp = '(' + nodeNames.map(escapeRegExp_1.default).join('|') + ')';
    const nodeRegexps = ACCESS_PATTERNS.map((pattern) => [
        pattern.checkPattern,
        // avoid compiling the expensive regex for rare legacy ways of accessing nodes
        new LazyRegExp(() => pattern.replacePattern(namesRegexp), 'g'),
    ]);
    ////
    // STEP 3 - Parse expressions used in parameters and build mappings
    ////
    // This map is used to change the actual expressions once resolved
    // The value represents fields in the actual parameters object which require change
    const parameterTreeMappingByNode = new Map();
    // This is used to track all candidates for change, necessary for deduplication
    const allData = [];
    // Additional mappings that should contribute to sub-workflow inputs (e.g. Split Out 'fieldToSplitOut')
    const extraVariableCandidates = [];
    for (const node of subGraph) {
        const [parameterMapping, allMappings] = applyParameterMapping(node.parameters, (s) => parseReferencingExpressions(s, nodeRegexps, nodeNames, insertedStartName, graphInputNodeNames?.includes(node.name) ?? false));
        parameterTreeMappingByNode.set(node.name, parameterMapping);
        allData.push(...allMappings);
        if (node.name === start && node.type === SPLIT_OUT_NODE_TYPE) {
            const raw = node.parameters?.fieldToSplitOut;
            if (typeof raw === 'string' && raw.trim() !== '') {
                const trimmed = raw.trim();
                const isExpression = trimmed.startsWith('=');
                // Expressions in Split Out 'fieldToSplitOut' parameters are not supported,
                // as they define the fields to split out only at execution time.
                if (isExpression) {
                    throw new errors_1.OperationalError(`Extracting sub-workflow from Split Out node with 'fieldToSplitOut' parameter having expression "${trimmed}" is not supported.`);
                }
                // Parameter value is a CSV of fields to split out.
                // Create synthetic $json expressions for each field
                const fields = isExpression
                    ? [trimmed]
                    : trimmed.split(',').map((field) => `={{$json.${field.trim()}}}`);
                for (const expression of fields) {
                    const mappingsFromField = parseReferencingExpressions(expression, nodeRegexps, nodeNames, insertedStartName, graphInputNodeNames?.includes(node.name) ?? false);
                    extraVariableCandidates.push(...mappingsFromField);
                }
            }
        }
    }
    ////
    // STEP 4 - Filter out nodes in subGraph and handle name clashes
    ////
    const subGraphNodeNames = new Set(subGraphNames);
    const dataFromOutsideSubgraph = [...allData, ...extraVariableCandidates].filter(
    // `nodeNameInExpression` being absent implies direct access via `$json` or `$binary`
    (x) => !x.nodeNameInExpression || !subGraphNodeNames.has(x.nodeNameInExpression));
    const { originalExpressionMap, triggerArgumentMap } = resolveDuplicates(dataFromOutsideSubgraph, nodeNames);
    ////
    // STEP 5 - Apply canonical mappings to nodes and track created variables
    ////
    // triggerArgumentMap[originalExpressionMap[originalExpression]] returns its canonical object
    // These should never be undefined at this stage
    const getCanonicalData = (e) => {
        const key = originalExpressionMap.get(e.originalExpression);
        if (!key)
            return undefined;
        return triggerArgumentMap.get(key);
    };
    for (const [key, value] of parameterTreeMappingByNode.entries()) {
        parameterTreeMappingByNode.set(key, applyCanonicalMapping(value, getCanonicalData));
    }
    const allUsedMappings = [];
    const output = [];
    for (const node of subGraph) {
        const { result, usedMappings } = applyExtractMappingToNode((0, cloneDeep_1.default)(node), parameterTreeMappingByNode.get(node.name));
        allUsedMappings.push(...usedMappings);
        output.push(result);
    }
    for (const candidate of extraVariableCandidates) {
        const key = originalExpressionMap.get(candidate.originalExpression);
        if (!key)
            continue;
        const canonical = triggerArgumentMap.get(key);
        if (!canonical)
            continue;
        if (!allUsedMappings.some((u) => u.replacementName === canonical.replacementName)) {
            allUsedMappings.push(canonical);
        }
    }
    const variables = new Map(allUsedMappings.map((m) => [m.replacementName, m.originalExpression]));
    return { nodes: output, variables };
}
//# sourceMappingURL=node-reference-parser-utils.js.map