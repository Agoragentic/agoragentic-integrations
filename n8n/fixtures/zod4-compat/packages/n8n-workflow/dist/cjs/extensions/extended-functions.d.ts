declare function ifEmpty<T, V>(value: V, defaultValue: T): T | (V & {});
declare namespace ifEmpty {
    var doc: {
        name: string;
        description: string;
        returnType: string;
        args: {
            name: string;
            type: string;
        }[];
        docURL: string;
    };
}
export declare const extendedFunctions: {
    min: (...values: number[]) => number;
    max: (...values: number[]) => number;
    not: (value: unknown) => boolean;
    average: (...args: number[]) => number;
    numberList: (start: number, end: number) => number[];
    zip: (keys: unknown[], values: unknown[]) => unknown;
    $min: (...values: number[]) => number;
    $max: (...values: number[]) => number;
    $average: (...args: number[]) => number;
    $not: (value: unknown) => boolean;
    $ifEmpty: typeof ifEmpty;
};
export {};
//# sourceMappingURL=extended-functions.d.ts.map