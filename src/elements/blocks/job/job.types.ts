;
import type { Overlay } from '~/engine/util/type';

export type JobInput<
    Job extends $Job,
    IntrinsicMsg = Extract<Job['#input']['#raw'], { $: Job['name'] }>
> =
    Exclude<Job['#input']['#raw'], IntrinsicMsg>
    | (IntrinsicMsg extends never
        ? never
        : Overlay<IntrinsicMsg, { $?: Job['name'] } >)