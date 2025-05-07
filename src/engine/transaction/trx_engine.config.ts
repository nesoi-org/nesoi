import { $Module, $Space } from '~/elements';
import { BucketAdapter } from '~/elements/entities/bucket/adapters/bucket_adapter';
import { AnyTrx, Trx } from './trx';
import { AnyUsers } from '../auth/authn';
import { TrxNode, TrxNodeStatus } from './trx_node';

export type TrxEngineWrapFn<
    S extends $Space,
    M extends $Module
> = (trx: TrxNode<S, M, any>) => Promise<TrxNodeStatus>

export type TrxEngineConfig<
    S extends $Space,
    M extends $Module,
    Authn extends AnyUsers,
    Services extends Record<string, any>
> = {

    /**
     * Adapter used to store transactions of this module.
     */
    adapter?: (schema: M) => BucketAdapter<AnyTrx>,

    wrap?: <T extends Trx<S, M, Authn>>(
        trx: T,
        fn: TrxEngineWrapFn<S,M>,
        services: Services
    ) => Promise<any>
}