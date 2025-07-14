import { $BucketGraph } from './graph/bucket_graph.schema';
import { $BucketViews } from './view/bucket_view.schema';
import { $BucketModel } from './model/bucket_model.schema';
import { NesoiObj } from '~/engine/data/obj';
import { $Dependency } from '~/engine/dependency';
import { $Module } from '~/elements';
import { NQL_Query } from './query/nql.schema';

export type $BucketTenancy<
    M extends $Module,
    B extends $Bucket
> = {
    [K in keyof M['#authn']]?: (user: M['#authn'][K]) => NQL_Query<M, B>
}

/**
 * @category Schemas
 * @subcategory Entity
 * */
export class $Bucket {
    public $t = 'bucket' as const;
    public '#data'!: NesoiObj;
    public '#composition': Record<string, { bucket: $Bucket, many: boolean, optional: boolean }>;
    public '#modelpath': {};
    public '#querypath': {};
    public '#defaults': Record<string, any>

    constructor(
        public module: string,
        public name: string,
        public alias: string,
        public model: $BucketModel,
        public graph: $BucketGraph,
        public views: $BucketViews,
        public tenancy?: $BucketTenancy<any, any>,
        public extended?: $Dependency
    ) {}
}