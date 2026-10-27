export declare class LruCache<K, V> {
    private readonly capacity;
    private readonly onEvict?;
    private map;
    constructor(capacity: number, onEvict?: ((key: K, value: V) => void) | undefined);
    get(key: K): V | undefined;
    set(key: K, value: V): void;
    get size(): number;
    clear(): void;
}
//# sourceMappingURL=lru-cache.d.ts.map