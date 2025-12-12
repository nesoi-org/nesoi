import type { RawMessageInput } from '~/schema';
import type { Queue } from '~/elements/blocks/queue/queue';

import type { AnyTrxNode} from '../trx_node';
import { TrxNode } from '../trx_node';
import { ExternalTrxNode } from './external.trx_node';
import { Tag } from '~/engine/dependency';
import { NesoiError } from '~/engine/data/error';
import type { $Module, $Queue } from 'index';

/**
 * @category Engine
 * @subcategory Transaction
 */
export class QueueTrxNode<M extends $Module,$ extends $Queue> {
    
    private external: boolean
    private queue?: Queue<M, $>

    constructor(
        private trx: TrxNode<any, M, any>,
        private tag: Tag
    ) {
        const module = TrxNode.getModule(trx);
        this.external = tag.module !== module.name;
        if (!this.external) {
            this.queue = Tag.element(tag, trx);
            if (!this.queue) {
                throw NesoiError.Trx.NodeNotFound(this.tag.full, trx.globalId);
            }
        }
    }


    /*
        Wrap
    */
   
    async wrap(
        action: string,
        input: Record<string, any>,
        fn: (trx: AnyTrxNode, element: Queue<M, $>) => Promise<any>,
        fmtTrxOut?: (out: any) => any
    ) {
        const wrapped = async (parentTrx: AnyTrxNode, queue: Queue<M, $>) => {
            const trx = TrxNode.makeChildNode(parentTrx, queue.schema.module, 'queue', queue.schema.name);
                
            TrxNode.open(trx, action, input);
            let out;
            try {
                out = await fn(trx, queue);
            }
            catch (e) {
                throw TrxNode.error(trx, e);
            }
            TrxNode.ok(trx, fmtTrxOut ? fmtTrxOut(out) : out);
    
            return out;
        }
    
        if (this.external) {
            const ext = new ExternalTrxNode(this.trx, this.tag)
            return ext.run_and_hold(
                trx => Tag.element(this.tag, trx),
                wrapped
            );
        }
        else {
            return wrapped(this.trx, this.queue!)
        }
    }

    public async push(raw: RawMessageInput<M, keyof M['messages']>): Promise<void> {
        // return this.wrap('push', raw, (trx, queue) => {
        //     return queue.push(trx, message)
        // })
    }
}