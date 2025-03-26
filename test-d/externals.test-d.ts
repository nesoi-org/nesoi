/* eslint-disable unused-imports/no-unused-vars */
import { expectType } from 'tsd';
import { Mock } from './mock';
import { ExternalsBuilder } from '~/elements/blocks/externals/externals.builder';

/* Types */

/**
 * test: .bucket should reference foreign space buckets
*/

{
    const builder = new ExternalsBuilder<Mock.Space, 'mock'>('mock');
    
    type BucketParam = Parameters<typeof builder.bucket>[0];
    expectType<
        `other::${keyof Mock.OtherModule['buckets'] & string}`
    >({} as BucketParam)
}

/**
 * test: .job should reference foreign space jobs
*/

{
    const builder = new ExternalsBuilder<Mock.Space, 'mock'>('mock');
    
    type JobParam = Parameters<typeof builder.job>[0];
    expectType<
        `other::${keyof Mock.OtherModule['jobs'] & string}`
    >({} as JobParam)
}