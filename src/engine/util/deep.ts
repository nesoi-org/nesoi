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
}