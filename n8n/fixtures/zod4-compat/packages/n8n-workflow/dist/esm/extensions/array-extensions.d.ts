import type { ExtensionMap } from "./extensions.js";
export declare function average(value: unknown[]): number;
export declare namespace average {
    var doc: {
        name: string;
        aliases: string[];
        description: string;
        examples: {
            example: string;
            evaluated: string;
        }[];
        returnType: string;
        docURL: string;
    };
}
export declare function toJsonString(value: unknown[]): string;
export declare namespace toJsonString {
    var doc: {
        name: string;
        description: string;
        examples: {
            example: string;
            evaluated: string;
        }[];
        docURL: string;
        returnType: string;
    };
}
export declare function toInt(): undefined;
export declare function toFloat(): undefined;
export declare function toBoolean(): undefined;
export declare function toDateTime(): undefined;
export declare const arrayExtensions: ExtensionMap;
//# sourceMappingURL=array-extensions.d.ts.map