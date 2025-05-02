import { AnyTrxNode, TrxNode } from '~/engine/transaction/trx_node';
import { $Module, ViewName, ViewObj } from '~/schema';
import { Log } from '~/engine/util/log';
import { Bucket } from '../bucket';
import { $Bucket } from '../bucket.schema';
import { $BucketGraph } from './bucket_graph.schema';
import { NesoiError } from '~/engine/data/error';

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
        LinkBucketName extends $['graph']['links'][LinkName]['bucket']['refName'],
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
        const otherBucket = TrxNode.getModule(trx).buckets[schema.bucket.refName];
        const links = await otherBucket.adapter.query(trx, {
            ...schema.query,
            '#and': tenancy
        }, {
            perPage: schema.many ? undefined : 1,
        }, obj);
        
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
     * Read the data from a link and build it with a given view
     * 
     * - Options
     *   - `silent`: If not found, returns undefined instead of raising an exception (default: `false`)
     *   - `no_tenancy`: Don't apply tenancy rules (default: `false`)
     */
    public async viewLink<
        LinkName extends keyof $['graph']['links'],
        LinkBucketName extends $['graph']['links'][LinkName]['bucket']['refName'],
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
        const otherBucket = TrxNode.getModule(trx).buckets[schema.bucket.refName];

        const links = await this.readLink(trx, obj, link, options)
        if (!links) return undefined;

        if (Array.isArray(links)) {
            const output: Obj[] = [];
            for (const link of links) {
                output.push(await otherBucket.buildOne(trx, link, view));
            }
            return output;
        }
        else {
            return await otherBucket.buildOne(trx, links, view)
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
        const links = await this.bucket.adapter.query(trx, {
            ...schema.query,
            '#and': tenancy
        }, {
            perPage: 1,
        }, obj);

        return !!links.data.length;
    }
}

export type AnyBucket = Bucket<any, any>