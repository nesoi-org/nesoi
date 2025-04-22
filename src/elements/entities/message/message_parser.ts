import { TrxNode, AnyTrxNode } from '~/engine/transaction/trx_node';
import { NesoiError } from '~/engine/data/error';
import { RawMessageInput } from '~/schema';
import { Message } from './message';
import { $Message } from './message.schema';
import { $MessageTemplateField, $MessageTemplateFields } from './template/message_template.schema';
import { Log, scopeTag } from '~/engine/util/log';
import { MessageTemplateFieldParser } from './template/message_template_parser';

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
                const keyWithSuffix = field.type === 'id' ? `${k}_id` : k;
                const parsedField = await parseField(trx, field as $MessageTemplateField, obj[keyWithSuffix]);
                for (const suffix in parsedField) {
                    parsedObj[field.name+suffix] = parsedField[suffix];
                }
            }
            return parsedObj;
        };
    
        const parseField = async (trx: AnyTrxNode, field: $MessageTemplateField, value: any): Promise<any> => {
            // 1. Sanitize input
            this.sanitize(value);

            // 2. Check for required fields
            let parsedValue;
            if (MessageParser.isEmpty(value)) {
                if (field.required) {
                    const pathWithSuffix = field.type === 'id' ? `${field.path}_id` : field.path;
                    throw NesoiError.Message.FieldIsRequired({ field: field.alias, path: pathWithSuffix, value });
                }
                else if (field.defaultValue !== undefined) {
                    parsedValue = { '': field.defaultValue };
                }
                else {
                    parsedValue = { '': undefined };
                }
            }
            else {
                if (field.array) {
                    if (!Array.isArray(value)) {
                        throw NesoiError.Message.InvalidFieldType({ field: field.alias, value, type: 'list' });
                    }
                }
        
                // 3. Run parse method
                try {
                    parsedValue = await MessageTemplateFieldParser(raw, trx, field, value, parseFields);
                }
                catch (e: any) {
                    // If this error was not triggered by a nested field,
                    // and we have another option, we try that option.
                    if (field.or && !e.__msg_deep_error) {
                        return parseField(trx, field.or, value)
                    }
                    e.__msg_deep_error = true
                    throw e
                }
            }
            
            return parsedValue;
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
                        throw NesoiError.Message.RuleFailed(rule, res);
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
    
    /**
     * Empty values: `{}`, `[]`, `''`, `null`, `undefined`
     */
    public static isEmpty(value: any) {
        if (value === null || value === undefined) {
            return true;
        }
        if (Array.isArray(value)) {
            return value.length === 0
        }
        if (typeof value === 'object') {
            return Object.keys(value).length === 0
        }
        if (typeof value === 'string') {
            return value.length === 0;
        }
        return false;
    }
}
export type AnyMessageParser = MessageParser<$Message>