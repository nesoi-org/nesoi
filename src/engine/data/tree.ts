/*
    Tree methods
*/

import { NesoiError } from './error'

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
     * @deprecated Fieldpath was consolidated into Modelpath and Querypath.
     */
    static get(
        obj: Record<string, any>,
        fieldpath: string,
        index: '*' | 0 | (number|string)[] = '*'
    ): any {
        index = (!Array.isArray(index)) ? index : [...index];
        const paths = fieldpath.split('.')

        const pathIndexCount = paths.filter(p => p === '#').length;
        if (Array.isArray(index) && pathIndexCount > index.length) {
            throw NesoiError.Bucket.Fieldpath.InvalidIndexLength({ fieldpath, index });
        }

        let ref = obj;
        for (let i = 0; i < paths.length; i++) {
            const path = paths[i];
            if (path === '#') {
                // 0 index, read the first item from the list
                if (index === 0) {
                    // This is a TypeAsObj, stay on the node
                    if (typeof ref === 'object' && '__array' in ref) {
                        // 
                    }
                    else {
                        if (typeof ref !== 'object') {
                            return undefined;
                        }
                        if (Array.isArray(ref)) {
                            ref = ref[0];
                        }
                        else {
                            ref = ref[Object.keys(ref)[0]]
                        }
                    }
                }
                // Null index, return a list of all items
                else if (index === '*') {
                    if (typeof ref !== 'object') {
                        return undefined;
                    }
                    if (!Array.isArray(ref)) {
                        ref = Object.values(ref);
                    }

                    const childPath = paths.slice(i+1);
                    if (childPath.length === 0) {
                        return ref;
                    }
                    const out: any[] = [];
                    ref.forEach((v: any) => {
                        const deep = this.get(v, childPath.join('.'), '*');
                        if (deep !== undefined) out.push(deep);
                    })
                    return out.flat(1);
                }
                // List of indices, advance on it
                else {
                    const idx = index.shift()
                    if (idx === undefined) {
                        return undefined;
                    }
                    ref = ref[idx as any];
                }
            }
            else {
                ref = ref?.[path];
            }
            if (ref === undefined) {
                return ref;
            }
        }

        // When reading from a TypeAsObj,
        // advance on unions
        if (!ref && '__or' in obj) {
            return this.get(obj.__or, fieldpath, index);
        }
        
        return ref;
    }


    public static getModelpath(
        obj: Record<string, any>,
        modelpath: string,
        index: (string|number)[]
    ): any[] {
        const paths = modelpath.split('.')

        let poll: any[] = [obj];

        while (poll.length) {
            
            const next: any[] = [];

            for (const item of poll) {
                const path = paths[item.i];
                
                // '*'
                if (path === '*') {
                    if (typeof item !== 'object') {
                        throw new Error(`Can't read *, item is not object (${item})`);
                    }
                    next.push(...Object.values(item));
                }
                else {
                    const idx_str = path.match(/^\$(\d+)/)?.[1];
                    let _path: string|number = path;
                    // $0, $1..
                    if (idx_str !== undefined) {
                        const idx = parseInt(idx_str);
                        if (idx >= index.length) {
                            throw new Error(`Can't read $${idx}, too few indexes (${index.length})`);
                        }
                        _path = index[idx];
                    }

                    const n = typeof item === 'object' ? item[_path] : undefined;
                    if (n) next.push(n);
                }

            }
            poll = next;
        }

        return poll;
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