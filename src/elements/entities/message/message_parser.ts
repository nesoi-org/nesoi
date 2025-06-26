import { TrxNode, AnyTrxNode } from '~/engine/transaction/trx_node';
import { NesoiError } from '~/engine/data/error';
import { RawMessageInput } from '~/schema';
import { Message } from './message';
import { $Message } from './message.schema';
import { $MessageTemplateField, $MessageTemplateFields } from './template/message_template.schema';
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

    // TODO: OPTIMIZATION
    // Parse everything that's static first, then move on to
    // parsing ids etc.
    
    public async parse(
        trx: AnyTrxNode,
        raw: $['#raw'],
        sigKey?: string
    ): Promise<Message<$>> {
        Log.debug('trx', trx.globalId, `${scopeTag('message', this.schema.name)} Parse${sigKey ? ' (signed)' : ''}`, raw);

        const parseFields = async (trx: AnyTrxNode, fields: $MessageTemplateFields, obj: Record<string, any>) => {
            const parsedObj = {} as any;
            for (const k in fields) {
                const field = fields[k];
                parsedObj[k] = await parseField(trx, field as $MessageTemplateField, obj[k]);
            }
            return parsedObj;
        };
    
        const parseField = async (trx: AnyTrxNode, field: $MessageTemplateField, value: any): Promise<any> => {
            // 1. Sanitize input
            this.sanitize(value);

            // 2. Check for required fields
            return MessageTemplateFieldParser(raw, trx, field, value);
        };
    
        const applyRules = async (fields: $MessageTemplateFields, parsed: any, parsedValue = parsed): Promise<any> => {
            for (const f in fields) {
                const field = fields[f];
                for (const r in field.rules) {
                    const rule = field.rules[r];
                    const value = parsedValue?.[field.name];
                    const res = await rule({ field, value, msg: parsed });
                    if (typeof res === 'object') {
                        parsedValue ??= {};
                        parsedValue[field.name] = res.set;
                    }
                    else if (res !== true) {
                        throw NesoiError.Message.RuleFailed({ rule, error: res });
                    }
                }
                if (field.children) {
                    await applyRules(field.children, parsed, parsedValue?.[field.name])
                }
            }
        };

        const parsed = await parseFields(
            trx,
            this.schema.template.fields,
            raw as any
        ) as $['#parsed'];

        await applyRules(this.schema.template.fields, parsed);

        return Message.new(this.schema.name, parsed, sigKey);
    }
      
    private sanitize(value: any) {
        if (typeof value === 'function') {
            throw NesoiError.Message.UnsanitaryValue({
                details: 'Functions not allowed as message inputs.'
            });
        }
    }
    
}
export type AnyMessageParser = MessageParser<$Message>