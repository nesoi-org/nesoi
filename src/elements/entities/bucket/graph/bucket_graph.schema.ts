import { $Dependency } from '~/engine/dependency';
import { $Bucket } from '../bucket.schema';
import { AnyQuery } from '../query/nql.schema';

export class $BucketGraphLink {
    public $t = 'bucket.graph.link';
    public '#bucket'!: $Bucket;
    public '#many'!: boolean;

    constructor(
        public name: string,
        public alias: string,
        public bucket: $Dependency,
        public rel: 'aggregation' | 'composition',
        public many: boolean,
        public optional: boolean,
        public keyOwner: 'self' | 'other' | 'pivot',
        public selfKey: string,
        public otherKey: string,
        public pivotBucket?: string,
        public query?: AnyQuery<any, any>,
    ) {}

}

export type $BucketGraphLinks = {
    [x: string]: $BucketGraphLink
}

export class $BucketGraph {
    public $t = 'bucket.graph';
    
    constructor(
        public links: $BucketGraphLinks = {}
    ) {}

}
