import type { ExtensionMap } from "./extensions.js";
export declare function compact(value: object): object;
export declare namespace compact {
    var doc: {
        name: string;
        description: string;
        examples: {
            example: string;
            evaluated: string;
        }[];
        returnType: string;
        docURL: string;
    };
}
export declare function urlEncode(value: object): string;
export declare namespace urlEncode {
    var doc: {
        name: string;
        description: string;
        examples: {
            example: string;
            evaluated: string;
        }[];
        returnType: string;
        docURL: string;
    };
}
export declare function toJsonString(value: object): string;
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
export declare const objectExtensions: ExtensionMap;
//# sourceMappingURL=object-extensions.d.ts.map