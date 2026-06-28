import type { ViewName } from '~/schema';
import type { Bucket } from '~/elements/entities/bucket/bucket';
import type { CreateObj, PutObj } from '~/elements/entities/bucket/bucket.types';
import type { NQL_AnyQuery, NQL_Query } from '~/elements/entities/bucket/query/nql.schema';
import type { DriveAdapter } from '~/elements/entities/drive/drive_adapter';

import type { AnyTrxNode} from '../trx_node';
import { TrxNode } from '../trx_node';
import { BucketQueryTrxNode } from './bucket_query.trx_node';
import { NesoiError } from '~/engine/data/error';
import { Tag } from '~/engine/dependency';
import { ExternalTrxNode } from './external.trx_node';
import { Daemon } from '~/engine/daemon';
import { BucketViewTrxNode } from './bucket_view.trx_node';
import type { BucketViewDef } from '~/elements/entities/bucket/view/bucket_view.builder';
import { BucketLinkTrxNode } from './bucket_link.trx_node';

/**
 * @category Engine
 * @subcategory Transaction
 */
export class BucketTrxNode<Space extends $Space, M extends $Module, $ extends $Bucket> {
    
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
        Wrap
    */

    protected async wrap(
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
            return ext.run(trx => wrapped(trx, Tag.element(this.tag, trx)));
        }
        else {
            return wrapped(this.trx, this.bucket!)
        }
    }

    /*
        Read
    */

    public read = {

        /**
         * Returns one object by `id`, without building it,
         * or `undefined` if the object was not found.
         * 
         * Options:
         * - `no_tenancy`: Don't apply tenancy rules when reading the object.
         * - `no_cast`: Reads the object as stored on the adapter, without parsing. Can improve performance but cause inconsistent behavior between adapters.
         * - `roots`: Specify which root fields to be read from the object.
         */
        async one(
            id: $['#data']['id'],
            options?: {
                no_tenancy?: boolean
                no_cast?: boolean
                roots?: string[]
            }
        ): Promise<$['#data']> {
            // const results = await this.wrap(
            //     'read.one',
            //     { id },
            //     async (trx, bucket) => {
            //         return bucket.readOne(trx, id, options);
            //     }
            // )
            // return results.data as $['#data'][];
            return {} as any
        },

        /**
         * Returns many objects by `id`, without building them.
         * 
         * Options:
         * - `no_tenancy`: Don't apply tenancy rules when reading the object.
         * - `no_cast`: Reads the object as stored on the adapter, without parsing. Can improve performance but cause inconsistent behavior between adapters.
         * - `roots`: Specify which root fields to be read from the object.
         */
        async many(
            ids: $['#data']['id'][],
            options?: {
                no_tenancy?: boolean
                no_cast?: boolean
                roots?: string[]
            }
        ): Promise<$['#data'][]> {
            // const results = await this.wrap(
            //     'read.many',
            //     { ids },
            //     async (trx, bucket) => {
            //         return bucket.readAll(trx, options);
            //     },
            //     objs => ({ length: objs.length })
            // )
            // return results.data as $['#data'][];
            return []
        },

        /**
         * Returns all objects, without building it,
         * or `undefined` if the object was not found.
         * 
         * Options:
         * - `no_tenancy`: Don't apply tenancy rules when reading the object.
         * - `no_cast`: Reads the object as stored on the adapter, without parsing. Can improve performance but cause inconsistent behavior between adapters.
         * - `roots`: Specify which root fields to be read from the object.
         */
        async all(options?: {
            no_tenancy?: boolean
            no_cast?: boolean
            roots?: string[]
        }): Promise<$['#data'][]> {
            // const results = await this.wrap(
            //     'read.all',
            //     {},
            //     async (trx, bucket) => {
            //         return bucket.readAll(trx, options);
            //     },
            //     objs => ({ length: objs.length })
            // )
            // return results.data as $['#data'][];
            return []
        }
    }
    
    view<
        V extends ViewName<$>
    >(
        view: V | BucketViewDef<Space, M, $, $, $['#data']> = 'default' as V
    ) {
        return new BucketViewTrxNode<Space, M, $>(this, view as any);
    }
    
    link<
        LinkName extends keyof $['graph']['links']
    >(
        link: LinkName
    ) {
        return new BucketLinkTrxNode<Space, M, $>(this, link as string);
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
        Create
    */

    public create = {
        /**
         * Creates one object.
         * 
         * Options:
         * - `return`: Returns a list of the created objects
         */
        async one<Return extends boolean>(
            obj: CreateObj<$>,
            options?: {
                return?: Return
            }
        ): Promise<Return extends true ? $['#data'] : undefined> {
            // const results = await this.wrap(
            //     'read.one',
            //     { id },
            //     async (trx, bucket) => {
            //         return bucket.readOne(trx, id, options);
            //     }
            // )
            // return results.data as Obj[];
            return undefined as any;
        },

        /**
         * Creates many objects.
         * 
         * Options:
         * - `return`: Returns a list of the created objects
         */
        async many<Return extends boolean>(
            objs: CreateObj<$>[],
            options?: {
                return?: Return
            }
        ): Promise<Return extends true ? $['#data'][] : undefined> {
            // const results = await this.wrap(
            //     'read.many',
            //     { ids },
            //     async (trx, bucket) => {
            //         return bucket.readAll(trx, options);
            //     },
            //     objs => ({ length: objs.length })
            // )
            // return results.data as Obj[];
            return undefined as any;
        }
    }

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
    public patch = {
        /**
         * Creates one object.
         * 
         * Options:
         * - `return`: Returns a list of the created objects
         */
        async one<Return extends boolean>(
            id: $['#data']['id'],
            options?: {
                return?: Return
            }
        ): Promise<Return extends true ? $['#data'] : undefined> {
            // const results = await this.wrap(
            //     'read.one',
            //     { id },
            //     async (trx, bucket) => {
            //         return bucket.readOne(trx, id, options);
            //     }
            // )
            // return results.data as Obj[];
            return undefined as any;
        },

        /**
         * Creates many objects.
         * 
         * Options:
         * - `return`: Returns a list of the created objects
         */
        async many<Return extends boolean>(
            ids: $['#data']['id'][],
            options?: {
                return?: Return
            }
        ): Promise<Return extends true ? $['#data'][] : undefined> {
            // const results = await this.wrap(
            //     'read.many',
            //     { ids },
            //     async (trx, bucket) => {
            //         return bucket.readAll(trx, options);
            //     },
            //     objs => ({ length: objs.length })
            // )
            // return results.data as Obj[];
            return undefined as any;
        },

        /**
         * Patchs all objects affected by query.
         * 
         * Options:
         * - `return`: Returns a list of the created objects
         */
        async query<Return extends boolean>(
            query: NQL_Query<M, $>,
            options?: {
                return?: Return
            }
        ): Promise<Return extends true ? $['#data'][] : undefined> {
            // const results = await this.wrap(
            //     'read.many',
            //     { ids },
            //     async (trx, bucket) => {
            //         return bucket.readAll(trx, options);
            //     },
            //     objs => ({ length: objs.length })
            // )
            // return results.data as Obj[];
            return undefined as any;
        }
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
    public replace = {
        /**
         * Replaces one object.
         * 
         * Options:
         * - `return`: Returns a list of the created objects
         */
        async one<Return extends boolean>(
            id: $['#data']['id'],
            options?: {
                return?: Return
            }
        ): Promise<Return extends true ? $['#data'] : undefined> {
            // const results = await this.wrap(
            //     'read.one',
            //     { id },
            //     async (trx, bucket) => {
            //         return bucket.readOne(trx, id, options);
            //     }
            // )
            // return results.data as Obj[];
            return undefined as any;
        },

        /**
         * Replaces many objects.
         * 
         * Options:
         * - `return`: Returns a list of the created objects
         */
        async many<Return extends boolean>(
            ids: $['#data']['id'][],
            options?: {
                return?: Return
            }
        ): Promise<Return extends true ? $['#data'][] : undefined> {
            // const results = await this.wrap(
            //     'read.many',
            //     { ids },
            //     async (trx, bucket) => {
            //         return bucket.readAll(trx, options);
            //     },
            //     objs => ({ length: objs.length })
            // )
            // return results.data as Obj[];
            return undefined as any;
        },

        /**
         * Replaces all objects affected by query.
         * 
         * Options:
         * - `return`: Returns a list of the created objects
         */
        async query<Return extends boolean>(
            query: NQL_Query<M, $>,
            options?: {
                return?: Return
            }
        ): Promise<Return extends true ? $['#data'][] : undefined> {
            // const results = await this.wrap(
            //     'read.many',
            //     { ids },
            //     async (trx, bucket) => {
            //         return bucket.readAll(trx, options);
            //     },
            //     objs => ({ length: objs.length })
            // )
            // return results.data as Obj[];
            return undefined as any;
        }
    }

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
    public put = {
        /**
         * Replaces one object.
         * 
         * Options:
         * - `return`: Returns a list of the created objects
         */
        async one<Return extends boolean>(
            id: $['#data']['id'],
            options?: {
                return?: Return
            }
        ): Promise<Return extends true ? $['#data'] : undefined> {
            // const results = await this.wrap(
            //     'read.one',
            //     { id },
            //     async (trx, bucket) => {
            //         return bucket.readOne(trx, id, options);
            //     }
            // )
            // return results.data as Obj[];
            return undefined as any;
        },

        /**
         * Replaces many objects.
         * 
         * Options:
         * - `return`: Returns a list of the created objects
         */
        async many<Return extends boolean>(
            ids: $['#data']['id'][],
            options?: {
                return?: Return
            }
        ): Promise<Return extends true ? $['#data'][] : undefined> {
            // const results = await this.wrap(
            //     'read.many',
            //     { ids },
            //     async (trx, bucket) => {
            //         return bucket.readAll(trx, options);
            //     },
            //     objs => ({ length: objs.length })
            // )
            // return results.data as Obj[];
            return undefined as any;
        }
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
    public delete = {
        /**
         * Replaces one object.
         * 
         * Options:
         * - `return`: Returns a list of the created objects
         */
        async one<Return extends boolean>(
            id: $['#data']['id'],
            options?: {
                return?: Return
            }
        ): Promise<Return extends true ? $['#data'] : undefined> {
            // const results = await this.wrap(
            //     'read.one',
            //     { id },
            //     async (trx, bucket) => {
            //         return bucket.readOne(trx, id, options);
            //     }
            // )
            // return results.data as Obj[];
            return undefined as any;
        },

        /**
         * Replaces many objects.
         * 
         * Options:
         * - `return`: Returns a list of the created objects
         */
        async many<Return extends boolean>(
            ids: $['#data']['id'][],
            options?: {
                return?: Return
            }
        ): Promise<Return extends true ? $['#data'][] : undefined> {
            // const results = await this.wrap(
            //     'read.many',
            //     { ids },
            //     async (trx, bucket) => {
            //         return bucket.readAll(trx, options);
            //     },
            //     objs => ({ length: objs.length })
            // )
            // return results.data as Obj[];
            return undefined as any;
        },

        /**
         * Replaces all objects affected by query.
         * 
         * Options:
         * - `return`: Returns a list of the created objects
         */
        async query<Return extends boolean>(
            query: NQL_Query<M, $>,
            options?: {
                return?: Return
            }
        ): Promise<Return extends true ? $['#data'][] : undefined> {
            // const results = await this.wrap(
            //     'read.many',
            //     { ids },
            //     async (trx, bucket) => {
            //         return bucket.readAll(trx, options);
            //     },
            //     objs => ({ length: objs.length })
            // )
            // return results.data as Obj[];
            return undefined as any;
        }
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
        return new BucketDriveTrxNode<Space, M, $>(this, drive)
    }

}

/**
 * @category Engine
 * @subcategory Transaction
 */
export class BucketDriveTrxNode<Space extends $Space, M extends $Module, $ extends $Bucket> {
    
    private tag: Tag
    private trx: AnyTrxNode
    
    constructor(
        private bucketTrx: BucketTrxNode<Space, M, $>,
        private drive: DriveAdapter
    ) {
        this.tag = (bucketTrx as any).tag as BucketTrxNode<Space, any, any>['tag'];
        this.trx = (bucketTrx as any).trx as BucketTrxNode<Space, any, any>['trx'];
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