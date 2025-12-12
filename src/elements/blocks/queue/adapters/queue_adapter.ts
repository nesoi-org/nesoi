import type { AnyMessage } from '~/elements/entities/message/message';
import type { AnyTrxNode } from '~/engine/transaction/trx_node';

/**
 * @category Adapters
 * @subcategory Block
 */
export abstract class QueueAdapter {

    abstract push(
        trx: AnyTrxNode,
        message: AnyMessage
    ): Promise<void>

    abstract pop(
        trx: AnyTrxNode
    ): Promise<AnyMessage | undefined>
}