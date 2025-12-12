import type { RawMessageInput } from '~/schema';

import { TrxNode } from '~/engine/transaction/trx_node';
import { NesoiError } from '~/engine/data/error';
import { Message } from './message';
import { Log, scopeTag } from '~/engine/util/log';
import { MessageTemplateFieldParser } from './template/message_template_parser';

/**
 * @category Elements
 * @subcategory Entity
 * */
export class MessageParser<$ extends $Message> {

    constructor(
        public schema: $
    ) {}

    public static async parseWithTrxModule(
        trx: AnyTrxNode,
        raw: RawMessageInput<any, any>,
        sigKey?: string,
    ) {
        if (!raw.$) {
            throw NesoiError.Message.NoType({ raw });
        }
        if (typeof raw.$ !== 'string') {
            throw NesoiError.Message.InvalidType({ type: raw.$ });
        }
        const module = TrxNode.getModule(trx);
        const parser = module.messages[raw.$ as any];
        if (!parser) {
            throw NesoiError.Message.NotSupportedByModule({ type: raw.$, module: module.name });
        }
        return parser.parse(trx, raw, sigKey) as any;
    }

    public async parse(
        trx: AnyTrxNode,
        raw: $['#raw'],
        sigKey?: string
    ): Promise<Message<$>> {
        Log.debug('trx', trx.globalId, `${scopeTag('message', this.schema.name)} Parse${sigKey ? ' (signed)' : ''}`, raw);

        const fields = this.schema.template.fields;
        const parsed = await MessageTemplateFieldParser(trx, fields, raw) as never;

        return Message.new(this.schema.name, parsed, sigKey);
    }
      
    
}
export type AnyMessageParser = MessageParser<$Message>