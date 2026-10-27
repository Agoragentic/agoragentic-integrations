import { DateTime } from "luxon";
import type { FieldType, FormFieldsParameter, IBinaryData, INodePropertyOptions, ValidationResult } from "./interfaces.js";
export declare const tryToParseNumber: (value: unknown) => number;
export declare const tryToParseString: (value: unknown) => string;
export declare const tryToParseAlphanumericString: (value: unknown) => string;
export declare const tryToParseBoolean: (value: unknown) => value is boolean;
export declare const tryToParseDateTime: (value: unknown, defaultZone?: string) => DateTime;
export declare const tryToParseTime: (value: unknown) => string;
export declare const tryToParseArray: (value: unknown) => unknown[];
export declare const tryToParseObject: (value: unknown) => object;
export declare const tryToParseBinary: (value: unknown) => IBinaryData;
export declare const tryToParseJsonToFormFields: (value: unknown) => FormFieldsParameter;
export declare const getValueDescription: <T>(value: T) => string;
export declare const tryToParseUrl: (value: unknown) => string;
export declare const tryToParseJwt: (value: unknown) => string;
type ValidateFieldTypeOptions = Partial<{
    valueOptions: INodePropertyOptions[];
    strict: boolean;
    parseStrings: boolean;
}>;
export declare function validateFieldType<K extends FieldType>(fieldName: string, value: unknown, type: K, options?: ValidateFieldTypeOptions): ValidationResult<K>;
export {};
//# sourceMappingURL=type-validation.d.ts.map