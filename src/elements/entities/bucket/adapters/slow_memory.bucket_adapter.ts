import { BucketAdapterConfig } from './bucket_adapter';
import { MemoryBucketAdapter } from './memory.bucket_adapter';
import { $Bucket } from '../bucket.schema';
import { NesoiObj } from '~/engine/data/obj';
import { AnyTrxNode } from '~/engine/transaction/trx_node';
import { NQL_AnyQuery, NQL_Pagination } from '../query/nql.schema';

export class SlowMemoryBucketAdapter<
    Obj extends NesoiObj
> extends MemoryBucketAdapter<Obj> {

    constructor(
        public schema: $Bucket,
        protected timeout: number,
        data: Record<Obj['id'], Obj> = {} as any,
        config?: BucketAdapterConfig
    ) {
        super(schema, data, config);
    }

    private wrap<T extends Promise<any>>(scale: number, fn: () => T): T {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                fn()
                    .then(resolve)
                    .catch(reject);
            }, this.timeout*scale);
        }) as any;
    }

    /* Read operations */

    index(trx: AnyTrxNode) {
        return this.wrap(5, () => super.index(trx));
    }

    get(trx: AnyTrxNode, id: Obj['id']) {
        return this.wrap(1, () => super.get(trx, id));
    }

    async query<
        MetadataOnly extends boolean
    >(
        trx: AnyTrxNode,
        query: NQL_AnyQuery,
        pagination?: NQL_Pagination,
        config?: {
            metadataOnly: MetadataOnly
        }
    ): Promise<MetadataOnly extends true ? { id: Obj['id'], [x: string]: any }[] : Obj[]> {
        return this.wrap(3, () => super.query(trx, query, pagination, config));
    }

}