import type { UndefinedToOptional } from '~/engine/data/obj';
import type { ResourceJobDef } from '../job/internal/resource_job.builder';
import type { Overlay } from '~/engine/util/type';
import type { $Space, $Module, $Resource, $Message, Id } from 'index';

export type asResourceCreateJob<
    S extends $Space,
    Module extends keyof S['modules'],
    Res extends keyof S['modules'][Module]['resources'],
    M extends $Module = S['modules'][Module],
    $ extends $Resource = M['resources'][Res],
    Response extends Record<string, any> = UndefinedToOptional<
        Omit<$['#bucket']['#data'], 'id'>
    >,
    MsgName extends string = `${$['name']}.create`,
    MsgData extends Record<string, any> = Omit<$['#bucket']['#data'], 'id'>,
    DefaultTrigger extends $Message = Overlay<$Message, {
        $: MsgName,
        '#raw': MsgData['#input'] & { $: MsgData['$'] },
        '#parsed': MsgData['#output'] & { $: MsgData['$'] }
        fields: any
    }>
> = ResourceJobDef<S, M, MsgName, Response, $['#auth'], $['#bucket'], DefaultTrigger>

export type asResourceUpdateJob<
    S extends $Space,
    Module extends keyof S['modules'],
    Res extends keyof S['modules'][Module]['resources'],
    M extends $Module = S['modules'][Module],
    $ extends $Resource = M['resources'][Res],
    Response extends Record<string, any> = UndefinedToOptional<
        Omit<$['#bucket']['#data'], 'id'>
    >,
    MsgName extends string = `${$['name']}.update`,
    MsgData extends Record<string, any> = $['#bucket']['#data'],
    DefaultTrigger extends $Message = Overlay<$Message, {
        $: MsgName,
        '#raw': MsgData['#input'] & { $: MsgData['$'] },
        '#parsed': MsgData['#output'] & { $: MsgData['$'] }
        fields: any
    }>
> = ResourceJobDef<S, M, MsgName, Response, $['#auth'], $['#bucket'], DefaultTrigger>

export type asResourceDeleteJob<
    S extends $Space,
    Module extends keyof S['modules'],
    Res extends keyof S['modules'][Module]['resources'],
    M extends $Module = S['modules'][Module],
    $ extends $Resource = M['resources'][Res],
    MsgName extends string = `${$['name']}.update`,
    MsgData extends Record<string, any> = $['#bucket']['#data'],
    DefaultTrigger extends $Message = Overlay<$Message, {
        $: MsgName,
        '#raw': MsgData['#input'] & { $: MsgData['$'] },
        '#parsed': MsgData['#output'] & { $: MsgData['$'] }
        fields: any
    }>
> = ResourceJobDef<S, M, MsgName, boolean, $['#auth'], $['#bucket'], DefaultTrigger, { id: Id }>