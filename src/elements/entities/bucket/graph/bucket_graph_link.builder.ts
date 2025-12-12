import type { $Module } from '~/schema';
import type { BucketBuilderNode } from '../bucket.builder';
import type { $Bucket } from '../bucket.schema';
import type { NQL_AnyQuery, NQL_Query } from '../query/nql.schema';

import { $BucketGraphLink } from './bucket_graph.schema';
import { Dependency, Tag } from '~/engine/dependency';

/*
    Factory
*/


/**
 * @category Builders
 * @subcategory Entity
 * */
export class BucketGraphLinkFactory<
    Module extends $Module,
    SelfBucket extends $Bucket
> {

    private alias?: string;
    private type: 'aggregation' | 'composition' = 'aggregation';

    constructor(
        private module: string
    ) {}

    as(alias: string) {
        this.alias = alias;
        return this;
    }

    get compose (){
        const self = new BucketGraphLinkFactory(this.module);
        self.type = 'composition';
        return self as typeof this
    }

    one<
        N extends keyof Module['buckets'],
        Bucket extends $Bucket = Module['buckets'][N]
    >(bucket: N, query: NQL_Query<Module, Bucket>) {
        
        const tag = Tag.fromNameOrShort(this.module, 'bucket', bucket as string);
        
        return new BucketGraphLinkBuilder<
            Module, SelfBucket, Module['buckets'][N], false
        >(
            new Dependency(this.module, tag, { compile: true, runtime: true }),
            this.type,
            query as NQL_Query<any, any>,
            false,
            this.alias
        );
    }

    many<
        N extends keyof Module['buckets'],
        Bucket extends $Bucket = Module['buckets'][N]
    >(bucket: N, query: NQL_Query<Module, Bucket>) {
        const tag = Tag.fromNameOrShort(this.module, 'bucket', bucket as string);
        return new BucketGraphLinkBuilder<
            Module, SelfBucket, Module['buckets'][N], true
        >(
            new Dependency(this.module, tag, { compile: true, runtime: true }),
            this.type,
            query as NQL_Query<any, any>,
            true,
            this.alias
        );
    }

}

/*
    Builder
*/

/**
 * @category Builders
 * @subcategory Entity
 * */
export class BucketGraphLinkBuilder<
    Module extends $Module,
    SelfBucket extends $Bucket,
    OtherBucket extends $Bucket,
    Many extends boolean
> {
    public '#other': OtherBucket
    public '#many': Many

    private _optional = false;

    constructor(
        private bucket: Dependency,
        private rel: 'aggregation'|'composition',
        private query: NQL_AnyQuery,
        private many: boolean,
        private alias?: string
    ) {}

    as(alias: string) {
        this.alias = alias;
        return this;
    }

    get optional() {
        this._optional = true;
        return this;
    }


    public static build(node: BucketBuilderNode, builder: BucketGraphLinkBuilder<any, any, any, any>, name: string) {
        return new $BucketGraphLink(
            name,
            builder.alias || name,
            builder.bucket.tag,
            builder.rel,
            builder.many,
            builder._optional,
            this.inferKeyOwner(builder.query),
            builder.query,
        );
    }

    public static inferKeyOwner(query: NQL_AnyQuery) {
        const keyOwner: 'self'|'other'|'pivot' = 'self';
        // TODO
        return keyOwner;
    }
}

/*
    Collection
*/

export type BucketGraphLinkBuilders = {
    [x: string]: BucketGraphLinkBuilder<any, any, any, any>
}