import { ApplicationError } from "@n8n/errors";
import type { FilterConditionValue, FilterOptionsValue, FilterValue, INodeProperties } from "../interfaces.js";
type FilterConditionMetadata = {
    index: number;
    unresolvedExpressions: boolean;
    itemIndex: number;
    errorFormat: 'full' | 'inline';
};
export declare class FilterError extends ApplicationError {
    readonly description: string;
    constructor(message: string, description: string);
}
export declare function arrayContainsValue(array: unknown[], value: unknown, ignoreCase: boolean): boolean;
export declare function executeFilterCondition(condition: FilterConditionValue, filterOptions: FilterOptionsValue, metadata?: Partial<FilterConditionMetadata>): boolean;
type ExecuteFilterOptions = {
    itemIndex?: number;
};
export declare function executeFilter(value: FilterValue, { itemIndex }?: ExecuteFilterOptions): boolean;
export declare const validateFilterParameter: (nodeProperties: INodeProperties, value: FilterValue) => Record<string, string[]>;
export {};
//# sourceMappingURL=filter-parameter.d.ts.map