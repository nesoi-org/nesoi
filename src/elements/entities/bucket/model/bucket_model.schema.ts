/**
 * @category Schemas
 * @subcategory Entity
 * */
export class $BucketModelField {
    public $t = 'bucket.model.field' as const;
    
    constructor(
        public name: string,
        public path: string,
        public type: $BucketModelFieldType,
        public alias: string,
        public required: boolean,
        public meta?: {
            literal?: {
                template: string
            }
            enum?: {
                options: Record<string, any>
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

/**
 * @category Schemas
 * @subcategory Entity
 * */
export class $BucketModel {
    public $t = 'bucket.model' as const;

    constructor(
        public fields: $BucketModelFields & { id: $BucketModelField },
        public defaults: Record<string, any> = {},
        public hasFileField = false,
        public hasEncryptedField = false
    ) {}

    public static getFields(
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
    
                // If it's a list or dict, add the index field
                if (field.type === 'list' || field.type === 'dict') {
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

                if (field.type === 'unknown') {
                    results.push(field);
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

}

