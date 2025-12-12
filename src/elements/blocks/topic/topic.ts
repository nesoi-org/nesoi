import type { Module } from '~/engine/module';
import type { AnyMessage } from '~/elements/entities/message/message';

import { TrxNode } from '~/engine/transaction/trx_node';
import { Block } from '../block';
import { Log } from '~/engine/util/log';
import { Random } from '~/engine/util/random';

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
    protected async run(trx: TrxNode<S, M, $['#auth']>, msg: AnyMessage, _ctx: Record<string, any> = {}): Promise<void> {
        // Check authentication
        await TrxNode.checkAuth(trx, this.schema.auth);

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

    public async subscribe(trx: TrxNode<S, M, $['#auth']>, fn: (msg: AnyMessage) => void): Promise<string> {
        // Check authentication
        await TrxNode.checkAuth(trx, this.schema.auth);

        const id = Random.uuid();
        this.subscriptions[id] = {
            id, fn
        }
        return id;
    }

    public async unsubscribe(trx: TrxNode<S, M, $['#auth']>, id: string): Promise<void> {
        // Check authentication
        await TrxNode.checkAuth(trx, this.schema.auth);

        delete this.subscriptions[id];
    }

}

export type AnyTopic = Topic<any, any, any>