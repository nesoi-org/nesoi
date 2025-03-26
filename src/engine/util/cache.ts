export default class Cache<T> {

    constructor(
        private data: Record<string, T> = {}
    ) {}

    set(key: string, val: T) {
        this.data[key] = val;
    }

    get(key: string, set: () => T | undefined) {
        if (!(key in this.data)) {
            const val = set();
            if (val) {
                this.data[key] = val;
            }
        }
        return this.data[key];
    }

}