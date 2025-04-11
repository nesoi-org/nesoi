import { AnyTrxNode, TrxNode } from '~/engine/transaction/trx_node';
import { $Module, ViewName, ViewObj } from '~/schema';
import { Log } from '~/engine/util/log';
import { Bucket } from '../bucket';
import { $Bucket } from '../bucket.schema';
import { $BucketGraph } from './bucket_graph.schema';
import { NesoiError } from '~/engine/data/error';

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

    // Graph

    public async readLinkOrFail<
        LinkName extends keyof $['graph']['links'],
        LinkBucketName extends $['graph']['links'][LinkName]['bucket']['refName'],
        LinkBucket extends M['buckets'][LinkBucketName],
        V extends ViewName<LinkBucket>,
        Obj extends ViewObj<LinkBucket, V>
    >(
        trx: AnyTrxNode,
        link: LinkName,
        obj: $['#data'],
        view: V = 'default' as V
    ): Promise<Obj | Obj[]> {
        const res = await this.readLink(trx, link, obj, view as string);
        if (!res) {
            const linkSchema = this.schema.links[link as string];
            // TODO: get bucket alias instead of name (for error message)
            throw NesoiError.Bucket.ObjNotFound({ bucket: linkSchema.bucket.name, id: obj.id });
        }
        return res as any;
    }

    public async readLink<
        LinkName extends keyof $['graph']['links'],
        LinkBucketName extends $['graph']['links'][LinkName]['bucket']['refName'],
        LinkBucket extends M['buckets'][LinkBucketName],
        V extends ViewName<LinkBucket>,
        Obj extends ViewObj<LinkBucket, V>
    >(
        trx: AnyTrxNode,
        link: LinkName,
        obj: $['#data'],
        view: V = 'default' as V
    ): Promise<Obj | Obj[] | undefined> {
        const schema = this.schema.links[link as string];
        Log.trace('bucket', this.bucketName, `Read link ${link as string}`, schema);

        const otherBucket = TrxNode.getModule(trx).buckets[schema.bucket.refName];

        const links = await otherBucket.adapter.query(trx, schema.query, {
            perPage: schema.many ? undefined : 1
        }, obj);
        
        if (!schema.many && !schema.optional && !links.data.length) {
            throw NesoiError.Bucket.Graph.RequiredLinkNotFound({
                bucket: this.bucketName,
                link: link as string,
                id: obj.id
            });
        }

        if (schema.many) {
            return links.data as Obj[];
        }
        else {
            return links.data[0] as Obj;
        }
    }


    public async hasLink<
        LinkName extends keyof $['graph']['links'],
    >(
        trx: AnyTrxNode,
        link: LinkName,
        obj: $['#data']
    ): Promise<boolean> {
        const schema = this.schema.links[link as string];
        Log.trace('bucket', this.bucketName, `Has link ${link as string}`, schema);

        const links = await this.bucket.adapter.query(trx, schema.query, {
            perPage: schema.many ? undefined : 1
        }, {
            params: obj
        });

        return !!links.data.length;
    }
}

export type AnyBucket = Bucket<any, any>