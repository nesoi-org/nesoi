

export type ElementType = 'constants' | 'externals' | 'message' | 'bucket' | 'job' | 'resource' | 'machine' | 'controller' | 'queue' | 'topic'

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