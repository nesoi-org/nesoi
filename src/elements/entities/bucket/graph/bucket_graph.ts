import { AnyTrxNode } from '~/engine/transaction/trx_node';
import { $Module, ViewName, ViewObj } from '~/schema';
import { Log } from '~/engine/util/log';
import { Tree } from '~/engine/data/tree';
import { Bucket } from '../bucket';
import { $Bucket } from '../bucket.schema';
import { $BucketGraph, $BucketGraphLink } from './bucket_graph.schema';
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
        view: V = 'default' as V,
        index: (string|number)[] = []
    ): Promise<Obj | Obj[]> {
        const res = await this.readLink(trx, link, obj, view as string, index);
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
        view: V = 'default' as V,
        index: (string|number)[] = []
    ): Promise<Obj | Obj[] | undefined> {
        const schema = this.schema.links[link as string];
        Log.trace('bucket', this.bucketName, `Read link ${link as string}`, schema);

        const selfValue = Tree.get(obj as Record<string, any>, schema.selfKey, index);
        if (!selfValue) {
            return undefined;
        }

        // Validate value type
        if (schema.many) {
            if (schema.keyOwner === 'self') {
                if (!Array.isArray(selfValue)) {
                    throw NesoiError.Bucket.Graph.LinkManyRefOnSelfWithoutArrayValue(schema.name);
                }
            }
            else {
                if (Array.isArray(selfValue)) {
                    throw NesoiError.Bucket.Graph.LinkManyRefOffSelfWithArrayValue(schema.name);
                }
            }
        }
        else {
            if (Array.isArray(selfValue)) {
                throw NesoiError.Bucket.Graph.LinkOneWithArrayValue(schema.name);
            }
        }

        // 
        const links = schema.many
            ? await this.readManyLink(trx, schema, selfValue, view as string)
            : await this.readOneLink(trx, schema, selfValue, view as string);
        
        if (!schema.many && !schema.optional && !links) {
            throw NesoiError.Bucket.Graph.RequiredLinkNotFound(schema.name, selfValue);
        }

        return links;
    }

    private async readOneLink(trx: AnyTrxNode, link: $BucketGraphLink, selfValue: any, view: string) {
        const linkBucket = trx.bucket(link.bucket.refName);
        if (link.keyOwner === 'self' || link.keyOwner === 'other') {
            const q = linkBucket.query({
                [link.otherKey]: selfValue
            }, view)
            if (link.query) { q.merge(link.query); }
            return q.first();
        }
        else if (link.keyOwner === 'pivot') {
            const pivotBucket = trx.bucket(link.pivotBucket!);
            const pivotSelfKey = this.bucket.schema.name+'_id';
            const pivotOtherKey = link.bucket+'_id';
            const pivotObj = await linkBucket.query({
                [pivotSelfKey]: selfValue
            }, view).first();
            const pivotValue = pivotObj[pivotOtherKey];
            if (pivotValue === undefined || pivotValue === null) {
                throw NesoiError.Bucket.Graph.PivotValueIsUndefined(link.name);
            }
            const q = linkBucket.query({
                [link.otherKey]: pivotValue
            }, view)
            if (link.query) { q.merge(link.query); }
            return q.first();
        }
    }

    private async readManyLink(trx: AnyTrxNode, link: $BucketGraphLink, selfValue: any, view: string) {
        const linkBucket = trx.bucket(link.bucket.refName);
        if (link.keyOwner === 'self') {
            const q = linkBucket.query({
                [link.otherKey]: selfValue
            }, view)
            if (link.query) { q.merge(link.query); }
            return q.all();
        }
        else if (link.keyOwner === 'other') {
            const q = linkBucket.query({
                [link.otherKey]: selfValue
            }, view)
            if (link.query) { q.merge(link.query); }
            return q.all();
        }
        else if (link.keyOwner === 'pivot') {
            const pivotBucket = trx.bucket(link.pivotBucket!);
            const pivotSelfKey = this.bucket.schema.name+'_id';
            const pivotOtherKey = link.bucket+'_id';
            const q = pivotBucket.query({
                [pivotSelfKey]: selfValue
            }, view)
            if (link.query) { q.merge(link.query); }
            const pivotObjs = await q.all();
            const pivotValues = pivotObjs.map(obj => obj[pivotOtherKey]);
            if (!pivotValues.length) {
                return [];
            }
            return linkBucket.query({
                [`${link.otherKey} in`]: pivotValues
            } as any, view)
        }
    }

    public async hasLink<
        LinkName extends keyof $['graph']['links'],
    >(
        trx: AnyTrxNode,
        link: LinkName,
        obj: $['#data']
    ): Promise<boolean> {
        const links = await this.readLink(trx, link, obj);
        if (Array.isArray(links)) {
            return !!links.length;
        }
        return !!links;
    }
}

export type AnyBucket = Bucket<any, any>