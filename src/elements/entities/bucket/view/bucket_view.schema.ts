import type { $BucketViewFieldMeta, $BucketViewFieldOp, $BucketViewFields } from 'index';

/**
 * @category Schemas
 * @subcategory Entity
 * */
export class $BucketViewField {
    public $t = 'bucket.view.field' as const;
    public '#data': unknown;
    constructor(
        public name: string,
        public type: 'model'|'computed'|'query'|'obj'|'view'|'drive'|'inject',
        public alias: string,
        public meta: $BucketViewFieldMeta,
        public ops: $BucketViewFieldOp[] = []
    ) {}
}

/**
 * @category Schemas
 * @subcategory Entity
 * */
export class $BucketView {
    public $t = 'bucket.view' as const;
    public '#data': unknown;
    constructor(
        public name: string,
        public fields: $BucketViewFields = {}
    ) {
        
    }    
}

export type $BucketViews = {
    [x: string]: $BucketView
}