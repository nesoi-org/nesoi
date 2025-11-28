import type { $Module } from '~/schema';
import type { AnyMessage } from '~/elements/entities/message/message';
import type { AnyTrxNode } from '~/engine/transaction/trx_node';

import { QueueAdapter } from './queue_adapter';

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