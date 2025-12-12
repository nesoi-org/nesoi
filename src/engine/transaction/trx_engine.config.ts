import type { BucketAdapter } from '~/elements/entities/bucket/adapters/bucket_adapter';
import type { Trx } from './trx';
import type { TrxNode } from './trx_node';
import type { TrxData } from './trx_engine';
import type { AnyUsers } from '../auth/authn';
import type { $Space, $Module, $Bucket } from 'index';

export type TrxEngineWrapFn<
    S extends $Space,
    M extends $Module
> = (trx: TrxNode<S, M, any>) => Promise<any>

export type TrxEngineConfig<
    S extends $Space,
    M extends $Module,
    AuthUsers extends AnyUsers,
    Services extends Record<string, any>
> = {

    /**
     * Adapter used to temporarily store transactions of this module, while they happen.
     */
    adapter?: (schema: $Bucket) => BucketAdapter<TrxData>,

    /**
     * Adapter used to log transactions of this module once they're finished.
     */
    log_adapter?: (schema: $Bucket) => BucketAdapter<TrxData>,

    wrap?: {
        begin: <T extends Trx<S, M, AuthUsers>>(
            trx: T,
            services: Services
        ) => Promise<void>,
        continue: <T extends Trx<S, M, AuthUsers>>(
            trx: T,
            services: Services
        ) => Promise<void>,
        commit: <T extends Trx<S, M, AuthUsers>>(
            trx: T,
            services: Services
        ) => Promise<void>,
        rollback: <T extends Trx<S, M, AuthUsers>>(
            trx: T,
            services: Services
        ) => Promise<void>
    }[]
}