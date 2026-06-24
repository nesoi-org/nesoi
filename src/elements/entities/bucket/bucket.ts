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
     * Read one object from the adapter, by `id` (string or number).
     * 
     * - Options:
     *   - `no_throw`: If not found, return `undefined` instead of throwing an exception
     *   - `no_tenancy`: Don't apply tenancy rules.
     *   - `no_cast`: Don't cast nesoi values from string. (The output depends on the adapter behavior.)
     */
    public async readOne<
        Obj = $['#data']
    >(
        trx: AnyTrxNode,
        id: $['#data']['id'],
        options: {
            no_throw?: boolean
            no_tenancy?: boolean
            no_cast?: boolean
            roots?: string[]
        } = {}
    ): Promise<Obj | undefined> {
        Log.debug('bucket', this.schema.name, `Read id=${id}`);

        // Validate ID
        if (typeof id !== 'string' && typeof id !== 'number') {
            throw NesoiError.Bucket.InvalidId({ bucket: this.schema.alias, id });
        }
        
        // Read
        let raw: Record<string, any>;
        if (options?.no_tenancy || !this.schema.tenancy) {
            const adapter = await Trx.getCache(trx, this as AnyBucket) || this.cache || this.adapter;
            raw = await adapter.get_one(trx, id, {
                roots: options?.roots
            });
        }
        else {
            raw = await BucketQuery.run(trx, this.tag,
                { id },
                {}, [],
                {
                    pagination: { perPage: 1 },
                    roots: options?.roots
                }
            )
                .then(res => res.data[0]);
        }

        // Empty result
        if (!raw) {
            if (options?.no_throw) return undefined;
            else throw NesoiError.Bucket.ObjNotFound({ bucket: this.schema.alias, id: id })
        }

        // Cast
        if (this.adapter.behavior.serialized && !options.no_cast) {
            raw = this.model.cast(raw);
        }

        // Encryption
        if (this.schema.model.hasEncryptedField) {
            await this.decrypt(trx, raw);
        }

        return raw as Obj;
    }

    /**
     * Read many objects from the adapter, by `id` (string or number).
     * 
     * - Options:
     *   - `no_throw`: If not found, return `undefined` instead of throwing an exception
     *   - `no_tenancy`: Don't apply tenancy rules.
     *   - `no_cast`: Don't cast nesoi values from string. (The output depends on the adapter behavior.)
     */
    public async readMany<
        Obj = $['#data']
    >(
        trx: AnyTrxNode,
        ids: $['#data']['id'][],
        options: {
            no_throw?: boolean
            no_tenancy?: boolean
            no_cast?: boolean
            roots?: string[]
        } = {}
    ): Promise<Obj[]> {
        Log.debug('bucket', this.schema.name, `Read ids=${ids}`);

        // Validate ID
        let i = 0; const n = ids.length;
        while (i < n) {
            if (typeof ids[i] !== 'string' && typeof ids[i] !== 'number')
                throw NesoiError.Bucket.InvalidId({ bucket: this.schema.alias, id: ids[i] });
            i++;
        }
        
        // Read
        let raws: Record<string, any>;
        if (options?.no_tenancy || !this.schema.tenancy) {
            const adapter = await Trx.getCache(trx, this as AnyBucket) || this.cache || this.adapter;
            raws = await adapter.get_many(trx, ids, {
                roots: options?.roots
            });
        }
        else {
            raws = await BucketQuery.run(trx, this.tag,
                {
                    'id in': ids
                },
                {}, [],
                { pagination: { perPage: -1 } }
            )
                .then(res => res.data);
        }

        // Empty result
        if (!raws.length) {
            return [];
        }

        // Cast
        if (this.adapter.behavior.serialized && !options.no_cast) {
            let i = 0; const n = raws.length;
            while (i < n) {
                if (raws[i])
                    raws[i] = this.model.cast(raws[i]);
                i++;
            }
        }

        // Encryption
        if (this.schema.model.hasEncryptedField) {
            let i = 0; const n = raws.length;
            while (i < n) {
                await this.decrypt(trx, raws[i] as Record<string, any>);
                i++;
            }
        }

        return raws as Obj[];
    }
    
    /**
     * Read all objects available on the adapter.
     * 
     * - Options:
     *   - `no_tenancy`: Don't apply tenancy rules.
     *   - `no_cast`: Don't cast nesoi values from string. (The output depends on the adapter behavior.)
     */
    public async readAll<
        Obj = $['#data']
    >(
        trx: AnyTrxNode,
        options: {
            no_tenancy?: boolean
            no_cast?: boolean
            roots?: string[]
        } = {}
    ): Promise<Obj[]> {
        Log.debug('bucket', this.schema.name, 'Read All');
        
        // Read
        let raws: Record<string, any>[];
        if (options?.no_tenancy || !this.schema.tenancy) {
            const adapter = await Trx.getCache(trx, this as AnyBucket) || this.cache || this.adapter;
            raws = await adapter.get_all(trx, {
                roots: options?.roots
            });
        }
        else {
            raws = await BucketQuery.run(trx, this.tag,
                {},
                {}, [],
                { pagination: { perPage: -1 } }
            )
                .then(res => res.data);
        }

        // Cast
        if (this.adapter.behavior.serialized && !options.no_cast) {
            let i = 0; const n = raws.length;
            while (i < n) {
                raws[i] = this.model.cast(raws[i]);
                i++;
            }
        }

        // Encryption
        if (this.schema.model.hasEncryptedField) {
            let i = 0; const n = raws.length;
            while (i < n) {
                await this.decrypt(trx, raws[i] as Record<string, any>);
                i++;
            }
        }

        return raws as Obj[];
    }

    /**
     * Read one object from the adapter, by `id` (string or number),
     * then build it with a given view.
     * 
     * - Options:
     *   - `no_throw`: If not found, return `undefined` instead of throwing an exception
     *   - `no_tenancy`: Don't apply tenancy rules.
     *   - `as_json`: Cast nesoi values to string.
     */
    public async viewOne<
        V extends ViewName<$>,
        Obj extends ViewObj<$, V>
    >(
        trx: AnyTrxNode,
        id: $['#data']['id'],
        view: V,
        options?: {
            no_throw?: boolean
            no_tenancy?: boolean
            as_json?: boolean
        }
    ): Promise<Obj | undefined> {
        Log.debug('bucket', this.schema.name, `View id=${id}, v=${view as string}`);

        // Read
        const raw = await this.readOne(trx, id, {
            ...options,
            no_cast: true
        });
        if (!raw) return;

        // Build
        return this.buildOne(trx, raw, view, {
            as_json: options?.as_json
        });
    }
    
    /**
     * Read many objects from the adapter, by `id` (string or number),
     * then build them with a given view.
     * 
     * - Options:
     *   - `no_tenancy`: Don't apply tenancy rules.
     *   - `as_json`: Cast nesoi values to string.
     */
    public async viewMany<
        V extends ViewName<$>,
        Obj extends ViewObj<$, V>
    >(
        trx: AnyTrxNode,
        ids: $['#data']['id'][],
        view: V,
        options?: {
            no_tenancy?: boolean
            as_json?: boolean
        }
    ): Promise<Obj[]> {
        Log.debug('bucket', this.schema.name, `View all, v=${view as string}`);

        // Read
        const raws = await this.readMany(trx, ids, {
            ...options,
            no_cast: true
        });
        
        // Build
        return this.buildMany(trx, raws, view, {
            as_json: options?.as_json
        });
    }
    
    /**
     * Read all objects available on the adapter,
     * then build them with a given view.
     * 
     * - Options:
     *   - `no_tenancy`: Don't apply tenancy rules.
     *   - `as_json`: Cast nesoi values to string.
     */
    public async viewAll<
        V extends ViewName<$>,
        Obj extends ViewObj<$, V>
    >(
        trx: AnyTrxNode,
        view: V,
        options?: {
            no_tenancy?: boolean
            as_json?: boolean
        }
    ): Promise<Obj[]> {
        Log.debug('bucket', this.schema.name, `View all, v=${view as string}`);

        // Read
        const raws = await this.readAll(trx, {
            ...options,
            no_cast: true
        });
        
        // Build
        return this.buildMany(trx, raws, view, {
            as_json: options?.as_json
        });
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
        options: {
            as_json?: boolean
        } = {}
    ): Promise<Obj> {
        if (!(view in this.views)) {
            throw NesoiError.Bucket.ViewNotFound({ bucket: this.schema.alias, view: view as string });
        }
        return this.views[view].parse(trx, obj, options) as any;
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
        options: {
            as_json?: boolean
        } = {}
    ): Promise<Obj[]> {
        if (!(view in this.views)) {
            throw NesoiError.Bucket.ViewNotFound({ bucket: this.schema.alias, view: view as string });
        }
        return this.views[view].parseMany(trx, objs, options) as any;
    }

    // Create
    
    /**
     * Create an entity
     */
    async create(
        trx: AnyTrxNode,
        obj: CreateObj<$>,
        options?: {
            return?: boolean
            no_throw?: boolean
        }
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
        const _obj = await this.adapter.create(trx, input, {
            return: this.adapter.behavior.frozen || options?.return
        }) as any;
        if (_obj === false) {
            if (options?.no_throw) return;
            throw NesoiError.Bucket.ObjFound({ method: 'create', bucket: this.schema.name, id: obj.id! })
        }
        if (!_obj) return;
        
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

        // Freeze
        if (this.adapter.behavior.frozen) {
            this.model.freeze(_obj);
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
     * Update one object on the adapter
     * 
     * - Options:
     *   - `mode`: Type of update to perform (default: `patch`)
     *     - `patch`: Only modifies properties that changed
     *     - `replace`: Replace the whole object
     *   - `no_tenancy`: Don't apply tenancy rules when reading (default: `false`)
     *   - `no_read`:
     *     - Don't attempt to read the object before updating. This option is faster, but can throw exceptions directly from the adapter (default: `false`)
     *     - Only allowed when no_tenancy
     *   - `no_throw`:
     *     - If not found, return `undefined` instead of throwing an exception
     *     - Useless if no_read
     */
    async update(
        trx: AnyTrxNode,
        obj: PatchObj<$>,
        options?: {
            mode?: 'patch' | 'replace',
            no_tenancy?: boolean
            no_read?: boolean
            no_throw?: boolean
            return?: boolean
        }
    ): Promise<$['#data'] | undefined> {
        Log.debug('bucket', this.schema.name, `Update id=${obj['id']}`, obj as any);
        
        // Separate composition
        const composition = (obj as any)['#composition'] || {};
        delete (obj as any)['#composition'];

        // Read old object, to check if it exists
        let oldObj;
        if (!options?.no_tenancy && !options?.no_read) {
            oldObj = await this.readOne(trx, obj.id, {
                ...options,
                roots: ['id']
            });
            if (!oldObj) return undefined;
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
        const _obj = await this.adapter[mode](trx, obj as any, {
            return: this.adapter.behavior.frozen || options?.return
        });

        if (_obj === false) {
            if (options?.no_throw) return;
            throw NesoiError.Bucket.ObjNotFound({ bucket: this.schema.name, id: obj.id! })
        }

        // TODO: Composition
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

        return _obj as $['#data'];
    }

    /**
     * Update many objects on the adapter
     * 
     * - Options:
     *   - `mode`: Type of update to perform (default: `patch`)
     *     - `patch`: Only modifies properties that changed
     *     - `replace`: Replace the whole object
     *   - `no_tenancy`: Don't apply tenancy rules when reading (default: `false`)
     *   - `no_read`:
     *     - Don't attempt to read the object before updating. This option is faster, but can throw exceptions directly from the adapter (default: `false`)
     *     - Only allowed when no_tenancy
     *   - `no_throw`:
     *     - If one of the objects is not found, return `undefined` instead of throwing an exception
     *     - Useless if no_read
     */
    async updateMany(
        trx: AnyTrxNode,
        objs: PatchObj<$>[],
        options?: {
            mode?: 'patch' | 'replace',
            no_tenancy?: boolean
            no_read?: boolean
            no_throw?: boolean
            return?: boolean
        }
    ): Promise<$['#data'][] | undefined> {

        // Id list
        let i = 0; const n = objs.length;
        const ids = Array(n);
        while (i < n) {
            ids[i] = objs[i].id;
            i++;
        }

        Log.debug('bucket', this.schema.name, `Update ids=${ids}`, objs);
        
        // Separate composition
        i = 0;
        const compositions = Array(n);
        while (i < n) {
            compositions[i] = (objs[i] as any)['#composition'];
            delete (objs[i] as any)['#composition'];
            i++;
        }
        
        // Read old object, to check if it exists
        let oldObjs;
        if (!options?.no_tenancy && !options?.no_read) {
            oldObjs = await this.readMany(trx, ids, {
                ...options,
                roots: ['id']
            });
            if (oldObjs.length !== objs.length) return [];
        }

        // Add meta (updated_by/updated_at)
        i = 0;
        while (i < n) {
            this.addMeta(trx, objs[i], 'update');
            i++;
        }

        // Encryption
        i = 0;
        while (i < n) {
            await this.encrypt(trx, objs[i]);
            i++;
        }

        // Drive
        i = 0;
        while (i < n) {
            await this.uploadFilesToDrive(objs[i]);
            i++;
        }

        // Patch/Replace
        const mode = (options?.mode || 'patch') + '_many' as 'patch_many'|'replace_many';
        const _objs = await this.adapter[mode](trx, objs);

        if (_objs === false) {
            if (options?.no_throw) return;
            throw NesoiError.Bucket.ObjNotFound({ bucket: this.schema.name, id: objs.map(obj => obj.id).join('.') })
        }

        // TODO: Composition
        // for (const link of Object.values(this.schema.graph.links)) {
        //     if (link.rel !== 'composition') continue;
        //     const linkObj = composition[link.name];
        //     if (!linkObj) {
        //         if (mode === 'patch') continue;
        //         throw  NesoiError.Bucket.MissingComposition({ method: 'replace', bucket: this.schema.name, link: link.name })
        //     }
        //     if (link.many) {
        //         if (!Array.isArray(linkObj)) {
        //             throw  NesoiError.Bucket.CompositionValueShouldBeArray({ method: 'replace', bucket: this.schema.name, link: link.name })
        //         }
        //         for (const linkObjItem of linkObj) {
        //             await trx.bucket(link.bucket.short)[mode](linkObjItem);
        //         }
        //     }
        //     else {
        //         await trx.bucket(link.bucket.short)[mode](linkObj);
        //     }
        // }

        return _objs as $['#data'][];
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
     *   - `no_tenancy`: Don't apply tenancy rules when reading (default: `false`) (Useless if no_read)
     *   - `no_read`:
     *     - Don't attempt to read the object before updating. This option is faster, but can throw exceptions directly from the adapter (default: `false`)
     *     - Only allowed when no_tenancy
     *     - Ignored if the module has a trash configured (read is required to save a copy)
     *     - Ignored if the bucket has composition links (read is required to read the link)
     *   - `no_throw`:
     *     - If not found, return `undefined` instead of throwing an exception
     *     - Also applies to compositions
     */
    async delete(
        trx: AnyTrxNode,
        id: $['#data']['id'],
        options?: {
            no_tenancy?: boolean
            no_read?: boolean
            no_throw?: boolean
        }
    ): Promise<void> {
        Log.debug('bucket', this.schema.name, `Delete id=${id}`);

        const has_composition = Object.values(this.schema.graph.links)
            .some(link => link.rel === 'composition' && link.keyOwner === 'self');

        // Read old object, to check if it exists
        let oldObj: $['#data'];
        if (this.module.trash || has_composition || (!options?.no_tenancy && !options?.no_read)) {
            oldObj = await this.readOne(trx, id, {
                ...options,
                roots: ['id']
            }) as any;
            if (!oldObj) return undefined;
        }

        // Composition
        for (const link of Object.values(this.schema.graph.links)) {
            if (link.rel !== 'composition') continue;
            if (link.keyOwner !== 'self') continue;

            await this.graph.deleteLink(trx, oldObj!, link.name, options);
        }

        // Delete the object itself
        if (this.module.trash) {
            await Trash.add(trx, this.module, this.schema.name, oldObj!);
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
        
        // // Filter ids, if safe, to check if it exists
        // let result;
        // if (this.module.trash || !options?.unsafe) {
        //     // Filter ids
        //     result = await BucketQuery.run(trx, this.tag, {
        //         'id in': ids
        //     },
        //     undefined, {
        //         pagination: { perPage: 1 },
        //         no_tenancy: options.no_tenancy
        //     })
        //     ids = result.data.map(obj => (obj as any).id);
        // }

        // // Composition (with other key)
        // for(const link of Object.values(this.schema.graph.links)) {
        //     if (link.rel !== 'composition') continue;
        //     if (link.keyOwner !== 'other') continue;
        //     for (const id of ids) {
        //         const linked = await this.readLink(trx, id, link.name, { no_tenancy: options?.no_tenancy, silent: true }) as any;
        //         if (!linked) continue;
        //         if (link.many) {
        //             await trx.bucket(link.bucket.short).unsafe.deleteMany(linked.map((l: any) => l.id));
        //         }
        //         else {
        //             await trx.bucket(link.bucket.short).unsafe.delete(linked.id);
        //         }
        //     }
        // }

        // if (this.module.trash) {
        //     const objs = result!.data as any as NesoiObj[];
        //     await Trash.addMany(trx, this.module, this.schema.name, objs);
        // }
        // await this.adapter.deleteMany(trx, ids);

        // // Composition (with self key)
        // for(const link of Object.values(this.schema.graph.links)) {
        //     if (link.rel !== 'composition') continue;
        //     if (link.keyOwner !== 'self') continue;
        //     for (const id of ids) {
        //         const linked = await this.readLink(trx, id, link.name, { no_tenancy: options?.no_tenancy, silent: true }) as any;
        //         if (!linked) continue;
        //         if (link.many) {
        //             await trx.bucket(link.bucket.short).unsafe.deleteMany(linked.map((l: any) => l.id));
        //         }
        //         else {
        //             await trx.bucket(link.bucket.short).unsafe.delete(linked.id);
        //         }
        //     }
        // }

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
        binding: Record<string, any>,
        template: string[],
        options: {
            pagination?: NQL_Pagination,
            view?: V,
            roots?: string[],
            as_json?: boolean
            no_tenancy?: boolean,
        } = {},
    ): Promise<NQL_Result<Obj>> {
        Log.trace('bucket', this.schema.name, 'Query', query);

        // Resolve view
        const v = (options.view ? this.views[options.view] : null) || this.views['default'];
        if (!v) {
            throw NesoiError.Bucket.Query.ViewNotFound(this.schema.name, (options.view as string) || 'default');
        }

        // Run query
        const result = await BucketQuery.run(trx, this.tag, query, binding, template, {
            pagination: options?.pagination,
            roots: options?.roots,
            no_tenancy: options?.no_tenancy,
        })
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
            result.data = this.model.copyMany(result.data, 'load', options.as_json);
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

    // TODO: migrate to codegen
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

    // TODO: migrate to codegen
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