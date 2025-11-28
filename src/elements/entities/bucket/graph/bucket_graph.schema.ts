import type { Tag } from '~/engine/dependency';
import type { $Bucket } from '../bucket.schema';
import type { NQL_AnyQuery } from '../query/nql.schema';

/**
 * @category Schemas
 * @subcategory Entity
 * */
export class $BucketGraphLink {
    public $t = 'bucket.graph.link';
    public '#bucket'!: $Bucket;
    public '#many'!: boolean;

    constructor(
        public name: string,
        public alias: string,
        public bucket: Tag,
        public rel: 'aggregation' | 'composition',
        public many: boolean,
        public optional: boolean,
        public keyOwner: 'self' | 'other' | 'pivot',
        public query: NQL_AnyQuery
    ) {}

}

export type $BucketGraphLinks = {
    [x: string]: $BucketGraphLink
}

/**
 * @category Schemas
 * @subcategory Entity
 * */
export class $BucketGraph {
    public $t = 'bucket.graph';
    
    constructor(
        public links: $BucketGraphLinks = {}
    ) {}

}
