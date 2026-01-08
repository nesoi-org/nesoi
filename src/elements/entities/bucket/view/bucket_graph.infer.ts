export type $BucketGraphLinkName<Raw> = 
    Raw extends '$'
        ? `$${number}`
        : Raw extends `${infer X}.${infer Y}`
            ? `${X}.${$BucketGraphLinkName<Y>}`
            : Raw