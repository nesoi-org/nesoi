import { $Dependency } from '~/engine/dependency';

export type $BucketModelFieldType = 'boolean'|'date'|'datetime'|'duration'|'decimal'|'enum'|'file'|'float'|'int'|'string'|'obj'|'unknown'|'dict'

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
        public array: boolean,
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
        public or?: $BucketModelField,
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

    public static get(
        model: $BucketModel,
        fieldpath: string
    ): $BucketModelField | undefined {
        const paths = fieldpath.split('.')

        let ref = model.fields as any;
        for (let i = 0; i < paths.length; i++) {
            const path = paths[i];
            if (path === '#') {
                continue;
            }
            else {
                ref = ref?.[path];
            }
            if (!ref?.children || i == paths.length-1) {
                return ref;
            }
            if (!ref) {
                return undefined;
            }
            ref = ref.children;
        }
        return ref;
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
}

