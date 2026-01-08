import type { ScopedMessage, ScopedMessageName } from '~/schema';
import type { ResolvedBuilderNode } from '~/engine/dependency';
import type { Overlay } from '~/engine/util/type';
import type { MessageTemplateDef } from '~/elements/entities/message/template/message_template.builder';
import type { $MessageInfer } from '~/elements/entities/message/message.infer';
import type { ModuleTree } from '~/engine/tree';

import { $Topic } from './topic.schema';
import { BlockBuilder } from '../block.builder';
import { MessageBuilder } from '~/elements/entities/message/message.builder';

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

    private _subscriber?: TopicSubscriberBuilder<any>

    constructor(
        module: string,
        name: string
    ) {
        super(module, 'topic', name);
    }

    /* [Block] */

    public auth<U extends keyof Space['users']>(
        provider: U,
        resolver?: (user: Space['users'][U]) => boolean
    ) {
        return super.auth(provider, resolver) as unknown as TopicBuilder<
            Space, Module,
            Overlay<Topic, { '#auth': Topic['#auth'] & { [K in U]: Space['users'][U] } }>
        >;
    }

    /* [Topic] */


    public subscriber(
        def: TopicSubscriberDef<Space>
    ) {
        this._subscriber = new TopicSubscriberBuilder();
        def(this._subscriber);
        return this;
    }

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
        PreInput extends $Message = (Topic['#input']['#raw'] & { $: string})['$'] extends string ? Topic['#input'] : never
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

        const subscriber = TopicSubscriberBuilder.build(node.builder._subscriber);

        const input = node.builder._inputMsgs.map(m => m.tag);
        node.schema = new $Topic(
            node.builder.module,
            node.builder.name,
            node.builder._alias || node.builder.name,
            node.builder._auth,
            subscriber?.auth ?? [],
            input,
            node.builder._output,
        );

        return {
            schema: node.schema,
            inlineMessages: MessageBuilder.buildInlines(node, tree, module)
        };
    }

}

export class TopicSubscriberBuilder<
    Space extends $Space
> {
    protected _auth: {
        provider: string
        resolver?: (user: any) => boolean
    }[] = [];

    // Authentication

    public auth<U extends keyof Space['authnUsers']>(
        provider: U,
        resolver?: (user: Space['authnUsers'][U]) => boolean
    ) {
        this._auth ??= [];
        
        // Replace by provider name
        const match = this._auth.findIndex(opt => opt.provider === provider as string);
        if (match >= 0) {
            this._auth.splice(match, 1);
        }

        this._auth.push({
            provider: provider as string,
            resolver
        })
        return this as unknown;
    }

    public static build(builder?: TopicSubscriberBuilder<any>) {
        if (!builder) return;
        return {
            auth: builder._auth
        }
    }
}

export type TopicSubscriberDef<S extends $Space> = (builder: TopicSubscriberBuilder<S>) => any

export type AnyTopicBuilder = TopicBuilder<any, any, any>

export type TopicBuilderNode = Omit<ResolvedBuilderNode, 'builder'> & {
    builder: AnyTopicBuilder,
    schema?: $Topic
}