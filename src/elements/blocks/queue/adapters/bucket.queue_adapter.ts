import { $Module } from '~/schema';
import { QueueAdapter } from './queue_adapter';
import { AnyMessage } from '~/elements/entities/message/message';
import { AnyTrxNode } from '~/engine/transaction/trx_node';

/**
 * @category Adapters
 * @subcategory Block
 */
export class BucketQueueAdapter<
    M extends $Module
> extends QueueAdapter {

    constructor(
        protected bucket: keyof M['buckets']
    ) {
        super();
    }

    async push(trx: AnyTrxNode, message: AnyMessage): Promise<void> {
        return;
    }

    async pop(trx: AnyTrxNode): Promise<AnyMessage | undefined> {
        return undefined;
    }

}