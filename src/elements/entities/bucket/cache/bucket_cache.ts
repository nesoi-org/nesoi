import { Log } from '~/engine/util/log';
import { BucketConfig } from '../bucket.config';
import { AnyTrxNode } from '~/engine/transaction/trx_node';
import { NesoiObj } from '~/engine/data/obj';
import { AnyBucketAdapter, BucketAdapter } from '../adapters/bucket_adapter';
import { MemoryBucketAdapter } from '../adapters/memory.bucket_adapter';
import { $BucketView } from '../view/bucket_view.schema';
import { NesoiDatetime } from '~/engine/data/datetime';
import { NQL_AnyQuery, NQL_Pagination } from '../query/nql.schema';

export type BucketCacheSync<T> = {
    obj: T,
    updateEpoch: number
}

export class BucketCacheEntry<
    Obj extends NesoiObj
> {
    constructor(
        public id: Obj['id'],
        public obj: Obj,
        public updateEpoch: number,
        public syncEpoch: number
    ) {}
}

export class BucketCache<
    Obj extends NesoiObj
> {

    private lastUpdateEpoch?: number;
    private lastSyncEpoch?: number;
    private lastHash?: string;

    private innerAdapter: BucketAdapter<BucketCacheEntry<Obj>>;

    constructor(
        private bucketName: string,
        private outerAdapter: AnyBucketAdapter,
        private config: NonNullable<BucketConfig<any, any, any>['cache']>
    ) {
        this.innerAdapter = this.config?.adapter || new MemoryBucketAdapter<any, any>({} as any, {});
    }

    public async get(trx: AnyTrxNode, id: NesoiObj['id']) {
        const mode = this.config?.mode?.get;

        if (mode === 'one') {
            const { action, sync } = await this.syncOne(trx, id);
            Log.debug('bucket', this.bucketName, `CACHE get.one, ${ action }`);
            return sync?.obj;
        }
        if (mode === 'past') {
            const { action, sync } = await this.syncOneAndPast(trx, id);
            Log.debug('bucket', this.bucketName, `CACHE get.past, ${ action }`);
            return sync?.obj;
        }
        if (mode === 'all') {
            const { action, sync } = await this.syncAll(trx);
            Log.debug('bucket', this.bucketName, `CACHE get.sync, ${ action }`);
            return sync.find(s => s.obj.id === id)?.obj;
        }

        return this.outerAdapter.get(trx, id);
    }
    
    public async index(trx: AnyTrxNode) {
        const mode = this.config?.mode?.index;

        if (mode === 'all') {
            const { action, sync } = await this.syncAll(trx);
            Log.debug('bucket', this.bucketName, `CACHE index.sync, ${ action }`);
            return sync.map(s => s.obj);
        }

        return this.outerAdapter.index(trx);
    }
    
    public async query(trx: AnyTrxNode, view: $BucketView, query: NQL_AnyQuery, pagination?: NQL_Pagination) {
        const mode = this.config?.mode?.query;

        if (mode === 'incremental') {
            const { action, sync } = await this.syncQuery(trx, view, query, pagination);
            Log.debug('bucket', this.bucketName, `CACHE query.incremental, ${ action }`);
            return sync.map(s => s.obj);
        }
        if (mode === 'all') {
            const { action, sync } = await this.syncAll(trx);
            Log.debug('bucket', this.bucketName, `CACHE query.sync, ${ action }`);
            return this.innerAdapter.query(trx, query);
        }
        
        return this.outerAdapter.query(trx, query);
    }

    /* Cache modes */
    
    private async syncOne(trx: AnyTrxNode, id: Obj['id']): Promise<{
        action: 'delete' | 'update' | 'keep',
        sync?: BucketCacheSync<Obj>
    }> {
        const localObj = await this.innerAdapter.get(trx, id);
        if (!localObj) {
            const obj = await this.outerAdapter.get(trx, id);
            if (obj) {
                const entry = new BucketCacheEntry(
                    obj.id,
                    obj,
                    this.outerAdapter.getUpdateEpoch(obj),
                    this.lastSyncEpoch!
                );
                await this.innerAdapter.create(trx, entry);
                return { action: 'update', sync: entry};
            }
            return { action: 'keep' };
        }

        const sync = await this.outerAdapter.syncOne(trx, id, localObj.updateEpoch);

        if (sync === null) {
            return { action: 'keep', sync: localObj };
        }
        if (sync === 'deleted') {
            await this.innerAdapter.delete(trx, id);
            return { action: 'delete' };
        }

        localObj.obj = sync.obj;
        localObj.updateEpoch = sync.updateEpoch;
        localObj.syncEpoch = NesoiDatetime.now().epoch;

        await this.innerAdapter.put(trx, localObj);
        return { action: 'update', sync };
    }
    
    private async syncOneAndPast(trx: AnyTrxNode, id: Obj['id']): Promise<{
        action: 'delete' | 'update' | 'keep',
        sync?: BucketCacheSync<Obj>
    }> {
        const localObj = await this.innerAdapter.get(trx, id);
        if (!localObj) {
            const obj = await this.outerAdapter.get(trx, id);
            if (obj) {
                await this.innerAdapter.create(trx, obj);
                return { action: 'update', sync: {
                    obj,
                    updateEpoch: this.outerAdapter.getUpdateEpoch(obj)
                }};
            }
            return { action: 'keep' };
        }

        const sync = await this.outerAdapter.syncOneAndPast(trx, id, localObj.updateEpoch);

        if (sync === null) {
            return { action: 'keep', sync: localObj };
        }
        if (sync === 'deleted') {
            await this.innerAdapter.delete(trx, id);
            return { action: 'delete' };
        }

        await this.innerAdapter.putMany(trx, sync.map(s => s.obj));
        return { action: 'update', sync: sync.find(s => s.obj.id === id) };
    }
    
    private async syncAll(trx: AnyTrxNode): Promise<{
        action: 'reset' | 'update' | 'keep',
        sync: BucketCacheSync<Obj>[]
    }> {
        const sync = await this.outerAdapter.syncAll(trx, this.lastHash, this.lastUpdateEpoch);
        if (sync === null) {
            const all = await this.innerAdapter.index(trx);
            return { action: 'keep', sync: all };
        }
        
        this.lastUpdateEpoch = sync.updateEpoch;
        this.lastHash = sync.hash;
        this.lastSyncEpoch = NesoiDatetime.now().epoch;

        const entries = sync.sync.map(s => new BucketCacheEntry(
            s.obj.id,
            s.obj,
            s.updateEpoch,
            this.lastSyncEpoch!
        ));

        if (sync.reset) {
            await (this.innerAdapter as any).deleteEverything(trx);
            await this.innerAdapter.putMany(trx, entries);
            return { action: 'reset', sync: sync.sync };
        }
        
        await this.innerAdapter.putMany(trx, entries);
        return { action: 'update', sync: sync.sync };
    }
    
    private async syncQuery(trx: AnyTrxNode, view: $BucketView, query: NQL_AnyQuery, pagination?: NQL_Pagination): Promise<{
        action: 'update' | 'keep',
        sync: BucketCacheSync<Obj>[]
    }> {
        // 1. Query id and epoch from outer adapter
        const outerMetadata = await this.outerAdapter.query(trx, query, pagination, {
            metadataOnly: true
        });
        if (!outerMetadata.length) {
            return { action: 'keep', sync: [] };
        }

        // 2. Read ids from the inner adapter
        const innerData = await this.innerAdapter.query(trx, {
            'id in': outerMetadata.map(obj => obj.id)
        });

        // 3. Filter modified query results
        const outerEpoch = {} as Record<any, number>;
        for (const i in outerMetadata) {
            const obj = outerMetadata[i];
            outerEpoch[obj.id] = this.outerAdapter.getUpdateEpoch(obj);
        }

        const queryResults = {} as Record<any, BucketCacheSync<Obj>>;
        const modifiedIds = [];
        for (const i in innerData) {
            const obj = innerData[i];
            const epoch = outerEpoch[obj.id];
            if (!epoch || epoch > obj.updateEpoch) {
                modifiedIds.push(obj.id);
            }
            else {
                queryResults[obj.id] = obj as BucketCacheSync<Obj>;
            }
        }

        // 4. Nothing changed, return current data
        if (!modifiedIds.length) {
            return { action: 'keep', sync: innerData as BucketCacheSync<Obj>[] };
        }

        // 5. Query modified objects to outer adapter and merge them on results
        const outerData = await this.outerAdapter.query(trx, {
            'id in': modifiedIds
        });

        for (const i in outerData) {
            const obj = outerData[i];
            const updateEpoch = this.outerAdapter.getUpdateEpoch(obj);
            queryResults[obj.id] = {
                obj,
                updateEpoch
            };
        }

        return { action: 'update', sync: Object.values(queryResults) };
    }

}

export type AnyBucketCache = BucketCache<any>
