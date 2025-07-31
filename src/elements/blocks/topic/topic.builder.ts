import { $Module, $Space, ScopedMessage, ScopedMessageName } from '~/schema';
import { $Topic } from './topic.schema';
import { ResolvedBuilderNode } from '~/engine/dependency';
import { BlockBuilder } from '../block.builder';
import { Overlay } from '~/engine/util/type';
import { MessageTemplateDef } from '~/elements/entities/message/template/message_template.builder';
import { $MessageInfer } from '~/elements/entities/message/message.infer';
import { MessageBuilder } from '~/elements/entities/message/message.builder';
import { ModuleTree } from '~/engine/tree';
import { $Message } from '~/elements/entities/message/message.schema';

/**
 * @category Builders
 * @subcategory Block
 */
export class TopicBuilder<
    Space extends $Space,
    Module extends $Module,
    Topic extends $Topic
> extends BlockBuilder<Space, Module, 'topic'> {
    $b = 'topic' as const;

    constructor(
        module: string,
        name: string
    ) {
        super(module, 'topic', name);
    }

    /* [Block] */

    public authn<
        U extends keyof Space['authnUsers']
    >(...providers: U[]) {
        return super.authn(...providers as string[]) as unknown as TopicBuilder<
            Space, Module,
            Overlay<Topic, { '#authn': { [K in U]: Space['authnUsers'][U] } }>
        >;
    }

    /* [Topic] */

    public message<
        Name extends string,
        Def extends MessageTemplateDef<Space, Module, Name>,
        FullName extends string = `${Topic['name']}${Name extends '' ? '' : '.'}${Name & string}`,
        Msg extends $Message = $MessageInfer<FullName, ($: any) => ReturnType<Def>>
    >(name: Name, def: Def) {
        return super.message(name, def) as unknown as TopicBuilder<
            Space,
            Overlay<Module, {
                messages: Overlay<Module['messages'], {
                    [K in FullName]: Msg
                }>
            }>,
            Topic
        >;
    }

    public input<
        MsgName extends ScopedMessageName<Module, Topic['name']>,
        Msg extends NoInfer<ScopedMessage<Module, Topic['name'], MsgName>>,
        PreInput extends $Message = Topic['#input']['#raw']['$'] extends string ? Topic['#input'] : never
    >(...def: MsgName[]) {
        return super._input(...def) as unknown as TopicBuilder<
            Space, Module, Overlay<Topic, {
                '#input': PreInput | Msg,
                '#output': PreInput | Msg
            }>
        >;
    }


    // Build

    public static build(node: TopicBuilderNode, tree: ModuleTree, module: $Module) {

        const input = node.builder._inputMsgs;
        node.schema = new $Topic(
            node.builder.module,
            node.builder.name,
            node.builder._alias || node.builder.name,
            node.builder._authn,
            input,
            node.builder._output,
        );

        return {
            schema: node.schema,
            inlineMessages: MessageBuilder.buildInlines(node, tree, module)
        };
    }

}

export type AnyTopicBuilder = TopicBuilder<any, any, any>

export type TopicBuilderNode = Omit<ResolvedBuilderNode, 'builder'> & {
    builder: AnyTopicBuilder,
    schema?: $Topic
}