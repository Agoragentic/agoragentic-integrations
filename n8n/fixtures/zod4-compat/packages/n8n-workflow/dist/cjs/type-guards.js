"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBinaryValue = exports.isNodeConnectionType = exports.isFilterValue = exports.isAssignmentCollectionValue = exports.isAssignmentValue = exports.isResourceMapperValue = exports.isValidResourceLocatorParameterValue = exports.isINodePropertyCollectionList = exports.isINodePropertyOptionsList = exports.isINodePropertiesList = exports.isINodePropertyCollection = exports.isINodePropertyOptions = exports.isINodeProperties = void 0;
exports.isResourceLocatorValue = isResourceLocatorValue;
const interfaces_1 = require("./interfaces.js");
function isResourceLocatorValue(value) {
    return Boolean(typeof value === 'object' && value && 'mode' in value && 'value' in value && '__rl' in value);
}
const isINodeProperties = (item) => 'name' in item && 'type' in item && !('value' in item);
exports.isINodeProperties = isINodeProperties;
const isINodePropertyOptions = (item) => 'value' in item && 'name' in item && !('displayName' in item);
exports.isINodePropertyOptions = isINodePropertyOptions;
const isINodePropertyCollection = (item) => 'values' in item && 'name' in item && 'displayName' in item;
exports.isINodePropertyCollection = isINodePropertyCollection;
const isINodePropertiesList = (items) => Array.isArray(items) && items.every(exports.isINodeProperties);
exports.isINodePropertiesList = isINodePropertiesList;
const isINodePropertyOptionsList = (items) => Array.isArray(items) && items.every(exports.isINodePropertyOptions);
exports.isINodePropertyOptionsList = isINodePropertyOptionsList;
const isINodePropertyCollectionList = (items) => {
    return Array.isArray(items) && items.every(exports.isINodePropertyCollection);
};
exports.isINodePropertyCollectionList = isINodePropertyCollectionList;
const isValidResourceLocatorParameterValue = (value) => {
    if (typeof value === 'object') {
        if (typeof value.value === 'number') {
            return true; // Accept all numbers
        }
        return !!value.value;
    }
    else {
        return !!value;
    }
};
exports.isValidResourceLocatorParameterValue = isValidResourceLocatorParameterValue;
const isResourceMapperValue = (value) => {
    return (typeof value === 'object' &&
        value !== null &&
        'mappingMode' in value &&
        'schema' in value &&
        'value' in value);
};
exports.isResourceMapperValue = isResourceMapperValue;
const isAssignmentValue = (value) => {
    return (typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        typeof value.id === 'string' &&
        'name' in value &&
        typeof value.name === 'string' &&
        'value' in value &&
        (!('type' in value) || typeof value.type === 'string'));
};
exports.isAssignmentValue = isAssignmentValue;
const isAssignmentCollectionValue = (value) => {
    return (typeof value === 'object' &&
        value !== null &&
        'assignments' in value &&
        Array.isArray(value.assignments) &&
        value.assignments.every(exports.isAssignmentValue));
};
exports.isAssignmentCollectionValue = isAssignmentCollectionValue;
const isFilterValue = (value) => {
    return (typeof value === 'object' && value !== null && 'conditions' in value && 'combinator' in value);
};
exports.isFilterValue = isFilterValue;
const isNodeConnectionType = (value) => {
    return interfaces_1.nodeConnectionTypes.includes(value);
};
exports.isNodeConnectionType = isNodeConnectionType;
const isBinaryValue = (value) => {
    return (typeof value === 'object' &&
        value !== null &&
        'mimeType' in value &&
        ('data' in value || 'id' in value));
};
exports.isBinaryValue = isBinaryValue;
//# sourceMappingURL=type-guards.js.map