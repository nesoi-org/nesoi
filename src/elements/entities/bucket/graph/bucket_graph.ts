import { AnyTrxNode, TrxNode } from '~/engine/transaction/trx_node';
import { $Module, ViewName, ViewObj } from '~/schema';
import { Log } from '~/engine/util/log';
import { Bucket } from '../bucket';
import { $Bucket } from '../bucket.schema';
import { $BucketGraph } from './bucket_graph.schema';
import { NesoiError } from '~/engine/data/error';
import { AnyMemoryBucketAdapter, MemoryBucketAdapter } from '../adapters/memory.bucket_adapter';
import { AnyBucketCache, BucketCache } from '../cache/bucket_cache';
import { Daemon } from '~/engine/daemon';
import { Tag } from '~/engine/dependency';
import { Trx } from '~/engine/transaction/trx';

/**
 * @category Elements
 * @subcategory Entity
 * */
export class BucketGraph<
    M extends $Module,
    $ extends $Bucket
> {

    private bucketName: string;
    private schema: $BucketGraph;

    constructor(
        private bucket: Bucket<M, $>
    ) {
        this.bucketName = bucket.schema.name;
        this.schema = bucket.schema.graph;
    }

    /**
     * Read the data from a link
     * 
     * - Options
     *   - `silent`: If not found, returns undefined instead of raising an exception (default: `false`)
     *   - `no_tenancy`: Don't apply tenancy rules (default: `false`)
     */
    public async readLink<
        LinkName extends keyof $['graph']['links'],
        LinkBucketName extends $['graph']['links'][LinkName]['bucket']['short'],
        LinkBucket extends M['buckets'][LinkBucketName],
        Obj = LinkBucket['#data']
    >(
        trx: AnyTrxNode,
        obj: $['#data'],
        link: { name: LinkName, index: string[] },
        options?: {
            silent?: boolean
            no_tenancy?: boolean
        }
    ): Promise<Obj | Obj[] | undefined> {
        Log.trace('bucket', this.bucketName, `Read link ${link.name as string}`);
        const schema = this.schema.links[link.name as never];

        const module = TrxNode.getModule(trx);
        const page = {
            perPage: schema.many ? undefined : 1,
        }
        // Params
        const params = [{ ...obj }];
        const param_templates = link.index.length
            ? Object.fromEntries(link.index
                .map((s, i) => [`$${i}`, s]))
            : undefined;

        // External
        let links;
        if (schema.bucket.module !== module.name) {
            links = await trx.bucket(schema.bucket.short)
                .query(schema.query)
                .params(params)
                .param_templates(param_templates)
                .page(page);
        }
        // Internal
        else {
            const otherBucket = Tag.element(schema.bucket, trx) as AnyBucket;

            // Make tenancy query
            const tenancy = (options?.no_tenancy)
                ? undefined
                : otherBucket.getTenancyQuery(trx);

            const query = {
                ...schema.query,
                '#and __tenancy__': tenancy
            };
            
            const adapter = await Trx.getCache(trx, this.bucket as AnyBucket) || otherBucket.cache || otherBucket.adapter;
            links = await adapter.query(trx, query, page, params, param_templates ? [param_templates] : undefined);
        }
        
        // Empty response
        if (!schema.many && !schema.optional && !links.data.length) {
            // silent = undefined
            if (options?.silent) return;
            // non-silent = exception
            else {
                throw NesoiError.Bucket.Graph.RequiredLinkNotFound({
                    bucket: this.bucketName,
                    link: link.name as string,
                    id: obj.id
                });
            }
        }

        if (schema.many) {
            return links.data as Obj[];
        }
        else {
            return links.data[0] as Obj;
        }
    }

    /**
     * Read the data from a link
     * 
     * - Options
     *   - `silent`: If not found, returns undefined instead of raising an exception (default: `false`)
     *   - `no_tenancy`: Don't apply tenancy rules (default: `false`)
     */
    public async readManyLinks<
        LinkName extends keyof $['graph']['links'],
        LinkBucketName extends $['graph']['links'][LinkName]['bucket']['short'],
        LinkBucket extends M['buckets'][LinkBucketName],
        Obj = LinkBucket['#data']
    >(
        trx: AnyTrxNode,
        objs: $['#data'][],
        link: { name: LinkName, indexes: string[][] },
        options?: {
            silent?: boolean
            no_tenancy?: boolean
        }
    ): Promise<Obj[] | Obj[][]> {
        Log.trace('bucket', this.bucketName, `Read link ${link.name as string}`);
        const schema = this.schema.links[link.name as string];

        // 1st Query

        const module = TrxNode.getModule(trx);
        
        const params = objs.map(obj => ({ ...obj }));
        const param_templates = link.indexes.length
            ? link.indexes.map(index => Object.fromEntries(index
                .map((s, i) => [`$${i}`, s]))
            ): undefined;

        let tempAdapter: AnyMemoryBucketAdapter | AnyBucketCache;
        // External
        if (schema.bucket.module !== module.name) {
            const allLinks = await trx.bucket(schema.bucket.short)
                .query(schema.query)
                .params(params)
                .param_templates(param_templates)
                .all();

            const tempData: Record<string, any> = {};
            for (const obj of allLinks) tempData[obj.id] = obj;
            const otherBucket = await Daemon.getBucketMetadata(module.daemon!, schema.bucket);
            tempAdapter = new MemoryBucketAdapter(otherBucket.schema, tempData as never);
        }
        // Internal
        else {
            const otherBucket = Tag.element(schema.bucket, trx) as AnyBucket;

            // Make tenancy query
            const tenancy = (options?.no_tenancy)
                ? undefined
                : otherBucket.getTenancyQuery(trx);
        
            const query = {
                ...schema.query,
                '#and __tenancy__': tenancy
            };
            
            if (otherBucket.adapter instanceof MemoryBucketAdapter) {
                tempAdapter = await Trx.getCache(trx, this.bucket as AnyBucket) || otherBucket.cache || otherBucket.adapter;
            }
            else {
                const adapter = await Trx.getCache(trx, this.bucket as AnyBucket) || otherBucket.cache || otherBucket.adapter;
                const allLinks = await adapter.query(trx, query, undefined, params, param_templates);
                
                const tempData: Record<string, any> = {};
                for (const obj of allLinks.data) tempData[obj.id] = obj;
                tempAdapter = new MemoryBucketAdapter(otherBucket.schema, tempData as never);
            }
        }
           
        // 2nd Query

        const links: Obj[] | Obj[][] = [];
        for (const obj of objs) {
            const result = tempAdapter instanceof BucketCache
                ? await tempAdapter.query(trx, schema.query, {
                    perPage: schema.many ? undefined : 1,
                }, [{ ...obj }], undefined)
                : await tempAdapter.query(trx, schema.query, {
                    perPage: schema.many ? undefined : 1,
                }, [{ ...obj }], undefined, undefined, {
                    module: schema.bucket.module,
                    runners: {
                        [tempAdapter.getQueryMeta().scope]: tempAdapter.nql
                    },
                    metadata: {
                        ...tempAdapter.getQueryMeta(),
                        schema: tempAdapter.schema,
                        tag: schema.bucket,
                        meta: tempAdapter.config.meta
                    }
                });
            if (schema.many) {
                links.push(result.data as never)
            }
            else {
                links.push(result.data[0] as never);
            }
        }

        // Empty response
        return links;
    }

    /**
     * Read the data from a link and build it with a given view
     * 
     * - Options
     *   - `silent`: If not found, returns undefined instead of raising an exception (default: `false`)
     *   - `no_tenancy`: Don't apply tenancy rules (default: `false`)
     */
    public async viewLink<
        LinkName extends keyof $['graph']['links'],
        LinkBucketName extends $['graph']['links'][LinkName]['bucket']['short'],
        LinkBucket extends M['buckets'][LinkBucketName],
        V extends ViewName<LinkBucket>,
        Obj extends ViewObj<LinkBucket, V>
    >(
        trx: AnyTrxNode,
        obj: $['#data'],
        link: { name: LinkName, index: string[] },
        view: V,
        options?: {
            silent?: boolean
            no_tenancy?: boolean
            param_templates?: Record<string, any>
        }
    ): Promise<Obj | Obj[] | undefined> {
        Log.trace('bucket', this.bucketName, `Read link ${link.name as string}`);
        const schema = this.schema.links[link.name as string];
        
        const links = await this.readLink(trx, obj, link, options)
        if (!links) return undefined;
        
        const module = TrxNode.getModule(trx);
        
        // External
        if (schema.bucket.module !== module.name) {
            if (Array.isArray(links)) {
                return trx.bucket(schema.bucket.short).buildMany(links, view)
            }
            else {
                return await trx.bucket(schema.bucket.short).buildOne(links, view)
            }
        }
        // Internal
        else {
            const otherBucket = Tag.element(schema.bucket, trx) as AnyBucket;
            if (Array.isArray(links)) {
                return await otherBucket.buildMany(trx, links, view);
            }
            else {
                return await otherBucket.buildOne(trx, links, view)
            }
        }
    }

    /**
     * Return true if the link resolves to at least one object
     * 
     * - Options
     *   - `silent`: If not found, returns undefined instead of raising an exception
     *   - `no_tenancy`: Don't apply tenancy rules
     */
    public async hasLink<
        LinkName extends keyof $['graph']['links'],
    >(
        trx: AnyTrxNode,
        link: LinkName,
        obj: $['#data'],
        options?: {
            no_tenancy?: boolean
        }
    ): Promise<boolean> {
        Log.trace('bucket', this.bucketName, `Has link ${link as string}`);
        const schema = this.schema.links[link as string];

        // Query
        const module = TrxNode.getModule(trx);
        const params = [{ ...obj }];
        const page = {
            perPage: 1,
        }
        // External
        let links;
        if (schema.bucket.module !== module.name) {
            links = await trx.bucket(schema.bucket.short)
                .query(schema.query)
                .params(params)
                .page(page);
        }
        // Internal
        else {
            const otherBucket = Tag.element(schema.bucket, trx) as AnyBucket;
            // Make tenancy query
            const tenancy = (options?.no_tenancy)
                ? undefined
                : otherBucket.getTenancyQuery(trx);
            const query = {
                ...schema.query,
                '#and__tenancy__': tenancy
            };

            const adapter = await Trx.getCache(trx, this.bucket as AnyBucket) || otherBucket.cache || otherBucket.adapter;
            links = await adapter.query(trx, query, page, params);
        }

        return !!links.data.length;
    }
}

export type AnyBucket = Bucket<any, any>