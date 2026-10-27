"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryToParseJwt = exports.tryToParseUrl = exports.getValueDescription = exports.tryToParseJsonToFormFields = exports.tryToParseBinary = exports.tryToParseObject = exports.tryToParseArray = exports.tryToParseTime = exports.tryToParseDateTime = exports.tryToParseBoolean = exports.tryToParseAlphanumericString = exports.tryToParseString = exports.tryToParseNumber = void 0;
exports.validateFieldType = validateFieldType;
const isObject_1 = __importDefault(require("lodash/isObject.js"));
const luxon_1 = require("luxon");
const errors_1 = require("./errors/index.js");
const utils_1 = require("./utils.js");
const type_guards_1 = require("./type-guards.js");
const tryToParseNumber = (value) => {
    const isValidNumber = !isNaN(Number(value));
    if (!isValidNumber) {
        throw new errors_1.UserError('Failed to parse value to number', { extra: { value } });
    }
    return Number(value);
};
exports.tryToParseNumber = tryToParseNumber;
const tryToParseString = (value) => {
    if (typeof value === 'object')
        return JSON.stringify(value);
    if (typeof value === 'undefined')
        return '';
    if (typeof value === 'string' ||
        typeof value === 'bigint' ||
        typeof value === 'boolean' ||
        typeof value === 'number') {
        return value.toString();
    }
    return String(value);
};
exports.tryToParseString = tryToParseString;
const tryToParseAlphanumericString = (value) => {
    const parsed = (0, exports.tryToParseString)(value);
    // We do not allow special characters, only letters, numbers and underscore
    // Numbers not allowed as the first character
    const regex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!regex.test(parsed)) {
        throw new errors_1.UserError('Value is not a valid alphanumeric string', { extra: { value } });
    }
    return parsed;
};
exports.tryToParseAlphanumericString = tryToParseAlphanumericString;
const tryToParseBoolean = (value) => {
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'string' && ['true', 'false'].includes(value.toLowerCase())) {
        return value.toLowerCase() === 'true';
    }
    // If value is not a empty string, try to parse it to a number
    if (!(typeof value === 'string' && value.trim() === '')) {
        const num = Number(value);
        if (num === 0) {
            return false;
        }
        else if (num === 1) {
            return true;
        }
    }
    throw new errors_1.UserError('Failed to parse value as boolean', {
        extra: { value },
    });
};
exports.tryToParseBoolean = tryToParseBoolean;
const tryToParseDateTime = (value, defaultZone) => {
    if (luxon_1.DateTime.isDateTime(value) && value.isValid) {
        // Ignore the defaultZone if the value is already a DateTime
        // because DateTime objects already contain the zone information
        return value;
    }
    if (value instanceof Date) {
        const fromJSDate = luxon_1.DateTime.fromJSDate(value, { zone: defaultZone });
        if (fromJSDate.isValid) {
            return fromJSDate;
        }
    }
    const dateString = String(value).trim();
    // Rely on luxon to parse different date formats
    const isoDate = luxon_1.DateTime.fromISO(dateString, { zone: defaultZone, setZone: true });
    if (isoDate.isValid) {
        return isoDate;
    }
    const httpDate = luxon_1.DateTime.fromHTTP(dateString, { zone: defaultZone, setZone: true });
    if (httpDate.isValid) {
        return httpDate;
    }
    const rfc2822Date = luxon_1.DateTime.fromRFC2822(dateString, { zone: defaultZone, setZone: true });
    if (rfc2822Date.isValid) {
        return rfc2822Date;
    }
    const sqlDate = luxon_1.DateTime.fromSQL(dateString, { zone: defaultZone, setZone: true });
    if (sqlDate.isValid) {
        return sqlDate;
    }
    const parsedDateTime = luxon_1.DateTime.fromMillis(Date.parse(dateString), { zone: defaultZone });
    if (parsedDateTime.isValid) {
        return parsedDateTime;
    }
    throw new errors_1.UserError('Value is not a valid date', { extra: { dateString } });
};
exports.tryToParseDateTime = tryToParseDateTime;
const tryToParseTime = (value) => {
    const isTimeInput = /^\d{2}:\d{2}(:\d{2})?((\-|\+)\d{4})?((\-|\+)\d{1,2}(:\d{2})?)?$/s.test(String(value));
    if (!isTimeInput) {
        throw new errors_1.UserError('Value is not a valid time', { extra: { value } });
    }
    return String(value);
};
exports.tryToParseTime = tryToParseTime;
const tryToParseArray = (value) => {
    try {
        if (typeof value === 'object' && Array.isArray(value)) {
            return value;
        }
        let parsed;
        try {
            parsed = JSON.parse(String(value));
        }
        catch (e) {
            parsed = JSON.parse(String(value).replace(/'/g, '"'));
        }
        if (!Array.isArray(parsed)) {
            throw new errors_1.UserError('Value is not a valid array', { extra: { value } });
        }
        return parsed;
    }
    catch (e) {
        throw new errors_1.UserError('Value is not a valid array', { extra: { value } });
    }
};
exports.tryToParseArray = tryToParseArray;
const tryToParseObject = (value) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value;
    }
    try {
        const o = (0, utils_1.jsonParse)(String(value), { acceptJSObject: true });
        if (typeof o !== 'object' || Array.isArray(o)) {
            throw new errors_1.UserError('Value is not a valid object', { extra: { value } });
        }
        return o;
    }
    catch (e) {
        throw new errors_1.UserError('Value is not a valid object', { extra: { value } });
    }
};
exports.tryToParseObject = tryToParseObject;
const tryToParseBinary = (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value) || !(0, type_guards_1.isBinaryValue)(value)) {
        throw new errors_1.UserError('Value is not a valid binary data object', { extra: { value } });
    }
    return value;
};
exports.tryToParseBinary = tryToParseBinary;
const ALLOWED_FORM_FIELDS_KEYS = [
    'fieldLabel',
    'fieldType',
    'placeholder',
    'defaultValue',
    'fieldOptions',
    'multiselect',
    'multipleFiles',
    'acceptFileTypes',
    'formatDate',
    'requiredField',
    'fieldValue',
    'elementName',
    'html',
    'fieldName',
    'limitSelection',
    'numberOfSelections',
    'minSelections',
    'maxSelections',
];
const ALLOWED_FIELD_TYPES = [
    'date',
    'dropdown',
    'email',
    'file',
    'number',
    'password',
    'text',
    'textarea',
    'checkbox',
    'radio',
    'html',
    'hiddenField',
];
const tryToParseJsonToFormFields = (value) => {
    const fields = [];
    try {
        const rawFields = (0, utils_1.jsonParse)(value, {
            acceptJSObject: true,
        });
        for (const [index, field] of rawFields.entries()) {
            for (const key of Object.keys(field)) {
                if (!ALLOWED_FORM_FIELDS_KEYS.includes(key)) {
                    throw new errors_1.UserError(`Key '${key}' in field ${index} is not valid for form fields`);
                }
                if (key !== 'fieldOptions' &&
                    !['string', 'number', 'boolean'].includes(typeof field[key])) {
                    field[key] = String(field[key]);
                }
                else if (typeof field[key] === 'string' && key !== 'html') {
                    field[key] = field[key].replace(/</g, '&lt;').replace(/>/g, '&gt;');
                }
                if (key === 'fieldType' && !ALLOWED_FIELD_TYPES.includes(field[key])) {
                    throw new errors_1.UserError(`Field type '${field[key]}' in field ${index} is not valid for form fields`);
                }
                if (key === 'fieldOptions') {
                    if (Array.isArray(field[key])) {
                        field[key] = { values: field[key] };
                    }
                    if (typeof field[key] !== 'object' ||
                        !field[key].values) {
                        throw new errors_1.UserError(`Field dropdown in field ${index} does has no 'values' property that contain an array of options`);
                    }
                    for (const [optionIndex, option] of field[key].values.entries()) {
                        if (Object.keys(option).length !== 1 || typeof option.option !== 'string') {
                            throw new errors_1.UserError(`Field dropdown in field ${index} has an invalid option ${optionIndex}`);
                        }
                    }
                }
            }
            fields.push(field);
        }
    }
    catch (error) {
        if (error instanceof errors_1.ApplicationError || error instanceof errors_1.BaseError)
            throw error;
        throw new errors_1.UserError('Value is not valid JSON');
    }
    return fields;
};
exports.tryToParseJsonToFormFields = tryToParseJsonToFormFields;
const getValueDescription = (value) => {
    if (typeof value === 'object') {
        if (value === null)
            return "'null'";
        if (Array.isArray(value))
            return 'array';
        return 'object';
    }
    return `'${String(value)}'`;
};
exports.getValueDescription = getValueDescription;
const ALLOWED_URL_PROTOCOLS = ['http:', 'https:', 'ftp:', 'file:'];
const tryToParseUrl = (value) => {
    if (typeof value === 'string' && !value.includes('://')) {
        value = `https://${value}`;
    }
    try {
        const parsed = new URL(String(value));
        if (!ALLOWED_URL_PROTOCOLS.includes(parsed.protocol)) {
            throw new errors_1.UserError(`The value "${String(value)}" is not a valid url.`, {
                extra: { value },
            });
        }
        return String(value);
    }
    catch (e) {
        if (e instanceof errors_1.ApplicationError || e instanceof errors_1.BaseError)
            throw e;
        throw new errors_1.UserError(`The value "${String(value)}" is not a valid url.`, {
            extra: { value },
        });
    }
};
exports.tryToParseUrl = tryToParseUrl;
const tryToParseJwt = (value) => {
    const error = new errors_1.UserError(`The value "${String(value)}" is not a valid JWT token.`, {
        extra: { value },
    });
    if (!value)
        throw error;
    const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/;
    if (!jwtPattern.test(String(value)))
        throw error;
    return String(value);
};
exports.tryToParseJwt = tryToParseJwt;
// eslint-disable-next-line complexity
function validateFieldType(fieldName, value, type, options = {}) {
    if (value === null || value === undefined)
        return { valid: true };
    const strict = options.strict ?? false;
    const valueOptions = options.valueOptions ?? [];
    const parseStrings = options.parseStrings ?? false;
    const defaultErrorMessage = `'${fieldName}' expects a ${type} but we got ${(0, exports.getValueDescription)(value)}`;
    switch (type.toLowerCase()) {
        case 'string': {
            if (!parseStrings)
                return { valid: true, newValue: value };
            try {
                if (strict && typeof value !== 'string') {
                    return { valid: false, errorMessage: defaultErrorMessage };
                }
                return { valid: true, newValue: (0, exports.tryToParseString)(value) };
            }
            catch (e) {
                return { valid: false, errorMessage: defaultErrorMessage };
            }
        }
        case 'string-alphanumeric': {
            try {
                return { valid: true, newValue: (0, exports.tryToParseAlphanumericString)(value) };
            }
            catch (e) {
                return {
                    valid: false,
                    errorMessage: 'Value is not a valid alphanumeric string, only letters, numbers and underscore allowed',
                };
            }
        }
        case 'number': {
            try {
                if (strict && typeof value !== 'number') {
                    return { valid: false, errorMessage: defaultErrorMessage };
                }
                return { valid: true, newValue: (0, exports.tryToParseNumber)(value) };
            }
            catch (e) {
                return { valid: false, errorMessage: defaultErrorMessage };
            }
        }
        case 'boolean': {
            try {
                if (strict && typeof value !== 'boolean') {
                    return { valid: false, errorMessage: defaultErrorMessage };
                }
                return { valid: true, newValue: (0, exports.tryToParseBoolean)(value) };
            }
            catch (e) {
                return { valid: false, errorMessage: defaultErrorMessage };
            }
        }
        case 'datetime': {
            try {
                return { valid: true, newValue: (0, exports.tryToParseDateTime)(value) };
            }
            catch (e) {
                const luxonDocsURL = 'https://moment.github.io/luxon/api-docs/index.html#datetimefromformat';
                const errorMessage = `${defaultErrorMessage} <br/><br/> Consider using <a href="${luxonDocsURL}" target="_blank"><code>DateTime.fromFormat</code></a> to work with custom date formats.`;
                return { valid: false, errorMessage };
            }
        }
        case 'time': {
            try {
                return { valid: true, newValue: (0, exports.tryToParseTime)(value) };
            }
            catch (e) {
                return {
                    valid: false,
                    errorMessage: `'${fieldName}' expects time (hh:mm:(:ss)) but we got ${(0, exports.getValueDescription)(value)}.`,
                };
            }
        }
        case 'binary': {
            try {
                return { valid: true, newValue: (0, exports.tryToParseBinary)(value) };
            }
            catch (e) {
                const errorMessage = `${defaultErrorMessage}. Make sure the value is a valid binary data object with 'mimeType' and 'data' or 'id' property.`;
                return { valid: false, errorMessage };
            }
        }
        case 'object': {
            try {
                if (strict && !(0, isObject_1.default)(value)) {
                    return { valid: false, errorMessage: defaultErrorMessage };
                }
                return { valid: true, newValue: (0, exports.tryToParseObject)(value) };
            }
            catch (e) {
                return { valid: false, errorMessage: defaultErrorMessage };
            }
        }
        case 'array': {
            if (strict && !Array.isArray(value)) {
                return { valid: false, errorMessage: defaultErrorMessage };
            }
            try {
                return { valid: true, newValue: (0, exports.tryToParseArray)(value) };
            }
            catch (e) {
                return { valid: false, errorMessage: defaultErrorMessage };
            }
        }
        case 'options': {
            const validOptions = valueOptions.map((option) => option.value).join(', ');
            const isValidOption = valueOptions.some((option) => option.value === value);
            if (!isValidOption) {
                return {
                    valid: false,
                    errorMessage: `'${fieldName}' expects one of the following values: [${validOptions}] but we got ${(0, exports.getValueDescription)(value)}`,
                };
            }
            return { valid: true, newValue: value };
        }
        case 'url': {
            try {
                return { valid: true, newValue: (0, exports.tryToParseUrl)(value) };
            }
            catch (e) {
                return { valid: false, errorMessage: defaultErrorMessage };
            }
        }
        case 'jwt': {
            try {
                return { valid: true, newValue: (0, exports.tryToParseJwt)(value) };
            }
            catch (e) {
                return {
                    valid: false,
                    errorMessage: 'Value is not a valid JWT token',
                };
            }
        }
        case 'form-fields': {
            try {
                return { valid: true, newValue: (0, exports.tryToParseJsonToFormFields)(value) };
            }
            catch (e) {
                return {
                    valid: false,
                    errorMessage: e.message,
                };
            }
        }
        default: {
            return { valid: true, newValue: value };
        }
    }
}
//# sourceMappingURL=type-validation.js.map