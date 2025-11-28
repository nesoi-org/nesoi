import type { $Module } from '~/schema';
import type { $BucketGraphLinks } from './bucket_graph.schema';
import type { BucketGraphLinkBuilders, BucketGraphLinkFactory } from './bucket_graph_link.builder';
import type { BucketBuilderNode } from '../bucket.builder';
import type { $Bucket } from '../bucket.schema';

import { $BucketGraph } from './bucket_graph.schema';
import { BucketGraphLinkBuilder } from './bucket_graph_link.builder';

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