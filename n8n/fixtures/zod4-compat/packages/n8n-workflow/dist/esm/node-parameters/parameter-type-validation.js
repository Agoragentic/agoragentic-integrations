import { NodeOperationError } from "../errors/index.js";
import { assert } from "../utils.js";
function assertUserInput(condition, message, node) {
    try {
        assert(condition, message);
    }
    catch (e) {
        if (e instanceof Error) {
            // Use level 'info' to prevent reporting to Sentry (only 'error' and 'fatal' levels are reported)
            const nodeError = new NodeOperationError(node, e.message, { level: 'info' });
            nodeError.stack = e.stack;
            throw nodeError;
        }
        throw e;
    }
}
function assertParamIsType(parameterName, value, type, node) {
    assertUserInput(typeof value === type, `Parameter "${parameterName}" is not ${type}`, node);
}
export function assertParamIsNumber(parameterName, value, node) {
    assertParamIsType(parameterName, value, 'number', node);
}
export function assertParamIsString(parameterName, value, node) {
    assertParamIsType(parameterName, value, 'string', node);
}
export function assertParamIsBoolean(parameterName, value, node) {
    assertParamIsType(parameterName, value, 'boolean', node);
}
export function assertParamIsOfAnyTypes(parameterName, value, types, node) {
    const isValid = types.some((type) => typeof value === type);
    if (!isValid) {
        const typeList = types.join(' or ');
        assertUserInput(false, `Parameter "${parameterName}" must be ${typeList}`, node);
    }
}
export function assertParamIsArray(parameterName, value, validator, node) {
    assertUserInput(Array.isArray(value), `Parameter "${parameterName}" is not an array`, node);
    // Use for loop instead of .every() to properly handle sparse arrays
    // .every() skips empty/sparse indices, which could allow invalid arrays to pass
    for (let i = 0; i < value.length; i++) {
        if (!validator(value[i])) {
            assertUserInput(false, `Parameter "${parameterName}" has elements that don't match expected types`, node);
        }
    }
}
function assertIsValidObject(value, node) {
    assertUserInput(typeof value === 'object' && value !== null, 'Value is not a valid object', node);
}
function assertIsRequiredParameter(parameterName, value, isRequired, node) {
    if (isRequired && value === undefined) {
        assertUserInput(false, `Required parameter "${parameterName}" is missing`, node);
    }
}
function assertIsResourceLocator(parameterName, value, node) {
    assertUserInput(typeof value === 'object' &&
        value !== null &&
        '__rl' in value &&
        'mode' in value &&
        'value' in value, `Parameter "${parameterName}" is not a valid resource locator object`, node);
}
function assertParamIsObject(parameterName, value, node) {
    assertUserInput(typeof value === 'object' && value !== null, `Parameter "${parameterName}" is not a valid object`, node);
}
function createElementValidator(elementType) {
    return (val) => typeof val === elementType;
}
function assertParamIsArrayOfType(parameterName, value, arrayType, node) {
    const baseType = arrayType.slice(0, -2);
    const elementType = baseType === 'string' || baseType === 'number' || baseType === 'boolean' ? baseType : 'string';
    const validator = createElementValidator(elementType);
    assertParamIsArray(parameterName, value, validator, node);
}
function assertParamIsPrimitive(parameterName, value, type, node) {
    assertUserInput(typeof value === type, `Parameter "${parameterName}" is not a valid ${type}`, node);
}
function validateParameterType(parameterName, value, type, node) {
    try {
        if (type === 'resource-locator') {
            assertIsResourceLocator(parameterName, value, node);
        }
        else if (type === 'object') {
            assertParamIsObject(parameterName, value, node);
        }
        else if (type.endsWith('[]')) {
            assertParamIsArrayOfType(parameterName, value, type, node);
        }
        else {
            assertParamIsPrimitive(parameterName, value, type, node);
        }
        return true;
    }
    catch {
        return false;
    }
}
function validateParameterAgainstTypes(parameterName, value, types, node) {
    let isValid = false;
    for (const type of types) {
        if (validateParameterType(parameterName, value, type, node)) {
            isValid = true;
            break;
        }
    }
    if (!isValid) {
        const typeList = types.join(' or ');
        assertUserInput(false, `Parameter "${parameterName}" does not match any of the expected types: ${typeList}`, node);
    }
}
export function validateNodeParameters(value, parameters, node) {
    assertIsValidObject(value, node);
    Object.keys(parameters).forEach((key) => {
        const param = parameters[key];
        const paramValue = value[key];
        assertIsRequiredParameter(key, paramValue, param.required ?? false, node);
        // If required, value cannot be undefined and must be validated
        // If not required, value can be undefined but should be validated when present
        if (param.required || paramValue !== undefined) {
            const types = Array.isArray(param.type) ? param.type : [param.type];
            validateParameterAgainstTypes(key, paramValue, types, node);
        }
    });
}
//# sourceMappingURL=parameter-type-validation.js.map