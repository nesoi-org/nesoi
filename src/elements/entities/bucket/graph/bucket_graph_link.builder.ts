import { $Module } from '~/schema';
import { $BucketGraphLink } from './bucket_graph.schema';
import { BucketBuilderNode } from '../bucket.builder';
import { $Dependency } from '~/engine/dependency';
import { $Bucket } from '../bucket.schema';
import { NQL_AnyQuery, NQL_Query } from '../query/nql.schema';

/*
    Types
*/

type BucketGraphLinkPath<
    SelfBucket extends $Bucket,
    OtherBucket extends $Bucket
> = {
    self?: keyof SelfBucket['#modelpath'],
    other?: keyof OtherBucket['#modelpath'],
}

/*
    Factory
*/


/**
 * @category Builders
 * @subcategory Entity
 * */
export class BucketGraphLinkFactory<
    Module extends $Module,
    SelfBucket extends $Bucket,
    Fieldpaths = NoInfer<SelfBucket['#modelpath']>
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
    >(bucket: N, query: NQL_Query<Module, Bucket, Fieldpaths>) {
        return new BucketGraphLinkBuilder<
            Module, SelfBucket, Module['buckets'][N]
        >(
            new $Dependency(this.module, 'bucket', bucket as string, true),
            this.type,
            query as NQL_Query<any, any>,
            false,
            this.alias
        );
    }

    many<
        N extends keyof Module['buckets'],
        Bucket extends $Bucket = Module['buckets'][N]
    >(bucket: N, query: NQL_Query<Module, Bucket, Fieldpaths>) {
        return new BucketGraphLinkBuilder<
            Module, SelfBucket, Module['buckets'][N]
        >(
            new $Dependency(this.module, 'bucket', bucket as string, true),
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
    OtherBucket extends $Bucket
> {
    public '#other': OtherBucket

    private _optional = false;

    constructor(
        private bucket: $Dependency,
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


    public static build(node: BucketBuilderNode, builder: BucketGraphLinkBuilder<any, any, any>, name: string) {
        return new $BucketGraphLink(
            name,
            builder.alias || name,
            builder.bucket,
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
    [x: string]: BucketGraphLinkBuilder<any, any, any>
}