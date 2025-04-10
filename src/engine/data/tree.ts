/*
    Tree methods
*/

import { NesoiError } from './error'


type TreeNode<T> = {
    path: string
    key: string
    value: T
}

export class Tree {

    /**
     * When the fieldpath contains a `.*.`, which refers to a item in a list:
     * - If the `index` parameter is null, returns nested lists
     * - If the `index` parameter is a list of indices, returns the target object
     * 
     */
    static get(
        obj: Record<string, any>,
        fieldpath: string,
        index: 0 | null | (number|string)[] = []
    ): any {
        index = (!Array.isArray(index)) ? index : [...index];
        const paths = fieldpath.split('.')

        const pathIndexCount = paths.filter(p => p === '*').length;
        if (Array.isArray(index) && pathIndexCount > index.length) {
            throw NesoiError.Bucket.Fieldpath.InvalidIndexLength({ fieldpath, index });
        }

        let ref = obj;
        for (let i = 0; i < paths.length; i++) {
            const path = paths[i];
            if (path === '*') {
                // 0 index, read the first item from the list
                if (index === 0) {
                    // This is a ObjTypeAsObj, stay on the node
                    if ('__array' in ref) {
                        // 
                    }
                    else {
                        if (!Array.isArray(ref)) {
                            return undefined;
                        }
                        ref = ref[0];
                    }
                }
                // Null index, return a list of all items
                else if (index === null) {
                    if (!Array.isArray(ref)) {
                        return undefined;
                    }
                    const childPath = paths.slice(i+1);
                    if (childPath.length === 0) {
                        return ref;
                    }
                    return ref.map(v => this.get(v, childPath.join('.'), null))
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
                ref = ref[path];
            }
            if (ref === undefined) {
                return undefined;
            }
        }

        if (!ref && '__or' in obj) {
            return this.get(obj.__or, fieldpath, index);
        }
        
        return ref;
    }

    static find<P>(
        obj: Record<string, P>,
        fn: (path: string, value: P) => boolean,
        link?: string,
        _prefix?: string
    ): TreeNode<P>|undefined {
        const root = link ? obj[link] : obj as any;
        for (const key in root) {
            const prop = root[key];
            const path = (_prefix ? _prefix + '.' : '') + key;
            if (fn(path, prop as any)) {
                return {
                    path,
                    key,
                    value: prop
                } as TreeNode<P>;
            }
            if (
                typeof prop === 'object'
                && !Array.isArray(prop)
                && !(prop as any)['__type']
            ) {
                const inner = this.find(prop as any, fn, link, path);
                if (inner) {
                    return inner;
                }
            }
        }
    }

    static findAll<P>(
        obj: Record<string, P>,
        fn: (path: string, value: P) => boolean,
        _prefix?: string
    ) {
        const nodes: TreeNode<P>[] = [];
        for (const key in obj) {
            const prop = obj[key];
            const path = (_prefix ? _prefix + '.' : '') + key;
            if (
                typeof prop === 'object'
                && !Array.isArray(prop)
                && !(prop as any)['__type']
            ) {
                nodes.push(...this.findAll(prop as any, fn, key));
            }
            if (fn(path, prop as any)) {
                nodes.push({
                    path,
                    key,
                    value: prop
                });
            }
        }
        return nodes;
    }

}