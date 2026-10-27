const defaultPropertyDescriptor = Object.freeze({ enumerable: true, configurable: true });
// eslint-disable-next-line @typescript-eslint/unbound-method
const { hasOwnProperty } = Object.prototype;
const augmentedObjects = new WeakSet();
function augment(value) {
    if (typeof value !== 'object' || value === null || value instanceof RegExp)
        return value;
    if (value instanceof Date)
        return new Date(value.valueOf());
    if (value instanceof Uint8Array)
        return value.slice();
    if (Array.isArray(value))
        return augmentArray(value);
    return augmentObject(value);
}
export function augmentArray(data) {
    if (augmentedObjects.has(data))
        return data;
    let newData = undefined;
    function getData() {
        if (newData === undefined) {
            newData = [...data];
        }
        return newData;
    }
    const proxy = new Proxy(data, {
        deleteProperty(_target, key) {
            return Reflect.deleteProperty(getData(), key);
        },
        get(target, key, receiver) {
            if (key === 'constructor')
                return Array;
            const value = Reflect.get(newData ?? target, key, receiver);
            const newValue = augment(value);
            if (newValue !== value) {
                newData = getData();
                Reflect.set(newData, key, newValue);
                return newValue;
            }
            return value;
        },
        getOwnPropertyDescriptor(target, key) {
            if (newData === undefined) {
                return Reflect.getOwnPropertyDescriptor(target, key);
            }
            if (key === 'length') {
                return Reflect.getOwnPropertyDescriptor(newData, key);
            }
            return Object.getOwnPropertyDescriptor(data, key) ?? defaultPropertyDescriptor;
        },
        has(target, key) {
            return Reflect.has(newData ?? target, key);
        },
        ownKeys(target) {
            return Reflect.ownKeys(newData ?? target);
        },
        set(_target, key, newValue) {
            // Always proxy all objects. Like that we can check in get simply if it
            // is a proxy and it does then not matter if it was already there from the
            // beginning and it got proxied at some point or set later and so theoretically
            // does not have to get proxied
            return Reflect.set(getData(), key, augment(newValue));
        },
    });
    augmentedObjects.add(proxy);
    return proxy;
}
export function augmentObject(data) {
    if (augmentedObjects.has(data))
        return data;
    const newData = {};
    const deletedProperties = new Set();
    const proxy = new Proxy(data, {
        get(target, key, receiver) {
            if (key === 'constructor')
                return Object;
            if (deletedProperties.has(key)) {
                return undefined;
            }
            if (hasOwnProperty.call(newData, key)) {
                return newData[key];
            }
            const value = Reflect.get(target, key, receiver);
            if (typeof value !== 'object' || value === null)
                return value;
            if (value instanceof RegExp)
                return value.toString();
            if ('toJSON' in value && typeof value.toJSON === 'function')
                return value.toJSON();
            const newValue = augment(value);
            if (newValue !== value) {
                Object.assign(newData, { [key]: newValue });
                return newValue;
            }
            return value;
        },
        deleteProperty(_target, key) {
            if (hasOwnProperty.call(newData, key)) {
                delete newData[key];
            }
            if (hasOwnProperty.call(data, key)) {
                deletedProperties.add(key);
            }
            return true;
        },
        set(target, key, newValue) {
            if (newValue === undefined) {
                if (key in newData) {
                    delete newData[key];
                }
                if (key in target) {
                    deletedProperties.add(key);
                }
                return true;
            }
            newData[key] = newValue;
            if (deletedProperties.has(key)) {
                deletedProperties.delete(key);
            }
            return true;
        },
        has(_target, key) {
            if (deletedProperties.has(key))
                return false;
            const target = hasOwnProperty.call(newData, key) ? newData : data;
            return Reflect.has(target, key);
        },
        ownKeys(target) {
            const originalKeys = Reflect.ownKeys(target);
            const newKeys = Object.keys(newData);
            return [...new Set([...originalKeys, ...newKeys])].filter((key) => !deletedProperties.has(key));
        },
        getOwnPropertyDescriptor(_target, key) {
            if (deletedProperties.has(key))
                return undefined;
            const target = hasOwnProperty.call(newData, key) ? newData : data;
            return Object.getOwnPropertyDescriptor(target, key);
        },
    });
    augmentedObjects.add(proxy);
    return proxy;
}
//# sourceMappingURL=augment-object.js.map