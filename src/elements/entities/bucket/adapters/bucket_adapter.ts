import { AnyTrxNode, TrxNode } from '~/engine/transaction/trx_node';
import { NesoiObj , NewOrOldObj } from '~/engine/data/obj';
import { NesoiError } from '~/engine/data/error';
import { BucketCacheSync } from '../cache/bucket_cache';
import { NesoiDatetime } from '~/engine/data/datetime';
import { NQL_AnyQuery, NQL_Pagination } from '../query/nql.schema';
import { NQLRunner } from '../query/nql_engine';
import { NQL_Compiler } from '../query/nql_compiler';
import { $Bucket } from '~/elements';

export type BucketAdapterConfig = {
    updatedAtField: string
}

export abstract class BucketAdapter<
    Obj extends NesoiObj
> {
    protected config: BucketAdapterConfig;
    
    constructor(
        protected schema: $Bucket,
        protected nql: NQLRunner,
        config?: Partial<BucketAdapterConfig>
    ) {
        this.config = {
            updatedAtField: config?.updatedAtField || 'updated_at'
        };
    }

    /**
     * **Dangerous!**
     * This should only be used on inner adapters of bucket caches.
     * Be extremely careful when implementing this on permanent storage adapters.
     */

    protected abstract deleteEverything(
        trx: AnyTrxNode
    ): Promise<void>

    /* Read Operations */

    /**
     * Return one entity by ID
     */
    abstract get(
        trx: AnyTrxNode,
        id: Obj['id']
    ): Promise<undefined | Obj>
    
    /**
     * Return all entities
     */
    abstract index(
        trx: AnyTrxNode
    ): Promise<Obj[]>
    
    /**
     * Return the results of a query
     */
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

        const module = TrxNode.getModule(trx);

        const compiled = await NQL_Compiler.build(module, this.schema.name, query);
        const results = await module.nql.run(trx, compiled);
        if (config?.metadataOnly) {
            return results.map(obj => ({
                id: obj.id,
                [this.config.updatedAtField]: this.getUpdateEpoch(obj as any)
            })) as any;
        }
        return results as Obj[];
    }

    /* Write Operations */

    /**
     * Create/update an entity and return it.
     * 
     * - If the `obj` has an `id` property, it's a **replace**.
     * - If not, it's a **create**.
     */
    abstract put(
        trx: AnyTrxNode,
        obj: NewOrOldObj<Obj>
    ): Promise<Obj>

    /**
     * Create/update many entities and return them.
     * 
     * For each `obj` of `objs`:
     * - If the `obj` has an `id` property, it's a **replace**.
     * - If not, it's a **create**.
     */
    abstract putMany(
        trx: AnyTrxNode,
        objs: NewOrOldObj<Obj>[]
    ): Promise<Obj[]>

    /**
     * Delete an entity by ID
     */
    abstract delete(
        trx: AnyTrxNode,
        id: Obj['id']
    ): Promise<void>

    /**
     * Delete many entities by their IDs
     */
    abstract deleteMany(
        trx: AnyTrxNode,
        ids: Obj['id'][]
    ): Promise<void>

    /* Cache Operations */

    getUpdateEpoch(obj: Obj) {
        const objUpdateStr = obj[this.config.updatedAtField as never];
        if (!objUpdateStr) {
            throw NesoiError.Bucket.NoUpdatedAtField({ bucket: 'TODO', id: obj.id, field: this.config.updatedAtField });
        }

        const objUpdate = NesoiDatetime.fromISO(objUpdateStr);
        return objUpdate.epoch;
    }

    /**
     * Given an id, sync that object only.
     * - If the id doesn't exist on the source, return 'deleted'
     * - If it does, check if it changed since lastObjUpdateEpoch
     *      - If yes, return the updated object
     *      - If not, return null
     * @returns
     *  - null: Object hasn't changed 
     *  - Obj: Object has changed
     *  - 'deleted': Object was deleted
     */
    abstract syncOne(
        trx: AnyTrxNode,
        id: Obj['id'],
        lastObjUpdateEpoch: number
    ): Promise<null|'deleted'|BucketCacheSync<Obj>>

    /**
     * Given an id, if the object was not deleted and has changed on source,
     * sync the object and all objects of this bucket updated before it.
     * @returns
     *  - null: Object hasn't changed 
     *  - Obj[]: Object or past objects changed
     *  - 'deleted': Object was deleted
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
     @returns
     *  - null: Cache hasn't changed
     *  - { data: Obj[], hash: string, hard: true }: Cache has changed
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
     * Returns a scope string, used to optimize queries.
     * Should be the same for adapters that can be queried together.
     */
    abstract getQueryMeta(): {
        scope: string
        avgTime: number
    }
}

export type AnyBucketAdapter = BucketAdapter<any>