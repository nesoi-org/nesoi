import type { $Module } from '~/schema';
import type { AnyTrxNode} from '../trx_node';
import type { $Topic } from '~/elements/blocks/topic/topic.schema';
import type { Tag } from '~/engine/dependency';
import type { AnyDaemon } from '~/engine/daemon';

import { TrxNode } from '../trx_node';
import { NesoiError } from '~/engine/data/error';
import { Log } from '~/engine/util/log';

/**
 * @category Engine
 * @subcategory Transaction
 */
export class ExternalTrxNode<M extends $Module,$ extends $Topic> {

    private daemon: AnyDaemon
    
    constructor(
        private trx: TrxNode<any, M, any>,
        private tag: Tag,
        private idempotent = false
    ) {
        const _module = TrxNode.getModule(trx)
        if (!_module.daemon) {
            throw NesoiError.Trx.DaemonNotFound(_module.name)
        }
        this.daemon = _module.daemon;
    }
    
    public async run_and_hold(
        element: (trx: AnyTrxNode) => any,
        fn: (trx: AnyTrxNode, element: any) => Promise<any>
    ) {
        if (this.idempotent) {
            Log.debug('trx', 'external', `Attempt to hold idempotent external node of transaction ${this.trx.globalId} on ${this.tag.full} ignored. Running without hold.`);
            return this.run(element, fn);
        }

        const parent = (this.trx as any).trx as AnyTrxNode['trx'];
        const module = TrxNode.getModule(this.trx);
        const trx = TrxNode.makeChildNode(this.trx, module.name, 'externals', this.tag.full);
        TrxNode.open(trx, '~', {
            tag: this.tag
        });

        const origin = module.name+'::trx:'+parent.id;
        const tag = this.tag.module+'::trx:'+parent.id;
        let out: any;
        try {
            const dtrx = await this.daemon.trx(this.tag.module)
                .origin(origin)

            const hold = await dtrx
                .auth_inherit(trx)
                .run_and_hold(async extTrx => {
                    try {
                        return await fn(extTrx, element(extTrx))
                    }
                    catch (e) {
                        throw TrxNode.error(extTrx, e);
                    }
                    finally {
                        TrxNode.merge(trx, extTrx)
                    }
                }, parent.id);
            if (hold.status.state === 'error') {
                throw hold.status.error!;
            }
            out = hold.status.output;
            const parentModule = TrxNode.getModule(parent.root);
            if (!(tag in parent.holds) && this.tag.module !== parentModule.name) {
                parent.holds[tag] = hold;
            }
        }
        catch (e) {
            throw TrxNode.error(trx, e);
        }

        TrxNode.ok(trx, out);
        return out;
    }
    
    public async run_isolated(
        element: (trx: AnyTrxNode) => any,
        fn: (trx: AnyTrxNode, element: any) => Promise<any>
    ) {
        return this.run(element, fn, { isolated: true });
    }
    
    public async run(
        element: (trx: AnyTrxNode) => any,
        fn: (trx: AnyTrxNode, element: any) => Promise<any>,
        options?: {
            isolated?: boolean
        }
    ) {
        const parent = (this.trx as any).trx as AnyTrxNode['trx'];
        const module = TrxNode.getModule(this.trx);
        const trx = TrxNode.makeChildNode(this.trx, module.name, 'externals', this.tag.full);
        TrxNode.open(trx, '~', {
            tag: this.tag
        });

        let out: any;
        try {
            const dtrx = await this.daemon.trx(this.tag.module)
                .origin(module.name+'::trx:'+parent.id)
                
            const res = await dtrx
                .auth_inherit(trx)
                .run(async extTrx => {
                    try {
                        return await fn(extTrx, element(extTrx))
                    }
                    catch (e) {
                        throw TrxNode.error(extTrx, e);
                    }
                    finally {
                        TrxNode.merge(trx, extTrx)
                    }
                }, options?.isolated ? undefined : parent.id, this.idempotent);
            if (res.state === 'error') {
                throw res.error!;
            }
            out = res.output;
        }
        catch (e) {
            throw TrxNode.error(trx, e);
        }

        TrxNode.ok(trx, out);
        return out;
    }
}