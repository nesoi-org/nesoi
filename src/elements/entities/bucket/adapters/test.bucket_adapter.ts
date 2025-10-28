import { BucketAdapterConfig } from './bucket_adapter';
import { $Bucket, MemoryBucketAdapter } from '~/elements';

/**
 * @category Adapters
 * @subcategory Entity
 */
export class TestBucketAdapter<
    B extends $Bucket,
    Obj extends B['#data']
> extends MemoryBucketAdapter<B, Obj> {

    private queryMeta?: {
        scope: string
        avgTime: number
    }

    constructor(
        public schema: B,
        public data: NoInfer<Record<Obj['id'], Obj>> = {} as any,
        config?: BucketAdapterConfig & {
            queryMeta?: {
                scope: string
                avgTime: number
            }
        }
    ) {
        super(schema, data, config);
        this.queryMeta = config?.queryMeta;
    }

    getQueryMeta() {
        return this.queryMeta || super.getQueryMeta();
    }

}

export type AnyTestBucketAdapter = TestBucketAdapter<any, any>