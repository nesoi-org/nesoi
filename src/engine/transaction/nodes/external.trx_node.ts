import { Daemon, type AnyDaemon } from '~/engine/daemon';

import type { AnyTrxNode, t_TrxNode} from '../trx_node';
import { TrxNode } from '../trx_node';
import { NesoiError } from '~/engine/data/error';

/**
 * @category Engine
 * @subcategory Transaction
 */
export class ExternalTrxNode<M extends $Module> {

    private module: string
    private daemon: AnyDaemon
    
    constructor(
        private trx: TrxNode<any, M, any>,
        private tag: Tag,
        private _idempotent = false
    ) {
        const module = TrxNode.getModule(trx)
        if (!module.daemon) {
            throw NesoiError.Trx.DaemonNotFound(module.name)
        }
        this.module = module.name;
        this.daemon = module.daemon;
    }
    
    public get idempotent() {
        this._idempotent = true;
        return this;
    }

    public async run(
        fn: (trx: AnyTrxNode) => Promise<any>
    ) {
        const parent_engine = Daemon.getTrxEngine(this.daemon, this.module);
        const child_engine = Daemon.getTrxEngine(this.daemon, this.tag.module);

        return parent_engine.trx_child(
            this.trx as any as t_TrxNode,
            child_engine,
            fn,
            {
                idempotent: this._idempotent
            }
        )
    }
}