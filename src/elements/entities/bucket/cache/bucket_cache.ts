import type { BucketConfig } from '../bucket.config';
import type { AnyBucketAdapter, BucketAdapter } from '../adapters/bucket_adapter';
import type { AnyBucket } from '../bucket';

import { Log } from '~/engine/util/log';
import { MemoryBucketAdapter } from '../adapters/memory.bucket_adapter';
import { NesoiDatetime } from '~/engine/data/datetime';
import { $Bucket } from '../bucket.schema';
import { $BucketModel, $BucketModelField } from '../model/bucket_model.schema';
import { $BucketGraph } from '../graph/bucket_graph.schema';
import type { AnyTrxNode } from '~/engine/transaction/trx_node';

export type BucketCacheSync<T> = {
    obj: T,
    updateEpoch: number
}

/**
 * @category Elements
 * @subcategory Entity
 * */
export class BucketCacheEntry<
    Obj extends NesoiObj
> {
    public id!: Obj['id']

    constructor(
        obj: Obj,
        public __update_epoch: number,
        public __sync_epoch: number
    ) {
        Object.assign(this, obj);
    }
}

/**
 * @category Elements
 * @subcategory Entity
 * */
export class BucketCache<
    Obj extends NesoiObj
> {

    private lastUpdateEpoch?: number;
    private lastSyncEpoch?: number;
    private lastHash?: string;

    private innerAdapter: BucketAdapter<any>;
    private outerAdapter: AnyBucketAdapter
    
    constructor(
        private bucket: AnyBucket,
        private config: NonNullable<BucketConfig<any, any, any>['cache']>
    ) {
        const innerSchema = new $Bucket(
            bucket.schema.module,
            bucket.schema.name,
            '[cache] ' + bucket.schema.alias,
            new $BucketModel({
                ...bucket.schema.model.fields,
                __update_epoch: new $BucketModelField('__update_epoch', '__update_epoch', 'int', '__update_epoch', true),
                __sync_epoch: new $BucketModelField('__sync_epoch', '__sync_epoch', 'int', '__sync_epoch', true),
            }),
            new $BucketGraph(),
            {}
        )

        this.innerAdapter = this.config?.adapter || new MemoryBucketAdapter<any, any>(innerSchema, {});
        this.outerAdapter = bucket.adapter;
    }

    public async get(trx: AnyTrxNode, id: Id) {
        const mode = this.config?.mode?.get;

        if (mode === 'eager') {
            Log.debug('bucket', this.bucket.schema.name, `CACHE get.eager, ${ id }`);
            const sync = await this.innerAdapter.get(trx, id) as BucketCacheEntry<Obj>;
            if (!sync) return undefined;
            const { __update_epoch, __sync_epoch, ...obj } = sync;
            return obj;
        }
        if (mode === 'one') {
            const { action, sync } = await this.syncOne(trx, id);
            Log.debug('bucket', this.bucket.schema.name, `CACHE get.one, ${ action }`);
            if (!sync) return undefined;
            const { __update_epoch, __sync_epoch, ...obj } = sync;
            return obj;
        }
        if (mode === 'past') {
            const { action, sync } = await this.syncOneAndPast(trx, id);
            Log.debug('bucket', this.bucket.schema.name, `CACHE get.past, ${ action }`);
            if (!sync) return undefined;
            const { __update_epoch, __sync_epoch, ...obj } = sync;
            return obj;
        }
        if (mode === 'all') {
            const { action, sync } = await this.syncAll(trx);
            Log.debug('bucket', this.bucket.schema.name, `CACHE get.all, ${ action }`);
            const one = sync.find(s => s.id === id);
            if (!one) return undefined;
            const { __update_epoch, __sync_epoch, ...obj } = one;
            return one;
        }

        return this.outerAdapter.get(trx, id);
    }
    
    public async index(trx: AnyTrxNode) {
        const mode = this.config?.mode?.index;
        let data;

        if (mode === 'eager') {
            Log.debug('bucket', this.bucket.schema.name, 'CACHE index.eager');
            data = await this.innerAdapter.index(trx) as BucketCacheEntry<Obj>[];
        }
        else if (mode === 'all') {
            const { action, sync } = await this.syncAll(trx);
            Log.debug('bucket', this.bucket.schema.name, `CACHE index.all, ${ action }`);
            data = sync;
        }
        else {
            throw new Error(`Invalid index cache mode '${mode}'`);
        }

        const out = [];
        for (const e of data) {
            const { __update_epoch, __sync_epoch, ...obj } = e;
            out.push(obj);
        }
        return out;
    }
    
    // public async _queryCompiled<
    //     MetadataOnly extends boolean
    // >(
    //     trx: AnyTrxNode,
    //     query: NQL_CompiledQuery,
    //     pagination?: NQL_Pagination,
    //     params?: Record<string, any>[],
    //     param_templates?: Record<string, string>[],
    //     config?: {
    //         view?: string
    //         metadata_only?: MetadataOnly
    //         serialize?: boolean
    //     },
    // ): Promise<NQL_Result<
    //     MetadataOnly extends true ? { id: Obj['id'], [x: string]: any } : Obj>
    // > {
    //     const tag = new Tag(this.bucket.schema.module, 'bucket', this.bucket.schema.name);
    //     const mode = this.config?.mode?.query;
    //     let data: any[];

    //     if (mode === 'eager') {
    //         Log.debug('bucket', this.bucket.schema.name, 'CACHE index.eager');
    //         const result = await this.innerAdapter._queryCompiled(trx, query, pagination, params, param_templates, config, {
    //             module: this.bucket.schema.module
    //         });
    //         data = result.data;
    //     }
    //     else if (mode === 'incremental') {
    //         const { action, sync } = await this.syncQuery(trx, query as any /* TODO */, pagination, params);
    //         Log.debug('bucket', this.bucket.schema.name, `CACHE query.incremental, ${ action }`);
    //         data = sync;
    //     }
    //     else if (mode === 'all') {
    //         const { action, sync } = await this.syncAll(trx);
    //         Log.debug('bucket', this.bucket.schema.name, `CACHE query.all, ${ action }`);
    //         const entries = (await this.innerAdapter._queryCompiled(trx, query, pagination, params, undefined, {
    //             serialize: config?.serialize
    //         }, {
    //             module: this.bucket.schema.module
    //         })).data as BucketCacheEntry<any>[];
    //         data = [];
    //         for (const e of entries) {
    //             const { __update_epoch, __sync_epoch, ...obj } = e;
    //             data.push(obj);
    //         }
    //     }
    //     // Invalid mode, bypass cache
    //     else {
    //         const result = await this.outerAdapter.query(trx, query as any /* TODO */, pagination, params, param_templates, config, {
    //             module: this.bucket.schema.module
    //         });
    //         data = result.data;
    //     }

    //     for (const entry of data) {
    //         delete entry['__update_epoch'];
    //         delete entry['__sync_epoch'];
    //     }

    //     if (config?.view) {
    //         data = await this.bucket.buildMany(trx, data, config.view);
    //     }
        
    //     return { data }
    // }

    /* Cache modes */
    
    /**
     * Update inner adapter with data from outer adapter.
     */
    public async sync(trx: AnyTrxNode): Promise<void> {
        Log.info('bucket', this.bucket.schema.name, `CACHE sync, trx: ${ trx.globalId }`);
        
        const objects = await this.outerAdapter.index(trx);
        const entries = objects.map(obj => new BucketCacheEntry(
            obj,
            this.outerAdapter.getUpdateEpoch(obj),
            this.lastSyncEpoch!
        ));

        await (this.innerAdapter as any).deleteEverything(trx);
        await this.innerAdapter.putMany(trx, entries);
    }
    
    /**
     * If doesnt exist on inner adapter, read.
     * If it exists, check if it's updated (query metadata).
     * 
     * [get.one]
     * - reduces transit payload for data that doesn't change much
     */
    private async syncOne(trx: AnyTrxNode, id: Obj['id']): Promise<{
        action: 'delete' | 'update' | 'none',
        sync?: BucketCacheEntry<Obj>
    }> {
        Log.debug('bucket', this.bucket.schema.name, `CACHE sync one: ${id}, trx: ${ trx.globalId }`);
        let localObj = await this.innerAdapter.get(trx, id) as BucketCacheEntry<Obj>;
        if (!localObj) {
            const obj = await this.outerAdapter.get(trx, id);
            if (obj) {
                const entry = new BucketCacheEntry(
                    obj,
                    this.outerAdapter.getUpdateEpoch(obj),
                    this.lastSyncEpoch!
                );
                await this.innerAdapter.create(trx, entry);
                return { action: 'update', sync: entry };
            }
            return { action: 'none' };
        }

        const sync = await this.outerAdapter.syncOne(trx, id, localObj.__update_epoch);

        if (sync === null) {
            return { action: 'none', sync: localObj };
        }
        if (sync === 'deleted') {
            await this.innerAdapter.delete(trx, id);
            return { action: 'delete' };
        }

        localObj = new BucketCacheEntry(
            sync.obj,
            sync.updateEpoch,
            NesoiDatetime.now().epoch
        );

        await this.innerAdapter.put(trx, localObj as BucketCacheEntry<any>);
        return { action: 'update', sync: localObj };
    }
    
    /**
     * If doesnt exist on inner adapter, read.
     * If it exists, read past.
     * 
     * [get.past]
     * - reduces transit payload for data that changes a little
     */
    private async syncOneAndPast(trx: AnyTrxNode, id: Obj['id']): Promise<{
        action: 'delete' | 'update' | 'none',
        sync?: BucketCacheEntry<Obj>
    }> {
        const localObj = await this.innerAdapter.get(trx, id)as BucketCacheEntry<Obj>;
        if (!localObj) {
            const obj = await this.outerAdapter.get(trx, id);
            if (obj) {
                await this.innerAdapter.create(trx, obj);
                return { action: 'update', sync: new BucketCacheEntry(
                    obj,
                    this.outerAdapter.getUpdateEpoch(obj),
                    NesoiDatetime.now().epoch
                )};
            }
            return { action: 'none' };
        }

        const sync = await this.outerAdapter.syncOneAndPast(trx, id, localObj.__update_epoch);

        if (sync === null) {
            return { action: 'none', sync: localObj };
        }
        if (sync === 'deleted') {
            await this.innerAdapter.delete(trx, id);
            return { action: 'delete' };
        }

        const entries = sync.map(s => new BucketCacheEntry(
            s.obj,
            s.updateEpoch,
            NesoiDatetime.now().epoch
        ));

        await this.innerAdapter.putMany(trx, entries);
        return { action: 'update', sync: entries.find(e => e.id === id) };
    }
    
    /**
     * Compare ids hash with outer. If it matches, read updated data.
     * If not, hard resync.
     * 
     * [get.all, index.all, query.all]
     * - reduces transit payload for data that's not often deleted
     */
    private async syncAll(trx: AnyTrxNode): Promise<{
        action: 'reset' | 'update' | 'none',
        sync: BucketCacheEntry<Obj>[]
    }> {
        const sync = await this.outerAdapter.syncAll(trx, this.lastHash, this.lastUpdateEpoch);
        if (sync === null) {
            const all = await this.innerAdapter.index(trx) as BucketCacheEntry<Obj>[];
            return { action: 'none', sync: all };
        }
        
        this.lastUpdateEpoch = sync.updateEpoch;
        this.lastHash = sync.hash;
        this.lastSyncEpoch = NesoiDatetime.now().epoch;

        const entries = sync.sync.map(s => new BucketCacheEntry(
            s.obj,
            s.updateEpoch,
            this.lastSyncEpoch!
        ));

        if (sync.reset) {
            await (this.innerAdapter as any).deleteEverything(trx);
            await this.innerAdapter.putMany(trx, entries);
            return { action: 'reset', sync: entries };
        }
        
        await this.innerAdapter.putMany(trx, entries);
        return { action: 'update', sync: entries };
    }
    
    /**
     * Query metadata from outer, then query data from outer - only newer than inner data.
     * 
     * [query.incremental]
     * - reduces transit payload for data that doesn't change much
     */
    // private async syncQuery(trx: AnyTrxNode, query: NQL_AnyQuery, pagination?: NQL_Pagination, params?: Record<string, any>[]): Promise<{
    //     action: 'update' | 'none',
    //     sync: BucketCacheEntry<Obj>[]
    // }> {
    //     // 1. Query id and epoch from outer adapter
    //     const outerMetadata = await this.outerAdapter.query(trx, query, pagination, params, undefined, {
    //         metadata_only: true
    //     }) as NQL_Result<any>;
    //     if (!outerMetadata.data.length) {
    //         return { action: 'none', sync: [] };
    //     }

    //     // 2. Read ids from the inner adapter
    //     const tag = new Tag(this.bucket.schema.module, 'bucket', this.bucket.schema.name);
    //     const innerData = await this.innerAdapter.query(trx, {
    //         'id in': outerMetadata.data.map(obj => obj.id)
    //     }, undefined, undefined, undefined, undefined, {
    //         module: this.bucket.schema.module
    //     }) as NQL_Result<any>;

    //     // 3. Filter modified query results
    //     const outerEpoch = {} as Record<any, number>;
    //     for (const i in outerMetadata.data) {
    //         const obj = outerMetadata.data[i];
    //         outerEpoch[obj.id] = this.outerAdapter.getUpdateEpoch(obj);
    //     }

    //     const queryResults = {} as Record<any, BucketCacheSync<Obj>>;
    //     const modifiedIds = [];
    //     for (const i in innerData.data) {
    //         const entry = innerData.data[i];
    //         const epoch = outerEpoch[entry.id];
    //         if (!epoch || epoch > entry.__update_epoch) {
    //             modifiedIds.push(entry.id);
    //         }
    //         else {
    //             queryResults[entry.id] = entry as BucketCacheSync<Obj>;
    //         }
    //     }

    //     // 4. Nothing changed, return current data
    //     if (!modifiedIds.length) {
    //         return { action: 'none', sync: innerData.data };
    //     }

    //     // 5. Query modified objects to outer adapter and merge them on results
    //     const outerData = await this.outerAdapter.query(trx, {
    //         'id in': modifiedIds
    //     }) as NQL_Result<any>;

    //     for (const i in outerData.data) {
    //         const obj = outerData.data[i];
    //         const updateEpoch = this.outerAdapter.getUpdateEpoch(obj);
    //         queryResults[obj.id] = {
    //             obj,
    //             updateEpoch
    //         };
    //     }

    //     return { action: 'update', sync: Object.values(queryResults).map(r => new BucketCacheEntry(
    //         r.obj,
    //         r.updateEpoch,
    //         NesoiDatetime.now().epoch
    //     )) };
    // }

}

export type AnyBucketCache = BucketCache<any>
