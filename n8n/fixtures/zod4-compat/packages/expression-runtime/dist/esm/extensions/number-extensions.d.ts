import { DateTime } from "luxon";
import type { ExtensionMap } from "./extensions.js";
type DateTimeFormat = 'ms' | 's' | 'us' | 'excel';
export declare function toDateTime(value: number, extraArgs: [DateTimeFormat]): DateTime;
export declare namespace toDateTime {
    var doc: {
        name: string;
        description: string;
        examples: {
            example: string;
            evaluated: string;
        }[];
        section: string;
        returnType: string;
        args: {
            name: string;
            optional: boolean;
            description: string;
            default: string;
            type: string;
        }[];
        docURL: string;
    };
}
export declare const numberExtensions: ExtensionMap;
export {};
//# sourceMappingURL=number-extensions.d.ts.map