import { $Bucket } from '../bucket.schema';
import { AnyTrxNode } from '~/engine/transaction/trx_node';

export type $BucketViewFieldFn<
    TrxNode extends AnyTrxNode,
    B extends $Bucket
> = (
    ctx: { trx: TrxNode, raw: B['#data'], bucket: $Bucket }
) => any | Promise<any>

export type $BucketViewFieldMeta =
{
    model?: {
        path: string
    }
    graph?: {
        link: string,
        view?: string
    }
    computed?: {
        fn: $BucketViewFieldFn<any, any>
    }
    view?: {
        view: string
    }
    drive?: {
        path: string
    }
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
        public scope: 'model'|'graph'|'computed'|'group'|'view'|'drive',
        public alias: string,
        public meta: $BucketViewFieldMeta,
        public children?: $BucketViewFields,
        public chain?: $BucketViewField
    ) {}
}

export type $BucketViewFields = {
    [x: string]: $BucketViewField
}

export type $BucketViewFieldTree = {
    [x: string]: $BucketViewField | $BucketViewFieldTree
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

    public static getField(schema: $BucketView, path: string) {
        const find = (fields: $BucketViewFields, path: string[]): $BucketViewField|undefined => {
            const term = path[0];
            if (term in fields) {
                const field = fields[term];
                if (path.length === 1) {
                    return field as $BucketViewField;
                }
                if (!field.children) {
                    return undefined;
                }
                return find(field.children as $BucketViewFields, path.slice(1));
            }
            return undefined;
        };
        return find(schema.fields, (path as string).split('.'));
    }

    
}

export type $BucketViews = {
    [x: string]: $BucketView
}