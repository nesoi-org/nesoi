import type { ViewName, ViewObj } from '~/schema';
import type { Bucket } from '~/elements/entities/bucket/bucket';
import type { CreateObj, PatchObj, PutObj } from '~/elements/entities/bucket/bucket.types';
import type { NQL_Query } from '~/elements/entities/bucket/query/nql.schema';
import type { DriveAdapter } from '~/elements/entities/drive/drive_adapter';

import type { AnyTrxNode} from '../trx_node';
import { TrxNode } from '../trx_node';
import { BucketQueryTrxNode } from './bucket_query.trx_node';
import { NesoiError } from '~/engine/data/error';
import { Tag } from '~/engine/dependency';
import { ExternalTrxNode } from './external.trx_node';
import { Daemon } from '~/engine/daemon';

/**
 * @category Engine
 * @subcategory Transaction
 */
export class BucketTrxNode<M extends $Module, $ extends $Bucket> {
    
    private enableTenancy = true;
    private external: boolean
    private bucket?: Bucket<M, $>

    constructor(
        private trx: TrxNode<any, M, any>,
        private tag: Tag
    ) {
        const module = TrxNode.getModule(trx);
        this.external = tag.module !== module.name;
        if (!this.external) {
            this.bucket = Tag.element(tag, trx);
            if (!this.bucket) {
                throw NesoiError.Trx.NodeNotFound(this.tag.full, trx.globalId);
            }
        }
    }

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
        fn: (trx: AnyTrxNode, element: Bucket<M, $>) => Promise<any>,
        fmtTrxOut?: (out: any) => any,
        idempotent = false
    ) {
        const wrapped = async (parentTrx: AnyTrxNode, bucket: Bucket<M, $>) => {
            
            const trx_idempotent = ((parentTrx as any).trx as AnyTrxNode['trx']).idempotent;
            if (trx_idempotent && !idempotent) {
                throw NesoiError.Bucket.IdempotentTransaction({ bucket: this.tag.full, trx: this.trx.globalId, action });
            }
            
            const trx = TrxNode.makeChildNode(parentTrx, bucket.schema.module, 'bucket', bucket.schema.name);    
            
            TrxNode.open(trx, action, input);
            let out;
            try {
                out = await fn(trx, bucket);
            }
            catch (e) {
                throw TrxNode.error(trx, e);
            }
            TrxNode.ok(trx, fmtTrxOut ? fmtTrxOut(out) : out);

            return out;
        }

        if (this.external) {
            const ext = new ExternalTrxNode(this.trx, this.tag, idempotent)
            // The if below is not strictly necessary but avoids a warning.
            if (idempotent) {
                return ext.run(trx => Tag.element(this.tag, trx), wrapped);
            }
            return ext.run_and_hold(trx => Tag.element(this.tag, trx), wrapped);
        }
        else {
            return wrapped(this.trx, this.bucket!)
        }
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
        return this.wrap('readOne', { id }, (trx, bucket) => 
            bucket.readOne(trx, id, {
                silent: true,
                no_tenancy: !this.enableTenancy
            }),
        undefined, true)
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
        return this.wrap('viewOne', { id }, (trx, bucket) =>
            bucket.viewOne(trx, id, view, {
                silent: true,
                no_tenancy: !this.enableTenancy
            }),
        undefined, true)
    }

    /**
     * Returns one object by `id`, without pre-formatting,
     * or **throws an exception** if the object was not found.
     */
    async readOneOrFail(
        id: $['#data']['id']
    ): Promise<$['#data']> {
        return this.wrap('readOneOrFail', { id }, (trx, bucket) =>
            bucket.readOne(trx, id, {
                no_tenancy: !this.enableTenancy
            }),
        undefined, true)
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
        return this.wrap('viewOneOrFail', { id }, (trx, bucket) =>
            bucket.viewOne(trx, id, view, {
                no_tenancy: !this.enableTenancy
            }),
        undefined, true)
    }

    /*
        Read/View All
    */

    /**
     * Returns a list of all objects, without pre-formatting.
     */
    async readAll(): Promise<$['#data'][]> {
        return this.wrap('readAll', {}, (trx, bucket) =>
            bucket.readAll(trx, {
                no_tenancy: !this.enableTenancy
            }),
        objs => ({ length: objs.length }),
        true)
    }

    /**
     * Returns a list of all objects formated with the specified view.
     * - The formating process can impact performance. If you just need
     * the raw obj, it's recommended to use `readAll` instead.
     */
    async viewAll<V extends ViewName<$>>(
        view: V = 'default' as V
    ): Promise<ViewObj<$, V>[]> {
        return this.wrap('viewAll', {}, (trx, bucket) =>
            bucket.viewAll(trx, view, {
                no_tenancy: !this.enableTenancy
            }),
        objs => ({ length: objs.length }), 
        true)
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
        return new BucketQueryTrxNode(this.trx, this.tag, query as NQL_AnyQuery, this.enableTenancy);
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
        link: LinkName,
        index?: string[]
    ): Promise<Link['#many'] extends true ? Obj[] : (Obj | undefined)> {
        return this.wrap('readLink', { id, link }, (trx, bucket) =>
            bucket.readLink(trx, id, link, {
                silent: true,
                no_tenancy: !this.enableTenancy,
                index
            }), undefined, true
        )
    }

    /**
     * Returns one or more objects referenced by the graph link,
     * or `undefined` if the graph link doesn't resolve.
     */
    async readManyLinks<
        LinkName extends keyof $['graph']['links'],
        Link extends $['graph']['links'][LinkName],
        Obj extends Link['#bucket']['#data']
    >(
        ids: $['#data']['id'][],
        link: LinkName,
        indexes?: string[][]
    ): Promise<Link['#many'] extends true ? Obj[] : (Obj | undefined)> {
        return this.wrap('readLinks', { ids, link }, (trx, bucket) =>
            bucket.readManyLinks(trx, ids, link, {
                silent: true,
                no_tenancy: !this.enableTenancy,
                indexes
            }), undefined, true
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
        return this.wrap('viewLink', { id, link, view }, (trx, bucket) =>
            bucket.viewLink(trx, id, link, view, {
                silent: true,
                no_tenancy: !this.enableTenancy
            }), undefined, true
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
        return this.wrap('readLinkOrFail', { id, link }, (trx, bucket) =>
            bucket.readLink(trx, id, link, {
                no_tenancy: !this.enableTenancy
            }), undefined, true
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
        return this.wrap('viewLinkOrFail', { id, link, view }, (trx, bucket) =>
            bucket.viewLink(trx, id, link, view, {
                no_tenancy: !this.enableTenancy
            }), undefined, true
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
    ): Promise<boolean> {
        return this.wrap('hasLink', { id, link }, (trx, bucket) =>
            bucket.hasLink(trx, id, link, {
                no_tenancy: !this.enableTenancy
            }), undefined, true
        )
    }
    
    /**
     * Returns the number of objects matching the link.
     */
    async countLink<
        LinkName extends keyof $['graph']['links']
    >(
        id: $['#data']['id'],
        link: LinkName
    ): Promise<number> {
        return this.wrap('countLink', { id, link }, (trx, bucket) =>
            bucket.countLink(trx, id, link, {
                no_tenancy: !this.enableTenancy
            }), undefined, true
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
        return this.wrap('create', { obj }, (trx, bucket) =>
            bucket.create(trx, obj)
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
        return this.wrap('patch', { obj }, (trx, bucket) =>
            bucket.update(trx, obj, {
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
        return this.wrap('replace', { obj }, (trx, bucket) =>
            bucket.update(trx, obj, {
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
        return this.wrap('put', { obj }, (trx, bucket) =>
            bucket.put(trx, obj),
        () => undefined)
    }

    /**
     * Create, replace or delete all the objects passed as an argument.
     * Does the same for compositions of this bucket, from the
     * `#composition` field passed in the message.
     *
     * - If `#composition` is wrong, this will throw an exception.
     * - This will **REPLACE** objects and it's compositions if they already exist,
     *  so there might be unexpected data loss, use it carefully.
     * - It will only delete an object from the bucket if it contains `id` and `__delete: true`.
     * 
     * **WARNING** Tenancy currently not implemented for put.
     */
    async sync(
        objs: (PutObj<$> & { __delete: boolean })[]
    ): Promise<$['#data']> {
        return this.wrap('sync', { objs }, async (trx, bucket) => {
            for (const obj of objs) {
                if (obj.id && obj.__delete) {
                    await bucket.delete(trx, obj.id)
                }
                else {
                    await bucket.put(trx, obj)
                }
            }
        },
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
        return this.wrap('delete', { id }, (trx, bucket) =>
            bucket.delete(trx, id, {
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
        return this.wrap('deleteMany', { ids }, (trx, bucket) =>
            bucket.deleteMany(trx, ids, {
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
        view: V,
        flags?: {
            serialize: boolean
        }
    ): Promise<Obj> {
        return this.wrap('buildOne', { obj }, (trx, bucket) =>
            bucket.buildOne(trx, obj, view, flags),
        () => undefined)
    }

    async buildMany<
        V extends ViewName<$>,
        Obj extends ViewObj<$, V>
    >(
        objs: $['#data'][],
        view: V,
        flags?: {
            serialize: boolean
        }
    ): Promise<Obj[]> {
        return this.wrap('buildMany', { objs }, (trx, bucket) =>
            bucket.buildMany(trx, objs, view, flags),
        () => undefined)
    }

    /*
        Drive
    */

    /**
     * Methods to use the Bucket's drive (file storage).
     */
    get drive() {
        let drive;
        if (!this.bucket) {
            const module = TrxNode.getModule(this.trx);
            drive = Daemon.getBucketDrive(module.daemon!, this.tag);
        }
        else {
            drive = this.bucket.drive;
        }
        if (!drive) {
            throw NesoiError.Bucket.Drive.NoAdapter({ bucket: this.bucket?.schema.alias || this.tag.full });
        }
        return new BucketDriveTrxNode<M, $>(this, drive)
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
        if (!this.bucket) {
            throw new Error('Unsafe mode not allowed for external buckets');
        }
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
        return this.bucketTrx.wrap('patch', { obj }, (trx, bucket) =>
            bucket.update(trx, obj, {
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
        return this.bucketTrx.wrap('replace', { obj }, (trx, bucket) =>
            bucket.update(trx, obj, {
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
        return this.bucketTrx.wrap('delete', { id }, (trx, bucket) =>
            bucket.delete(trx, id, {
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
        return this.bucketTrx.wrap('deleteMany', { ids }, (trx, bucket) =>
            bucket.deleteMany(trx, ids, {
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
    
    private tag: Tag
    private trx: AnyTrxNode
    
    constructor(
        private bucketTrx: BucketTrxNode<M, $>,
        private drive: DriveAdapter
    ) {
        this.tag = (bucketTrx as any).tag as BucketTrxNode<any, any>['tag'];
        this.trx = (bucketTrx as any).trx as BucketTrxNode<any, any>['trx'];
    }

    /**
     * Read the contents of a File of this bucket's drive
     */
    read(file: NesoiFile, options?: { silent?: boolean }) {
        try {
            return this.drive.read(file);
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
            return this.drive.move(file, to);
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
            return this.drive.delete(file);
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