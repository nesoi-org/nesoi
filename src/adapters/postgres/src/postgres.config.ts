import { BucketAdapterConfig } from '~/elements/entities/bucket/adapters/bucket_adapter';
import postgres from 'postgres'

export type PostgresConfig = BucketAdapterConfig & {
    connection?: postgres.Options<any>
}