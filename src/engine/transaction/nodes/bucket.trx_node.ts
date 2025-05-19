import { $Module, ViewName, ViewObj } from '~/schema';
import { AnyTrxNode, TrxNode } from '../trx_node';
import { BucketQueryTrxNode } from './bucket_query.trx_node';
import { $Bucket } from '~/elements/entities/bucket/bucket.schema';
import { Bucket } from '~/elements/entities/bucket/bucket';
import { CreateObj, PatchObj, PutObj } from '~/elements/entities/bucket/bucket.types';
import { NQL_AnyQuery, NQL_Query } from '~/elements/entities/bucket/query/nql.schema';
import { NesoiFile } from '~/engine/data/file';
import { NesoiError } from '~/engine/data/error';

/**
 * @category Engine
 * @subcategory Transaction
 */
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
        Wrap
    */

    async wrap(
        action: string,
        input: Record<string, any>,
        fn: (trx: AnyTrxNode) => Promise<any>,
        fmtTrxOut?: (out: any) => any
    ) {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        await TrxNode.open(trx, action, input);
        
        let out: any;
        try {
            out = await fn(trx);
        }
        catch (e) {
            throw await TrxNode.error(trx, e);
        }

        await TrxNode.ok(trx, fmtTrxOut ? fmtTrxOut(out) : out);
        return out;
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
        return this.wrap('readOne', { id }, trx => 
            this.bucket.readOne(trx, id, {
                silent: true,
                no_tenancy: !this.enableTenancy
            })
        )
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
        return this.wrap('viewOne', { id }, trx =>
            this.bucket.viewOne(trx, id, view, {
                silent: true,
                no_tenancy: !this.enableTenancy
            })
        )
    }

    /**
     * Returns one object by `id`, without pre-formatting,
     * or **throws an exception** if the object was not found.
     */
    async readOneOrFail(
        id: $['#data']['id']
    ): Promise<$['#data']> {
        return this.wrap('readOneOrFail', { id }, trx =>
            this.bucket.readOne(trx, id, {
                no_tenancy: !this.enableTenancy
            })
        )
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
        return this.wrap('viewOneOrFail', { id }, trx =>
            this.bucket.viewOne(trx, id, view, {
                no_tenancy: !this.enableTenancy
            })
        )
    }

    /*
        Read/View All
    */

    /**
     * Returns a list of all objects, without pre-formatting.
     */
    async readAll(): Promise<$['#data'][]> {
        return this.wrap('readAll', {}, trx =>
            this.bucket.readAll(trx, {
                no_tenancy: !this.enableTenancy
            }),
        objs => ({ length: objs.length }))
    }

    /**
     * Returns a list of all objects formated with the specified view.
     * - The formating process can impact performance. If you just need
     * the raw obj, it's recommended to use `readAll` instead.
     */
    async viewAll<V extends ViewName<$>>(
        view: V = 'default' as V
    ): Promise<ViewObj<$, V>[]> {
        return this.wrap('viewAll', {}, trx =>
            this.bucket.viewAll(trx, view, {
                no_tenancy: !this.enableTenancy
            }),
        objs => ({ length: objs.length }))
    }

    /*
        Query
    */

    /**
     * Returns a list containing the results of the query.
     */
    query(
        query: NQL_Query<M,$>
    ): BucketQueryTrxNode<M, $> {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        return new BucketQueryTrxNode(trx, this.bucket, query as NQL_AnyQuery, this.enableTenancy);
    }

    /**
     * Returns a list containing the results of the query built with a view.
     */
    viewQuery<
        V extends ViewName<$> = 'default'
    >(
        query: NQL_Query<M,$>,
        view: V = 'default' as any
    ): BucketQueryTrxNode<M, $, V> {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        return new BucketQueryTrxNode(trx, this.bucket, query as NQL_AnyQuery, this.enableTenancy, view);
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
        Obj extends Link['#bucket']['#data']
    >(
        id: $['#data']['id'],
        link: LinkName
    ): Promise<Link['#many'] extends true ? Obj[] : (Obj | undefined)> {
        return this.wrap('readLink', { id, link }, trx =>
            this.bucket.readLink(trx, id, link, {
                silent: true,
                no_tenancy: !this.enableTenancy
            })
        )
    }

    /**
     * Returns one or more objects referenced by the graph link built with a view,
     * or `undefined` if the graph link doesn't resolve.
     */
    async viewLink<
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
        return this.wrap('viewLink', { id, link, view }, trx =>
            this.bucket.viewLink(trx, id, link, view, {
                silent: true,
                no_tenancy: !this.enableTenancy
            })
        )
    }

    /**
     * Returns one or more objects referenced by the graph link,
     * or **throws an exception** if the graph link doesn't resolve.
     */
    async readLinkOrFail<
        LinkName extends keyof $['graph']['links'],
        Link extends $['graph']['links'][LinkName],
        Obj extends Link['#bucket']['#data']
    >(
        id: $['#data']['id'],
        link: LinkName
    ): Promise<Link['#many'] extends true ? Obj[] : Obj> {
        return this.wrap('readLinkOrFail', { id, link }, trx =>
            this.bucket.readLink(trx, id, link, {
                no_tenancy: !this.enableTenancy
            })
        )
    }

    /**
     * Returns one or more objects referenced by the graph link built with a view,
     * or **throws an exception** if the graph link doesn't resolve.
     */
    async viewLinkOrFail<
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
        return this.wrap('viewLinkOrFail', { id, link, view }, trx =>
            this.bucket.viewLink(trx, id, link, view, {
                no_tenancy: !this.enableTenancy
            })
        )
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
        return this.wrap('hasLink', { id, link }, trx =>
            this.bucket.hasLink(trx, id, link, {
                no_tenancy: !this.enableTenancy
            })
        )
    }

    /*
        Create
    */

    /**
     * Creates an object by passing it to the bucket adapter.
     * Also creates the compositions of this bucket, from the
     * `#composition` field passed in the message.
     * 
     * - If `#composition` is wrong, this will throw an exception
     */
    async create(
        obj: CreateObj<$>
    ): Promise<$['#data']> {
        return this.wrap('create', { obj }, trx =>
            this.bucket.create(trx, obj)
        , () => undefined)
    }

    /*
        Update (Patch, Replace)
    */

    /**
     * Reads one object by `id` and `patch` (modify) it based on the one passed as an argument.
     * Also patches the compositions of this bucket, from the
     * `#composition` field passed in the message.
     * 
     * - If the object is not found, this will throw an exception
     * - If `#composition` is wrong, this will throw an exception
     * - The read query before updating might impact performance and be unnecessary
     * when you're updating from code that's sure the object exists. In that case,
     * you can use `unsafe.patch`, which doesn't read prior to writing.
     */
    async patch(
        obj: PatchObj<$>
    ): Promise<$['#data']> {
        return this.wrap('patch', { obj }, trx =>
            this.bucket.update(trx, obj, {
                mode: 'patch',
                no_tenancy: !this.enableTenancy
            }),
        () => undefined)
    }

    /**
     * Reads one object by `id` and `replace` it with the one passed as an argument.
     * Also patches the compositions of this bucket, from the
     * `#composition` field passed in the message.
     * 
     * - If the object is not found, this will throw an exception
     * - If `#composition` is wrong, this will throw an exception
     * - The read query before updating might impact performance and be unnecessary
     * when you're updating from code that's sure the object exists. In that case,
     * you can use `unsafe.replace`, which doesn't read prior to writing.
     */
    async replace(
        obj: PatchObj<$>
    ): Promise<$['#data']> {
        return this.wrap('replace', { obj }, trx =>
            this.bucket.update(trx, obj, {
                mode: 'replace',
                no_tenancy: !this.enableTenancy
            }),
        () => undefined)
    }

    /*
        Put
    */

    /**
     * Creates or replaces (by `id`) the object passed as an argument.
     * Does the same for compositions of this bucket, from the
     * `#composition` field passed in the message.
     *
     * - If `#composition` is wrong, this will throw an exception.
     * - This will **REPLACE** objects and it's compositions if they already exist,
     *  so there might be unexpected data loss, use it carefully.
     * 
     * **WARNING** Tenancy currently not implemented for put.
     */
    async put(
        obj: PutObj<$>
    ): Promise<$['#data']> {
        return this.wrap('put', { obj }, trx =>
            this.bucket.put(trx, obj),
        () => undefined)
    }

    /*
        Delete
    */

    /**
     * Attempts to read an object by `id`, if found, deletes it.
     * 
     * - If you want to skip the read query, use the `unsafe.delete` method,
     * so the behavior depends on the bucket used.
     */
    async delete(
        id: $['#data']['id']
    ): Promise<void> {
        return this.wrap('delete', { id }, trx =>
            this.bucket.delete(trx, id, {
                no_tenancy: !this.enableTenancy
            }),
        () => undefined)
    }

    /**
     * Attempts to read an object by `id`, if found, deletes it.
     * 
     * - If you want to skip the read query, use the `unsafe.delete` method,
     * so the behavior depends on the bucket used.
     */
    async deleteMany(
        ids: $['#data']['id'][]
    ): Promise<void> {
        return this.wrap('deleteMany', { ids }, trx =>
            this.bucket.deleteMany(trx, ids, {
                no_tenancy: !this.enableTenancy
            }),
        () => undefined)
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
        return this.wrap('buildOne', { obj }, trx =>
            this.bucket.buildOne(trx, obj, view),
        () => undefined)
    }

    async buildMany<
        V extends ViewName<$>,
        Obj extends ViewObj<$, V>
    >(
        objs: $['#data'][],
        view: V
    ): Promise<Obj[]> {
        return this.wrap('buildMany', { objs }, trx =>
            this.bucket.buildMany(trx, objs, view),
        () => undefined)
    }

    /*
        Drive
    */

    /**
     * Methods to use the Bucket's drive (file storage).
     */
    get drive() {
        return new BucketDriveTrxNode<M, $>(this, this.bucket)
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
        return new BucketUnsafeTrxNode<M, $>(this, this.bucket, this.enableTenancy)
    }

}

/**
 * @category Engine
 * @subcategory Transaction
 */
export class BucketUnsafeTrxNode<M extends $Module, $ extends $Bucket> {
    
    
    constructor(
        private bucketTrx: BucketTrxNode<M, $>,
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

    /*
        Update (Patch, Replace)
    */

    /**
     * Directly `patch` (modify) an object based on the one passed as an argument.
     * Also patches the compositions of this bucket, from the
     * `#composition` field passed in the message.
     * 
     * > This unsafe version does not check if the object exists prior to patching.
     * 
     * - If the object is not found, this will throw an exception
     * - If `#composition` is wrong, this will throw an exception
     */
    async patch(
        obj: PatchObj<$>
    ): Promise<$['#data']> {
        return this.bucketTrx.wrap('patch', { obj }, trx =>
            this.bucket.update(trx, obj, {
                mode: 'patch',
                unsafe: true,
                no_tenancy: !this.enableTenancy
            }),
        () => undefined)
    }

    /**
     * Directly `replace` on object with the one passed as an argument.
     * Also replaces the compositions of this bucket, from the
     * `#composition` field passed in the message.
     * 
     * > This unsafe version does not check if the object exists prior to replacing.
     * 
     * - If the object is not found, this will throw an exception
     * - If `#composition` is wrong, this will throw an exception
     */
    async replace(
        obj: PatchObj<$>
    ): Promise<$['#data']> {
        return this.bucketTrx.wrap('replace', { obj }, trx =>
            this.bucket.update(trx, obj, {
                mode: 'replace',
                unsafe: true,
                no_tenancy: !this.enableTenancy
            }),
        () => undefined)
    }

    /*
        Delete
    */

    /**
     * Deletes an object
     * 
     * > This unsafe version does not check if the object exists prior to deleting.
     */
    async delete(
        id: $['#data']['id']
    ): Promise<void> {
        return this.bucketTrx.wrap('delete', { id }, trx =>
            this.bucket.delete(trx, id, {
                unsafe: true,
                no_tenancy: !this.enableTenancy
            }),
        () => undefined)
    }

    /**
     * Attempts to read an object by `id`, if found, deletes it.
     * 
     * > This unsafe version does not check if the objects exist prior to deleting.
     */
    async deleteMany(
        ids: $['#data']['id'][]
    ): Promise<void> {
        return this.bucketTrx.wrap('deleteMany', { ids }, trx =>
            this.bucket.deleteMany(trx, ids, {
                unsafe: true,
                no_tenancy: !this.enableTenancy
            }),
        () => undefined)
    }

}

/**
 * @category Engine
 * @subcategory Transaction
 */
export class BucketDriveTrxNode<M extends $Module, $ extends $Bucket> {
    
    
    constructor(
        private bucketTrx: BucketTrxNode<M, $>,
        private bucket: Bucket<M, $>
    ) {
        if (!this.bucket.drive) {
            throw NesoiError.Bucket.Drive.NoAdapter({ bucket: this.bucket.schema.alias });
        }
    }

    /**
     * Read the contents of a File of this bucket's drive
     */
    read(file: NesoiFile, options?: { silent?: boolean }) {
        try {
            return this.bucket.drive!.read(file);
        }
        catch (e) {
            if (options?.silent) {
                console.error(e);
                return;
            }
            throw e;
        }
    }

    /**
     * Move the file on disk
     */
    move(file: NesoiFile, to: string, options?: { silent?: boolean }) {
        try {
            return this.bucket.drive!.move(file, to);
        }
        catch (e) {
            if (options?.silent) {
                console.error(e);
                return;
            }
            throw e;
        }
    }

    /**
     * Delete a file of this bucket's drive
     */
    delete(file: NesoiFile, options?: { silent?: boolean }) {
        try {
            return this.bucket.drive!.delete(file);
        }
        catch (e) {
            if (options?.silent) {
                console.error(e);
                return;
            }
            throw e;
        }
    }

}