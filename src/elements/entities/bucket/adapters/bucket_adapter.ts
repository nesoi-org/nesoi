import { AnyTrxNode, TrxNode } from '~/engine/transaction/trx_node';
import { NesoiObj , ObjWithOptionalId } from '~/engine/data/obj';
import { NesoiError } from '~/engine/data/error';
import { BucketCacheSync } from '../cache/bucket_cache';
import { NesoiDatetime } from '~/engine/data/datetime';
import { NQL_AnyQuery, NQL_Pagination } from '../query/nql.schema';
import { NQLRunner, NQL_Result } from '../query/nql_engine';
import { NQL_CompiledQuery, NQL_Compiler } from '../query/nql_compiler';
import { $Bucket } from '~/elements';

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
    public config: Config;
    
    constructor(
        protected schema: $Bucket,
        public nql: NQLRunner,
        config?: Partial<Config>
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
     * Return one entity by ID.
     * - This method MUST NOT throw an exception if not found. The exception is thrown by Nesoi.
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
    
    /* Write Operations */

    /**
     * Create an entity and return it
     * 
     * - This method should throw an exception if the obj `id` already exists
     */
    abstract create(
        trx: AnyTrxNode,
        obj: ObjWithOptionalId<Obj>
    ): Promise<Obj>

    /**
     * Create many entities and return them
     */
    abstract createMany(
        trx: AnyTrxNode,
        objs: ObjWithOptionalId<Obj>[]
    ): Promise<Obj[]>

    /**
     * Replace an entity and return it.
     * 
     * **WARNING**: This method **MUST NOT** replace the `created_by` and `created_at` fields.
     */
    abstract replace(
        trx: AnyTrxNode,
        obj: Obj
    ): Promise<Obj>

    /**
     * Replace many entities and return them
     *
     * **WARNING**: This method **MUST NOT** replace the `created_by` and `created_at` fields.
     */
    abstract replaceMany(
        trx: AnyTrxNode,
        objs: Obj[]
    ): Promise<Obj[]>

    /**
     * Patch (modify) an entity and return it
     */
    abstract patch(
        trx: AnyTrxNode,
        obj: Obj
    ): Promise<Obj>

    /**
     * Patch (modify) many entities and return them
     */
    abstract patchMany(
        trx: AnyTrxNode,
        objs: Obj[]
    ): Promise<Obj[]>

    /**
     * Put (Create or Replace) an entity and return it.
     * 
     * - If the object does not contains an `id`, it's a `create`
     * - If the object contains an `id`, it's a `replace`
     * 
     * **WARNING**: This method **MUST NOT** replace the `created_by` and `created_at` fields on `replace`.
     */
    abstract put(
        trx: AnyTrxNode,
        obj: ObjWithOptionalId<Obj>
    ): Promise<Obj>

    /**
     * Put (Create or Replace) many entities and return them
     * 
     * **WARNING**: This method **MUST NOT** replace the `created_by` and `created_at` fields on `replace`.
     */
    abstract putMany(
        trx: AnyTrxNode,
        objs: ObjWithOptionalId<Obj>[]
    ): Promise<Obj[]>

    /* Delete Operations */

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
     * sync the object and all objects of this bucket updated before it.
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
     * Returns a scope string, used to optimize queries.
     * Should be the same for adapters that can be queried together.
     */
    abstract getQueryMeta(): {
        scope: string
        avgTime: number
    }

    /* Generic Implementation */

    /**
     * Return the results of a query
     * - `pagination`: Limits the number of results.
     *  - `perPage`: If 0, returns no results (useful with config.metadata_only). If -1, returns all results.
     * - `params`: Objects to be used when filling param values. The query returns objects matching *any* of the param objects.
     * - `param_templates`: Path parameter replacements to be used when filling param_with_$ values. The query returns objects matching *any* of the param objects.
     */
    async query<
        MetadataOnly extends boolean
    >(
        trx: AnyTrxNode,
        query: NQL_AnyQuery,
        pagination?: NQL_Pagination,
        params?: Record<string, any>[],
        param_templates?: Record<string, string>[],
        config?: {
            view?: string
            metadata_only?: MetadataOnly
            serialize?: boolean
        },
        // When running a temporary local memory adapter,
        // these are required
        custom?: {
            module?: string,
            buckets?: Record<string, {
                scope: string
                nql: NQLRunner
            }>
        }
    ): Promise<NQL_Result<
        MetadataOnly extends true ? { id: Obj['id'], [x: string]: any } : Obj>
    > {
        const compiled = await this._compileQuery(trx, query, custom);
        return this._queryCompiled(trx, compiled, pagination, params, param_templates, config, custom)
    }

    async _compileQuery(
        trx: AnyTrxNode,
        query: NQL_AnyQuery,
        // When running a temporary local memory adapter,
        // these are required
        custom?: {
            module?: string,
            buckets?: Record<string, {
                scope: string
                nql: NQLRunner
            }>
        }
    ): Promise<NQL_CompiledQuery> {

        const module = TrxNode.getModule(trx);
        const moduleName = custom?.module || module.name;

        const customBuckets = {
            ...(custom?.buckets || {}),
            ...TrxNode.getCacheCustomBuckets(trx)
        }

        return NQL_Compiler.build(module.daemon!, moduleName, this.schema.name, query, customBuckets);
    }

    async _queryCompiled<
        MetadataOnly extends boolean
    >(
        trx: AnyTrxNode,
        compiled: NQL_CompiledQuery,
        pagination?: NQL_Pagination,
        params?: Record<string, any>[],
        param_templates?: Record<string, string>[],
        config?: {
            view?: string
            metadata_only?: MetadataOnly
            serialize?: boolean
        },
        custom?: {
            module?: string,
            buckets?: Record<string, {
                scope: string
                nql: NQLRunner
            }>
        },
    ): Promise<NQL_Result<
        MetadataOnly extends true ? { id: Obj['id'], [x: string]: any } : Obj>
    > {
        const module = TrxNode.getModule(trx);

        const customBuckets = {
            ...(custom?.buckets || {}),
            ...TrxNode.getCacheCustomBuckets(trx)
        }

        const view = config?.view ? this.schema.views[config.view] : undefined;
        const result = await module.nql.run(trx, compiled, pagination, params, param_templates, view, customBuckets, config?.serialize);
        if (config?.metadata_only) {
            result.data = result.data.map(obj => ({
                id: obj.id,
                [this.config.meta.updated_at]: this.getUpdateEpoch(obj as any)
            }));
        }
        
        return result as NQL_Result<any>;
    }

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