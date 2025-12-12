/**
 * @category Schemas
 * @subcategory Entity
 * */
export class $BucketGraphLink {
    public $t = 'bucket.graph.link' as const;
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

/**
 * @category Schemas
 * @subcategory Entity
 * */
export class $BucketGraph {
    public $t = 'bucket.graph' as const;
    
    constructor(
        public links: $BucketGraphLinks = {}
    ) {}

}
