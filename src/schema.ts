import { $Controller } from './elements/edge/controller/controller.schema';
import { AnyUsers, User } from './engine/auth/authn';
import { $Machine } from './elements/blocks/machine/machine.schema';
import { $Constants } from './elements/entities/constants/constants.schema';
import { $Message } from './elements/entities/message/message.schema';
import { $Bucket } from './elements/entities/bucket/bucket.schema';
import { $Job } from './elements/blocks/job/job.schema';
import { $Resource } from './elements/blocks/resource/resource.schema';
import { $Queue } from './elements/blocks/queue/queue.schema';
import { $Externals } from './elements/edge/externals/externals.schema';

export type BuilderType = 'constants' | 'externals' | 'message' | 'bucket' | 'job' | 'resource' | 'machine' | 'controller' | 'queue'

export type $Space = {
    authnUsers: {
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
    '#input': $Message
    '#authn': AnyUsers
    '#providers': Record<string, any>
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