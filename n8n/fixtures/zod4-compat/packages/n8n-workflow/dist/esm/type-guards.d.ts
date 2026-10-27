import { type AssignmentCollectionValue, type AssignmentValue, type FilterValue, type INodeParameterResourceLocator, type INodeProperties, type INodePropertyCollection, type INodePropertyOptions, type NodeConnectionType, type ResourceMapperValue, type IBinaryData } from "./interfaces.js";
export declare function isResourceLocatorValue(value: unknown): value is INodeParameterResourceLocator;
export declare const isINodeProperties: (item: INodePropertyOptions | INodeProperties | INodePropertyCollection) => item is INodeProperties;
export declare const isINodePropertyOptions: (item: INodePropertyOptions | INodeProperties | INodePropertyCollection) => item is INodePropertyOptions;
export declare const isINodePropertyCollection: (item: INodePropertyOptions | INodeProperties | INodePropertyCollection) => item is INodePropertyCollection;
export declare const isINodePropertiesList: (items: INodeProperties["options"]) => items is INodeProperties[];
export declare const isINodePropertyOptionsList: (items: INodeProperties["options"]) => items is INodePropertyOptions[];
export declare const isINodePropertyCollectionList: (items: INodeProperties["options"]) => items is INodePropertyCollection[];
export declare const isValidResourceLocatorParameterValue: (value: INodeParameterResourceLocator) => boolean;
export declare const isResourceMapperValue: (value: unknown) => value is ResourceMapperValue;
export declare const isAssignmentValue: (value: unknown) => value is AssignmentValue;
export declare const isAssignmentCollectionValue: (value: unknown) => value is AssignmentCollectionValue;
export declare const isFilterValue: (value: unknown) => value is FilterValue;
export declare const isNodeConnectionType: (value: unknown) => value is NodeConnectionType;
export declare const isBinaryValue: (value: unknown) => value is IBinaryData;
//# sourceMappingURL=type-guards.d.ts.map