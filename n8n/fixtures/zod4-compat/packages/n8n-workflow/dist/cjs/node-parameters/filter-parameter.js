"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateFilterParameter = exports.FilterError = void 0;
exports.arrayContainsValue = arrayContainsValue;
exports.executeFilterCondition = executeFilterCondition;
exports.executeFilter = executeFilter;
const errors_1 = require("@n8n/errors");
const LoggerProxy = __importStar(require("../logger-proxy.js"));
const type_validation_1 = require("../type-validation.js");
class FilterError extends errors_1.ApplicationError {
    description;
    constructor(message, description) {
        super(message, { level: 'warning' });
        this.description = description;
    }
}
exports.FilterError = FilterError;
function parseSingleFilterValue(value, type, strict = false, version = 1) {
    if (type === 'any' || value === null || value === undefined) {
        return { valid: true, newValue: value };
    }
    if (type === 'boolean' && !strict) {
        if (version >= 2) {
            const result = (0, type_validation_1.validateFieldType)('filter', value, type);
            if (result.valid)
                return result;
        }
        return { valid: true, newValue: Boolean(value) };
    }
    if (type === 'number') {
        if (Number.isNaN(value)) {
            return { valid: true, newValue: value };
        }
        const isEmptyString = typeof value === 'string' && value.trim() === '';
        const isEmptyArray = Array.isArray(value) && value.length === 0;
        // Number('') and Number([]) convert to 0 in validateFieldType, which is not intuitive, consider them empty values
        if ((isEmptyString || isEmptyArray) && version >= 3) {
            return { valid: true, newValue: null };
        }
    }
    return (0, type_validation_1.validateFieldType)('filter', value, type, { strict, parseStrings: true });
}
const withIndefiniteArticle = (noun) => {
    const article = 'aeiou'.includes(noun.charAt(0)) ? 'an' : 'a';
    return `${article} ${noun}`;
};
function parseFilterConditionValues(condition, options, metadata) {
    const index = metadata.index ?? 0;
    const itemIndex = metadata.itemIndex ?? 0;
    const errorFormat = metadata.errorFormat ?? 'full';
    const strict = options.typeValidation === 'strict';
    const version = options.version ?? 1;
    const { operator } = condition;
    const rightType = operator.rightType ?? operator.type;
    const parsedLeftValue = parseSingleFilterValue(condition.leftValue, operator.type, strict, version);
    const parsedRightValue = parseSingleFilterValue(condition.rightValue, rightType, strict, version);
    const leftValid = parsedLeftValue.valid ||
        (metadata.unresolvedExpressions &&
            typeof condition.leftValue === 'string' &&
            condition.leftValue.startsWith('='));
    const rightValid = parsedRightValue.valid ||
        !!operator.singleValue ||
        (metadata.unresolvedExpressions &&
            typeof condition.rightValue === 'string' &&
            condition.rightValue.startsWith('='));
    const leftValueString = String(condition.leftValue);
    const rightValueString = String(condition.rightValue);
    const suffix = errorFormat === 'full' ? `[condition ${index}, item ${itemIndex}]` : `[item ${itemIndex}]`;
    const composeInvalidTypeMessage = (type, fromType, value) => {
        fromType = fromType.toLocaleLowerCase();
        if (strict) {
            return `Wrong type: '${value}' is ${withIndefiniteArticle(fromType)} but was expecting ${withIndefiniteArticle(type)} ${suffix}`;
        }
        return `Conversion error: the ${fromType} '${value}' can't be converted to ${withIndefiniteArticle(type)} ${suffix}`;
    };
    const getTypeDescription = (isStrict) => {
        if (isStrict)
            return "Try changing the type of comparison. Alternatively you can enable 'Convert types where required'.";
        return 'Try changing the type of the comparison.';
    };
    const composeInvalidTypeDescription = (type, fromType, valuePosition) => {
        fromType = fromType.toLocaleLowerCase();
        const expectedType = withIndefiniteArticle(type);
        let convertionFunction = '';
        if (type === 'string') {
            convertionFunction = '.toString()';
        }
        else if (type === 'number') {
            convertionFunction = '.toNumber()';
        }
        else if (type === 'boolean') {
            convertionFunction = '.toBoolean()';
        }
        if (strict && convertionFunction) {
            const suggestFunction = ` by adding <code>${convertionFunction}</code>`;
            return `
<p>Try either:</p>
<ol>
  <li>Enabling 'Convert types where required'</li>
  <li>Converting the ${valuePosition} field to ${expectedType}${suggestFunction}</li>
</ol>
			`;
        }
        return getTypeDescription(strict);
    };
    if (!leftValid && !rightValid && typeof condition.leftValue === typeof condition.rightValue) {
        return {
            ok: false,
            error: new FilterError(`Comparison type expects ${withIndefiniteArticle(operator.type)} but both fields are ${withIndefiniteArticle(typeof condition.leftValue)}`, getTypeDescription(strict)),
        };
    }
    if (!leftValid) {
        return {
            ok: false,
            error: new FilterError(composeInvalidTypeMessage(operator.type, typeof condition.leftValue, leftValueString), composeInvalidTypeDescription(operator.type, typeof condition.leftValue, 'first')),
        };
    }
    if (!rightValid) {
        return {
            ok: false,
            error: new FilterError(composeInvalidTypeMessage(rightType, typeof condition.rightValue, rightValueString), composeInvalidTypeDescription(rightType, typeof condition.rightValue, 'second')),
        };
    }
    return {
        ok: true,
        result: {
            left: parsedLeftValue.valid ? parsedLeftValue.newValue : undefined,
            right: parsedRightValue.valid ? parsedRightValue.newValue : undefined,
        },
    };
}
function parseRegexPattern(pattern) {
    const regexMatch = (pattern || '').match(new RegExp('^/(.*?)/([gimusy]*)$'));
    let regex;
    if (!regexMatch) {
        regex = new RegExp((pattern || '').toString());
    }
    else {
        regex = new RegExp(regexMatch[1], regexMatch[2]);
    }
    return regex;
}
function arrayContainsValue(array, value, ignoreCase) {
    if (ignoreCase && typeof value === 'string') {
        return array.some((item) => {
            if (typeof item !== 'string') {
                return false;
            }
            return item.toString().toLocaleLowerCase() === value.toLocaleLowerCase();
        });
    }
    return array.includes(value);
}
// eslint-disable-next-line complexity
function executeFilterCondition(condition, filterOptions, metadata = {}) {
    const ignoreCase = !filterOptions.caseSensitive;
    const { operator } = condition;
    const parsedValues = parseFilterConditionValues(condition, filterOptions, metadata);
    if (!parsedValues.ok) {
        throw parsedValues.error;
    }
    let { left: leftValue, right: rightValue } = parsedValues.result;
    const exists = leftValue !== undefined && leftValue !== null && !Number.isNaN(leftValue);
    if (condition.operator.operation === 'exists') {
        return exists;
    }
    else if (condition.operator.operation === 'notExists') {
        return !exists;
    }
    switch (operator.type) {
        case 'string': {
            if (ignoreCase) {
                if (typeof leftValue === 'string') {
                    leftValue = leftValue.toLocaleLowerCase();
                }
                if (typeof rightValue === 'string' &&
                    !(condition.operator.operation === 'regex' || condition.operator.operation === 'notRegex')) {
                    rightValue = rightValue.toLocaleLowerCase();
                }
            }
            const left = (leftValue ?? '');
            const right = (rightValue ?? '');
            switch (condition.operator.operation) {
                case 'empty':
                    return left.length === 0;
                case 'notEmpty':
                    return left.length !== 0;
                case 'equals':
                    return left === right;
                case 'notEquals':
                    return left !== right;
                case 'contains':
                    return left.includes(right);
                case 'notContains':
                    return !left.includes(right);
                case 'startsWith':
                    return left.startsWith(right);
                case 'notStartsWith':
                    return !left.startsWith(right);
                case 'endsWith':
                    return left.endsWith(right);
                case 'notEndsWith':
                    return !left.endsWith(right);
                case 'regex':
                    return parseRegexPattern(right).test(left);
                case 'notRegex':
                    return !parseRegexPattern(right).test(left);
            }
            break;
        }
        case 'number': {
            const left = leftValue;
            const right = rightValue;
            switch (condition.operator.operation) {
                case 'empty':
                    return !exists;
                case 'notEmpty':
                    return exists;
                case 'equals':
                    return left === right;
                case 'notEquals':
                    return left !== right;
                case 'gt':
                    return left > right;
                case 'lt':
                    return left < right;
                case 'gte':
                    return left >= right;
                case 'lte':
                    return left <= right;
            }
            break;
        }
        case 'dateTime': {
            const left = leftValue;
            const right = rightValue;
            if (condition.operator.operation === 'empty') {
                return !exists;
            }
            else if (condition.operator.operation === 'notEmpty') {
                return exists;
            }
            if (!left || !right) {
                return false;
            }
            switch (condition.operator.operation) {
                case 'equals':
                    return left.toMillis() === right.toMillis();
                case 'notEquals':
                    return left.toMillis() !== right.toMillis();
                case 'after':
                    return left.toMillis() > right.toMillis();
                case 'before':
                    return left.toMillis() < right.toMillis();
                case 'afterOrEquals':
                    return left.toMillis() >= right.toMillis();
                case 'beforeOrEquals':
                    return left.toMillis() <= right.toMillis();
            }
            break;
        }
        case 'boolean': {
            const left = leftValue;
            const right = rightValue;
            switch (condition.operator.operation) {
                case 'empty':
                    return !exists;
                case 'notEmpty':
                    return exists;
                case 'true':
                    return left;
                case 'false':
                    return !left;
                case 'equals':
                    return left === right;
                case 'notEquals':
                    return left !== right;
            }
            break;
        }
        case 'array': {
            const left = (leftValue ?? []);
            const rightNumber = rightValue;
            switch (condition.operator.operation) {
                case 'contains':
                    return arrayContainsValue(left, rightValue, ignoreCase);
                case 'notContains':
                    return !arrayContainsValue(left, rightValue, ignoreCase);
                case 'lengthEquals':
                    return left.length === rightNumber;
                case 'lengthNotEquals':
                    return left.length !== rightNumber;
                case 'lengthGt':
                    return left.length > rightNumber;
                case 'lengthLt':
                    return left.length < rightNumber;
                case 'lengthGte':
                    return left.length >= rightNumber;
                case 'lengthLte':
                    return left.length <= rightNumber;
                case 'empty':
                    return left.length === 0;
                case 'notEmpty':
                    return left.length !== 0;
            }
            break;
        }
        case 'object': {
            const left = leftValue;
            switch (condition.operator.operation) {
                case 'empty':
                    return !left || Object.keys(left).length === 0;
                case 'notEmpty':
                    return !!left && Object.keys(left).length !== 0;
            }
            break;
        }
    }
    LoggerProxy.warn(`Unknown filter parameter operator "${operator.type}:${operator.operation}"`);
    return false;
}
function executeFilter(value, { itemIndex } = {}) {
    const conditionPass = (condition, index) => executeFilterCondition(condition, value.options, { index, itemIndex });
    if (value.combinator === 'and') {
        return value.conditions.every(conditionPass);
    }
    else if (value.combinator === 'or') {
        return value.conditions.some(conditionPass);
    }
    LoggerProxy.warn(`Unknown filter combinator "${value.combinator}"`);
    return false;
}
const validateFilterParameter = (nodeProperties, value) => {
    return value.conditions.reduce((issues, condition, index) => {
        const key = `${nodeProperties.name}.${index}`;
        try {
            parseFilterConditionValues(condition, value.options, {
                index,
                unresolvedExpressions: true,
                errorFormat: 'inline',
            });
        }
        catch (error) {
            if (error instanceof FilterError) {
                issues[key].push(error.message);
            }
        }
        return issues;
    }, {});
};
exports.validateFilterParameter = validateFilterParameter;
//# sourceMappingURL=filter-parameter.js.map