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
        link: LinkName,
        options?: {
            silent?: boolean
            no_tenancy?: boolean
        }
    ): Promise<Obj | Obj[] | undefined> {
        Log.trace('bucket', this.bucketName, `Read link ${link as string}`);
        const schema = this.schema.links[link as string];

        // Make tenancy query
        const tenancy = (options?.no_tenancy)
            ? undefined
            : this.bucket.getTenancyQuery(trx);

        // Query
        const module = TrxNode.getModule(trx);
        const query = {
            ...schema.query,
            '#and__tenancy__': tenancy
        };
        const params = [{ ...obj }];
        const page = {
            perPage: schema.many ? undefined : 1,
        }
        // External
        let links;
        if (schema.bucket.module !== module.name) {
            links = await trx.bucket(schema.bucket.short)
                .query(query)
                .params(params)
                .page(page);
        }
        // Internal
        else {
            const otherBucket = Tag.element(schema.bucket, trx) as AnyBucket;
            const adapter = otherBucket.cache || otherBucket.adapter;
            links = await adapter.query(trx, query, page, params);
        }
        
        // Empty response
        if (!schema.many && !schema.optional && !links.data.length) {
            // silent = undefined
            if (options?.silent) return;
            // non-silent = exception
            else {
                throw NesoiError.Bucket.Graph.RequiredLinkNotFound({
                    bucket: this.bucketName,
                    link: link as string,
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
        link: LinkName,
        options?: {
            silent?: boolean
            no_tenancy?: boolean
        }
    ): Promise<Obj[] | Obj[][]> {
        Log.trace('bucket', this.bucketName, `Read link ${link as string}`);
        const schema = this.schema.links[link as string];

        // Make tenancy query
        const tenancy = (options?.no_tenancy)
            ? undefined
            : this.bucket.getTenancyQuery(trx);

        // Query

        const module = TrxNode.getModule(trx);
        const query = {
            ...schema.query,
            '#and__tenancy__': tenancy
        };
        const params = objs.map(obj => ({ ...obj }));

        let tempAdapter: AnyMemoryBucketAdapter | AnyBucketCache;
        // External
        if (schema.bucket.module !== module.name) {
            const allLinks = await trx.bucket(schema.bucket.short)
                .query(query)
                .params(params)
                .all();

            const tempData: Record<string, any> = {};
            for (const obj of allLinks) tempData[obj.id] = obj;
            const otherBucket = await Daemon.getSchema(module.daemon!, schema.bucket) as $Bucket;
            tempAdapter = new MemoryBucketAdapter(otherBucket, tempData as never);
        }
        // Internal
        else {
            const otherBucket = Tag.element(schema.bucket, trx) as AnyBucket;
            
            if (otherBucket.adapter instanceof MemoryBucketAdapter) {
                tempAdapter = otherBucket.cache || otherBucket.adapter;
            }
            else {
                const adapter = otherBucket.cache || otherBucket.adapter;
                const allLinks = await adapter.query(trx, query, undefined, params);
                
                const tempData: Record<string, any> = {};
                for (const obj of allLinks.data) tempData[obj.id] = obj;
                tempAdapter = new MemoryBucketAdapter(otherBucket.schema, tempData as never);
            }
        }
           
        // Query
        const links: Obj[] | Obj[][] = [];
        for (const obj of objs) {
            const result = tempAdapter instanceof BucketCache
                ? await tempAdapter.query(trx, schema.query, {
                    perPage: schema.many ? undefined : 1,
                }, [{ ...obj }], undefined)
                : await tempAdapter.query(trx, schema.query, {
                    perPage: schema.many ? undefined : 1,
                }, [{ ...obj }], undefined, tempAdapter.nql);
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
        link: LinkName,
        view: V,
        options?: {
            silent?: boolean
            no_tenancy?: boolean
        }
    ): Promise<Obj | Obj[] | undefined> {
        Log.trace('bucket', this.bucketName, `Read link ${link as string}`);
        const schema = this.schema.links[link as string];
        
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

        // Make tenancy query
        const tenancy = (options?.no_tenancy)
            ? undefined
            : this.bucket.getTenancyQuery(trx);

        // Query
        const module = TrxNode.getModule(trx);
        const query = {
            ...schema.query,
            '#and__tenancy__': tenancy
        };
        const params = [{ ...obj }];
        const page = {
            perPage: 1,
        }
        // External
        let links;
        if (schema.bucket.module !== module.name) {
            links = await trx.bucket(schema.bucket.short)
                .query(query)
                .params(params)
                .page(page);
        }
        // Internal
        else {
            const otherBucket = Tag.element(schema.bucket, trx) as AnyBucket;
            const adapter = otherBucket.cache || otherBucket.adapter;
            links = await adapter.query(trx, query, page, params);
        }

        return !!links.data.length;
    }
}

export type AnyBucket = Bucket<any, any>