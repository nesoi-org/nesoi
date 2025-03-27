import { AnyTrxNode } from '~/engine/transaction/trx_node';
import { NesoiObj , NewOrOldObj } from '~/engine/data/obj';
import { NesoiError } from '~/engine/data/error';
import { $Module, ViewName, ViewObj } from '~/schema';
import { $Bucket } from './bucket.schema';
import { BucketView } from './view/bucket_view';
import { MemoryBucketAdapter } from './adapters/memory.bucket_adapter';
import { AnyBucketAdapter, BucketAdapter } from './adapters/bucket_adapter';
import { BucketConfig } from './bucket.config';
import { AnyBucketCache, BucketCache } from './cache/bucket_cache';
import { Log } from '~/engine/util/log';
import { BucketGraph } from './graph/bucket_graph';
import { NQL_AnyQuery, NQL_Order, NQL_Pagination } from './query/nql.schema';

export class Bucket<M extends $Module, $ extends $Bucket> {

    private adapter: BucketAdapter<$['#data']>;
    private cache?: AnyBucketCache;

    public graph: BucketGraph<M, $>;
    private views;

    constructor(
        public schema: $,
        private config?: BucketConfig<$, any>,
        public providers: Record<string, any> = {}
    ) {
        // Config
        this.adapter = this.config?.adapter?.(schema, providers) || new MemoryBucketAdapter(schema, {} as any);

        // Graph
        this.graph = new BucketGraph(this);

        // Views
        const views = {} as any;
        for (const v in schema.views) {
            views[v] = new BucketView(this, schema.views[v]);
        }
        this.views = views as {
            [V in keyof $['views']]: BucketView<$['views'][V]>
        };

        // Cache
        if (this.config?.cache) {
            this.cache = new BucketCache(this.schema.name, this.adapter, this.config.cache);            
        }
    }

    // Get
    
    public async readOne<
        Obj = $['#data']
    >(
        trx: AnyTrxNode,
        id: (Obj & NesoiObj)['id']
    ): Promise<Obj | undefined> {
        if (typeof id !== 'string' && typeof id !== 'number') {
            throw NesoiError.Bucket.InvalidId({ bucket: this.schema.alias, id });
        }
        Log.debug('bucket', this.schema.name, `Get id=${id}`);
        const raw = this.cache
            ? await this.cache.get(trx, id)
            : await this.adapter.get(trx, id);
        if (!raw) return undefined;
        return raw;
    }
    
    public async readAll<
        Obj = $['#data']
    >(
        trx: AnyTrxNode,
        pagination?: NQL_Pagination,
        order?: NQL_Order<$['#fieldpath']>
    ): Promise<Obj[]> {
        Log.debug('bucket', this.schema.name, 'Index');
        const raws = this.cache
            ? await this.cache.index(trx)
            : await this.adapter.index(trx);
        return raws;
    }

    public async viewOne<
        V extends ViewName<$>,
        Obj extends ViewObj<$, V>
    >(
        trx: AnyTrxNode,
        id: (Obj & NesoiObj)['id'],
        view: V
    ): Promise<Obj | undefined> {
        if (typeof id !== 'string' && typeof id !== 'number') {
            throw NesoiError.Bucket.InvalidId({ bucket: this.schema.alias, id });
        }
        Log.debug('bucket', this.schema.name, `View id=${id}, v=${view as string}`);
        const obj = await this.readOne(trx, id);
        if (!obj) {
            return;
        }
        return this.buildOne(trx, obj as $['#data'], view);
    }
    
    public async viewAll<
        V extends ViewName<$>,
        Obj extends ViewObj<$, V>
    >(
        trx: AnyTrxNode,
        view: V,
        pagination?: NQL_Pagination,
        order?: NQL_Order<$['#fieldpath']>
    ): Promise<Obj[]> {
        Log.debug('bucket', this.schema.name, `View all, v=${view as string}`);
        const objs = await this.readAll(trx);
        return this.buildAll(trx, objs as $['#data'][], view);
    }
    
    public async buildOne<
        V extends ViewName<$>,
        Obj extends ViewObj<$, V>
    >(
        trx: AnyTrxNode,
        obj: $['#data'],
        view: V
    ): Promise<Obj> {
        if (!(view in this.views)) {
            throw NesoiError.Bucket.ViewNotFound({ bucket: this.schema.alias, view: view as string });
        }
        return this.views[view].parse(trx, obj) as any;
    }

    public async buildAll<
        V extends ViewName<$>,
        Obj extends ViewObj<$, V>
    >(
        trx: AnyTrxNode,
        objs: $['#data'][],
        view: V
    ): Promise<Obj[]> {
        return Promise.all(
            objs.map(obj => this.buildOne(trx, obj, view))
        ) as Promise<Obj[]>;
    }

    // Put

    public async put<
        Obj = $['#data']
    >(
        trx: AnyTrxNode,
        obj: NewOrOldObj<Obj & NesoiObj>
    ): Promise<Obj> {
        Log.debug('bucket', this.schema.name, `Put id=${obj['id'] || 'new'}`, obj as any);
        const raw = await this.adapter.put(trx, obj as any);
        return raw as Obj;
    }

    // Delete

    public async delete(
        trx: AnyTrxNode,
        id: $['#data']['id']
    ): Promise<void> {
        if (typeof id !== 'string' && typeof id !== 'number') {
            throw NesoiError.Bucket.InvalidId({ bucket: this.schema.alias, id });
        }
        Log.debug('bucket', this.schema.name, `Delete id=${id}`);
        await this.adapter.delete(trx, id);
    }

    public async deleteMany(
        trx: AnyTrxNode,
        ids: $['#data']['id'][]
    ): Promise<void> {
        Log.debug('bucket', this.schema.name, `Delete Many ids=${ids}`);
        await this.adapter.deleteMany(trx, ids);
    }

    // Query

    public async query<
        V extends ViewName<$>,
        Obj extends ViewObj<$, V>
    >(
        trx: AnyTrxNode,
        query: NQL_AnyQuery,
        pagination?: NQL_Pagination,
        view?: V
    ): Promise<Obj[]> {
        Log.trace('bucket', this.schema.name, 'Query', query);

        const v = (view ? this.views[view] : null) || this.views['default'];
        if (!v) {
            throw NesoiError.Bucket.Query.ViewNotFound(this.schema.name, (view as string) || 'default');
        }

        const raws = this.cache
            ? await this.cache.query(trx, v.schema, query, pagination)
            : await this.adapter.query(trx, query, pagination);
        if (!raws.length) return [];
        
        if (view) {
            return this.buildAll(trx, raws, view) as any;
        }
        else {
            return raws;
        }
    }

    public static getQueryMeta(bucket: AnyBucket) {
        return {
            ...bucket.adapter.getQueryMeta(),
            bucket: bucket.schema
        }
    }

    public static getQueryRunner(bucket: AnyBucket) {
        return (bucket.adapter as any).nql as AnyBucketAdapter['nql'];
    }

    public static getAdapter(bucket: AnyBucket) {
        return bucket.adapter;
    }

}

export type AnyBucket = Bucket<$Module, $Bucket>