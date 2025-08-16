import { $Module, $Space } from '~/elements';
import { BucketAdapter } from '~/elements/entities/bucket/adapters/bucket_adapter';
import { Trx } from './trx';
import { AnyUsers } from '../auth/authn';
import { TrxNode } from './trx_node';
import { TrxData } from './trx_engine';

export type TrxEngineWrapFn<
    S extends $Space,
    M extends $Module
> = (trx: TrxNode<S, M, any>) => Promise<any>

export type TrxEngineConfig<
    S extends $Space,
    M extends $Module,
    Authn extends AnyUsers,
    Services extends Record<string, any>
> = {

    /**
     * Adapter used to store transactions of this module.
     */
    adapter?: (schema: M) => BucketAdapter<TrxData>,

    wrap?: <T extends Trx<S, M, Authn>>(
        trx: T,
        fn: TrxEngineWrapFn<S,M>,
        services: Services
    ) => Promise<any>
}