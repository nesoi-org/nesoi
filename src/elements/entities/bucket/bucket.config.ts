import { $Module } from '~/elements';
import { BucketAdapter } from './adapters/bucket_adapter';
import { $Bucket } from './bucket.schema';
import { DriveAdapter } from '../drive/drive_adapter';

export type BucketConfig<
    M extends $Module,
    B extends $Bucket,
    Services extends Record<string, any>
> = {
    
    /** Adapter used by this bucket to communicate with a data source */
    adapter?: (schema: B, services: Services) => BucketAdapter<B['#data']>,
    
    /** Drive Adapter used by this bucket to write/read files */
    drive?: (schema: B, services: Services) => DriveAdapter,

    /** Settings for the app cache of this bucket */
    cache?: {
        /** Inner adapter used by the cache to manage cache entry data */
        adapter?: BucketAdapter<B['#data']>
        
        /** Cache mode for each read method. Undefined on a method means no cache for that method. */
        mode?: {
            /** Cache mode for `get`:
             * - **one**: Update/delete the object, then return
             * - **past**: Update/delete the object and update all objects modified before it, then return
             * - **all**: Update/reset the cache, then return
            */
            get?: 'eager' | 'one' | 'past' | 'all',

            /** Cache mode for `index`:
             * - **all**: Update/reset the cache, then return
            */
            index?: 'eager' | 'all',

            /** Cache mode for `query`:
             * - **incremental**: Query ids only, then query data for modified entries only, save them and return
             * - **all**: Update/reset the cache, then query the inner adapter and return
            */
            query?: 'eager' | 'incremental' | 'all'
        }


        // Future ideas:
        
        // - Timeout:
        //      - Persistence:
        //          - TTL: How long should data remain on the cache
        //          - Cleanup period: How often should the cache be cleared
        //      - Trust: A period in ms during which to trust the cache data
        //          - Blind trust: The cache data can be trusted before even calling the outer adapter
        //          - Partition trust: The cache data can be trusted during a partition with the outer adapter

        // - Cache levels:
        //      The cache config should be a list of the current object
        //      Each level has an adapter and specified timeout
        //      The cache tries 
    }
}