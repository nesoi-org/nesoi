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

        const applyFieldRules = async (field: $MessageTemplateField, parent: Record<string, any>, value: any|undefined, path: string[]): Promise<any> => {
            // Apply rules to the field
            // If field is an array, the value passed to the rule is the array itself
            for (const r in field.rules) {
                const rule = field.rules[r];
                const res = await rule({ field, value, path: path.join('.'), msg: parsed });
                if (typeof res === 'object') {
                    parent[path.at(-1)!] = res.set;
                }
                else if (res !== true) {
                    throw NesoiError.Message.RuleFailed({ rule, error: res });
                }
            }

            if (field.type === 'obj') {
                if (field.array) {
                    for (let i = 0; i < value?.length; i++) {
                        await applyRules(field.children!, value[i] || {}, [...path, i.toString()])
                    }
                }
                else {
                    await applyRules(field.children!, value || {}, path)
                }
            }
            else if (field.type === 'dict') {
                if (field.array) {
                    for (let i = 0; i < value?.length; i++) {
                        for (const k in value[i]) {
                            await applyFieldRules(field.children!.__dict, value[i], value[i][k], [...path, i.toString(), k])
                        }
                    }
                }
                else {
                    for (const k in value) {
                        await applyFieldRules(field.children!.__dict, value, value[k], [...path, k])
                    }
                }
            }
        }

        const applyRules = async (fields: $MessageTemplateFields, parent: Record<string, any>, path: string[] = []): Promise<any> => {
            for (const f in fields) {
                const field = fields[f];
                const value = parent[field.name];
                const _path = [...path, field.name]
                await applyFieldRules(field, parent, value, _path)
            }
        };

        const fields = this.schema.template.fields;
        const parsed = {} as $['#parsed'];
        for (const k in fields) {
            const field = fields[k];
            const key_raw = field.path_raw.split('.')[0];
            const key_parsed = field.path_parsed.split('.')[0];
            
            const value = raw[key_raw as never];
            this.sanitize(value);
            parsed[key_parsed as never] = await MessageTemplateFieldParser(raw, trx, field, value) as never;
        }

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