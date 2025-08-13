import { $Dependency } from '~/engine/dependency';
import { BucketAdapterConfig } from '../adapters/bucket_adapter';

export type $BucketModelFieldType = 'boolean'|'date'|'datetime'|'duration'|'decimal'|'enum'|'file'|'float'|'int'|'string'|'obj'|'unknown'|'dict'|'list'|'union'

export type $BucketModelFieldCrypto = {
    algorithm: string,
    key: string
}

/**
 * @category Schemas
 * @subcategory Entity
 * */
export class $BucketModelField {
    public $t = 'bucket.model.field';
    
    constructor(
        public name: string,
        public path: string,
        public type: $BucketModelFieldType,
        public alias: string,
        public required: boolean,
        public meta?: {
            enum?: {
                options: string | string[]
                dep?: $Dependency
            },
            decimal?: {
                left?: number
                right?: number
            },
            file?: {
                extnames?: string[],
                maxsize?: number
            }
        },
        public defaultValue?: any,
        public children?: $BucketModelFields,
        public crypto?: $BucketModelFieldCrypto
    ) {}

}

export type $BucketModelFields = {
    [x: string]: $BucketModelField
}

/**
 * @category Schemas
 * @subcategory Entity
 * */
export class $BucketModel {
    public $t = 'bucket.model';

    constructor(
        public fields: $BucketModelFields & { id: $BucketModelField },
        public defaults: Record<string, any> = {},
        public hasFileField = false,
        public hasEncryptedField = false
    ) {}

    public static getField(
        model: $BucketModel,
        modelpath: string
    ): $BucketModelField[] {
        const paths = modelpath.split('.')

        const results: $BucketModelField[] = [];

        let poll: {
            i: number
            field: $BucketModelField
        }[] = [{ i: 0, field: { children: model.fields } as any }];

        while (poll.length) {
            
            const next: {
                i: number
                field: $BucketModelField
            }[] = [];

            for (const item of poll) {
                const path = paths[item.i];
                if (!path) {
                    results.push(item.field);
                    continue;
                }
                
                const field = item.field;

                // If the field is a union, add all of it's children with the same path index
                if (field.type === 'union') {
                    next.push(...Object.values(field.children!).map(field => ({
                        i: item.i,
                        field
                    })));
                    continue;
                }
    
                // If it's a list or dict, or an object 
                if (field.type === 'list' || field.type === 'dict') {
                    // If not, iterate
                    next.push({
                        i: item.i+1,
                        field: field.children!['#']
                    })
                    continue;
                }
    
                // If it's an object and the path is '*', walk all of it's children
                if (field.type === 'obj' && path === '*') {
                    next.push(...Object.values(field.children!).map(field => ({
                        i: item.i+1,
                        field
                    })))
                    continue;
                }
                
                const child = field.children![path];
                if (child) {
                    next.push({
                        i: item.i+1,
                        field: child
                    })
                }
            }
            poll = next;
        }

        return results;
    }

    public static fieldsOfType(
        model: $BucketModel,
        type: $BucketModelFieldType
    ) {

        const fields: $BucketModelField[] = [];
        
        let poll: $BucketModelField[] = Object.values(model.fields);
        while (poll.length) {
            const next: $BucketModelField[] = [];
            for (const field of poll) {
                if (field.type === type) {
                    fields.push(field);
                }
                if (field.children) {
                    next.push(...Object.values(field.children))
                }
            }
            poll = next;
        }

        return fields;
    }

    public static async forEachField(
        model: $BucketModel,
        predicate: (field: $BucketModelField, path: string) => Promise<void>
    ) {
        let poll: {
            field: $BucketModelField,
            path: string
        }[] = Object.entries(model.fields).map(([path, field]) => ({ path, field }));
        while (poll.length) {
            const next: typeof poll = [];
            for (const obj of poll) {
                await predicate(obj.field, obj.path);
                
                if (obj.field.children) {
                    next.push(...Object.values(obj.field.children)
                        .map((field, i) => ({
                            field,
                            path: obj.path + '.' + (obj.field.type === 'union' ? i : field.name)
                        }))
                    )
                }
            }
            poll = next;
        }
    }

    public static copy<T extends Record<string, any>>(
        model: $BucketModel,
        obj: T,
        meta: BucketAdapterConfig['meta'] = {
            created_at: 'created_at',
            created_by: 'created_by',
            updated_at: 'updated_at',
            updated_by: 'updated_by',
        }
    ): T {
        const copy: Record<string, any> = {};
        let poll: {
            field: $BucketModelField,
            obj: Record<string, any>,
            copy: Record<string, any>,
            path: string
        }[] = Object.entries(model.fields).map(([path, field]) => ({ path, obj, copy, field }));
        while (poll.length) {
            const next: typeof poll = [];
            for (const entry of poll) {
                const val = entry.obj[entry.path];
                if (val === undefined) {
                    continue;
                }
                if (val === null) {
                    entry.copy[entry.path] = null;
                    continue;
                }

                if (entry.field.type === 'list') {
                    if (!Array.isArray(val)) continue;
                    entry.copy[entry.path] = [];
                    next.push(...val.map((_,i) => ({
                        path: i.toString(),
                        obj: val,
                        copy: entry.copy[entry.path],
                        field: entry.field.children!['*']
                    })))
                }
                else if (entry.field.type === 'dict') {
                    if (typeof val !== 'object' || Array.isArray(val)) continue;
                    entry.copy[entry.path] = {};
                    next.push(...Object.keys(val).map((path) => ({
                        path,
                        obj: val,
                        copy: entry.copy[entry.path],
                        field: entry.field.children!['*']
                    })))
                }
                else if (entry.field.type === 'obj') {
                    if (typeof val !== 'object' || Array.isArray(val)) continue;
                    entry.copy[entry.path] = {};
                    next.push(...Object.keys(entry.field.children!).map(path => ({
                        path: path,
                        obj: val,
                        copy: entry.copy[entry.path],
                        field: entry.field.children![path]
                    })))
                }
                else if (entry.field.type === 'union') {
                    // TODO: ??????????   
                    entry.copy[entry.path] = entry.obj[entry.path];
                }
                else {
                    entry.copy[entry.path] = entry.obj[entry.path];
                }
            }
            poll = next;
        }
        copy[meta.created_at] = obj[meta.created_at];
        copy[meta.created_by] = obj[meta.created_by];
        copy[meta.updated_at] = obj[meta.updated_at];
        copy[meta.updated_by] = obj[meta.updated_by];
        return copy as never;
    }

    public static getModelpaths(
        model: $BucketModel
    ) {
        const modelpaths: Record<string, $BucketModelField[]> = {};

        let poll: {
            field: $BucketModelField,
            path: string,
        }[] = Object.entries(model.fields).map(([path, field]) => ({ path, field }));
        while (poll.length) {
            const next: typeof poll = [];
            for (const obj of poll) {
                if (obj.field.type === 'union') {
                    modelpaths[obj.path] = [obj.field];
                }
                else {
                    modelpaths[obj.path] = [obj.field];
                    if (obj.field.children) {
                        
                        if (obj.field.type === 'dict') {
                            modelpaths[obj.path+'{*}'] = [obj.field.children['#']];
                        }
                        else if (obj.field.type === 'list') {
                            modelpaths[obj.path+'[*]'] = [obj.field.children['#']];
                        }
                        else if (obj.field.type === 'obj') {
                            modelpaths[obj.path+'{*}'] = Object.values(obj.field.children);
                        }

                        for (const key in obj.field.children) {
                            const child = obj.field.children[key];
                            
                            if (obj.field.type === 'dict') {
                                modelpaths[obj.path + '{$${number}}'] = [child];
                                next.push({
                                    field: child,
                                    path: obj.path + '{${string}}'
                                })
                            }
                            else if (obj.field.type === 'list') {
                                modelpaths[obj.path + '[$${number}]'] = [child];
                                next.push({
                                    field: child,
                                    path: obj.path + '[${number}]'
                                })
                            }
                            else {
                                next.push({
                                    field: child,
                                    path: obj.path + '.' + child.name
                                })
                            }

                        }
                    }
                }
            }
            poll = next;
        }

        return modelpaths;
    }

}

