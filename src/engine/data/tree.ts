/*
    Tree methods
*/


/**
 * @category Engine
 * @subcategory Data
 */
export class Tree {

    /**
     * Read one or more values from the object, from a _fieldpath_.
     * 
     * The `index` argument is only relevant if the fieldpath contains a spread (`.#`):
     * - `*`: Return all values of the matched array or dict
     * - `0`: Return the first value of an array or dict (dict ordering is unstable)
     * - `(number|string)[]`: Sequence of values to replace the `#`s on the fieldpath
     * 
     * @deprecated Fieldpath was consolidated into Modelpath/ViewModelpath/QueryModelpath.
     */
    static get(
        obj: Record<string, any>,
        fieldpath: string
    ): any {
        if (!fieldpath.includes('.')) return obj[fieldpath];

        const paths = fieldpath.split('.')

        let ref = obj;
        for (let i = 0; i < paths.length; i++) {
            const path = paths[i];
            ref = ref?.[path];
            if (ref === undefined) {
                return undefined;
            }
        }

        // When reading from a TypeAsObj,
        // advance on unions
        if (!ref && '__or' in obj) {
            return this.get(obj.__or, fieldpath);
        }
        
        return ref;
    }

    static set(
        obj: Record<string, any>,
        fieldpath: string,
        replacer: (v: any, i: (number|string)[]) => any,
        __index: (number|string)[] = []
    ): void {
        const paths = fieldpath.split('.')

        class Ptr {
            public key!: string
            constructor(
                public obj: Record<string, any>
            ) {}

            walk(key: string) {
                if (this.key) {
                    this.obj = this.obj[this.key];
                }
                this.key = key;
            }
            get() {
                if (!this.key) return this.obj;
                return this.obj?.[this.key];
            }
            replace(replacer: (v: any, i: (number|string)[]) => any, i: (number|string)[]) {
                this.obj ??= {};
                this.obj[this.key] = replacer(this.obj?.[this.key], i)
            }
        }

        const ref = new Ptr(obj);
        for (let i = 0; i < paths.length; i++) {
            const path = paths[i];
            if (path === '#') {
                const arr = ref.get();
                if (typeof arr !== 'object') {
                    return;
                }
                const childPath = paths.slice(i+1);
                if (childPath.length === 0) {
                    if (Array.isArray(arr)) {
                        for (let i = 0; i < arr.length; i++) {
                            arr[i] = replacer(arr[i], [...__index, i]);
                        }
                    }
                    else {
                        for (const key in arr) {
                            arr[key] = replacer(arr[key], [...__index, key]);
                        }
                    }
                    return;
                }
                if (Array.isArray(arr)) {
                    for (let i = 0; i < arr.length; i++) {
                        if (typeof arr[i] === 'object') {
                            this.set(arr[i], childPath.join('.'), replacer, [...__index, i])
                        }
                    }
                }
                else {
                    for (const key in arr) {
                        if (typeof arr[key] === 'object') {
                            this.set(arr[key], childPath.join('.'), replacer, [...__index, key])
                        }
                    }
                }
                return;
            }
            else {
                ref.walk(path);
            }
            if (ref.get() === undefined) {
                ref.replace(replacer, __index);
                return;
            }
        }

        if ('__or' in obj) {
            this.set(obj.__or, fieldpath, replacer, __index);
        }
        
        ref.replace(replacer, __index);
    }

}