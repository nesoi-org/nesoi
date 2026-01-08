import type { Message } from '~/elements/entities/message/message';
import type { Module } from '~/engine/module';
import type { TrxNode } from '~/engine/transaction/trx_node';

import { Log, scopeTag } from '~/engine/util/log';
import { NesoiError } from '~/engine/data/error';
import type { MessageName, RawMessageInput } from '~/schema';

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
        const _raw = raw as Record<string, any>;
        Log.debug('trx', trx.globalId, `${scopeTag(this.type, this.schema.name)} Consume Raw`, _raw);
        if (!_raw.$) {
            throw NesoiError.Message.NoType({ raw: _raw });
        }
        if (typeof _raw.$ !== 'string') {
            throw NesoiError.Message.InvalidType({ type: _raw.$ });
        }
        if (!this.schema.input.some(tag =>
            tag.module === this.module.name && tag.name === _raw.$
        )) {
            throw NesoiError.Block.MessageNotSupported({ block: this.schema.name, message: _raw.$ as string });
        }
        const msg: Message<any> = (await trx.message(_raw)) as any;
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