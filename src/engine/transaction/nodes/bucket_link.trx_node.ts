
import type { BucketTrxNode } from './bucket.trx_node';

/**
 * @category Engine
 * @subcategory Transaction
 */
export class BucketLinkTrxNode<
    Space extends $Space,
    M extends $Module,
    B extends $Bucket,
    Obj = B['#data']
> {

    constructor(
        private trx: BucketTrxNode<Space, M, B>,
        private link: string
    ) {}

    /**
     * Returns an object read from a linked bucket through an id/object
     * of this bucket, without building it.
     * 
     * Options:
     * - `no_tenancy`: Don't apply tenancy rules when reading the object.
     * - `no_cast`: Reads the object as stored on the adapter, without parsing. Can improve performance but cause inconsistent behavior between adapters.
     * - `roots`: Specify which root fields to be read from the object.
     */
    public async one(
        input: B['#data']['id'] | B['#data'],
        options?: {
            no_tenancy?: boolean
            no_cast?: boolean
            roots?: string[]
        }
    ): Promise<Obj> {
        return {} as any
        // const results = await ((this.trx as any).wrap as BucketTrxNode<any, any, any>['wrap'])(
        //     'read.one',
        //     { input },
        //     async (trx, bucket) => {
        //         return bucket.readOne(trx, input, options);
        //     }
        // )
        // return results.data as Obj[];
    }

    /**
     * Returns many objects read from a linked bucket through a list of ids/objects
     * of this bucket, without building them.
     * 
     * Options:
     * - `no_tenancy`: Don't apply tenancy rules when reading the object.
     * - `no_cast`: Reads the object as stored on the adapter, without parsing. Can improve performance but cause inconsistent behavior between adapters.
     * - `roots`: Specify which root fields to be read from the object.
     */
    public async many(
        input: B['#data']['id'][] | B['#data'][],
        options?: {
            no_tenancy?: boolean
            no_cast?: boolean
            roots?: string[]
        }
    ): Promise<Obj[]> {
        const results = await ((this.trx as any).wrap as BucketTrxNode<any, any, any>['wrap'])(
            'read.many',
            { input },
            async (trx, bucket) => {
                return bucket.readMany(trx, input, options);
            },
            objs => ({ length: objs.length })
        )
        return results.data as Obj[];
    }

    /**
     * Returns many objects read from a linked bucket through a list of ids/objects
     * of this bucket, without building them.
     * 
     * Options:
     * - `no_tenancy`: Don't apply tenancy rules when reading the object.
     * - `no_cast`: Reads the object as stored on the adapter, without parsing. Can improve performance but cause inconsistent behavior between adapters.
     * - `roots`: Specify which root fields to be read from the object.
     */
    public async is_present(
        input: B['#data']['id'] | B['#data'],
        options?: {
            no_tenancy?: boolean
        }
    ): Promise<boolean> {
        return false
    }

}