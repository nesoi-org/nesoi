import { AnyTrxNode, TrxNode } from '~/engine/transaction/trx_node';
import { NesoiObj  } from '~/engine/data/obj';
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
import { NQL_AnyQuery, NQL_Pagination } from './query/nql.schema';
import { CreateObj, PatchObj, PutObj } from './bucket.types';
import { NesoiDatetime } from '~/engine/data/datetime';
import { NQL_Result } from './query/nql_engine';

export class Bucket<M extends $Module, $ extends $Bucket> {

    public adapter: BucketAdapter<$['#data']>;
    private cache?: AnyBucketCache;

    public graph: BucketGraph<M, $>;
    private views;

    constructor(
        public schema: $,
        private config?: BucketConfig<any, any, any>,
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

    /*
        Metadata
     */

    protected addMeta(
        trx: AnyTrxNode,
        obj: Record<string, any>,
        operation: 'create'|'update'
    ) {
        const match = TrxNode.getFirstUserMatch(trx, this.config?.tenancy)

        if (operation === 'create') {
            obj[this.adapter.config.meta.created_at] = NesoiDatetime.now();
            if (match) {
                obj[this.adapter.config.meta.created_by] = match.user.id;
            }
        }
        
        obj[this.adapter.config.meta.updated_at] = NesoiDatetime.now();
        if (match) {
            obj[this.adapter.config.meta.updated_by] = match.user.id;
        }
    }

    // Tenancy

    protected getTenancyQuery(
        trx: AnyTrxNode
    ) {
        if (!this.config?.tenancy) return;
        const match = TrxNode.getFirstUserMatch(trx, this.config?.tenancy)
        return this.config.tenancy[match!.provider]!(match!.user);
    }

    // Get
    
    public async readOne<
        Obj = $['#data']
    >(
        trx: AnyTrxNode,
        id: (Obj & NesoiObj)['id'],
        options?: { no_tenancy: boolean }
    ): Promise<Obj | undefined> {
        if (typeof id !== 'string' && typeof id !== 'number') {
            throw NesoiError.Bucket.InvalidId({ bucket: this.schema.alias, id });
        }
        Log.debug('bucket', this.schema.name, `Get id=${id}`);
        
        const tenancy = (options?.no_tenancy)
            ? undefined
            : this.getTenancyQuery(trx);

        let raw;
        if (tenancy) {
            // TODO: cache
            const result = await this.adapter.query(trx, {
                id,
                '#and': tenancy
            }, { perPage: 1 });
            raw = result.data[0];
        }
        else {
            raw = this.cache
                ? await this.cache.get(trx, id)
                : await this.adapter.get(trx, id);
        }
        if (!raw) return undefined;
        return raw;
    }
    
    public async readAll<
        Obj = $['#data']
    >(
        trx: AnyTrxNode,
        options?: { no_tenancy: boolean }
    ): Promise<Obj[]> {
        Log.debug('bucket', this.schema.name, 'Index');
        
        const tenancy = (options?.no_tenancy)
            ? undefined
            : this.getTenancyQuery(trx);

        let raws;
        if (tenancy) {
            // TODO: cache
            const result = await this.adapter.query(trx, tenancy);
            raws = result.data;
        }
        else {
            raws = this.cache
                ? await this.cache.index(trx)
                : await this.adapter.index(trx);
        }

        return raws;
    }

    public async viewOne<
        V extends ViewName<$>,
        Obj extends ViewObj<$, V>
    >(
        trx: AnyTrxNode,
        id: (Obj & NesoiObj)['id'],
        view: V,
        options?: { no_tenancy: boolean }
    ): Promise<Obj | undefined> {
        if (typeof id !== 'string' && typeof id !== 'number') {
            throw NesoiError.Bucket.InvalidId({ bucket: this.schema.alias, id });
        }
        Log.debug('bucket', this.schema.name, `View id=${id}, v=${view as string}`);
        const obj = await this.readOne(trx, id, options);
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
        options?: { no_tenancy: boolean }
    ): Promise<Obj[]> {
        Log.debug('bucket', this.schema.name, `View all, v=${view as string}`);
        const objs = await this.readAll(trx, options);
        return this.buildMany(trx, objs as $['#data'][], view);
    }
    
    // Graph

    async readLink<
        LinkName extends keyof $['graph']['links'],
        Link extends $['graph']['links'][LinkName],
        LinkBucket extends Link['#bucket'],
        V extends ViewName<LinkBucket>,
        Obj extends ViewObj<LinkBucket, V>
    >(
        trx: AnyTrxNode,
        id: $['#data']['id'],
        link: LinkName,
        view: V = 'default' as any
    ): Promise<Link['#many'] extends true ? Obj[] : (Obj | undefined)> {
        Log.debug('bucket', this.schema.name, `Read Link, id=${id} l=${link as string} v=${view as string}`);
        
        const obj = await this.readOne(trx, id);
        if (!obj) {
            const schema = this.schema.graph.links[link as string];
            if (schema.many) { return [] as any }
            return undefined as any;
        }
        const linkObj = await this.graph.readLink(trx, link, obj, view as string);

        return linkObj as any;
    }

    async hasLink<
        LinkName extends keyof $['graph']['links']
    >(
        trx: AnyTrxNode,
        id: $['#data']['id'],
        link: LinkName
    ): Promise<boolean | undefined> {
        Log.debug('bucket', this.schema.name, `Has Link, id=${id} l=${link as string}`);
        
        const obj = await this.readOne(trx, id);
        if (!obj) {
            return undefined;
        }
        return this.graph.hasLink(trx, link, obj);
    }

    // Build

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

    public async buildMany<
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

    async create(
        trx: AnyTrxNode,
        obj: CreateObj<$>
    ): Promise<$['#data']> {
        Log.debug('bucket', this.schema.name, `Create id=${obj['id'] || 'new'}`, obj as any);

        delete (obj as any)['id'];
        
        const composition = (obj as any)['#composition'] || {};
        delete (obj as any)['#composition'];

        // Add meta (created_by/created_at/updated_by/updated_at)
        this.addMeta(trx, obj, 'create');

        const input = Object.assign({}, this.schema.model.defaults, obj as any);
        const _obj = await this.adapter.create(trx, input) as any;

        // Composition
        for(const link of Object.values(this.schema.graph.links)) {
            if (link.rel !== 'composition') continue;
            const linkObj = composition[link.name];
            if (!linkObj) {
                throw NesoiError.Bucket.MissingComposition({ method: 'create', bucket: this.schema.name, link: link.name })
            }
            if (link.many) {
                if (!Array.isArray(linkObj)) {
                    throw NesoiError.Bucket.CompositionValueShouldBeArray({ method: 'create', bucket: this.schema.name, link: link.name })
                }
                _obj['#composition'] ??= {};
                _obj['#composition'][link.name] ??= [];
                for (const linkObjItem of linkObj) {
                    const child = await trx.bucket(link.bucket.refName).create(linkObjItem);
                    _obj['#composition'][link.name].push(child);
                }
            }
            else {
                const child = await trx.bucket(link.bucket.refName).create(linkObj);
                _obj['#composition'] ??= {};
                _obj['#composition'][link.name] = child;
            }
        }

        return _obj;
    }

    /**
     * **WARNING** tenancy not implemented for put
     * TODO
     */
    async put(
        trx: AnyTrxNode,
        obj: PutObj<$>
    ): Promise<$['#data']> {
        Log.debug('bucket', this.schema.name, `Put id=${obj['id']}`, obj as any);

        const composition = (obj as any)['#composition'] || {};
        delete (obj as any)['#composition'];

        // Add meta (created_by/created_at/updated_by/updated_at)
        // **WARNING**: The adapter should remove created_* if the object already exists
        this.addMeta(trx, obj, 'create');

        const _obj = await this.adapter.put(trx, obj as any) as any;

        // Composition
        for(const link of Object.values(this.schema.graph.links)) {
            if (link.rel !== 'composition') continue;
            const linkObj = composition[link.name];
            if (!linkObj) {
                throw NesoiError.Bucket.MissingComposition({ method: 'replace', bucket: this.schema.name, link: link.name })
            }
            if (link.many) {
                if (!Array.isArray(linkObj)) {
                    throw NesoiError.Bucket.CompositionValueShouldBeArray({ method: 'replace', bucket: this.schema.name, link: link.name })
                }
                _obj['#composition'] ??= {};
                _obj['#composition'][link.name] ??= [];
                for (const linkObjItem of linkObj) {
                    const child = await trx.bucket(link.bucket.refName).put(linkObjItem);
                    _obj['#composition'][link.name].push(child);
                }
            }
            else {
                const child = await trx.bucket(link.bucket.refName).put(linkObj);
                _obj['#composition'] ??= {};
                _obj['#composition'][link.name] = child;
            }
        }

        return _obj;
    }

    async patch(
        trx: AnyTrxNode,
        obj: PatchObj<$>,
        options?: {
            no_tenancy: boolean
        }
    ): Promise<$['#data']> {
        Log.debug('bucket', this.schema.name, `Update id=${obj['id']}`, obj as any);
        
        const composition = (obj as any)['#composition'] || {};
        delete (obj as any)['#composition'];

        // Tenancy
        const tenancy = (options?.no_tenancy)
            ? undefined
            : this.getTenancyQuery(trx);

        // Read old object
        let oldObj;
        if (tenancy) {
            // TODO: cache
            const result = await this.adapter.query(trx, tenancy, { perPage: 1 });
            oldObj = result.data[0];
        }
        else {
            oldObj = this.cache
                ? await this.cache.get(trx, obj['id'])
                : await this.adapter.get(trx, obj['id']);
        }

        if (!oldObj) {
            throw  NesoiError.Bucket.ObjNotFound({ bucket: this.schema.alias, id: obj['id'] });
        }

        // TODO: deep merge
        const putObj = Object.assign({}, oldObj, obj)

        // Add meta (updated_by/updated_at)
        this.addMeta(trx, obj, 'update');
        
        const _obj = await this.adapter.patch(trx, putObj as any);

        // Composition
        for(const link of Object.values(this.schema.graph.links)) {
            if (link.rel !== 'composition') continue;
            const linkObj = composition[link.name];
            if (!linkObj) {
                throw  NesoiError.Bucket.MissingComposition({ method: 'patch', bucket: this.schema.name, link: link.name })
            }
            if (link.many) {
                if (!Array.isArray(linkObj)) {
                    throw  NesoiError.Bucket.CompositionValueShouldBeArray({ method: 'patch', bucket: this.schema.name, link: link.name })
                }
                for (const linkObjItem of linkObj) {
                    await trx.bucket(link.bucket.refName).patch(linkObjItem);
                }
            }
            else {
                await trx.bucket(link.bucket.refName).patch(linkObj);
            }
        }

        await TrxNode.ok(trx);
        return _obj;
    }

    // Delete

    async delete(
        trx: AnyTrxNode,
        id: $['#data']['id'],
        options?: {
            no_tenancy: boolean
        }
    ): Promise<void> {
        if (typeof id !== 'string' && typeof id !== 'number') {
            throw NesoiError.Bucket.InvalidId({ bucket: this.schema.alias, id });
        }
        Log.debug('bucket', this.schema.name, `Delete id=${id}`);
        
        // Tenancy
        const tenancy = (options?.no_tenancy)
            ? undefined
            : this.getTenancyQuery(trx);

        // If tenancy is enabled, check if the object is accessible
        // to this user before deleting
        let obj;
        if (tenancy) {
            // TODO: cache
            const result = await this.adapter.query(trx, {
                id, '#and': tenancy
            }, { perPage: 1});
            obj = result.data[0]
            if (!obj) {
                throw  NesoiError.Bucket.ObjNotFound({ bucket: this.schema.alias, id: obj['id'] });
            }
        }

        // Composition (with other key)
        // TODO: keyOwner must be inferred from query now
        for(const link of Object.values(this.schema.graph.links)) {
            if (link.rel !== 'composition') continue;
            if (link.keyOwner !== 'other') continue;
            const linked = await this.readLink(trx, id, link.name) as any;
            if (link.many) {
                for (const linkedItem of linked) {
                    await trx.bucket(link.bucket.refName).delete(linkedItem.id);
                }
            }
            else {
                await trx.bucket(link.bucket.refName).delete(linked.id);
            }
        }

        // The object itself
        await this.adapter.delete(trx, id);

        // Composition (with self key)
        for(const link of Object.values(this.schema.graph.links)) {
            if (link.rel !== 'composition') continue;
            if (link.keyOwner !== 'self') continue;
            const linked = await this.readLink(trx, id, link.name) as any;
            if (link.many) {
                await trx.bucket(link.bucket.refName).unsafe.deleteMany(linked.map((l: any) => l.id));
            }
            else {
                await trx.bucket(link.bucket.refName).delete(linked.id);
            }
        }

        await TrxNode.ok(trx);
    }

    async deleteMany(
        trx: AnyTrxNode,
        ids: $['#data']['id'][],
        options?: {
            no_tenancy: boolean
        }
    ): Promise<void> {
        Log.debug('bucket', this.schema.name, `Delete Many ids=${ids}`);
        
        // Tenancy
        const tenancy = (options?.no_tenancy)
            ? undefined
            : this.getTenancyQuery(trx);

        // If tenancy is enabled, filter ids
        if (tenancy) {
            // TODO: cache
            const result = await this.adapter.query(trx, {
                'id in': ids,
                '#and': tenancy
            });
            ids = result.data.map(obj => (obj as any).id);
        }

        // Composition (with other key)
        for(const link of Object.values(this.schema.graph.links)) {
            if (link.rel !== 'composition') continue;
            if (link.keyOwner !== 'other') continue;
            for (const id of ids) {
                const linked = await this.readLink(trx, id, link.name) as any;
                if (link.many) {
                    await trx.bucket(link.bucket.refName).unsafe.deleteMany(linked.map((l: any) => l.id));
                }
                else {
                    await trx.bucket(link.bucket.refName).unsafe.delete(linked.id);
                }
            }
        }

        await this.adapter.deleteMany(trx, ids);

        // Composition (with self key)
        for(const link of Object.values(this.schema.graph.links)) {
            if (link.rel !== 'composition') continue;
            if (link.keyOwner !== 'self') continue;
            for (const id of ids) {
                const linked = await this.readLink(trx, id, link.name) as any;
                if (link.many) {
                    await trx.bucket(link.bucket.refName).unsafe.deleteMany(linked.map((l: any) => l.id));
                }
                else {
                    await trx.bucket(link.bucket.refName).unsafe.delete(linked.id);
                }
            }
        }

        await TrxNode.ok(trx);
    }

    // Query

    public async query<
        V extends ViewName<$>,
        Obj extends ViewObj<$, V>
    >(
        trx: AnyTrxNode,
        query: NQL_AnyQuery,
        pagination?: NQL_Pagination,
        view?: V,
        options?: {
            no_tenancy?: boolean,
            params?: Record<string, any>
        },
    ): Promise<NQL_Result<Obj>> {
        Log.trace('bucket', this.schema.name, 'Query', query);

        const v = (view ? this.views[view] : null) || this.views['default'];
        if (!v) {
            throw NesoiError.Bucket.Query.ViewNotFound(this.schema.name, (view as string) || 'default');
        }

        // Tenancy
        const tenancy = (options?.no_tenancy)
            ? undefined
            : this.getTenancyQuery(trx);
        
        if (tenancy) {
            query = {
                ...query,
                '#and': tenancy
            }
        }

        // TODO: cache
        // const raws = this.cache
        //     ? await this.cache.query(trx, v.schema, query, pagination)
        const result = await this.adapter.query(trx, query, pagination, options?.params);
        if (!result.data.length) return {
            data: []
        };
        
        if (view) {
            result.data = await this.buildMany(trx, result.data as any[], view) as any;
        }
        return result as NQL_Result<any>;
    }

    //

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