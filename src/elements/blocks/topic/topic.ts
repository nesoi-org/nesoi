import { $Module, $Space } from '~/schema';
import { $Topic } from './topic.schema';
import { Module } from '~/engine/module';
import { AnyMessage } from '~/elements/entities/message/message';
import { TrxNode } from '~/engine/transaction/trx_node';
import { Block } from '../block';
import { randomUUID } from 'crypto';
import { Log } from '~/engine/util/log';

export type TopicSubscription = {
    id: string
    fn: (msg: AnyMessage) => void
}

export class Topic<
    S extends $Space,
    M extends $Module,
    $ extends $Topic
> extends Block<S,M,$> {

    private subscriptions: Record<string, TopicSubscription> = {}

    constructor(
        public module: Module<any, M>,
        public schema: $
    ) {
        super('topic', module, schema);
    }

    // Publish
    protected async run(trx: TrxNode<S, M, $['#authn']>, msg: AnyMessage, _ctx: Record<string, any> = {}): Promise<void> {
        // Check authentication
        TrxNode.checkAuthn(trx, this.schema.authn);

        for (const id in this.subscriptions) {
            try {
                this.subscriptions[id].fn(msg)
            }
            catch (error) {
                Log.error('topic', this.schema.name, `Subscription ${id} threw an error when executed. Removed.`, { error })
                delete this.subscriptions[id];
            }
        }
    }

    public subscribe(trx: TrxNode<S, M, $['#authn']>, fn: (msg: AnyMessage) => void): string {
        // Check authentication
        TrxNode.checkAuthn(trx, this.schema.authn);

        const id = randomUUID();
        this.subscriptions[id] = {
            id, fn
        }
        return id;
    }

    public unsubscribe(trx: TrxNode<S, M, $['#authn']>, id: string): void {
        // Check authentication
        TrxNode.checkAuthn(trx, this.schema.authn);

        delete this.subscriptions[id];
    }

}

export type AnyTopic = Topic<any, any, any>