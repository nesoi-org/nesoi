import type { $Bucket } from '../bucket.schema';
import type { AnyTrxNode } from '~/engine/transaction/trx_node';
import type { NQL_AnyQuery } from '../query/nql.schema';
import type { Tag } from '~/engine/dependency';

export type $BucketViewFieldFn<
    TrxNode extends AnyTrxNode,
    RootBucket extends $Bucket,
    CurrentBucket extends $Bucket,
    Value,
    Return = any
> = (
    ctx: {
        trx: TrxNode,
        bucket: $Bucket
        root: RootBucket['#data'],           // Undefined if multiple branches
        current: CurrentBucket['#data'],     // Undefined if multiple branches
        value: Value,
        
        graph: {
            branch: Record<string, any>[]
            model_index: (string|number)[]
        } | {
            branch: Record<string, any>[]
            model_indexes: (string|number)[][]
        } | {
            branches: Record<string, any>[][]
            model_indexes: (string|number)[][]
        }
        flags: {
            serialize: boolean
        }
    }
) => Return | Promise<Return>

export type $BucketViewFieldMeta =
{
    model?: {
        path: string
    }
    computed?: {
        fn: $BucketViewFieldFn<any, any, any, any>
    }
    query?: {
        link: string
        path: string
        view?: string
    } | {
        many: boolean
        bucket: Tag,
        query: NQL_AnyQuery,
        params: $BucketViewFieldFn<any, any, any, any, Record<string, any>>,
        view?: string
    }
    view?: {
        view: string
    }
    drive?: {
        path: string
    }
    inject?: {
        path: number|'value'
    }
}

export type $BucketViewFieldOp =
{
    type: 'map'
    ops: $BucketViewFieldOp[]
} | {
    type: 'prop'
    prop: string
} | {
    type: 'list'
} | {
    type: 'dict'
    key?: string
} | {
    type: 'group'
    key: string
} | {
    type: 'transform'
    fn: $BucketViewFieldFn<any, any, any, any>
} | {
    type: 'subview'
    children: $BucketViewFields
}

/**
 * @category Schemas
 * @subcategory Entity
 * */
export class $BucketViewField {
    public $t = 'bucket.view.field';
    public '#data': unknown;
    constructor(
        public name: string,
        public type: 'model'|'computed'|'query'|'obj'|'view'|'drive'|'inject',
        public alias: string,
        public meta: $BucketViewFieldMeta,
        public ops: $BucketViewFieldOp[] = []
    ) {}
}

export type $BucketViewFields = {
    [x: string]: $BucketViewField
}

/**
 * @category Schemas
 * @subcategory Entity
 * */
export class $BucketView {
    public $t = 'bucket.view';
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