import type { INode } from "../interfaces.js";
type ParameterType = 'string' | 'boolean' | 'number' | 'resource-locator' | 'string[]' | 'number[]' | 'boolean[]' | 'object';
export declare function assertParamIsNumber(parameterName: string, value: unknown, node: INode): asserts value is number;
export declare function assertParamIsString(parameterName: string, value: unknown, node: INode): asserts value is string;
export declare function assertParamIsBoolean(parameterName: string, value: unknown, node: INode): asserts value is boolean;
type TypeofMap = {
    string: string;
    number: number;
    boolean: boolean;
};
export declare function assertParamIsOfAnyTypes<T extends ReadonlyArray<keyof TypeofMap>>(parameterName: string, value: unknown, types: T, node: INode): asserts value is TypeofMap[T[number]];
export declare function assertParamIsArray<T>(parameterName: string, value: unknown, validator: (val: unknown) => val is T, node: INode): asserts value is T[];
type InferParameterType<T extends ParameterType | ParameterType[]> = T extends ParameterType[] ? InferSingleParameterType<T[number]> : T extends ParameterType ? InferSingleParameterType<T> : never;
type InferSingleParameterType<T extends ParameterType> = T extends 'string' ? string : T extends 'boolean' ? boolean : T extends 'number' ? number : T extends 'resource-locator' ? Record<string, unknown> : T extends 'string[]' ? string[] : T extends 'number[]' ? number[] : T extends 'boolean[]' ? boolean[] : T extends 'object' ? Record<string, unknown> : unknown;
export declare function validateNodeParameters<T extends Record<string, {
    type: ParameterType | ParameterType[];
    required?: boolean;
}>>(value: unknown, parameters: T, node: INode): asserts value is {
    [K in keyof T]: T[K]['required'] extends true ? InferParameterType<T[K]['type']> : InferParameterType<T[K]['type']> | undefined;
};
export {};
//# sourceMappingURL=parameter-type-validation.d.ts.map