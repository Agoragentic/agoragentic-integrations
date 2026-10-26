import { nodeConnectionTypes, } from "./interfaces.js";
export function isResourceLocatorValue(value) {
    return Boolean(typeof value === 'object' && value && 'mode' in value && 'value' in value && '__rl' in value);
}
export const isINodeProperties = (item) => 'name' in item && 'type' in item && !('value' in item);
export const isINodePropertyOptions = (item) => 'value' in item && 'name' in item && !('displayName' in item);
export const isINodePropertyCollection = (item) => 'values' in item && 'name' in item && 'displayName' in item;
export const isINodePropertiesList = (items) => Array.isArray(items) && items.every(isINodeProperties);
export const isINodePropertyOptionsList = (items) => Array.isArray(items) && items.every(isINodePropertyOptions);
export const isINodePropertyCollectionList = (items) => {
    return Array.isArray(items) && items.every(isINodePropertyCollection);
};
export const isValidResourceLocatorParameterValue = (value) => {
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
export const isResourceMapperValue = (value) => {
    return (typeof value === 'object' &&
        value !== null &&
        'mappingMode' in value &&
        'schema' in value &&
        'value' in value);
};
export const isAssignmentValue = (value) => {
    return (typeof value === 'object' &&
        value !== null &&
        'id' in value &&
        typeof value.id === 'string' &&
        'name' in value &&
        typeof value.name === 'string' &&
        'value' in value &&
        (!('type' in value) || typeof value.type === 'string'));
};
export const isAssignmentCollectionValue = (value) => {
    return (typeof value === 'object' &&
        value !== null &&
        'assignments' in value &&
        Array.isArray(value.assignments) &&
        value.assignments.every(isAssignmentValue));
};
export const isFilterValue = (value) => {
    return (typeof value === 'object' && value !== null && 'conditions' in value && 'combinator' in value);
};
export const isNodeConnectionType = (value) => {
    return nodeConnectionTypes.includes(value);
};
export const isBinaryValue = (value) => {
    return (typeof value === 'object' &&
        value !== null &&
        'mimeType' in value &&
        ('data' in value || 'id' in value));
};
//# sourceMappingURL=type-guards.js.map