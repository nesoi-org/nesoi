import type { $Controller } from './elements/edge/controller/controller.schema';
import type { AnyUsers, User } from './engine/auth/authn';
import type { $Machine } from './elements/blocks/machine/machine.schema';
import type { $Constants } from './elements/entities/constants/constants.schema';
import type { $Message } from './elements/entities/message/message.schema';
import type { $Bucket } from './elements/entities/bucket/bucket.schema';
import type { $Job } from './elements/blocks/job/job.schema';
import type { $Resource } from './elements/blocks/resource/resource.schema';
import type { $Queue } from './elements/blocks/queue/queue.schema';
import type { $Externals } from './elements/edge/externals/externals.schema';
import type { $Topic } from './elements/blocks/topic/topic.schema';

export type ElementType = 'constants' | 'externals' | 'message' | 'bucket' | 'job' | 'resource' | 'machine' | 'controller' | 'queue' | 'topic'

export type $Space = {
    users: {
        [x: string]: User
    }
    modules: {
        [x: string]: $Module
    }
}

export type $Module = {
    name: string
    constants: $Constants
    externals: $Externals
    messages: {
        [x: string]: $Message
    }
    buckets: {
        [x: string]: $Bucket
    }
    jobs: {
        [x: string]: $Job
    }
    resources: {
        [x: string]: $Resource
    }
    machines: {
        [x: string]: $Machine
    }
    controllers: {
        [x: string]: $Controller
    }
    queues: {
        [x: string]: $Queue
    }
    topics: {
        [x: string]: $Topic
    }
    '#input': $Message
    '#auth': AnyUsers
    '#services': Record<string, any>
}

// Helpers

export type ModuleName<
    $ extends $Space
> = keyof $['modules']

export type MessageName<
    $ extends $Module
> = keyof $['messages']

export type ScopedMessageNameWithId<
    $ extends $Module,
    Scope extends string,
    Id,
    Msgs extends Record<string, $Message> = $['messages']
> = string & {
    [Msg in keyof Msgs]:
        Msgs[Msg]['#parsed'] extends { id: Id }
            ? Msg extends `${Scope}.${infer X}` ? (Msg | `@.${X}`) : Msg
            : never
}[keyof Msgs]

export type ScopedMessageName<
    $ extends $Module,
    Scope extends string,
    Msgs extends string | symbol | number = keyof $['messages']
> = string & {
    [Msg in Msgs]: Msg extends Scope
        ? '@' | Msg
        : Msg extends `${Scope}.${infer X}`
            ? (Msg | `@.${X}`)
            : Msg
}[Msgs]

export type ScopedMessage<
    $ extends $Module,
    Scope extends string,
    MsgName extends string
> = MsgName extends '@'
    ? $['messages'][Scope]
    : MsgName extends `@.${infer X}`
        ? $['messages'][`${Scope}.${X}`]
        : $['messages'][MsgName]

export type RawMessageInput<
    $ extends $Module,
    K extends MessageName<$>
> = $['messages'][K]['#raw']

export type ViewName<
    $ extends $Bucket
> = keyof $['views']

export type ViewObj<
    $ extends $Bucket,
    V extends ViewName<$>
> = $['views'][V]['#data']

export type BucketName<
    $ extends $Module
> = keyof $['buckets']