import { $Module } from '~/schema';
import { AnyTrxNode, TrxNode } from '../trx_node';
import { $Topic } from '~/elements/blocks/topic/topic.schema';
import { Tag } from '~/engine/dependency';
import { NesoiError } from '~/engine/data/error';
import { AnyDaemon } from '~/engine/daemon';

/**
 * @category Engine
 * @subcategory Transaction
 */
export class ExternalTrxNode<M extends $Module,$ extends $Topic> {

    private daemon: AnyDaemon
    
    constructor(
        private trx: TrxNode<any, M, any>,
        private tag: Tag
    ) {
        const _module = TrxNode.getModule(trx)
        if (!_module.daemon) {
            throw NesoiError.Trx.DaemonNotFound(_module.name)
        }
        this.daemon = _module.daemon;
    }
    
    public async run(
        element: (trx: AnyTrxNode) => any,
        fn: (trx: AnyTrxNode, element: any) => Promise<any>
    ) {
        const root = (this.trx as any).trx as AnyTrxNode['trx'];
        const module = TrxNode.getModule(this.trx);
        const trx = TrxNode.makeChildNode(this.trx, module.name, 'externals', this.tag.full);
        TrxNode.open(trx, '~', {
            tag: this.tag
        });

        let out: any;
        try {
            const res = await this.daemon.trx(this.tag.module).run_and_hold(async extTrx => {
                try {
                    return await fn(extTrx, element(extTrx))
                }
                catch (e) {
                    throw TrxNode.error(extTrx, e);
                }
                finally {
                    TrxNode.merge(trx, extTrx)
                }
            }, root.id);
            if (res.status.state === 'error') {
                throw res.status.error!;
            }
            out = res.status.output;
            root.holdNode(res);
        }
        catch (e) {
            throw TrxNode.error(trx, e);
        }

        TrxNode.ok(trx, out);
        return out;
    }
}