import { Overlay } from '~/engine/util/type';
import { $BucketGraphLink } from './bucket_graph.schema';
import { BucketGraphLinkBuilder, BucketGraphLinkBuilders } from './bucket_graph_link.builder';

export type $BucketGraphLinksInfer<Builders extends BucketGraphLinkBuilders> = {
    [K in keyof Builders]: 
        Builders[K] extends BucketGraphLinkBuilder<any, any, infer Y>
            ? Overlay<$BucketGraphLink, { '#bucket': Y, '#data': Y['#data'] }>
            : never;
}
