export type $BucketGraphLinkName<Raw> = 
    Raw extends `${infer X}.${infer Y}`
        ? X extends '$'
            ? `$${number}.${$BucketGraphLinkName<Y>}`
            : `${X}.${$BucketGraphLinkName<Y>}`
        : Raw extends '$'
            ? `$${number}`
            : Raw