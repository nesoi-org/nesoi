import { colored } from '~/engine/util/string';
import { $MessageTemplate, $MessageTemplateFields } from './template/message_template.schema';

/**
 * @category Schemas
 * @subcategory Entity
 * */
export class $Message {
    public $t = 'message' as const;
    
    public '#raw': { $: unknown };// typeonly
    public '#parsed': { $: unknown }; // typeonly

    constructor(
        public module: string,
        public name: string,
        public alias: string,
        public template: $MessageTemplate
    ) {}

    public static describe(schema: $Message) {
        let str = '';
        str += `◆ ${schema.module}::message:${colored(schema.name, 'lightblue')}\n`
        str += `  "${schema.alias}"\n\n`
        
        const fields = (_fields: $MessageTemplateFields, d = 0) => {
            for (const key in _fields) {
                const field = _fields[key];
                str += `${'  '.repeat(d)}- ${colored(key, 'green')}${field.required ? '' : '?'}: ${field.type}`
                if (field.type === 'id') {
                    str += `(${field.meta.id!.bucket.refName})`;
                }
                if (field.type === 'enum') {
                    const options = field.meta.enum!.options
                    if (typeof options === 'object') {
                        str += `(${Object.keys(options)})`;
                    }
                    else {
                        str += `(${options})`;
                    }
                }
                if (field.array) {
                    str += '[]';
                }
                str += '\n';
                if (field.children) {
                    fields(field.children, d+1);
                }
            }
        }
        fields(schema.template.fields);
        return str;
    }
}