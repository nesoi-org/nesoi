/**
 * @category Schemas
 * @subcategory Entity
 * */
export class $Bucket {
    public $t = 'bucket' as const;
    public '#data'!: NesoiObj;
    public '#composition': Record<string, { bucket: $Bucket, many: boolean, optional: boolean }>;
    public '#defaults': Record<string, any>

    constructor(
        public module: string,
        public name: string,
        public alias: string,
        public model: $BucketModel,
        public graph: $BucketGraph,
        public views: $BucketViews,
        public tenancy?: $BucketTenancy<any, any>,
        public extendsFrom?: Tag
    ) {}
}