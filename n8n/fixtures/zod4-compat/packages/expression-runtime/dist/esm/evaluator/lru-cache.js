export class LruCache {
    capacity;
    onEvict;
    map = new Map();
    constructor(capacity, onEvict) {
        this.capacity = capacity;
        this.onEvict = onEvict;
        if (capacity < 1) {
            throw new Error('LruCache capacity must be at least 1');
        }
    }
    get(key) {
        const value = this.map.get(key);
        if (value === undefined)
            return undefined;
        this.map.delete(key);
        this.map.set(key, value);
        return value;
    }
    set(key, value) {
        this.map.delete(key);
        this.map.set(key, value);
        if (this.map.size > this.capacity) {
            const [oldestKey, oldestValue] = this.map.entries().next().value;
            this.map.delete(oldestKey);
            this.onEvict?.(oldestKey, oldestValue);
        }
    }
    get size() {
        return this.map.size;
    }
    clear() {
        this.map.clear();
    }
}
//# sourceMappingURL=lru-cache.js.map