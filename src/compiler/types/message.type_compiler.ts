import type { ObjTypeNode, TypeCompiler, TypeNode } from './type_compiler';

import { NesoiRegex } from '~/engine/util/regex';
import { t } from './type_compiler';
import type { Tag, $Message, $MessageTemplateFields, $MessageTemplateField } from 'index';

export class MessageTypeCompiler {

    public raw: Record<string, ObjTypeNode> = {};
    public parsed: Record<string, ObjTypeNode> = {};

    constructor(
        private types: TypeCompiler
    ) {}

    compile(tag: Tag, schema: $Message) {
        const templateType = this.buildFields(schema.template.fields);
        this.raw[tag.short] = templateType.raw;
        this.raw[tag.short] = templateType.parsed;
    }

    private buildFields(fields: $MessageTemplateFields): { raw: ObjTypeNode, parsed: ObjTypeNode } {
        const raw = t.obj({});
        const parsed = t.obj({});

        for (const key in fields) {
            const type = this.buildField(fields[key])
            raw.children[key] = type.raw
            parsed.children[key] = type.parsed
        }
        
        return { raw, parsed };
    }

    private buildField(field: $MessageTemplateField): { raw: TypeNode, parsed: TypeNode }  {
        let raw = t.unknown();
        let parsed = t.unknown();
    
        if (field.type === 'boolean') {
            raw = t.boolean();
            parsed = raw;
        }
        else if (field.type === 'date') {
            raw = t.string();
            parsed = t.date();
        }
        else if (field.type === 'datetime') {
            raw = t.string();
            parsed = t.datetime();
        }
        else if (field.type === 'duration') {
            raw = t.string();
            parsed = t.duration();
        }
        else if (field.type === 'decimal') {
            raw = t.string();
            parsed = t.decimal();
        }
        else if (field.type === 'enum') {
            const options = field.meta!.enum!.options as string[];
            if (Array.isArray(options)) {
                raw = t.union(options.map(opt => t.literal(opt)))
            }
            else if (typeof options === 'object') {
                raw = t.union(Object.keys(options).map(opt => t.literal(opt)))
            }
            parsed = raw;
        }
        else if (field.type === 'file') {
            raw = t.file();
            parsed = raw
        }
        else if (field.type === 'float') {
            raw = t.number();
            parsed = raw
        }
        else if (field.type === 'int') {
            raw = t.number();
            parsed = raw
        }
        else if (field.type === 'string') {
            raw = t.string();
            parsed = raw
        }
        else if (field.type === 'literal') {
            const regex = field.meta!.literal!.template.toString();
            const rtype = NesoiRegex.toTemplateString(regex);
            raw = t.literal(`\`${rtype}\``);
            parsed = raw
        }
        else if (field.type === 'obj') {
            const children = this.buildFields(field.children!);
            raw = children.raw;
            parsed = children.parsed;
        }
        else if (field.type === 'unknown') {
            raw = t.unknown();
            parsed = raw;
        }
        else if (field.type === 'dict') {
            const child = this.buildField(field.children!['#']);
            raw = t.dict(child.raw)
            parsed = t.dict(child.parsed)
        }
        else if (field.type === 'list') {
            const child = this.buildField(field.children!['#']);
            raw = t.list(child.raw)
            parsed = t.list(child.parsed)
        }
        else if (field.type === 'union') {
            const options = Object.values(field.children!)
                .map(field => this.buildField(field))
            raw = t.union(options.map(opt => opt.raw));
            parsed = t.union(options.map(opt => opt.parsed));
        }
        else if (field.type === 'string_or_number') {
            raw = t.union([t.string(), t.number()]);
            parsed = raw;
        }
        else if (field.type === 'id') {
            const tag = field.meta.id!.bucket;
            const model = this.types.bucket.models[tag.short];
            raw = (model.children.id.kind === 'primitive' && model.children.id.subkind === 'number')
                ? t.number()
                : t.string()
            parsed = t.bucket(tag, field.meta.id!.view);
        }
        else if (field.type === 'msg') {
            raw = t.message(field.meta.msg!.tag, 'raw')
            parsed = t.message(field.meta.msg!.tag, 'parsed')
        }

        if (!field.required) {
            raw = t.union([
                t.undefined(),
                raw
            ]);
            parsed = t.union([
                t.undefined(),
                parsed
            ]);
        }
        return { raw, parsed };
    }
}