import type { AnyTrxNode } from '~/engine/transaction/trx_node';
import type { AnyMessage } from '~/elements/entities/message/message';

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