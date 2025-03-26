import { $Module } from '~/schema';
import { $BucketGraph, $BucketGraphLinks } from './bucket_graph.schema';
import { BucketGraphLinkBuilder, BucketGraphLinkBuilders, BucketGraphLinkFactory } from './bucket_graph_link.builder';
import { BucketBuilderNode } from '../bucket.builder';
import { $Bucket } from '../bucket.schema';

/*
    Builder
*/

export class BucketGraphBuilder<
    Module extends $Module
> {

    private _links: BucketGraphLinkBuilders = {};
    
    links(builders: BucketGraphLinkBuilders) {
        this._links = builders;
        return this;
    }

    // Build
    
    public static build(node: BucketBuilderNode, builder: BucketGraphBuilder<any>) {
        const links: $BucketGraphLinks = {};
        for(const k in builder._links) {
            const link = builder._links[k];
            links[k] = BucketGraphLinkBuilder.build(node, link, k);
        }
        return new $BucketGraph(
            links
        );
    }

}

/*
    Def
*/

export type BucketGraphDef<
    Module extends $Module,
    SelfBucket extends $Bucket
> = ($: BucketGraphLinkFactory<Module, SelfBucket>) => BucketGraphLinkBuilders