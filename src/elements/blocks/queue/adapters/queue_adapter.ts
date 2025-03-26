import { AnyTrxNode } from '~/engine/transaction/trx_node';
import { AnyMessage } from '~/elements/entities/message/message';

export abstract class QueueAdapter {

    abstract push(
        trx: AnyTrxNode,
        message: AnyMessage
    ): Promise<void>

    abstract pop(
        trx: AnyTrxNode
    ): Promise<AnyMessage | undefined>
}