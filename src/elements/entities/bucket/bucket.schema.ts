import { $BucketGraph } from './graph/bucket_graph.schema';
import { $BucketViews } from './view/bucket_view.schema';
import { $BucketModel } from './model/bucket_model.schema';
import { NesoiObj } from '~/engine/data/obj';
import { $Dependency } from '~/engine/dependency';

export class $Bucket {
    public $t = 'bucket' as const;
    public '#data'!: NesoiObj;
    public '#composition': Record<string, { bucket: $Bucket, many: boolean, optional: boolean }>;
    public '#fieldpath': {};
    public '#defaults': Record<string, any>

    constructor(
        public module: string,
        public name: string,
        public alias: string,
        public model: $BucketModel,
        public graph: $BucketGraph,
        public views: $BucketViews,
        public extended?: $Dependency
    ) {}
}