import type { ObjWithOptionalId } from '~/engine/data/obj';
import type { BucketCacheSync } from '../cache/bucket_cache';
import { type NQLRunner } from '../query/nql_engine';

import { NesoiError } from '~/engine/data/error';
import type { AnyTrxNode } from '~/engine/transaction/trx_node';

export type BucketAdapterConfig = {
    meta: {
        created_at: string,
        created_by: string,
        updated_at: string,
        updated_by: string
    }
}

/**
 * @category Adapters
 * @subcategory Entity
 * */
export abstract class BucketAdapter<
    Obj extends NesoiObj,
    Config extends BucketAdapterConfig = BucketAdapterConfig
> {
    /**
     * External config
     */
    public config: Config;

    /**
     * Internal config
     */
    public behavior: {
        // Data stored can only be modified via create/patch/replace/put.
        //
        // - On memory adapter, this means the data is frozen after changes.
        // - :warning: Disabling this might cause side effects
        // when modifying the bucket data directly through a reference.
        isolated?: boolean

        // Data is stored in a serialized state, meaning it must be
        // cast to it's nesoi struct on every read.
        as_json?: boolean
    }
    
    constructor(
        protected schema: $Bucket,
        public nql: NQLRunner,
        config?: Partial<Config>,
        behavior?: BucketAdapter<any, any>['behavior']
    ) {
        this.config = {
            ...config,
            meta: {
                created_at: config?.meta?.created_at || 'created_at',
                created_by: config?.meta?.created_by || 'created_by',
                updated_at: config?.meta?.updated_at || 'updated_at',
                updated_by: config?.meta?.updated_by || 'updated_by'
            }
        } as Config;
        this.behavior = behavior ?? {};
    }

    /**
     * **DANGEROUS!**
     * This should only be used on inner adapters of bucket caches.
     * Be extremely careful when implementing this on permanent storage adapters.
     */

    protected abstract deleteEverything(
        trx: AnyTrxNode
    ): Promise<void>

    /* Read Operations */

    /**
     * Return one object by ID.
     * - This method MUST return data on the format specified by the `behavior.serialized` flag.
     * - This method MUST return undefined if the obj `id` is not found.
     * - This method MUST NOT throw exceptions - handled by the bucket itself.
     */
    abstract getOne(
        trx: AnyTrxNode,
        id: Obj['id'],
        options?: {
            roots?: string[]
        }
    ): Promise<Obj|undefined>

    /**
     * Return many objects by ID.
     * - This method MUST return data on the format specified by the `behavior.serialized` flag.
     * - This method MUST return undefined if the obj `id` is not found.
     * - This method MUST NOT throw exceptions - handled by the bucket itself.
     */
    abstract getMany(
        trx: AnyTrxNode,
        id: Obj['id'][],
        options?: {
            roots?: string[]
        }
    ): Promise<Obj[]>
    
    /**
     * Return all objects
     * 
     * - This method MUST return data on the format specified by the `behavior.serialized` flag.
     * - This method MUST NOT throw exceptions - handled by the bucket itself.
     */
    abstract getAll(
        trx: AnyTrxNode,
        options?: {
            roots?: string[]
        }
    ): Promise<Obj[]>
    
    /* Write Operations */

    /**
     * Create an object and return it
     * 
     * - This method MUST return false if the obj `id` already exists.
     * - This method MUST NOT throw exceptions - handled by the bucket itself.
     */
    abstract create(
        trx: AnyTrxNode,
        obj: ObjWithOptionalId<Obj>,
        options?: {
            return?: boolean
        }
    ): Promise<Obj|undefined|false>

    /**
     * Create many objects and return them
     * 
     * - This method MUST return false if any of the objs `id` already exists.
     * - This method MUST NOT throw exceptions - handled by the bucket itself.
     */
    abstract createMany(
        trx: AnyTrxNode,
        objs: ObjWithOptionalId<Obj>[],
        options?: {
            return?: boolean
        }
    ): Promise<Obj[]|undefined|false>

    /**
     * Replace an object and return it.
     * 
     * - This method MUST return false if the obj `id` is not found.
     * - This method MUST NOT modify the `created_by` and `created_at` fields.
     * - This method MUST NOT throw exceptions - handled by the bucket itself.
     */
    abstract replace(
        trx: AnyTrxNode,
        obj: Obj,
        options?: {
            return?: boolean
        }
    ): Promise<Obj|undefined|false>

    /**
     * Replace many objects and return them
     *
     * - This method MUST not return false if at least 1 obj is not found.
     * - This method MUST NOT modify the `created_by` and `created_at` fields.
     * - This method MUST NOT throw exceptions - handled by the bucket itself.
     */
    abstract replaceMany(
        trx: AnyTrxNode,
        objs: Obj[],
        options?: {
            return?: boolean
        }
    ): Promise<Obj[]|undefined|false>

    /**
     * Patch (modify) an object and return it
     * 
     * - This method MUST return false if the obj `id` is not found.
     * - This method MUST NOT modify the `created_by` and `created_at` fields.
     * - This method MUST NOT throw exceptions - handled by the bucket itself.
     */
    abstract patch(
        trx: AnyTrxNode,
        obj: Obj,
        options?: {
            return?: boolean
        }
    ): Promise<(Obj|undefined|false)>

    /**
     * Patch (modify) many objects and return them
     * 
     * - This method MUST not return false if at least 1 obj is not found.
     * - This method MUST NOT modify the `created_by` and `created_at` fields.
     * - This method MUST NOT throw exceptions - handled by the bucket itself.
     */
    abstract patchMany(
        trx: AnyTrxNode,
        objs: Obj[],
        options?: {
            return?: boolean
        }
    ): Promise<Obj[]|undefined|false>

    /**
     * Put (Create or Replace) an object and return it.
     * 
     * - If the object does not contains an `id`, it's a `create`
     * - If the object contains an `id`, it's a `replace`
     * 
     * - This method MUST NOT modify the `created_by` and `created_at` fields when replacing.
     * - This method MUST NOT throw exceptions - handled by the bucket itself.
     */
    abstract put(
        trx: AnyTrxNode,
        obj: ObjWithOptionalId<Obj>,
        options?: {
            return?: boolean
        }
    ): Promise<Obj>

    /**
     * Put (Create or Replace) many objects and return them
     * 
     * - This method MUST NOT modify the `created_by` and `created_at` fields when replacing.
     * - This method MUST NOT throw exceptions - handled by the bucket itself.
     */
    abstract putMany(
        trx: AnyTrxNode,
        objs: ObjWithOptionalId<Obj>[],
        options?: {
            return?: boolean
        }
    ): Promise<Obj[]>

    /* Delete Operations */

    /**
     * Delete an object by ID
     * 
     * - This method MUST return false if the `id` is not found.
     * - This method MUST NOT throw exceptions - handled by the bucket itself.
     */
    abstract delete(
        trx: AnyTrxNode,
        id: Obj['id']
    ): Promise<boolean>

    /**
     * Delete many objects by their IDs
     * 
     * - This method MUST return false if any obj `id` that is not found.
     * - This method MUST NOT throw exceptions - handled by the bucket itself.
     */
    abstract deleteMany(
        trx: AnyTrxNode,
        ids: Obj['id'][]
    ): Promise<boolean>

    /* Cache Operations */

    /**
     * Given an id, sync that object only.
     * - If the id doesn't exist on the source, return 'deleted'
     * - If it does, check if it changed since lastObjUpdateEpoch
     *      - If yes, return the updated object
     *      - If not, return null
     * @returns One of the below:
     *  - `null`: Object hasn't changed 
     *  - `Obj`: Object has changed
     *  - `deleted`: Object was deleted
     */
    abstract syncOne(
        trx: AnyTrxNode,
        id: Obj['id'],
        lastObjUpdateEpoch: number
    ): Promise<null|'deleted'|BucketCacheSync<Obj>>

    /**
     * Given an id, if the object was not deleted and has changed on source,
     * sync the object and all objects of this bucket updated before it, but
     * after the last sync.
     * @returns One of the below:
     *  - `null`: Object hasn't changed 
     *  - `Obj[]`: Object or past objects changed
     *  - `deleted`: Object was deleted
     */
    abstract syncOneAndPast(
        trx: AnyTrxNode,
        id: Obj['id'],
        lastUpdateEpoch: number
    ): Promise<null|'deleted'|BucketCacheSync<Obj>[]>

    /**
     * Resync the entire cache.
     * - Hash the ids, check if it matches the incoming hash
     *   - If yes, read all data that changed since last time
     *   - If not, read all data and return a hard resync (previous data will be wiped)
     @returns One of the below:
     *  - `null`: Cache hasn't changed
     *  - `{ data: Obj[], hash: string, hard: true }`: Cache has changed
     */
    abstract syncAll(
        trx: AnyTrxNode,
        lastHash?: string,
        lastUpdateEpoch?: number,
    ): Promise<null|{
        sync: BucketCacheSync<Obj>[],
        hash: string,
        updateEpoch: number,
        reset: boolean
    }>
    
    /**
     * Returns a scope string and average response time, used to optimize queries.
     * Should be the same for adapters that can be queried together.
     */
    abstract getQueryMeta(): {
        scope: string
        avgTime: number
    }

    /* Generic Implementation */

    /**
     * Return the epoch of the last update of an object
     * @param {Obj} obj An object of this bucket
     */
    getUpdateEpoch(obj: Obj) {
        const objUpdate = obj[this.config.meta.updated_at as never] as NesoiDatetime;
        if (!objUpdate) {
            throw NesoiError.Bucket.NoUpdatedAtField({ bucket: this.schema.name, id: obj.id, field: this.config.meta.updated_at });
        }
        return objUpdate.epoch;
    }

}

export type AnyBucketAdapter = BucketAdapter<any, any>