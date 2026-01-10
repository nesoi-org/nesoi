import type { Overlay } from '~/engine/util/type';

export type TopicInput<
    Topic extends $Topic,
    IntrinsicMsg = Extract<Topic['#input']['#raw'], { $: Topic['name'] }>
> =
    Exclude<Topic['#input']['#raw'], IntrinsicMsg>
    | (IntrinsicMsg extends never
        ? never
        : Overlay<IntrinsicMsg, { $?: Topic['name'] } >)