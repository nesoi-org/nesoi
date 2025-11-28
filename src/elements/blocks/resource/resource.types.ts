/* File splitters */

import type { $Module, $Space } from '~/schema';
import type { $Resource } from './resource.schema';
import type { NesoiObjId, UndefinedToOptional } from '~/engine/data/obj';
import type { ResourceJobDef } from '../job/internal/resource_job.builder';
import type { $Message } from '~/elements/entities/message/message.schema';
import type { Overlay } from '~/engine/util/type';

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
> = ResourceJobDef<S, M, MsgName, Response, $['#authn'], $['#bucket'], DefaultTrigger>

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
> = ResourceJobDef<S, M, MsgName, Response, $['#authn'], $['#bucket'], DefaultTrigger>

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
> = ResourceJobDef<S, M, MsgName, boolean, $['#authn'], $['#bucket'], DefaultTrigger, { id: NesoiObjId }>