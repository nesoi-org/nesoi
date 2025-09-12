import { Log } from '~/engine/util/log';
import { BucketConfig } from '../bucket.config';
import { AnyTrxNode } from '~/engine/transaction/trx_node';
import { NesoiObj } from '~/engine/data/obj';
import { AnyBucketAdapter, BucketAdapter } from '../adapters/bucket_adapter';
import { MemoryBucketAdapter } from '../adapters/memory.bucket_adapter';
import { NesoiDatetime } from '~/engine/data/datetime';
import { NQL_AnyQuery, NQL_Pagination } from '../query/nql.schema';
import { NQL_Result } from '../query/nql_engine';
import { AnyBucket } from '../bucket';
import { $Bucket } from '../bucket.schema';
import { $BucketModel, $BucketModelField } from '../model/bucket_model.schema';
import { $BucketGraph } from '../graph/bucket_graph.schema';

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

    private innerAdapter: BucketAdapter<BucketCacheEntry<Obj>>;
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

    public async get(trx: AnyTrxNode, id: NesoiObj['id']) {
        const mode = this.config?.mode?.get;

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

        if (mode === 'all') {
            const { action, sync } = await this.syncAll(trx);
            Log.debug('bucket', this.bucket.schema.name, `CACHE index.all, ${ action }`);
            const data = [];
            for (const e of sync) {
                const { __update_epoch, __sync_epoch, ...obj } = e;
                data.push(obj);
            }
            return data;
        }

        return this.outerAdapter.index(trx);
    }
    
    public async query<
        MetadataOnly extends boolean
    >(
        trx: AnyTrxNode,
        query: NQL_AnyQuery,
        pagination?: NQL_Pagination,
        params?: Record<string, any>[],
        config?: {
            view?: string
            metadataOnly?: MetadataOnly
        },
    ): Promise<NQL_Result<
        MetadataOnly extends true ? { id: Obj['id'], [x: string]: any } : Obj>
    > {
        const mode = this.config?.mode?.query;
        let data;

        if (mode === 'incremental') {
            const { action, sync } = await this.syncQuery(trx, query, pagination, params);
            Log.debug('bucket', this.bucket.schema.name, `CACHE query.incremental, ${ action }`);
            data = sync;
        }
        else if (mode === 'all') {
            const { action, sync } = await this.syncAll(trx);
            Log.debug('bucket', this.bucket.schema.name, `CACHE query.all, ${ action }`);
            const meta = this.innerAdapter.getQueryMeta();
            const entries = (await this.innerAdapter.query(trx, query, pagination, params, undefined, {
                [meta.scope]: this.innerAdapter.nql
            })).data as BucketCacheEntry<any>[];
            data = [];
            for (const e of entries) {
                const { __update_epoch, __sync_epoch, ...obj } = e;
                data.push(obj);
            }
        }
        else {
            data = (await this.outerAdapter.query(trx, query, pagination, params)).data as any[];
        }

        for (const entry of data) {
            delete entry['__update_epoch'];
            delete entry['__sync_epoch'];
        }

        if (config?.view) {
            data = await this.bucket.buildMany(trx, data, config.view);
        }
        
        return { data }
    }

    /* Cache modes */
    
    private async syncOne(trx: AnyTrxNode, id: Obj['id']): Promise<{
        action: 'delete' | 'update' | 'none',
        sync?: BucketCacheEntry<Obj>
    }> {
        let localObj = await this.innerAdapter.get(trx, id);
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
    
    private async syncOneAndPast(trx: AnyTrxNode, id: Obj['id']): Promise<{
        action: 'delete' | 'update' | 'none',
        sync?: BucketCacheEntry<Obj>
    }> {
        const localObj = await this.innerAdapter.get(trx, id);
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
    
    private async syncAll(trx: AnyTrxNode): Promise<{
        action: 'reset' | 'update' | 'none',
        sync: BucketCacheEntry<Obj>[]
    }> {
        const sync = await this.outerAdapter.syncAll(trx, this.lastHash, this.lastUpdateEpoch);
        if (sync === null) {
            const all = await this.innerAdapter.index(trx);
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
    
    private async syncQuery(trx: AnyTrxNode, query: NQL_AnyQuery, pagination?: NQL_Pagination, params?: Record<string, any>[]): Promise<{
        action: 'update' | 'none',
        sync: BucketCacheEntry<Obj>[]
    }> {
        // 1. Query id and epoch from outer adapter
        const outerMetadata = await this.outerAdapter.query(trx, query, pagination, params, {
            metadataOnly: true
        }) as NQL_Result<any>;
        if (!outerMetadata.data.length) {
            return { action: 'none', sync: [] };
        }

        // 2. Read ids from the inner adapter
        const meta = this.innerAdapter.getQueryMeta();
        const innerData = await this.innerAdapter.query(trx, {
            'id in': outerMetadata.data.map(obj => obj.id)
        }, undefined, undefined, undefined, {
            [meta.scope]: this.innerAdapter.nql
        }) as NQL_Result<any>;

        // 3. Filter modified query results
        const outerEpoch = {} as Record<any, number>;
        for (const i in outerMetadata.data) {
            const obj = outerMetadata.data[i];
            outerEpoch[obj.id] = this.outerAdapter.getUpdateEpoch(obj);
        }

        const queryResults = {} as Record<any, BucketCacheSync<Obj>>;
        const modifiedIds = [];
        for (const i in innerData.data) {
            const entry = innerData.data[i];
            const epoch = outerEpoch[entry.id];
            if (!epoch || epoch > entry.__update_epoch) {
                modifiedIds.push(entry.id);
            }
            else {
                queryResults[entry.id] = entry as BucketCacheSync<Obj>;
            }
        }

        // 4. Nothing changed, return current data
        if (!modifiedIds.length) {
            return { action: 'none', sync: innerData.data };
        }

        // 5. Query modified objects to outer adapter and merge them on results
        const outerData = await this.outerAdapter.query(trx, {
            'id in': modifiedIds
        }) as NQL_Result<any>;

        for (const i in outerData.data) {
            const obj = outerData.data[i];
            const updateEpoch = this.outerAdapter.getUpdateEpoch(obj);
            queryResults[obj.id] = {
                obj,
                updateEpoch
            };
        }

        return { action: 'update', sync: Object.values(queryResults).map(r => new BucketCacheEntry(
            r.obj,
            r.updateEpoch,
            NesoiDatetime.now().epoch
        )) };
    }

}

export type AnyBucketCache = BucketCache<any>
