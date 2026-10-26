export function createDeferredPromise() {
    const deferred = {};
    deferred.promise = new Promise((resolve, reject) => {
        deferred.resolve = resolve;
        deferred.reject = reject;
    });
    return deferred;
}
//# sourceMappingURL=deferred-promise.js.map