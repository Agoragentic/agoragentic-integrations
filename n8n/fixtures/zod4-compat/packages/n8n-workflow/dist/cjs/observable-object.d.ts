import type { IDataObject, IObservableObject } from "./interfaces.js";
interface IObservableOptions {
    ignoreEmptyOnFirstChild?: boolean;
}
export declare function create(target: IDataObject, parent?: IObservableObject, option?: IObservableOptions, depth?: number): IDataObject;
export {};
//# sourceMappingURL=observable-object.d.ts.map