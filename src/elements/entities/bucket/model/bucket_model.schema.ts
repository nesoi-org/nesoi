import { $Dependency } from '~/engine/dependency';

export type $BucketModelFieldType = 'boolean'|'date'|'datetime'|'decimal'|'enum'|'file'|'float'|'int'|'string'|'obj'|'unknown'|'dict'

export class $BucketModelField {
    public $t = 'bucket.model.field';
    
    constructor(
        public name: string,
        public type: $BucketModelFieldType,
        public alias: string,
        public array: boolean,
        public required: boolean,
        public _enum?: {
            options: string | string[]
            dep?: $Dependency
        },
        public defaultValue?: any,
        public children?: $BucketModelFields,
        public or?: $BucketModelField,
    ) {}

}

export type $BucketModelFields = {
    [x: string]: $BucketModelField
}

export class $BucketModel {
    public $t = 'bucket.model';

    constructor(
        public fields: $BucketModelFields & { id: $BucketModelField },
        public defaults: Record<string, any> = {}
    ) {}

    public static get(
        model: $BucketModel,
        fieldpath: string
    ): $BucketModelField | undefined {
        const paths = fieldpath.split('.')

        let ref = model.fields as any;
        for (let i = 0; i < paths.length; i++) {
            const path = paths[i];
            if (path === '*') {
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
    
}

