import { DateTime } from "luxon";
import type { ExtensionMap } from "./extensions.js";
export declare const SupportedHashAlgorithms: readonly ["md5", "sha1", "sha224", "sha256", "sha384", "sha512", "sha3"];
export declare function toJsonString(value: string): string;
export declare namespace toJsonString {
    var doc: {
        name: string;
        description: string;
        section: string;
        returnType: string;
        docURL: string;
        examples: {
            example: string;
            evaluated: string;
        }[];
    };
}
export declare function toDateTime(value: string, extraArgs?: [string]): DateTime;
export declare namespace toDateTime {
    var doc: {
        name: string;
        description: string;
        section: string;
        returnType: string;
        docURL: string;
        examples: {
            example: string;
        }[];
        args: {
            name: string;
            optional: boolean;
            description: string;
            type: string;
        }[];
    };
}
export declare const stringExtensions: ExtensionMap;
//# sourceMappingURL=string-extensions.d.ts.map