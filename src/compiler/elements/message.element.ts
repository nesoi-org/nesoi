import type { TypeCompiler } from '../types/type_compiler';
import type { Compiler } from '../compiler';
import type { ResolvedBuilderNode } from '~/engine/dependency';
import { Element } from './element';
import { t } from '../types/type_compiler';

export class MessageElement extends Element<$Message> {

    constructor(
            protected compiler: Compiler,
            protected types: TypeCompiler,
            protected module: string,
            public $t: string,
            public files: string[],
            public schema: $Message,
            public dependencies: ResolvedBuilderNode[],
            public inlineRoot?: ResolvedBuilderNode,
            public bridge?: ResolvedBuilderNode['bridge']
    ) {
        super(compiler, module, $t, files, schema, dependencies, inlineRoot, bridge);
    }

    // Schema

    protected prepare() {
        this.schema['#raw'] = Element.Never;
        this.schema['#parsed'] = Element.Never;
        this.prepareFields(this.schema.template.fields);
    }

    private prepareFields(fields: $MessageTemplateFields) {
        Object.values(fields).forEach(field => {
            field['#raw'] = Element.Never;
            field['#parsed'] = Element.Never;
            if (field.children) {
                this.prepareFields(field.children);
            }
        });
    }

    // protected customSchemaImports(nesoiPath: string) {
    //     let has_rules = false;
    //     $MessageTemplate.forEachField(this.schema.template, field => {
    //         if (field.rules.length) has_rules = true;
    //     })
    //     if (has_rules) {
    //         return `import { $MessageTemplateRule } from '${nesoiPath}/lib/elements/entities/message/template/message_template.schema'`
    //     }
    //     else return '';
    // }

    // Interfaces

    public buildInterfaces() {
        const raw = this.types.message.raw[this.tag.short];
        const parsed = this.types.message.parsed[this.tag.short];

        this.interface
            .extends('$Message')
            .set({
                '#raw': raw,
                '#parsed': parsed,
                module: t.literal(this.module),
                name: t.literal(this.schema.name),
            })
    }

}