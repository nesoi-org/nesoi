import type { $Module, $Space } from '~/schema';
import type { MessageTemplateDef } from './template/message_template.builder';
import type { $MessageInfer } from './message.infer';
import type { ModuleTree } from '~/engine/tree';
import type { ResolvedBuilderNode } from '~/engine/dependency';

import { $Message } from './message.schema';
import { $MessageTemplate } from './template/message_template.schema';
import { MessageTemplateBuilder } from './template/message_template.builder';
import { MessageTemplateFieldFactory } from './template/message_template_field.builder';

/**
 * @category Builders
 * @subcategory Entity
 * */
export class MessageBuilder<
    Space extends $Space,
    Module extends $Module,
    Message extends $Message = $Message
> {
    public $b = 'message' as const;

    private alias?: string;
    private _template: MessageTemplateBuilder = new MessageTemplateBuilder();

    constructor(
        private module: string,
        private name: string
    ) {}
    
    as(
        alias: string
    ) {
        this.alias = alias;
        return this;
    }
    
    template<
        Def extends MessageTemplateDef<Space, Module, Message['name']>,
    >(
        $: Def
    ) {
        const factory = new MessageTemplateFieldFactory<any, any, any>(this.module);
        const fields = $(factory);
        this._template.fields(fields);
        type MessageInfer = $MessageInfer<Message['name'], Def>
        return this as MessageBuilder<Space, Module, MessageInfer>;
    }

    // Build
    
    public static build(
        node: MessageBuilderNode,
        tree: ModuleTree,
        module: $Module
    ) {
        node.schema = new $Message(
            module.name,
            node.builder.name,
            node.builder.alias || node.builder.name,
            node.builder._template ? MessageTemplateBuilder.build(node.builder._template, tree, module) : new $MessageTemplate()
        );
        return node.schema;
    }

    // Build Inline

    public static buildInlines(node: ResolvedBuilderNode, tree: ModuleTree, module: $Module) {
        const nodeInlines = node.inlines.message || {};

        const inlineMessages: Record<string, $Message> = {};
        for (const name in nodeInlines || {}) {
            const inline = nodeInlines[name];
            inlineMessages[name] = MessageBuilder.build(inline as MessageBuilderNode, tree, module);
        }
        return inlineMessages;
    }

}

export type AnyMessageBuilder = MessageBuilder<any, any, any>

export type MessageBuilderNode = ResolvedBuilderNode & {
    builder: AnyMessageBuilder,
    schema?: $Message
}