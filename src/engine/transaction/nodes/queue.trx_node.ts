import { $Module, RawMessageInput } from '~/schema';
import { TrxNode } from '../trx_node';
import { $Queue } from '~/elements/blocks/queue/queue.schema';
import { Queue } from '~/elements/blocks/queue/queue';

/**
 * @category Engine
 * @subcategory Transaction
 */
export class QueueTrxNode<M extends $Module,$ extends $Queue> {
    constructor(
        private trx: TrxNode<any, M, any>,
        private queue: Queue<M, $>
    ) {}

    public async push(raw: RawMessageInput<M, keyof M['messages']>): Promise<void> {
        const trx = TrxNode.makeChildNode(this.trx, this.queue.schema.module, 'queue', this.queue.schema.name);
        await TrxNode.open(trx, 'push', { raw });

        let response;
        try {
            // response = this.queue.push(trx, raw);
        }
        catch (e) {
            await TrxNode.error(trx, e);
            throw e;
        }

        await TrxNode.ok(trx, response);
    }
}