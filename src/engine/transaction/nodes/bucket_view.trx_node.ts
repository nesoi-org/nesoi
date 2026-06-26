
import type { BucketViewDef } from '~/elements/entities/bucket/view/bucket_view.builder';
import type { BucketTrxNode } from './bucket.trx_node';

/**
 * @category Engine
 * @subcategory Transaction
 */
export class BucketViewTrxNode<
    Space extends $Space,
    M extends $Module,
    B extends $Bucket,
    Obj = B['#data']
> {

    constructor(
        private trx: BucketTrxNode<Space, M, B>,
        private view: string | BucketViewDef<any, any, any, any, any>
    ) {}

    /**
     * Returns one object by `id`, built with the specified view,
     * or `undefined` if the object was not found.
     * Or build a given object with the view.
     * 
     * - :warning: Building objects with a view has performance implications.
     * If you just need the objects from the adapter, use `read.one` instead.
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
    ): Promise<Obj[]> {
        const results = await ((this.trx as any).wrap as BucketTrxNode<any, any, any>['wrap'])(
            'read.one',
            { input },
            async (trx, bucket) => {
                return bucket.readOne(trx, input, options);
            }
        )
        return results.data as Obj[];
    }

    /**
     * Returns many objects by `id`, built with the specified view them.
     * 
     * - :warning: Building objects with a view has performance implications.
     * If you just need the objects from the adapter, use `read.many` instead.
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
     * Returns all objects, built with the specified view,
     * or `undefined` if the object was not found.
     * 
     * - :warning: Building objects with a view has performance implications.
     * If you just need the objects from the adapter, use `read.all` instead.
     * 
     * Options:
     * - `no_tenancy`: Don't apply tenancy rules when reading the object.
     * - `no_cast`: Reads the object as stored on the adapter, without parsing. Can improve performance but cause inconsistent behavior between adapters.
     * - `roots`: Specify which root fields to be read from the object.
     */
    public async all(options?: {
        no_tenancy?: boolean
        no_cast?: boolean
        roots?: string[]
    }): Promise<Obj[]> {
        const results = await ((this.trx as any).wrap as BucketTrxNode<any, any, any>['wrap'])(
            'read.all',
            {},
            async (trx, bucket) => {
                return bucket.readAll(trx, options);
            },
            objs => ({ length: objs.length })
        )
        return results.data as Obj[];
    }
}