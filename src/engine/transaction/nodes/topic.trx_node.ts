import { $Module } from '~/schema';
import { TrxNode } from '../trx_node';
import { $Topic } from '~/elements/blocks/topic/topic.schema';
import { Topic } from '~/elements/blocks/topic/topic';
import { AnyMessage } from '~/elements/entities/message/message';

/**
 * @category Engine
 * @subcategory Transaction
 */
export class TopicTrxNode<M extends $Module,$ extends $Topic> {
    constructor(
        private trx: TrxNode<any, M, any>,
        private topic: Topic<any, M, $>
    ) {}

    public async subscribe(fn: (msg: AnyMessage) => void): Promise<string> {
        const trx = TrxNode.makeChildNode(this.trx, this.topic.schema.module, 'topic', this.topic.schema.name);
        await TrxNode.open(trx, 'subscribe', {});

        let id;
        try {
            id = await this.topic.subscribe(this.trx, fn);
        }
        catch (e) {
            throw await TrxNode.error(trx, e);
        }

        await TrxNode.ok(trx, { id });
        return id;
    }

    public async unsubscribe(id: string): Promise<void> {
        const trx = TrxNode.makeChildNode(this.trx, this.topic.schema.module, 'topic', this.topic.schema.name);
        await TrxNode.open(trx, 'unsubscribe', {});

        try {
            await this.topic.unsubscribe(this.trx, id);
        }
        catch (e) {
            throw await TrxNode.error(trx, e);
        }

        await TrxNode.ok(trx, undefined);
    }

    public async publish(raw: $['#input']['#raw']): Promise<void> {
        const trx = TrxNode.makeChildNode(this.trx, this.topic.schema.module, 'topic', this.topic.schema.name);
        await TrxNode.open(trx, 'publish', { raw });

        try {
            await this.topic.consumeRaw(trx, raw);
        }
        catch (e) {
            throw await TrxNode.error(trx, e);
        }

        await TrxNode.ok(trx, undefined);
    }
}