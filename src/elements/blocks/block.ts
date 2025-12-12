import type { $Module, $Space, MessageName, RawMessageInput } from '~/schema';
import type { $Block, $BlockType } from './block.schema';
import type { Message } from '~/elements/entities/message/message';
import type { Module } from '~/engine/module';
import type { TrxNode } from '~/engine/transaction/trx_node';

import { Log, scopeTag } from '~/engine/util/log';
import { NesoiError } from '~/engine/data/error';

export abstract class Block<
    S extends $Space,
    M extends $Module,
    $ extends $Block
> {

    constructor(
        public type: $BlockType,
        public module: Module<S, M>,
        public schema: $
    ) {
        if (schema.$t !== type) {
            throw NesoiError.Block.InvalidSchema({ name: schema.name, type: schema.$t, expectedType: type });
        }
    }

    async consumeRaw(trx: TrxNode<S, M, $['#auth']>, raw: RawMessageInput<M,MessageName<M>>, ctx?: Record<string, any>): Promise<$['#output']> {
        Log.debug('trx', trx.globalId, `${scopeTag(this.type, this.schema.name)} Consume Raw`, raw);
        if (!raw.$) {
            throw NesoiError.Message.NoType({ raw });
        }
        if (typeof raw.$ !== 'string') {
            throw NesoiError.Message.InvalidType({ type: raw.$ });
        }
        if (!this.schema.input.some(tag =>
            tag.module === this.module.name && tag.name === raw.$
        )) {
            throw NesoiError.Block.MessageNotSupported({ block: this.schema.name, message: raw.$ as string });
        }
        const msg: Message<any> = (await trx.message(raw)) as any;
        return this.run(trx, msg, ctx);
    }

    async consume(trx: TrxNode<S, M, $['#auth']>, msg: Message<any>, ctx?: Record<string, any>): Promise<$['#output']> {
        Log.debug('trx', trx.globalId, `${scopeTag(this.type, this.schema.name)} Consume`, msg);
        if (!this.schema.input.some(tag => tag.module === this.module.name && tag.name === msg.$ as string)) {
            throw NesoiError.Block.MessageNotSupported({ block: this.schema.name, message: msg.$ });
        }
        return this.run(trx, msg, ctx);
    }

    protected abstract run(trx: TrxNode<S, M, $['#auth']>, msg: Message<any>, ctx?: Record<string, any>): Promise<any>;

}

export type AnyBlock = Block<any, any, any>