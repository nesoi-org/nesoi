import { $Module, $Space, MessageName, RawMessageInput } from '~/schema';
import { $Block, $BlockType } from './block.schema';
import { Log, scopeTag } from '~/engine/util/log';
import { Message } from '~/elements/entities/message/message';
import { Module } from '~/engine/module';
import { NesoiError } from '~/engine/data/error';
import { TrxNode } from '~/engine/transaction/trx_node';

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

    async consumeRaw(trx: TrxNode<S, M, $['#authn']>, raw: RawMessageInput<M,MessageName<M>>, ctx?: Record<string, any>): Promise<$['#output']> {
        Log.debug('trx', trx.globalId, `${scopeTag(this.type, this.schema.name)} Consume Raw`, raw);
        if (!raw.$) {
            throw NesoiError.Message.NoType({ raw });
        }
        if (typeof raw.$ !== 'string') {
            throw NesoiError.Message.InvalidType({ type: raw.$ });
        }
        if (!this.schema.input.some(dep =>
            dep.tag === `${this.module.name}::message:${raw.$ as string}`
        )) {
            throw NesoiError.Block.MessageNotSupported({ block: this.schema.name, message: raw.$ as string });
        }
        const msg: Message<any> = (await trx.message(raw)) as any;
        return this.run(trx, msg, ctx);
    }

    async consume(trx: TrxNode<S, M, $['#authn']>, msg: Message<any>, ctx?: Record<string, any>): Promise<$['#output']> {
        Log.debug('trx', trx.globalId, `${scopeTag(this.type, this.schema.name)} Consume`, msg);
        if (!this.schema.input.some(dep => dep.module === this.module.name && dep.name === msg.$ as string)) {
            throw NesoiError.Block.MessageNotSupported({ block: this.schema.name, message: msg.$ });
        }
        return this.run(trx, msg, ctx);
    }

    protected abstract run(trx: TrxNode<S, M, $['#authn']>, msg: Message<any>, ctx?: Record<string, any>): Promise<any>;

}

export type AnyBlock = Block<any, any, any>