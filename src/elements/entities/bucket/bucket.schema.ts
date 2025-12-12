import type { $BucketGraph } from './graph/bucket_graph.schema';
import type { $BucketViews } from './view/bucket_view.schema';
import type { $BucketModel } from './model/bucket_model.schema';
import type { NesoiObj } from '~/engine/data/obj';
import type { Tag } from '~/engine/dependency';
import type { $Module } from '~/elements';
import type { NQL_Query } from './query/nql.schema';

export type $BucketTenancy<
    M extends $Module,
    B extends $Bucket
> = {
    [K in keyof M['#auth']]?: (user: M['#auth'][K]) => NQL_Query<M, B>
}

/**
 * @category Schemas
 * @subcategory Entity
 * */
export class $Bucket {
    public $t = 'bucket' as const;
    public '#data'!: NesoiObj;
    public '#composition': Record<string, { bucket: $Bucket, many: boolean, optional: boolean }>;
    public '#defaults': Record<string, any>

    constructor(
        public module: string,
        public name: string,
        public alias: string,
        public model: $BucketModel,
        public graph: $BucketGraph,
        public views: $BucketViews,
        public tenancy?: $BucketTenancy<any, any>,
        public extendsFrom?: Tag
    ) {}
}