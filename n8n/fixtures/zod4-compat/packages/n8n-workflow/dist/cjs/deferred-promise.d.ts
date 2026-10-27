type ResolveFn<T> = (result: T | PromiseLike<T>) => void;
type RejectFn = (error: Error) => void;
export interface IDeferredPromise<T> {
    promise: Promise<T>;
    resolve: ResolveFn<T>;
    reject: RejectFn;
}
export declare function createDeferredPromise<T = void>(): IDeferredPromise<T>;
export {};
//# sourceMappingURL=deferred-promise.d.ts.map