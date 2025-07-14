import { $Dependency } from '~/engine/dependency';

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
    
                // If it's an object, walk it's children
                if (field.type === 'obj' && path === '*') {
                    next.push(...Object.values(field.children!).map(field => ({
                        i: item.i+1,
                        field
                    })))
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
        template: $BucketModel,
        predicate: (field: $BucketModelField, unionKey?: number) => Promise<void>
    ) {
        let poll: {
            field: $BucketModelField,
            unionKey?: number
        }[] = Object.values(template.fields).map(field => ({ field }));
        while (poll.length) {
            const next: typeof poll = [];
            for (const obj of poll) {
                await predicate(obj.field, obj.unionKey);
                
                if (obj.field.children) {
                    next.push(...Object.values(obj.field.children)
                        .map((field, i) => ({
                            field,
                            unionKey: obj.field.type === 'union' ? i : undefined
                        }))
                    )
                }
            }
            poll = next;
        }
    }
}

