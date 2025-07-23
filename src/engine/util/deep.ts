import { UndefinedToOptional } from '../data/obj';

export type DeepPartial<T> = T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]>;
} : T;

export type DeepPartialNullable<T> = UndefinedToOptional<T extends object ? {
    [P in keyof T]?: DeepPartial<T[P]> | null;
} : T>;


type Obj = Record<string, any>

export class Deep {

    public static copy<T extends Obj>(obj: T): T {

        const copy: Obj = {};

        let poll: [Obj, Obj][] = [[obj, copy]];
        while (poll.length) {
            const next: [Obj, Obj][] = []
            
            for (const [obj, copy] of poll) {

                if (Array.isArray(obj)) {
                    for (const item of obj) {
                        if (typeof item === 'function') continue;
                        if (item === null) {
                            copy.push(null)
                        }
                        else if (typeof item === 'object') {
                            const nextCopy = Array.isArray(item) ? [] : {};
                            copy.push(nextCopy);
                            next.push([item, nextCopy])
                        }
                        else {
                            copy.push(item);
                        }
                    }
                }
                else {
                    for (const key in obj) {
                        const item = obj[key];
                        if (typeof item === 'function') continue;
                        if (item === null) {
                            copy[key] = null;
                        }
                        else if (typeof item === 'object') {
                            const nextCopy = Array.isArray(item) ? [] : {};
                            copy[key] = nextCopy;
                            next.push([item, nextCopy])
                        }
                        else {
                            copy[key] = item;
                        }
                    }
                }
            }
            poll = next;
        }

        return copy as T;
    }

    public static get (obj: Record<string, any>, path: string): any {
        if (!path) { return undefined }
        const props = path.split('.')
        let val = obj
        for (const p in props) {
            val = val[props[p]]
            if (val === undefined) {
                return undefined
            }
        }
        return val
    }
      
    public static set (obj: Record<string, any>, path: string, value: any) {
        const props = path.split('.')
        let val = obj
        for (const p in props) {
            const prop = props[p]
            if (val[prop] === undefined) {
                (val[prop] as any) = {}
            }
            if (parseInt(p) < props.length - 1) {
                val = val[prop]
            } else {
                val[prop] = value
            }
        }
    }
}