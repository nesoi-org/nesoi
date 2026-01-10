import type { ViewName, ViewObj } from '~/schema';
import type { BucketAdapter } from './adapters/bucket_adapter';
import type { BucketConfig } from './bucket.config';
import type { AnyBucketCache} from './cache/bucket_cache';
import type { NQL_AnyQuery, NQL_Pagination } from './query/nql.schema';
import type { CreateObj, PatchObj, PutObj } from './bucket.types';
import type { NQL_Result } from './query/nql_engine';
import type { DriveAdapter } from '../drive/drive_adapter';
import type { IService } from '~/engine/app/service';
import type { AnyModule } from '~/engine/module';

import type { AnyTrxNode} from '~/engine/transaction/trx_node';
import { TrxNode } from '~/engine/transaction/trx_node';
import { NesoiError } from '~/engine/data/error';
import { BucketView } from './view/bucket_view';
import { MemoryBucketAdapter } from './adapters/memory.bucket_adapter';
import { BucketCache } from './cache/bucket_cache';
import { Log } from '~/engine/util/log';
import { BucketGraph } from './graph/bucket_graph';
import { NesoiDatetime } from '~/engine/data/datetime';
import { Tree } from '~/engine/data/tree';
import { NesoiCrypto } from '~/engine/util/crypto';
import { $BucketModel } from './model/bucket_model.schema';
import { Trash } from '~/engine/data/trash';
import { BucketQuery } from './query/bucket_query';
import { Tag } from '~/engine/dependency';
import { Trx } from '~/engine/transaction/trx';
import { BucketModel } from './model/bucket_model';
import { Daemon } from '~/engine/daemon';

/**
 * **This should only be used inside a `#composition` of a bucket `create`** to refer to the parent id, which doesn't exist yet.
 * 
 * This property has no useful value outside the engine. If you try to `console.log` it, you'll find a Symbol.
 * It's replaced by the bucket after creating the parent, before creating the composition.
 * 
 * @category Elements
 * @subcategory Entity
 */
export const $id = Symbol('FUTURE ID OF CREATE') as unknown as string|number;

/**
 * @category Elements
 * @subcategory Entity
 * */
export class Bucket<M extends $Module, $ extends $Bucket> {

    private tag;

    public adapter: BucketAdapter<$['#data']>;
    public cache?: AnyBucketCache;
    
    public graph: BucketGraph<M, $>;
    public model: BucketModel<M, $>;
    private views;

    public drive?: DriveAdapter
    
    constructor(
        public module: AnyModule,
        public schema: $,
        private config?: BucketConfig<any, any, any>,
        public services: Record<string, IService> = {}
    ) {
        this.tag = new Tag(this.module.name, 'bucket', this.schema.name);

        // Config
        this.adapter = this.config?.adapter?.(schema, services) || new MemoryBucketAdapter(schema, {} as any);

        // Graph
        this.graph = new BucketGraph(this);

        // Model
        this.model = new BucketModel(this.schema, this.adapter.config);

        // Views
        const views = {} as any;
        for (const v in schema.views) {
            views[v] = new BucketView(this.schema, this.adapter.config, schema.views[v]);
        }
        this.views = views as {
            [V in keyof $['views']]: BucketView<$['views'][V]>
        };

        // Cache
        if (this.config?.cache) {
            this.cache = new BucketCache(this as AnyBucket, this.config.cache);            
        }

        // Drive
        if (this.config?.drive) {
            this.drive = this.config.drive(schema, services);
        }
    }

    // Getters

    public getQueryMeta() {
        return {
            ...this.adapter.getQueryMeta(),
            runner: this.adapter.nql,
        }
    }

    /* CRUD */

    /**
     * Read one raw entity by `id`
     * 
     * - Options:
     *   - `silent`: If not found, return `undefined` instead of throwing an exception
     *   - `no_tenancy`: Don't apply tenancy rules.
     */
    public async readOne<
        Obj = $['#data']
    >(
        trx: AnyTrxNode,
        id: (Obj & NesoiObj)['id'],
        options: {
            query_view?: string
            silent?: boolean
            no_tenancy?: boolean
        } = {}
    ): Promise<Obj | undefined> {
        Log.debug('bucket', this.schema.name, `Read id=${id}`);

        // Validate ID
        if (typeof id !== 'string' && typeof id !== 'number') {
            throw NesoiError.Bucket.InvalidId({ bucket: this.schema.alias, id });
        }
        
        // Read
        let raw: Obj;
        if (options?.no_tenancy) {
            const adapter = await Trx.getCache(trx, this as AnyBucket) || this.cache || this.adapter;
            raw = await adapter.get(trx, id);
        }
        else {
            raw = await BucketQuery.run(trx, this.tag, {
                id
            },
            undefined, {
                pagination: { perPage: 1 }
            }).then(res => res.data[0] as Obj);
        }

        // Empty result
        if (!raw) {
            if (options?.silent) return undefined;
            else throw NesoiError.Bucket.ObjNotFound({ bucket: this.schema.alias, id: id })
        }

        // Encryption
        if (this.schema.model.hasEncryptedField) {
            await this.decrypt(trx, raw);
        }

        return raw;
    }
    
    /**
     * Read all raw entities
     * 
     * - Options:
     *   - `no_tenancy`: Don't apply tenancy rules.
     */
    public async readAll<
        Obj = $['#data']
    >(
        trx: AnyTrxNode,
        options: {
            no_tenancy?: boolean
        } = {}
    ): Promise<Obj[]> {
        Log.debug('bucket', this.schema.name, 'Read All');
        
        let raws: Obj[];
        if (options?.no_tenancy) {
            const adapter = await Trx.getCache(trx, this as AnyBucket) || this.cache || this.adapter;
            raws = await adapter.index(trx) as Obj[];
        }
        else {
            raws = await BucketQuery.run(trx, this.tag, {},
                undefined, {
                    pagination: { perPage: -1 }
                }).then(res => res.data as Obj[]);
        }


        // Encryption
        if (this.schema.model.hasEncryptedField) {
            for (const raw of raws) {
                await this.decrypt(trx, raw as Record<string, any>);
            }
        }

        return raws as Obj[];
    }

    /**
     * Read an entity's view by `id`
     * 
     * - Options:
     *   - `silent`: If not found, return `undefined` instead of throwing an exception
     *   - `no_tenancy`: Don't apply tenancy rules.
     */
    public async viewOne<
        V extends ViewName<$>,
        Obj extends ViewObj<$, V>
    >(
        trx: AnyTrxNode,
        id: (Obj & NesoiObj)['id'],
        view: V,
        options?: {
            silent?: boolean
            no_tenancy?: boolean
        }
    ): Promise<Obj | undefined> {
        Log.debug('bucket', this.schema.name, `View id=${id}, v=${view as string}`);

        // Read
        const raw = await this.readOne(trx, id, options);
        if (!raw) {
            return;
        }

        // Build
        return this.buildOne(trx, raw as $['#data'], view);
    }
    
    /**
     * Read a view of all entities
     * 
     * - Options:
     *   - `no_tenancy`: Don't apply tenancy rules.
     */
    public async viewAll<
        V extends ViewName<$>,
        Obj extends ViewObj<$, V>
    >(
        trx: AnyTrxNode,
        view: V,
        options?: {
            silent?: boolean
            no_tenancy?: boolean
        }
    ): Promise<Obj[]> {
        Log.debug('bucket', this.schema.name, `View all, v=${view as string}`);

        // Read
        const raws = await this.readAll(trx, options);
        
        // Build
        return this.buildMany(trx, raws as $['#data'][], view);
    }
    
    // Graph

    /**
     * Read raw entity of a graph link for 1 object
     * 
     * - Options:
     *   - `silent`: If not found, return `undefined` instead of throwing an exception
     *   - `no_tenancy`: Don't apply tenancy rules.
     */
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
        options?: {
            silent?: boolean
            no_tenancy?: boolean
            index?: string[]
        }
    ): Promise<Link['#many'] extends true ? Obj[] : (Obj | undefined)> {
        Log.debug('bucket', this.schema.name, `Read Link, id=${id} l=${link as string}`);
        
        // Validate ID
        if (typeof id !== 'string' && typeof id !== 'number') {
            throw NesoiError.Bucket.InvalidId({ bucket: this.schema.alias, id });
        }

        // Read object
        const obj = await this.readOne(trx, id, options);

        // Empty response
        if (!obj) {
            const schema = this.schema.graph.links[link as string];
            if (schema.many) { return [] as any }
            return undefined as any;
        }

        // Read link
        const linkObj = await this.graph.readLink(
            trx,
            obj,
            link,
            options);

        // Encryption
        if (linkObj) {
            if (this.schema.model.hasEncryptedField) {
                await this.decrypt(trx, linkObj);
            }
        }

        return linkObj as any;
    }

    /**
     * Read raw entities of a graph link for N objects
     * 
     * - Options:
     *   - `silent`: If not found, return `undefined` instead of throwing an exception
     *   - `no_tenancy`: Don't apply tenancy rules.
     */
    async readManyLinks<
        LinkName extends keyof $['graph']['links'],
        Link extends $['graph']['links'][LinkName],
        LinkBucket extends Link['#bucket'],
        V extends ViewName<LinkBucket>,
        Obj extends ViewObj<LinkBucket, V>
    >(
        trx: AnyTrxNode,
        ids: $['#data']['id'][],
        link: LinkName,
        options?: {
            silent?: boolean
            no_tenancy?: boolean
            indexes?: string[][]
            serialize?: boolean
        }
    ): Promise<Link['#many'] extends true ? Obj[] : (Obj | undefined)> {
        Log.debug('bucket', this.schema.name, `Read Link, ids=${ids} l=${link as string}`);
        
        // Validate IDs
        for (const id of ids) {
            if (typeof id !== 'string' && typeof id !== 'number') {
                throw NesoiError.Bucket.InvalidId({ bucket: this.schema.alias, id });
            }
        }

        // Read object
        const objs = await this.query(trx, {
            'id in': ids
        }, undefined, options).then(res => res.data) as any[];

        // Empty response
        if (!objs.length) {
            const schema = this.schema.graph.links[link as string];
            if (schema.many) { return [] as any }
            return undefined as any;
        }

        // Read link
        const linkObj = await this.graph.readManyLinks(
            trx,
            objs,
            link as string,
            options
        );

        // TODO
        // // Encryption
        // if (linkObj) {
        //     if (this.schema.model.hasEncryptedField) {
        //         await this.decrypt(trx, linkObj);
        //     }
        // }

        return linkObj as any;
    }

    /**
     * Read the view of an entity of a graph link
     * 
     * - Options:
     *   - `silent`: If not found, return `undefined` instead of throwing an exception
     *   - `no_tenancy`: Don't apply tenancy rules.
     */
    public async viewLink<
    LinkName extends keyof $['graph']['links'],
        Link extends $['graph']['links'][LinkName],
        LinkBucket extends Link['#bucket'],
        V extends ViewName<LinkBucket>,
        Obj extends ViewObj<LinkBucket, V>
    >(
        trx: AnyTrxNode,
        id: $['#data']['id'],
        link: LinkName,
        view: V,
        options?: {
            silent?: boolean
            no_tenancy?: boolean
            serialize?: boolean
            index?: string[]
        }
    ): Promise<Obj | Obj[] | undefined> {
        const schema = this.schema.graph.links[link as string];
        Log.debug('bucket', this.schema.name, `View Link, id=${id} l=${link as string}`);
        
        // Validate ID
        if (typeof id !== 'string' && typeof id !== 'number') {
            throw NesoiError.Bucket.InvalidId({ bucket: this.schema.alias, id });
        }

        // Read object
        const obj = await this.readOne(trx, id, options);

        // Empty response
        if (!obj) {
            if (schema.many) { return [] as any }
            return undefined as any;
        }

        // Read link
        const linkObj = await this.graph.readLink(
            trx,
            obj,
            link,
            options
        );

        const module = TrxNode.getModule(trx);
        const bucket_ref = await Daemon.getBucketReference(this.module.name, module.daemon!, schema.bucket);
        const view_schema = bucket_ref.schema.views[view as never];
        const link_view = new BucketView(bucket_ref.schema, { meta: bucket_ref.meta }, view_schema);

        if (schema.many) {
            if (!Array.isArray(linkObj)) throw new Error('List expected');
            if (linkObj?.length && this.schema.model.hasEncryptedField) {
                for (const obj of linkObj)
                    await this.decrypt(trx, obj as any);
            }
            return link_view.parseMany(trx, linkObj, options) as Promise<Obj[]>;
        }
        else {
            if (linkObj && this.schema.model.hasEncryptedField) {
                await this.decrypt(trx, linkObj);
            }
            return link_view.parse(trx, linkObj as NesoiObj, options) as Promise<Obj>;
        }
    }

    /**
     * Return true if the graph link refers to at least one object
     * 
     * - Options:
     *   - `no_tenancy`: Don't apply tenancy rules.
     */
    async hasLink<
        LinkName extends keyof $['graph']['links']
    >(
        trx: AnyTrxNode,
        id: $['#data']['id'],
        link: LinkName,
        options?: {
            no_tenancy?: boolean
        }
    ): Promise<boolean | undefined> {
        Log.debug('bucket', this.schema.name, `Has Link, id=${id} l=${link as string}`);
        
        // Read Object
        const obj = await this.readOne(trx, id, options);
        if (!obj) {
            return undefined;
        }

        // Check Link
        return this.graph.hasLink(trx, link, obj, options);
    }

    /**
     * Return the number of objects matching a given link
     * 
     * - Options:
     *   - `no_tenancy`: Don't apply tenancy rules.
     */
    async countLink<
        LinkName extends keyof $['graph']['links']
    >(
        trx: AnyTrxNode,
        id: $['#data']['id'],
        link: LinkName,
        options?: {
            no_tenancy?: boolean
        }
    ): Promise<number | undefined> {
        Log.debug('bucket', this.schema.name, `Count Link, id=${id} l=${link as string}`);
        
        // Read Object
        const obj = await this.readOne(trx, id, options);
        if (!obj) {
            return undefined;
        }

        // Check Link
        return this.graph.countLink(trx, link, obj, options);
    }

    // Build

    /**
     * Build one object with a view
     */
    public async buildOne<
        V extends ViewName<$>,
        Obj extends ViewObj<$, V>
    >(
        trx: AnyTrxNode,
        obj: $['#data'],
        view: V,
        flags: {
            serialize?: boolean
        } = {}
    ): Promise<Obj> {
        if (!(view in this.views)) {
            throw NesoiError.Bucket.ViewNotFound({ bucket: this.schema.alias, view: view as string });
        }
        return this.views[view].parse(trx, obj, flags) as any;
    }

    /**
     * Build a list of objects with a view
     */
    public async buildMany<
        V extends ViewName<$>,
        Obj extends ViewObj<$, V>
    >(
        trx: AnyTrxNode,
        objs: $['#data'][],
        view: V,
        flags: {
            serialize?: boolean
        } = {}
    ): Promise<Obj[]> {
        if (!(view in this.views)) {
            throw NesoiError.Bucket.ViewNotFound({ bucket: this.schema.alias, view: view as string });
        }
        return this.views[view].parseMany(trx, objs, flags) as any;
    }

    // Create
    
    /**
     * Create an entity
     */
    async create(
        trx: AnyTrxNode,
        obj: CreateObj<$>
    ): Promise<$['#data'] | undefined> {
        Log.debug('bucket', this.schema.name, `Create id=${obj['id'] || 'new'}`, obj as any);
        
        // Separate composition
        let composition = (obj as any)['#composition'];
        delete (obj as any)['#composition'];

        // Add meta (created_by/created_at/updated_by/updated_at)
        this.addMeta(trx, obj, 'create');

        // Encryption
        if (this.schema.model.hasEncryptedField) {
            await this.encrypt(trx, obj);
        }

        // Drive
        if (this.schema.model.hasFileField) {
            await this.uploadFilesToDrive(obj);
        }

        // Create
        const input = Object.assign({}, this.schema.model.defaults, obj as any);
        const _obj = await this.adapter.create(trx, input) as any;
        
        // Composition
        if (composition) {
            this.replaceFutureId(composition, _obj.id);
        }
        else {
            composition = {};
        }

        // Create composition
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
                    const child = await trx.bucket(link.bucket.short).create(linkObjItem);
                    _obj['#composition'][link.name].push(child);
                }
            }
            else {
                const child = await trx.bucket(link.bucket.short).create(linkObj);
                _obj['#composition'] ??= {};
                _obj['#composition'][link.name] = child;
            }
        }

        return _obj;
    }

    /**
     * Replace the `$id` symbol on an object with the proper ID value.
     * This is used on composition, to access the ID of the parent.
     */
    private replaceFutureId(composition: Record<string, any>, value: string | number) {
        let poll = [composition];
        while (poll.length) {
            const next: Record<string, any>[] = []
            for (const obj of poll) {
                if (Array.isArray(obj)) {
                    for (let i = 0; i < obj.length; i++) {
                        if (typeof obj[i] === 'symbol' && obj[i] == $id as any) {
                            obj[i] = value;
                        }
                        else if (typeof obj[i] === 'object') {
                            next.push(obj[i]);
                        }
                    }
                }
                else {
                    for (const key in obj) {
                        if (typeof obj[key] === 'symbol' && obj[key] == $id as any) {
                            obj[key] = value;
                        }
                        else if (typeof obj[key] === 'object') {
                            next.push(obj[key]);
                        }
                    }
                }
            }
            poll = next;
        }
    }

    // Update

    /**
     * Update an entity
     * 
     * - Options:
     *   - `mode`: Type of update to perform (default: `patch`)
     *     - `patch`: Only modifies properties that changed
     *     - `replace`: Replace the whole object
     *   - `no_tenancy`: Don't apply tenancy rules (default: `false`)
     *   - `unsafe`:
     *     - Don't attempt to read the object before updating. This option is faster, but can throw exceptions directly from the adapter (default: `false`)
     *     - **WARNING** Unsafe currently avoids the tenancy check
     */
    async update(
        trx: AnyTrxNode,
        obj: PatchObj<$>,
        options?: {
            mode?: 'patch' | 'replace',
            no_tenancy?: boolean
            unsafe?: boolean
        }
    ): Promise<$['#data'] | undefined> {
        Log.debug('bucket', this.schema.name, `Update id=${obj['id']}`, obj as any);
        
        // Separate composition
        const composition = (obj as any)['#composition'] || {};
        delete (obj as any)['#composition'];

        // Read old object, if safe, to check if it exists
        let oldObj;
        if (!options?.unsafe) {
            if (options?.no_tenancy) {
                const adapter = await Trx.getCache(trx, this as AnyBucket) || this.cache || this.adapter;
                oldObj = await adapter.get(trx, obj.id);
            }
            else {
                oldObj = await BucketQuery.run(trx, this.tag, {
                    id: obj.id
                },
                undefined, {
                    pagination: { perPage: 1 },
                    metadata_only: true
                }).then(res => res.data[0]);
            }
    
            // Empty response
            if (!oldObj) {
                throw NesoiError.Bucket.ObjNotFound({ bucket: this.schema.alias, id: obj['id'] });
            }
        }

        // Add meta (updated_by/updated_at)
        this.addMeta(trx, obj, 'update');

        // Encryption
        if (this.schema.model.hasEncryptedField) {
            await this.encrypt(trx, obj);
        }

        // Drive
        if (this.schema.model.hasFileField) {
            await this.uploadFilesToDrive(obj);
        }

        // Patch/Replace
        const mode = options?.mode || 'patch';
        const _obj = await this.adapter[mode](trx, obj as any);

        // Composition
        for (const link of Object.values(this.schema.graph.links)) {
            if (link.rel !== 'composition') continue;
            const linkObj = composition[link.name];
            if (!linkObj) {
                if (mode === 'patch') continue;
                throw  NesoiError.Bucket.MissingComposition({ method: 'replace', bucket: this.schema.name, link: link.name })
            }
            if (link.many) {
                if (!Array.isArray(linkObj)) {
                    throw  NesoiError.Bucket.CompositionValueShouldBeArray({ method: 'replace', bucket: this.schema.name, link: link.name })
                }
                for (const linkObjItem of linkObj) {
                    await trx.bucket(link.bucket.short)[mode](linkObjItem);
                }
            }
            else {
                await trx.bucket(link.bucket.short)[mode](linkObj);
            }
        }

        return _obj;
    }
    
    /**
     * Create or Replace an entity
     * 
     * **WARNING** Tenancy not checked
     */
    async put(
        trx: AnyTrxNode,
        obj: PutObj<$>
    ): Promise<$['#data']> {
        Log.debug('bucket', this.schema.name, `Put id=${obj['id']}`, obj as any);

        // Separate composition
        let composition = (obj as any)['#composition'];
        delete (obj as any)['#composition'];

        // Add meta (created_by/created_at/updated_by/updated_at)
        this.addMeta(trx, obj, 'create');

        // Encryption
        if (this.schema.model.hasEncryptedField) {
            await this.encrypt(trx, obj);
        }

        // Drive
        if (this.schema.model.hasFileField) {
            await this.uploadFilesToDrive(obj);
        }

        // Put
        const _obj = await this.adapter.put(trx, obj as any) as any;

        // Composition
        if (composition) {
            this.replaceFutureId(composition, _obj.id);
        }
        else {
            composition = {};
        }
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
                    if (linkObjItem.id && linkObjItem.__delete) {
                        await trx.bucket(link.bucket.short).delete(linkObjItem.id);
                    }
                    else {
                        const child = await trx.bucket(link.bucket.short).put(linkObjItem);
                        _obj['#composition'][link.name].push(child);
                    }
                }
            }
            else {
                if (linkObj.id && linkObj.__delete) {
                    await trx.bucket(link.bucket.short).delete(linkObj.id);
                }
                else {
                    const child = await trx.bucket(link.bucket.short).put(linkObj);
                    _obj['#composition'] ??= {};
                    _obj['#composition'][link.name] = child;
                }
            }
        }

        return _obj;
    }

    // Delete

    /**
     * Delete an entity
     * 
     * - Options:
     *   - `no_tenancy`: Don't apply tenancy rules (default: `false`)
     *   - `unsafe`
     *     - Don't attempt to read the object before updating. This option is faster, but can throw exceptions directly from the adapter (default: `false`)
     *     - **WARNING** Unsafe currently avoids the tenancy check
     */
    async delete(
        trx: AnyTrxNode,
        id: $['#data']['id'],
        options?: {
            no_tenancy?: boolean
            unsafe?: boolean
        }
    ): Promise<void> {
        Log.debug('bucket', this.schema.name, `Delete id=${id}`);

        // Validate ID
        if (typeof id !== 'string' && typeof id !== 'number') {
            throw NesoiError.Bucket.InvalidId({ bucket: this.schema.alias, id });
        }
        
        // Read object, if safe, to check if it exists
        let oldObj;
        if (this.module.trash || !options?.unsafe) {
            if (options?.no_tenancy) {
                const adapter = await Trx.getCache(trx, this as AnyBucket) || this.cache || this.adapter;
                oldObj = await adapter.get(trx, id);
            }
            else {
                oldObj = await BucketQuery.run(trx, this.tag, {
                    id
                },
                undefined, {
                    pagination: { perPage: 1 },
                    metadata_only: true,
                }).then(res => res.data[0] as Record<string, any>);
            }
            
            if (!oldObj && !options?.unsafe) {
                throw NesoiError.Bucket.ObjNotFound({ bucket: this.schema.alias, id });
            }
        }

        // Composition
        for(const link of Object.values(this.schema.graph.links)) {
            if (link.rel !== 'composition') continue;
            if (link.keyOwner !== 'self') continue;

            const linked = oldObj
                // If safe, avoid reading the object again inside readLink.
                // Instead, use graph's readLink which takes the object.
                ? await this.graph.readLink(trx, oldObj!.data[0] as any,
                    link.name,
                    {
                        no_tenancy: options?.no_tenancy,
                        silent: true
                    }) as any
                // If unsafe, read the link base by id.
                : await this.readLink(trx, id, link.name, {
                    no_tenancy: options?.no_tenancy,
                    silent: true
                }) as any;
            if (!linked) continue;

            if (link.many) {
                await trx.bucket(link.bucket.short).unsafe.deleteMany(linked.map((l: any) => l.id));
            }
            else {
                await trx.bucket(link.bucket.short).unsafe.delete(linked.id);
            }
        }


        // Delete the object itself
        if (this.module.trash) {
            await Trash.add(trx, this.module, this.schema.name, oldObj);
        }
        await this.adapter.delete(trx, id);

    }

    /**
     * Delete many entities
     * 
     * - Options:
     *   - `no_tenancy`: Don't apply tenancy rules (default: `false`)
     *   - `unsafe`
     *     - Don't attempt to read the object before updating. This option is faster, but can throw exceptions directly from the adapter (default: `false`)
     *     - **WARNING** Unsafe currently avoids the tenancy check
     */
    async deleteMany(
        trx: AnyTrxNode,
        ids: $['#data']['id'][],
        options: {
            no_tenancy?: boolean
            unsafe?: boolean
        } = {}
    ): Promise<void> {
        Log.debug('bucket', this.schema.name, `Delete Many ids=${ids}`);
        
        // Filter ids, if safe, to check if it exists
        let result;
        if (this.module.trash || !options?.unsafe) {
            // Filter ids
            result = await BucketQuery.run(trx, this.tag, {
                'id in': ids
            },
            undefined, {
                pagination: { perPage: 1 },
                no_tenancy: options.no_tenancy
            })
            ids = result.data.map(obj => (obj as any).id);
        }

        // Composition (with other key)
        for(const link of Object.values(this.schema.graph.links)) {
            if (link.rel !== 'composition') continue;
            if (link.keyOwner !== 'other') continue;
            for (const id of ids) {
                const linked = await this.readLink(trx, id, link.name, { no_tenancy: options?.no_tenancy, silent: true }) as any;
                if (!linked) continue;
                if (link.many) {
                    await trx.bucket(link.bucket.short).unsafe.deleteMany(linked.map((l: any) => l.id));
                }
                else {
                    await trx.bucket(link.bucket.short).unsafe.delete(linked.id);
                }
            }
        }

        if (this.module.trash) {
            const objs = result!.data as any as NesoiObj[];
            await Trash.addMany(trx, this.module, this.schema.name, objs);
        }
        await this.adapter.deleteMany(trx, ids);

        // Composition (with self key)
        for(const link of Object.values(this.schema.graph.links)) {
            if (link.rel !== 'composition') continue;
            if (link.keyOwner !== 'self') continue;
            for (const id of ids) {
                const linked = await this.readLink(trx, id, link.name, { no_tenancy: options?.no_tenancy, silent: true }) as any;
                if (!linked) continue;
                if (link.many) {
                    await trx.bucket(link.bucket.short).unsafe.deleteMany(linked.map((l: any) => l.id));
                }
                else {
                    await trx.bucket(link.bucket.short).unsafe.delete(linked.id);
                }
            }
        }

    }

    // Query

    /**
     * Query entities using NQL
     * 
     * - Options:
     *   - `no_tenancy`: Don't apply tenancy rules (default: `false`)
     *   - `params`: NQL parameters
     */
    public async query<
        V extends ViewName<$>,
        Obj extends ViewObj<$, V>
    >(
        trx: AnyTrxNode,
        query: NQL_AnyQuery,
        params: Record<string, any>[] = [],
        options: {
            view?: V,
            pagination?: NQL_Pagination,
            indexes?: string[][],
            serialize?: boolean
            metadata_only?: boolean,
            no_tenancy?: boolean,
        } = {},
    ): Promise<NQL_Result<Obj>> {
        Log.trace('bucket', this.schema.name, 'Query', query);

        const v = (options.view ? this.views[options.view] : null) || this.views['default'];
        if (!v) {
            throw NesoiError.Bucket.Query.ViewNotFound(this.schema.name, (options.view as string) || 'default');
        }

        const result = await BucketQuery.run(trx, this.tag, query, params, options)
        if (!result.data.length) return result as NQL_Result<any>;
        
        // Encryption
        if (this.schema.model.hasEncryptedField) {
            for (const obj of result.data) {
                await this.decrypt(trx, obj);
            }
        }

        // Build
        if (options.view) {
            result.data = await this.buildMany(trx, result.data as any[], options.view) as any;
        }
        else {
            result.data = this.model.copyMany(result.data, 'load', options.serialize);
        }

        return result as NQL_Result<any>;
    }


    // Metadata

    /**
     * Add `created_by`, `created_at`, `updated_by` and `updated_at` fields to object
     */
    protected addMeta(
        trx: AnyTrxNode,
        obj: Record<string, any>,
        operation: 'create'|'update'
    ) {
        const match = TrxNode.getFirstUserMatch(trx, this.schema.tenancy)

        if (operation === 'create') {
            obj[this.adapter.config.meta.created_at] = NesoiDatetime.now();
            if (match) {
                obj[this.adapter.config.meta.created_by] = match.provider + '.' + match.user.id;
            }
        }
        
        obj[this.adapter.config.meta.updated_at] = NesoiDatetime.now();
        if (match) {
            obj[this.adapter.config.meta.updated_by] = match.provider + '.' + match.user.id;
        }
    }

    // Encryption

    protected async encrypt(trx: AnyTrxNode, obj: Record<string, any>, fields: $BucketModelFields = this.schema.model.fields) {
        for (const key in fields) {
            const field = fields[key];

            if (field.crypto) {
                const key = trx.value(field.crypto.value.short);
                const val = Tree.get(obj, field.path);
                if (val !== undefined) {
                    const encrypted = await NesoiCrypto.encrypt(val, key);
                    Tree.set(obj, field.path, () => encrypted);
                }
            }
            if (field.children) {
                await this.encrypt(trx, obj, field.children);
            }
        }
    }

    protected async decrypt(trx: AnyTrxNode, obj: Record<string, any>, fields: $BucketModelFields = this.schema.model.fields) {
        for (const key in fields) {
            const field = fields[key];

            if (field.crypto) {
                const key = trx.value(field.crypto.value.short);
                const val = Tree.get(obj, field.path);
                if (val !== undefined) {
                    const encrypted = await NesoiCrypto.decrypt(val, key);
                    Tree.set(obj, field.path, () => encrypted);
                }
            }
            if (field.children) {
                await this.decrypt(trx, obj, field.children);
            }
        }
    }

    // Drive (Files)

    /**
     * Copy all files from the object to the bucket's Drive
     * - Call `drive.upload` to send the files to the drive preserving the local copy
     * - Replace the file on the object with a new one representing the remote
     */
    protected async uploadFilesToDrive(obj: Record<string, any>) {
        if (!this.drive) {
            throw NesoiError.Bucket.Drive.NoAdapter({bucket: this.schema.alias})
        }
        await $BucketModel.forEachField(this.schema.model, async field => {
            if (field.type !== 'file') return;
            const file = Tree.get(obj, field.path) as NesoiFile;
            if (!file) return;
            const remoteFile = await this.drive!.upload(file)
            Tree.set(obj, field.path, () => remoteFile);
        });
    }

}

export type AnyBucket = Bucket<$Module, $Bucket>