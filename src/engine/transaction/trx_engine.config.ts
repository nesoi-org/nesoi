import type { BucketAdapter } from '~/elements/entities/bucket/adapters/bucket_adapter';
import type { AnyTrx, Trx } from './trx';
import type { TrxNode, TrxNodeState } from './trx_node';
import type { AnyUsers } from '../auth/authn';

export type TrxData = {
    id: number,
    trx_id: AnyTrx['id'],
    idempotent: boolean,
    state: TrxNodeState,
    origin: AnyTrx['origin'],
    module: string,
    start: AnyTrx['start'],
    end: AnyTrx['end'],
    data?: Record<string, any>,
    error?: Record<string, any>,
}

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

    log?: {
        idempotent?: {
            level?: 'info'|'output'|'status'
        },
        non_idempotent?: {
            level?: 'info'|'output'|'status'
        },
        /**
         * Adapter used to log transactions of this module once they're finished.
         */
        adapter: (schema: $Bucket) => BucketAdapter<TrxData>,
    }

    wrap?: {
        begin?: <T extends Trx<S, M, AuthUsers>>(
            trx: T,
            services: Services
        ) => Promise<void>,
        upgrade?: <T extends Trx<S, M, AuthUsers>>(
            trx: T,
            services: Services
        ) => Promise<void>,
        pause?: <T extends Trx<S, M, AuthUsers>>(
            trx: T,
            services: Services
        ) => Promise<void>,
        continue?: <T extends Trx<S, M, AuthUsers>>(
            trx: T,
            services: Services
        ) => Promise<void>,
        hold?: <T extends Trx<S, M, AuthUsers>>(
            trx: T,
            services: Services
        ) => Promise<void>,
        commit?: <T extends Trx<S, M, AuthUsers>>(
            trx: T,
            services: Services
        ) => Promise<void>,
        rollback?: <T extends Trx<S, M, AuthUsers>>(
            trx: T,
            services: Services
        ) => Promise<void>
    }[]
}