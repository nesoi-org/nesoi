import { $Module, $Space, ScopedMessage, ScopedMessageName } from '~/schema';
import { $Queue } from './queue.schema';
import { ResolvedBuilderNode } from '~/engine/dependency';
import { BlockBuilder } from '../block.builder';
import { Overlay } from '~/engine/util/type';
import { MultiMessageTemplateDef } from '~/elements/entities/message/template/message_template.builder';
import { $MessageInfer } from '~/elements/entities/message/message.infer';
import { MessageBuilder } from '~/elements/entities/message/message.builder';
import { ModuleTree } from '~/engine/tree';

export class QueueBuilder<
    Space extends $Space,
    M extends $Module,
    $ extends $Queue
> extends BlockBuilder<Space, M, 'queue'> {
    $b = 'queue' as const;

    constructor(
        module: string,
        name: string
    ) {
        super(module, 'queue', name);
    }

    /* [Block] */

    public authn<
        U extends keyof Space['authnUsers']
    >(...providers: U[]) {
        return super.authn(...providers as string[]) as any as QueueBuilder<
            Space, M,
            $ & { '#authn': U extends any[] ? U[number] : U }
        >;
    }

    public messages<
        Def extends MultiMessageTemplateDef<Space, M>
    >(def: Def) {
        type Messages = {
            [K in keyof ReturnType<Def> as `${$Queue['name']}${K extends '' ? '' : '.'}${K & string}`]: $MessageInfer<`${$Queue['name']}${K extends '' ? '' : '.'}${K & string}`, ($: any) => ReturnType<Def>[K] >
        }
        return super.messages(def) as any as QueueBuilder<
            Space,
            Overlay<M, {
                messages: Overlay<M['messages'], Messages>
            }>,
            $
        >;
    }

    public input<
        MsgName extends ScopedMessageName<M, $['name']>,
        Msg extends ScopedMessage<M, $['name'], MsgName>
    >(...def: MsgName[]) {
        return super._input(...def) as any as QueueBuilder<
            Space, M, Overlay<$, {
                '#input': Msg
            }>
        >;
    }

    // Build

    public static build(node: QueueBuilderNode, tree: ModuleTree, module: $Module) {
        node.schema = new $Queue(
            node.builder.module,
            node.builder.name,
            node.builder._alias || node.builder.name,
            node.builder._authn,
            node.builder._inputMsgs
        );
        return {
            schema: node.schema,
            inlineMessages: MessageBuilder.buildInlines(node, tree, module)
        };
    }

}

export type AnyQueueBuilder = QueueBuilder<any, any, any>

export type QueueBuilderNode = Omit<ResolvedBuilderNode, 'builder'> & {
    builder: AnyQueueBuilder,
    schema?: $Queue
}