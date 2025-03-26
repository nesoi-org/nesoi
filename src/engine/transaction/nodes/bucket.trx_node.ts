import { $Module, ViewName, ViewObj } from '~/schema';
import { NesoiError } from '../../data/error';
import { TrxNode } from '../trx_node';
import { BucketQueryTrxNode } from './bucket_query.trx_node';
import { $Bucket } from '~/elements/entities/bucket/bucket.schema';
import { Bucket } from '~/elements/entities/bucket/bucket';
import { CreateObj, PatchObj, PutObj, ReplaceObj } from '~/elements/entities/bucket/bucket.types';
import { NQL_AnyQuery, NQL_Query, NQL_Order, NQL_Pagination } from '~/elements/entities/bucket/query/nql.schema';

export class BucketTrxNode<M extends $Module, $ extends $Bucket> {
    constructor(
        private parentTrx: TrxNode<any, M, any>,
        private bucket: Bucket<M, $>
    ) {}

    // Read/View One

    async readOne(
        id: $['#data']['id']
    ): Promise<$['#data'] | undefined> {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        await TrxNode.open(trx, 'readOne', { id });
        
        let obj: $['#data'] | undefined;
        try {
            obj = await this.bucket.readOne(trx, id);
        }
        catch (e) {
            await TrxNode.error(trx, e); // Bucket unexpected error
            throw e;
        }

        await TrxNode.ok(trx, obj as any);
        return obj;
    }

    async viewOne<V extends ViewName<$>>(
        id: $['#data']['id'],
        view: V = 'default' as V
    ): Promise<ViewObj<$,V> | undefined> {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        await TrxNode.open(trx, 'viewOne', { id, view });
        
        let obj: ViewObj<$,V> | undefined;
        try {
            obj = await this.bucket.viewOne(trx, id, view);
        }
        catch (e) {
            await TrxNode.error(trx, e); // Bucket unexpected error
            throw e;
        }

        await TrxNode.ok(trx, obj as any);
        return obj;
    }

    async readOneOrFail(
        id: $['#data']['id']
    ): Promise<$['#data']> {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        await TrxNode.open(trx, 'readOneOrFail', { id });
        
        let obj: $['#data'] | undefined;
        try {
            obj = await this.bucket.readOne(trx, id);
        }
        catch (e) {
            await TrxNode.error(trx, e); // Bucket unexpected error
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

    async viewOneOrFail<V extends ViewName<$>>(
        id: $['#data']['id'],
        view: V = 'default' as V
    ): Promise<ViewObj<$,V>> {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        await TrxNode.open(trx, 'viewOneOrFail', { id, view });
        
        let obj: ViewObj<$,V> | undefined;
        try {
            obj = await this.bucket.viewOne(trx, id, view);
        }
        catch (e) {
            await TrxNode.error(trx, e); // Bucket unexpected error
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

    // All

    async readAll(
        pagination?: NQL_Pagination,
        order?: NQL_Order<$['#fieldpath']>
    ): Promise<$['#data'][]> {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        await TrxNode.open(trx, 'readAll', { pagination, order });
        
        let objs: $['#data'][];
        try {
            objs = await this.bucket.readAll(trx, pagination, order);
        }
        catch (e) {
            await TrxNode.error(trx, e); // Bucket unexpected error
            throw e;
        }
        
        await TrxNode.ok(trx, { length: objs.length });
        return objs;
    }

    async viewAll<V extends ViewName<$>>(
        view: V = 'default' as V,
        pagination?: NQL_Pagination,
        order?: NQL_Order<$['#fieldpath']>
    ): Promise<ViewObj<$, V>[]> {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        await TrxNode.open(trx, 'viewAll', { view, pagination, order });
        
        let objs: ViewObj<$, V>[];
        try {
            objs = await this.bucket.viewAll(trx, view, pagination, order);
        }
        catch (e) {
            await TrxNode.error(trx, e); // Bucket unexpected error
            throw e;
        }
        
        await TrxNode.ok(trx, { length: objs.length });
        return objs;
    }

    // Query

    query<
        V extends ViewName<$> = 'default'
    >(
        query: NQL_Query<M,$>,
        view: V = 'default' as any,
    ): BucketQueryTrxNode<M, $, V> {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        return new BucketQueryTrxNode(trx, this.bucket, query as NQL_AnyQuery, view);
    }

    // Graph Links

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
        
        let obj: $['#data'] | undefined;
        let linkObj;
        try {
            obj = await this.bucket.readOne(trx, id);
            if (!obj) {
                const schema = this.bucket.schema.graph.links[link as string];
                if (schema.many) { return [] as any }
                return undefined as any;
            }
            linkObj = await this.bucket.graph.readLink(trx, link, obj, view as string);
        }
        catch (e) {
            await TrxNode.error(trx, e); // Bucket unexpected error
            throw e;
        }

        await TrxNode.ok(trx, linkObj as any);
        return linkObj as any;
    }

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

        let obj: $['#data'] | undefined;
        let linkObj: Obj | Obj[] | undefined;
        try {
            obj = await this.bucket.readOne(trx, id);
            if (!obj) {
                const e = NesoiError.Bucket.ObjNotFound({ bucket: this.bucket.schema.alias, id: id });
                await TrxNode.error(trx, e);
                throw e;
            }
            linkObj = await this.bucket.graph.readLink(trx, link, obj, view as string) as Obj | Obj[] | undefined;
            if (!linkObj) {
                const e = NesoiError.Bucket.Graph.LinkNotFound({ bucket: this.bucket.schema.alias, link: link as string });
                await TrxNode.error(trx, e);
                throw e;
            }
        }
        catch (e) {
            await TrxNode.error(trx, e); // Bucket unexpected error
            throw e;
        }

        await TrxNode.ok(trx);
        return linkObj as any;
    }

    async hasLink<
        LinkName extends keyof $['graph']['links']
    >(
        id: $['#data']['id'],
        link: LinkName
    ): Promise<boolean | undefined> {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        await TrxNode.open(trx, 'hasLink', { id, link });
        
        let obj: $['#data'] | undefined;
        let result: boolean | undefined;
        try {
            obj = await this.bucket.readOne(trx, id);
            if (!obj) {
                return undefined;
            }
            result = await this.bucket.graph.hasLink(trx, id, obj);
        }
        catch (e) {
            await TrxNode.error(trx, e); // Bucket unexpected error
            throw e;
        }

        await TrxNode.ok(trx, { result });
        return result;
    }

    // Put / Create / Update

    /**
     * Updates an object by passing it directly to the bucket adapter,
     * without checking if it exists. This creates an object if a new
     * id is passed.
     */
    async put(
        obj: PutObj<$>
    ): Promise<$['#data']> {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        await TrxNode.open(trx, 'put', { obj });

        let _obj: $['#data'];
        try {
            _obj = await this.bucket.put(trx, obj as any);
        }
        catch (e) {
            await TrxNode.error(trx, e); // Bucket unexpected error
            throw e;
        }

        await TrxNode.ok(trx);
        return _obj;
    }

    /**
     * Creates an object by passing it to the bucket adapter,
     * without an ID (it's removed if passed).
     * This is a safer version of `put`, which ensures no update will happen.
     */
    async create(
        obj: CreateObj<$>
    ): Promise<$['#data']> {
        delete (obj as any)['id'];
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        await TrxNode.open(trx, 'create', { obj });

        const composition = (obj as any)['#composition'] || {};
        delete (obj as any)['#composition'];

        const input = Object.assign({}, this.bucket.schema.model.defaults, obj as any);
        let _obj: $['#data'];
        try {
            _obj = await this.bucket.put(trx, input);

            // Composition
            for(const link of Object.values(this.bucket.schema.graph.links)) {
                if (link.rel !== 'composition') continue;
                const linkObj = composition[link.name];
                if (!linkObj) {
                    const e = NesoiError.Bucket.MissingComposition({ method: 'create', bucket: this.bucket.schema.name, link: link.name })
                    await TrxNode.error(trx, e);
                    throw e;
                }
                if (link.many) {
                    if (!Array.isArray(linkObj)) {
                        const e = NesoiError.Bucket.CompositionValueShouldBeArray({ method: 'create', bucket: this.bucket.schema.name, link: link.name })
                        await TrxNode.error(trx, e);
                        throw e;
                    }
                    for (const linkObjItem of linkObj) {
                        await trx.bucket(link.bucket.refName).create(linkObjItem);
                    }
                }
                else {
                    await trx.bucket(link.bucket.refName).create(linkObj);
                }
            }

        }
        catch (e) {
            await TrxNode.error(trx, e); // Bucket unexpected error
            throw e;
        }

        await TrxNode.ok(trx);
        return _obj;
    }

    /**
     * Reads the id from the bucket adapter to ensure the object exists
     * before updating.
     * This is a safer version of `put`, suited for updating data.
     */
    async replace(
        obj: ReplaceObj<$>
    ): Promise<$['#data']> {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        await TrxNode.open(trx, 'replace', { obj });

        const composition = (obj as any)['#composition'] || {};
        delete (obj as any)['#composition'];

        let newObj: $['#data'];
        try {
            const oldObj = await this.bucket.readOne(trx, obj['id']);
            if (!oldObj) {
                const e = NesoiError.Bucket.ObjNotFound({ bucket: this.bucket.schema.alias, id: obj['id'] });
                await TrxNode.error(trx, e);
                throw e;
            }
            newObj = await this.bucket.put(trx, obj as any);

            // Composition
            for(const link of Object.values(this.bucket.schema.graph.links)) {
                if (link.rel !== 'composition') continue;
                const linkObj = composition[link.name];
                if (!linkObj) {
                    const e = NesoiError.Bucket.MissingComposition({ method: 'replace', bucket: this.bucket.schema.name, link: link.name })
                    await TrxNode.error(trx, e);
                    throw e;
                }
                if (link.many) {
                    if (!Array.isArray(linkObj)) {
                        const e = NesoiError.Bucket.CompositionValueShouldBeArray({ method: 'replace', bucket: this.bucket.schema.name, link: link.name })
                        await TrxNode.error(trx, e);
                        throw e;
                    }
                    for (const linkObjItem of linkObj) {
                        await trx.bucket(link.bucket.refName).replace(linkObjItem);
                    }
                }
                else {
                    await trx.bucket(link.bucket.refName).replace(linkObj);
                }
            }
        }
        catch (e) {
            await TrxNode.error(trx, e); // Bucket unexpected error
            throw e;
        }

        await TrxNode.ok(trx);
        return newObj;
    }

    /**
     * Reads the id from the bucket adapter to ensure the object exists
     * before updating. Applies changes to the object instead of replacing it.
     */
    async patch(
        obj: PatchObj<$>
    ): Promise<$['#data']> {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        await TrxNode.open(trx, 'patch', { obj });

        const composition = (obj as any)['#composition'] || {};
        delete (obj as any)['#composition'];

        let newObj: $['#data'];
        try {
            const oldObj = await this.bucket.readOne(trx, obj['id']);
            if (!oldObj) {
                const e = NesoiError.Bucket.ObjNotFound({ bucket: this.bucket.schema.alias, id: obj['id'] });
                await TrxNode.error(trx, e);
                throw e;
            }
            // TODO: deep merge
            const putObj = Object.assign({}, oldObj, obj)
            
            newObj = await this.bucket.put(trx, putObj as any);

            // Composition
            for(const link of Object.values(this.bucket.schema.graph.links)) {
                if (link.rel !== 'composition') continue;
                const linkObj = composition[link.name];
                if (!linkObj) {
                    const e = NesoiError.Bucket.MissingComposition({ method: 'patch', bucket: this.bucket.schema.name, link: link.name })
                    await TrxNode.error(trx, e);
                    throw e;
                }
                if (link.many) {
                    if (!Array.isArray(linkObj)) {
                        const e = NesoiError.Bucket.CompositionValueShouldBeArray({ method: 'patch', bucket: this.bucket.schema.name, link: link.name })
                        await TrxNode.error(trx, e);
                        throw e;
                    }
                    for (const linkObjItem of linkObj) {
                        await trx.bucket(link.bucket.refName).patch(linkObjItem);
                    }
                }
                else {
                    await trx.bucket(link.bucket.refName).patch(linkObj);
                }
            }
        }
        catch (e) {
            await TrxNode.error(trx, e); // Bucket unexpected error
            throw e;
        }

        await TrxNode.ok(trx);
        return newObj;
    }

    // Delete

    async delete(
        id: $['#data']['id']
    ): Promise<void> {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        await TrxNode.open(trx, 'delete', { id });

        try {
            // Composition (with other key)
            for(const link of Object.values(this.bucket.schema.graph.links)) {
                if (link.rel !== 'composition') continue;
                if (link.keyOwner !== 'other') continue;
                const linked = await this.readLink(id, link.name) as any;
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
            await this.bucket.delete(trx, id);

            // Composition (with self key)
            for(const link of Object.values(this.bucket.schema.graph.links)) {
                if (link.rel !== 'composition') continue;
                if (link.keyOwner !== 'self') continue;
                const linked = await this.readLink(id, link.name) as any;
                if (link.many) {
                    await trx.bucket(link.bucket.refName).deleteMany(linked.map((l: any) => l.id));
                }
                else {
                    await trx.bucket(link.bucket.refName).delete(linked.id);
                }
            }
        }
        catch (e) {
            await TrxNode.error(trx, e); // Bucket unexpected error
            throw e;
        }

        await TrxNode.ok(trx);
    }

    /**
     * **WARNING**: This does not currently implement composition
     */
    async deleteMany(
        ids: $['#data']['id'][]
    ): Promise<void> {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        await TrxNode.open(trx, 'deleteMany', { ids });

        try {
            // Composition (with other key)
            for(const link of Object.values(this.bucket.schema.graph.links)) {
                if (link.rel !== 'composition') continue;
                if (link.keyOwner !== 'other') continue;
                for (const id of ids) {
                    const linked = await this.readLink(id, link.name) as any;
                    if (link.many) {
                        await trx.bucket(link.bucket.refName).deleteMany(linked.map((l: any) => l.id));
                    }
                    else {
                        await trx.bucket(link.bucket.refName).delete(linked.id);
                    }
                }
            }

            await this.bucket.deleteMany(trx, ids);

            // Composition (with self key)
            for(const link of Object.values(this.bucket.schema.graph.links)) {
                if (link.rel !== 'composition') continue;
                if (link.keyOwner !== 'self') continue;
                for (const id of ids) {
                    const linked = await this.readLink(id, link.name) as any;
                    if (link.many) {
                        await trx.bucket(link.bucket.refName).deleteMany(linked.map((l: any) => l.id));
                    }
                    else {
                        await trx.bucket(link.bucket.refName).delete(linked.id);
                    }
                }
            }
        }
        catch (e) {
            await TrxNode.error(trx, e); // Bucket unexpected error
            throw e;
        }

        await TrxNode.ok(trx);
    }

    async deleteOrFail(
        id: $['#data']['id']
    ): Promise<void> {
        const trx = TrxNode.makeChildNode(this.parentTrx, this.bucket.schema.module, 'bucket', this.bucket.schema.name);
        await TrxNode.open(trx, 'deleteOrFail', { id });

        try {
            // Composition (with other key)
            for(const link of Object.values(this.bucket.schema.graph.links)) {
                if (link.rel !== 'composition') continue;
                if (link.keyOwner !== 'other') continue;
                const linked = await this.readLink(id, link.name) as any;
                if (link.many) {
                    for (const linkedItem of linked) {
                        await trx.bucket(link.bucket.refName).deleteOrFail(linkedItem.id);
                    }
                }
                else {
                    await trx.bucket(link.bucket.refName).deleteOrFail(linked.id);
                }
            }

            const obj = await this.bucket.readOne(trx, id);
            if (!obj) {
                const e = NesoiError.Bucket.ObjNotFound({ bucket: this.bucket.schema.alias, id: id });
                await TrxNode.error(trx, e);
                throw e;
            }
            await this.bucket.delete(trx, id);

            // Composition (with self key)
            for(const link of Object.values(this.bucket.schema.graph.links)) {
                if (link.rel !== 'composition') continue;
                if (link.keyOwner !== 'self') continue;
                const linked = await this.readLink(id, link.name) as any;
                if (link.many) {
                    for (const linkedItem of linked) {
                        await trx.bucket(link.bucket.refName).deleteOrFail(linkedItem.id);
                    }
                }
                else {
                    await trx.bucket(link.bucket.refName).deleteOrFail(linked.id);
                }
            }
        }
        catch (e) {
            await TrxNode.error(trx, e); // Bucket unexpected error
            throw e;
        }

        await TrxNode.ok(trx);
    }

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
            await TrxNode.error(trx, e); // Bucket unexpected error
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
            await TrxNode.error(trx, e); // Bucket unexpected error
            throw e;
        }

        await TrxNode.ok(trx);
        return result;
    }
}