import type { Overlay } from '~/engine/util/type';
import type { BucketGraphLinkBuilder, BucketGraphLinkBuilders } from './bucket_graph_link.builder';

type Replace<T extends string>
    = T extends `${infer L}$${infer R}`
    ? `${L}${string}${Replace<R>}`
    : T


export type $BucketGraphLinksInfer<Builders extends BucketGraphLinkBuilders> = {
    [K in keyof Builders as Replace<K & string>]: 
        Overlay<$BucketGraphLink, {
            '#bucket': Builders[K]['#other'],
            '#many': Builders[K]['#many']
        }>
}

export type $BucketGraphLinkInfer<Builder extends BucketGraphLinkBuilder<any, any, any, any>> =
    Overlay<$BucketGraphLink, {
        '#bucket': Builder['#other'],
        '#many': Builder['#many']
    }>
