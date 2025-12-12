import type { BucketGraphLinkBuilders, BucketGraphLinkFactory } from './bucket_graph_link.builder';
import type { BucketBuilderNode } from '../bucket.builder';

import { $BucketGraph } from './bucket_graph.schema';
import { BucketGraphLinkBuilder } from './bucket_graph_link.builder';
import type { $Module, $BucketGraphLinks, $Bucket } from 'index';

/*
    Builder
*/

/**
 * @category Builders
 * @subcategory Entity
 * */
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