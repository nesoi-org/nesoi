import { $Module, ViewName, ViewObj } from '~/schema';
import { NesoiError } from '../../data/error';
import { TrxNode } from '../trx_node';
import { BucketQueryTrxNode } from './bucket_query.trx_node';
import { $Bucket } from '~/elements/entities/bucket/bucket.schema';
import { Bucket } from '~/elements/entities/bucket/bucket';
import { CreateObj, PatchObj, PutObj } from '~/elements/entities/bucket/bucket.types';
import { NQL_AnyQuery, NQL_Query } from '~/elements/entities/bucket/query/nql.schema';

export class BucketTrxNode<M extends $Module, $ extends $Bucket> {
    
    private enableTenancy = true;

    constructor(
        private parentTrx: TrxNode<any, M, any>,
        private bucket: Bucket<M, $>
    ) {}

    /*
        Modifiers
    */

    get no_tenancy() {
        this.enableTenancy = false;
        return this;
    }

    /*
        Read/View One
    */

    /**
     * Returns one object by `id`, without pre-formatting,
     * or `undefined` if the object was not found.
     */
    async readOne(
        id: $['#data']['id']
    ): Promise<$['#data'] | undefined> {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        await TrxNode.open(trx, 'readOne', { id });
        
        let obj: $['#data'] | undefined;
        try {
            obj = await this.bucket.readOne(trx, id, {
                no_tenancy: !this.enableTenancy
            });
        }
        catch (e) {
            await TrxNode.error(trx, e);
            throw e;
        }

        await TrxNode.ok(trx, obj as any);
        return obj;
    }

    /**
     * Returns one object by `id` formated with the specified view,
     * or `undefined` if the object was not found.
     * - The formating process can impact performance. If you just need
     * the raw obj, it's recommended to use `readOne` instead.
     */
    async viewOne<V extends ViewName<$>>(
        id: $['#data']['id'],
        view: V = 'default' as V
    ): Promise<ViewObj<$,V> | undefined> {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        await TrxNode.open(trx, 'viewOne', { id, view });
        
        let obj: ViewObj<$,V> | undefined;
        try {
            obj = await this.bucket.viewOne(trx, id, view, {
                no_tenancy: !this.enableTenancy
            });
        }
        catch (e) {
            await TrxNode.error(trx, e);
            throw e;
        }

        await TrxNode.ok(trx, obj as any);
        return obj;
    }

    /**
     * Returns one object by `id`, without pre-formatting,
     * or **throws an exception** if the object was not found.
     */
    async readOneOrFail(
        id: $['#data']['id']
    ): Promise<$['#data']> {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        await TrxNode.open(trx, 'readOneOrFail', { id });
        
        let obj: $['#data'] | undefined;
        try {
            obj = await this.bucket.readOne(trx, id, {
                no_tenancy: !this.enableTenancy
            });
        }
        catch (e) {
            await TrxNode.error(trx, e);
            throw e;
        }

        if (!obj) {
            const e = NesoiError.Bucket.ObjNotFound({ bucket: this.bucket.schema.alias, id: id });
            await TrxNode.error(trx, e);
            throw e;
        }

        await TrxNode.ok(trx, obj);
        return obj;
    }

    /**
     * Returns one object by `id`, without pre-formatting,
     * or **throws an exception** if the object was not found.
     * - The formating process can impact performance. If you just need
     * the raw obj, it's recommended to use `readOneOrFail` instead.
     */
    async viewOneOrFail<V extends ViewName<$>>(
        id: $['#data']['id'],
        view: V = 'default' as V
    ): Promise<ViewObj<$,V>> {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        await TrxNode.open(trx, 'viewOneOrFail', { id, view });
        
        let obj: ViewObj<$,V> | undefined;
        try {
            obj = await this.bucket.viewOne(trx, id, view, {
                no_tenancy: !this.enableTenancy
            });
        }
        catch (e) {
            await TrxNode.error(trx, e);
            throw e;
        }

        if (!obj) {
            const e = NesoiError.Bucket.ObjNotFound({ bucket: this.bucket.schema.alias, id: id });
            await TrxNode.error(trx, e);
            throw e;
        }

        await TrxNode.ok(trx, obj as any);
        return obj;
    }

    /*
        Read/View All
    */

    /**
     * Returns a list of all objects, without pre-formatting.
     */
    async readAll(): Promise<$['#data'][]> {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        await TrxNode.open(trx, 'readAll', {});
        
        let objs: $['#data'][];
        try {
            objs = await this.bucket.readAll(trx, {
                no_tenancy: !this.enableTenancy
            });
        }
        catch (e) {
            await TrxNode.error(trx, e);
            throw e;
        }
        
        await TrxNode.ok(trx, { length: objs.length });
        return objs;
    }

    /**
     * Returns a list of all objects formated with the specified view.
     * - The formating process can impact performance. If you just need
     * the raw obj, it's recommended to use `readAll` instead.
     */
    async viewAll<V extends ViewName<$>>(
        view: V = 'default' as V
    ): Promise<ViewObj<$, V>[]> {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        await TrxNode.open(trx, 'viewAll', { view });
        
        let objs: ViewObj<$, V>[];
        try {
            objs = await this.bucket.viewAll(trx, view, {
                no_tenancy: !this.enableTenancy
            });
        }
        catch (e) {
            await TrxNode.error(trx, e);
            throw e;
        }
        
        await TrxNode.ok(trx, { length: objs.length });
        return objs;
    }

    /*
        Query
    */

    /**
     * Returns a list containing the results of the query.
     */
    query<
        V extends ViewName<$> = 'default'
    >(
        query: NQL_Query<M,$>,
        view: V = 'default' as any,
    ): BucketQueryTrxNode<M, $, V> {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        return new BucketQueryTrxNode(trx, this.bucket, query as NQL_AnyQuery, view, this.enableTenancy);
    }

    /*
        Graph
    */

    /**
     * Returns one or more objects referenced by the graph link,
     * or `undefined` if the graph link doesn't resolve.
     */
    async readLink<
        LinkName extends keyof $['graph']['links'],
        Link extends $['graph']['links'][LinkName],
        LinkBucket extends Link['#bucket'],
        V extends ViewName<LinkBucket>,
        Obj extends ViewObj<LinkBucket, V>
    >(
        id: $['#data']['id'],
        link: LinkName,
        view: V = 'default' as any
    ): Promise<Link['#many'] extends true ? Obj[] : (Obj | undefined)> {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        await TrxNode.open(trx, 'readLink', { id, link });
        
        let obj;
        try {
            obj = await this.bucket.readLink(trx, id, link, view);
        }
        catch (e) {
            await TrxNode.error(trx, e);
            throw e;
        }

        await TrxNode.ok(trx, obj as any);
        return obj as any;
    }

    /**
     * Returns one or more objects referenced by the graph link,
     * or **throws an exception** if the graph link doesn't resolve.
     */
    async readLinkOrFail<
        LinkName extends keyof $['graph']['links'],
        Link extends $['graph']['links'][LinkName],
        LinkBucket extends Link['#bucket'],
        V extends ViewName<LinkBucket>,
        Obj extends ViewObj<LinkBucket, V>
    >(
        id: $['#data']['id'],
        link: LinkName,
        view: V = 'default' as any
    ): Promise<Link['#many'] extends true ? Obj[] : Obj> {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        await TrxNode.open(trx, 'readLinkOrFail', { id, link });

        let obj;
        try {
            obj = await this.bucket.readLink(trx, id, link, view);
            if (obj === undefined) {
                const e = NesoiError.Bucket.Graph.LinkNotFound({ bucket: this.bucket.schema.alias, link: link as string });
                await TrxNode.error(trx, e);
                throw e;
            }
        }
        catch (e) {
            await TrxNode.error(trx, e);
            throw e;
        }

        await TrxNode.ok(trx);
        return obj as any;
    }

    /**
     * Returns `true` if the graph link resolves to at least 1 object.
     */
    async hasLink<
        LinkName extends keyof $['graph']['links']
    >(
        id: $['#data']['id'],
        link: LinkName
    ): Promise<boolean | undefined> {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        await TrxNode.open(trx, 'hasLink', { id, link });
        
        let result;
        try {
            result = await this.bucket.hasLink(trx, id, link);
        }
        catch (e) {
            await TrxNode.error(trx, e);
            throw e;
        }

        await TrxNode.ok(trx, { result });
        return result;
    }

    /*
        Create
    */

    /**
     * Creates an object by passing it to the bucket adapter,
     * without an ID (it's removed if passed).
     * Also creates the compositions of this bucket, from the
     * `#composition` field passed in the message.
     * 
     * - If `#composition` is wrong, this will throw an exception
     */
    async create(
        obj: CreateObj<$>
    ): Promise<$['#data']> {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        await TrxNode.open(trx, 'create', { obj });

        let _obj: $['#data'];
        try {
            _obj = await this.bucket.create(trx, obj);
        }
        catch (e) {
            await TrxNode.error(trx, e);
            throw e;
        }

        await TrxNode.ok(trx);
        return _obj;
    }

    /*
        Update (Patch & Replace)
    */

    /**
     * Creates or updates (by `id`) the object passed as an argument.
     * Does the same for compositions of this bucket, from the
     * `#composition` field passed in the message.
     *
     * - If `#composition` is wrong, this will throw an exception. If you don't
     * want to check for composition, use the `unsafe.put` version.
     * - This will **REPLACE** objects and it's compositions if they already exist,
     *  so there might be unexpected data loss, use it carefully.
     * 
     * **WARNING** Tenancy currently not implemented for put.
     */
    async put(
        obj: PutObj<$>
    ): Promise<$['#data']> {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        await TrxNode.open(trx, 'put', { obj });

        let _obj: $['#data'];
        try {
            _obj = await this.bucket.put(trx, obj);
        }
        catch (e) {
            await TrxNode.error(trx, e);
            throw e;
        }

        await TrxNode.ok(trx);
        return _obj;
    }

    /**
     * Reads one object by `id` and `patch` it with the one passed as an argument.
     * Also patches the compositions of this bucket, from the
     * `#composition` field passed in the message.
     * 
     * - If the object is not found, this will throw an exception
     * - If `#composition` is wrong, this will throw an exception
     * - The read query before updating might impact performance and be unnecessary
     * when you're updating from code that's sure the object exists. In that case,
     * you can use `unsafe_patch`, which doesn't read prior to writing.
     */
    async patch(
        obj: PatchObj<$>
    ): Promise<$['#data']> {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        await TrxNode.open(trx, 'patch', { obj });

        let _obj: $['#data'];
        try {
            _obj = await this.bucket.patch(trx, obj);
        }
        catch (e) {
            await TrxNode.error(trx, e);
            throw e;
        }

        await TrxNode.ok(trx);
        return _obj;
    }

    /*
        Delete
    */

    /**
     * Attempts to read an object by `id`, if found, deletes it.
     * 
     * - If you want to skip the read query, use the `unsafe.delete` method,
     * so the behavior depends on the adapter used.
     */
    async delete(
        id: $['#data']['id']
    ): Promise<void> {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        await TrxNode.open(trx, 'deleteOrFail', { id });

        try {

            const obj = await this.bucket.readOne(trx, id);
            if (obj === undefined) {
                const e = NesoiError.Bucket.ObjNotFound({ bucket: this.bucket.schema.name, id })
                await TrxNode.error(trx, e);
                throw e;
            }
        
            await this.bucket.delete(trx, id)
        }
        catch (e) {
            await TrxNode.error(trx, e);
            throw e;
        }

        await TrxNode.ok(trx);
    }

    /*
        Build
    */

    async buildOne<
        V extends ViewName<$>,
        Obj extends ViewObj<$, V>
    >(
        obj: $['#data'],
        view: V
    ): Promise<Obj> {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        await TrxNode.open(trx, 'buildOne', { obj });

        let result: Obj;
        try {
            result = await this.bucket.buildOne(trx, obj, view);
        }
        catch (e) {
            await TrxNode.error(trx, e);
            throw e;
        }

        await TrxNode.ok(trx);
        return result;
    }

    async buildAll<
        V extends ViewName<$>,
        Obj extends ViewObj<$, V>
    >(
        objs: $['#data'][],
        view: V
    ): Promise<Obj[]> {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        await TrxNode.open(trx, 'buildAll', { objs });

        let result: Obj[];
        try {
            result = await this.bucket.buildAll(trx, objs, view);
        }
        catch (e) {
            await TrxNode.error(trx, e);
            throw e;
        }

        await TrxNode.ok(trx);
        return result;
    }

    /*
        Unsafe
    */

    /**
     * Unsafe versions of methods, which improve performance
     * by avoiding some validations and queries.
     * 
     * **Use it carefully.**
     */
    get unsafe() {
        return new BucketUnsafeTrxNode<M, $>(this.parentTrx, this.bucket, this.enableTenancy)
    }

}

export class BucketUnsafeTrxNode<M extends $Module, $ extends $Bucket> {
    
    
    constructor(
        private parentTrx: TrxNode<any, M, any>,
        private bucket: Bucket<M, $>,
        private enableTenancy: boolean
    ) {}

    /*
        Modifiers
    */

    get no_tenancy() {
        this.enableTenancy = false;
        return this;
    }

    /**
     * Directly call the adapter `replace` method.
     * - Does **NOT** check if compositions are missing
     * - Does **NOT** check if the fields match the model
     * 
     * Make sure you handle adapter exceptions when using this method.
     *
     * **WARNING** Tenancy currently not implemented for put.
     */
    public async put(
        obj: PutObj<$>
    ): Promise<$['#data']> {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        await TrxNode.open(trx, 'unsafe replace', { obj });

        delete (obj as any)['#composition'];
        
        let newObj: $['#data'];
        try {
            newObj = await this.bucket.put(trx, obj as any);
        }
        catch (e) {
            await TrxNode.error(trx, e);
            throw e;
        }

        await TrxNode.ok(trx);
        return newObj;
    }

    /**
     * Directly call the adapter `patch` method.
     * - Does **NOT** check if the object exists
     * - Does **NOT** check if compositions are missing
     * - Does **NOT** check if the fields match the model
     * 
     * Make sure you handle adapter exceptions when using this method.
     */
    public async patch(
        obj: PatchObj<$>
    ): Promise<$['#data']> {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        await TrxNode.open(trx, 'unsafe patch', { obj });

        delete (obj as any)['#composition'];
        
        let newObj: $['#data'];
        try {
            newObj = await this.bucket.patch(trx, obj as any);
        }
        catch (e) {
            await TrxNode.error(trx, e);
            throw e;
        }

        await TrxNode.ok(trx);
        return newObj;
    }

    /**
     * Directly call the adapter `delete` method.
     * - Does **NOT** check if the object exists
     * 
     * Make sure you handle adapter exceptions when using this method.
     */
    public async delete(
        id: $['#data']['id']
    ): Promise<void> {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        await TrxNode.open(trx, 'unsafe delete', { id });

        try {
            await this.bucket.delete(trx, id);
        }
        catch (e) {
            await TrxNode.error(trx, e);
            throw e;
        }

        await TrxNode.ok(trx);
    }

    /**
     * Directly call the adapter `deleteMany` method.
     * - Does **NOT** check if the object exists
     * 
     * Make sure you handle adapter exceptions when using this method.
     */
    public async deleteMany(
        ids: $['#data']['id'][]
    ): Promise<void> {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        await TrxNode.open(trx, 'deleteMany', { ids });

        try {
            await this.bucket.deleteMany(trx, ids);
        }
        catch (e) {
            await TrxNode.error(trx, e);
            throw e;
        }

        await TrxNode.ok(trx);
    }

}