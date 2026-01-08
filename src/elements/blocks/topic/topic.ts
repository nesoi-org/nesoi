import type { Module } from '~/engine/module';
import type { AnyMessage } from '~/elements/entities/message/message';

import { TrxNode } from '~/engine/transaction/trx_node';
import { Block } from '../block';
import { Log } from '~/engine/util/log';
import { Random } from '~/engine/util/random';

export type TopicSubscription = {
    id: string
    fn: (msg: AnyMessage) => void
    auth?: {
        provider: string
        user: NesoiObj
    }
}

export type TopicTenancy<S extends $Space> = {
    [Provider in keyof S['users']]?: {
        [Prop in keyof S['users'][Provider]]?: S['users'][Provider][Prop][]
    }[]
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
    protected async run(trx: TrxNode<S, M, $['#auth']>, msg: AnyMessage, tenancy?: TopicTenancy<any>): Promise<void> {
        // Check authentication
        await TrxNode.checkAuth(trx, this.schema.auth);

        for (const id in this.subscriptions) {
            const sub = this.subscriptions[id];
            try {
                if (tenancy) {
                    // Subscription not authenticated
                    if (!sub.auth) continue;
                    
                    // Subscription not authenticated for this provider
                    if (!tenancy[sub.auth.provider]) continue;
                    
                    // Check tenancy rules
                    const rules = tenancy[sub.auth.provider]!;

                    let auth = false;
                    for (const rule of rules) {
                        let rule_ok = true;
                        for (const key in rule) {
                            if (!rule[key]?.includes(sub.auth.user[key as never])) {
                                rule_ok = false;
                                break;
                            }
                        }
                        if (rule_ok) {
                            auth = true;
                            break;
                        }
                    }

                    if (!auth) continue;
                }

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
        const provider = await TrxNode.checkAuth(trx, this.schema.subscription_auth);
        const user = provider ? await trx.user(provider as keyof S['users']) : undefined;

        const id = Random.uuid();
        this.subscriptions[id] = {
            id, fn,
            auth: provider ? {
                provider,
                user: user!
            } : undefined
        }
        return id;
    }

    public async unsubscribe(trx: TrxNode<S, M, $['#auth']>, id: string): Promise<void> {
        delete this.subscriptions[id];
    }

}

export type AnyTopic = Topic<any, any, any>