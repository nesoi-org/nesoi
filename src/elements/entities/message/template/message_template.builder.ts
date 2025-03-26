import { $Module, $Space } from '~/schema';
import { $MessageTemplate } from './message_template.schema';
import { MessageTemplateFieldBuilder, MessageTemplateFieldBuilders, MessageTemplateFieldFactory } from './message_template_field.builder';
import { ModuleTree } from '~/engine/tree';

export class MessageTemplateBuilder {

    private _fields: MessageTemplateFieldBuilders = {};

    constructor(
    ) {}

    public fields(builders: MessageTemplateFieldBuilders) {
        this._fields = builders;
        return this;
    }

    /// Build
    
    public static build(builder: MessageTemplateBuilder, tree: ModuleTree, module: $Module) {
        const fields = MessageTemplateFieldBuilder.buildChildren(builder._fields, tree, module);
        return new $MessageTemplate(
            fields
        );
    }

}

export type MessageTemplateDef<
    Space extends $Space,
    Module extends $Module,
    MsgName extends keyof Module['messages']
> = ($: MessageTemplateFieldFactory<Space, Module, MsgName>) => MessageTemplateFieldBuilders

export type MultiMessageTemplateDef<
    Space extends $Space,
    Module extends $Module
> = ($: MessageTemplateFieldFactory<Space, Module, any /* TODO: is there a way to type this? */>) => {
    [x: string]: MessageTemplateFieldBuilders
}