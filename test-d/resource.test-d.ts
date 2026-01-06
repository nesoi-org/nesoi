// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../index.d.ts"/>

/* eslint-disable unused-imports/no-unused-vars */
import { expectType } from 'tsd';
import type { Mock } from './mock';
import { ResourceBuilder } from '~/elements/blocks/resource/resource.builder';
import type { TrxNode } from '~/engine/transaction/trx_node';
import type { Infer } from './meta/types';
import type { ResourceAssertionDef } from '~/elements/blocks/job/internal/resource_job.builder';import type { NesoiDate } from '~/engine/data/date';
import type { NesoiDatetime } from '~/engine/data/datetime';
import type { NesoiDecimal } from '~/engine/data/decimal';

const _Mock = {
    module: 'MOCK_MODULE',
    resource: 'vanilla' as const
}

/* Types */

/**
 * test: .auth(*) should reference space auth users
*/

{
    const builder = new ResourceBuilder<Mock.Space, Mock.Module, Mock.VanillaResource>(_Mock.module, _Mock.resource)
    
    type AuthnParam = Parameters<typeof builder.auth>[0]
    expectType<keyof Mock.Space['users']>({} as AuthnParam)

    type AuthzParam = Parameters<typeof builder.auth<'api'>>[1]
    expectType<undefined | ((user: Mock.Space['users']['api']) => boolean)>({} as AuthzParam)
}

/**
 * test: .bucket(*) should reference module buckets
*/

{
    const builder = new ResourceBuilder<Mock.Space, Mock.Module, Mock.VanillaResource>(_Mock.module, _Mock.resource)
    
    type BucketParam = Parameters<typeof builder.bucket>[number]
    expectType<keyof Mock.Module['buckets']>({} as BucketParam)
}

/**
 * test: .query(*) should reference module view names
*/

{
    const builder = new ResourceBuilder<Mock.Space, Mock.Module, Mock.VanillaResource>(_Mock.module, _Mock.resource)
        .bucket('full')

    type BucketParam = Parameters<typeof builder.query>[0]
    expectType<keyof Mock.FullBucket['views']>({} as BucketParam)
}

/**
 * test: .create().[extra|assert|prepare|after]() should expose context correctly
*/

{
    type Users = { api: Mock.Space['users']['api'] };
    new ResourceBuilder<Mock.Space, Mock.Module, Mock.VanillaResource>(_Mock.module, _Mock.resource)
        .auth('api')
        .bucket('mock')
        .create($ => {
            $.extra($ => $.trx)
            type ExpectedCtx ={
                trx: TrxNode<Mock.Space, Mock.Module, Users>,
                msg: Infer<{ $: 'vanilla.create' } & Omit<Mock.MockBucket['#data'], 'id'>>,
                extra: {},
                job: $Job,
                that: ResourceAssertionDef<Mock.MockBucket>
            }

            $.extra($ => {
                expectType<ExpectedCtx['trx']>({} as typeof $.trx);
                expectType<ExpectedCtx['msg']>({} as Infer<typeof $.msg>);
                expectType<ExpectedCtx['extra']>({} as typeof $.extra);
                expectType<ExpectedCtx['job']>({} as typeof $.job);
                return {}
            })

            $.assert($ => {
                expectType<ExpectedCtx['trx']>({} as typeof $.trx);
                expectType<ExpectedCtx['msg']>({} as Infer<typeof $.msg>);
                expectType<ExpectedCtx['extra']>({} as typeof $.extra);
                expectType<ExpectedCtx['job']>({} as typeof $.job);
                expectType<ExpectedCtx['that']>({} as typeof $.that);
                return true
            })
            
            $.prepare($ => {
                expectType<ExpectedCtx['trx']>({} as typeof $.trx);
                expectType<ExpectedCtx['msg']>({} as Infer<typeof $.msg>);
                expectType<ExpectedCtx['extra']>({} as typeof $.extra);
                expectType<ExpectedCtx['job']>({} as typeof $.job);
                return {}
            })
            
            $.after($ => {
                expectType<ExpectedCtx['trx']>({} as typeof $.trx);
                expectType<ExpectedCtx['msg']>({} as Infer<typeof $.msg>);
                expectType<ExpectedCtx['extra']>({} as typeof $.extra);
                expectType<ExpectedCtx['job']>({} as typeof $.job);
                expectType<Mock.MockBucket['#data']>({} as typeof $.obj);
            })
        })
}

/**
 * test: .update().[extra|assert|prepare|after]() should expose context correctly
*/

{
    type Users = { api: Mock.Space['users']['api'] };
    new ResourceBuilder<Mock.Space, Mock.Module, Mock.VanillaResource>(_Mock.module, _Mock.resource)
        .auth('api')
        .bucket('mock')
        .update($ => {
            type ExpectedCtx = {
                trx: TrxNode<Mock.Space, Mock.Module, Users>,
                msg: Infer<{ $: 'vanilla.update' } & Mock.MockBucket['#data']>,
                extra: {},
                job: $Job,
                obj: Mock.MockBucket['#data'],
                that: ResourceAssertionDef<Mock.MockBucket>
            }
            
            $.extra($ => {
                expectType<ExpectedCtx['trx']>({} as typeof $.trx);
                expectType<ExpectedCtx['msg']>({} as Infer<typeof $.msg>);
                expectType<ExpectedCtx['extra']>({} as typeof $.extra);
                expectType<ExpectedCtx['job']>({} as typeof $.job);
                expectType<ExpectedCtx['obj']>({} as typeof $.obj);
                return {}
            })

            $.assert($ => {
                expectType<ExpectedCtx['trx']>({} as typeof $.trx);
                expectType<ExpectedCtx['msg']>({} as Infer<typeof $.msg>);
                expectType<ExpectedCtx['extra']>({} as typeof $.extra);
                expectType<ExpectedCtx['job']>({} as typeof $.job);
                expectType<ExpectedCtx['obj']>({} as typeof $.obj);
                expectType<ExpectedCtx['that']>({} as typeof $.that);
                return true
            })
            
            $.prepare($ => {
                expectType<ExpectedCtx['trx']>({} as typeof $.trx);
                expectType<ExpectedCtx['msg']>({} as Infer<typeof $.msg>);
                expectType<ExpectedCtx['extra']>({} as typeof $.extra);
                expectType<ExpectedCtx['job']>({} as typeof $.job);
                expectType<ExpectedCtx['obj']>({} as typeof $.obj);
                return {}
            })
            
            $.after($ => {
                expectType<ExpectedCtx['trx']>({} as typeof $.trx);
                expectType<ExpectedCtx['msg']>({} as Infer<typeof $.msg>);
                expectType<ExpectedCtx['extra']>({} as typeof $.extra);
                expectType<ExpectedCtx['job']>({} as typeof $.job);
                expectType<ExpectedCtx['obj']>({} as typeof $.obj);
            })
        })
}

/**
 * test: .delete().[extra|assert|prepare|after]() should expose context correctly
*/

{
    type Users = { api: Mock.Space['users']['api'] };
    new ResourceBuilder<Mock.Space, Mock.Module, Mock.VanillaResource>(_Mock.module, _Mock.resource)
        .auth('api')
        .bucket('mock')
        .delete($ => {
            type ExpectedCtx ={
                trx: TrxNode<Mock.Space, Mock.Module, Users>,
                msg: { $: 'vanilla.delete', id: Mock.MockBucket['#data']['id'] },
                extra: {},
                job: $Job,
                obj: Mock.MockBucket['#data'],
                that: ResourceAssertionDef<Mock.MockBucket>
            }

            type ExtraCtx = Parameters<Parameters<typeof $.extra>[0]>[0]
            $.extra($ => {
                expectType<ExpectedCtx['trx']>({} as typeof $.trx);
                expectType<ExpectedCtx['msg']>({} as Infer<typeof $.msg>);
                expectType<ExpectedCtx['extra']>({} as typeof $.extra);
                expectType<ExpectedCtx['job']>({} as typeof $.job);
                expectType<ExpectedCtx['obj']>({} as typeof $.obj);
                return {}
            })

            $.assert($ => {
                expectType<ExpectedCtx['trx']>({} as typeof $.trx);
                expectType<ExpectedCtx['msg']>({} as Infer<typeof $.msg>);
                expectType<ExpectedCtx['extra']>({} as typeof $.extra);
                expectType<ExpectedCtx['job']>({} as typeof $.job);
                expectType<ExpectedCtx['obj']>({} as typeof $.obj);
                expectType<ExpectedCtx['that']>({} as typeof $.that);
                return true
            })
            
            $.prepare($ => {
                expectType<ExpectedCtx['trx']>({} as typeof $.trx);
                expectType<ExpectedCtx['msg']>({} as Infer<typeof $.msg>);
                expectType<ExpectedCtx['extra']>({} as typeof $.extra);
                expectType<ExpectedCtx['job']>({} as typeof $.job);
                expectType<ExpectedCtx['obj']>({} as typeof $.obj);
                return true
            })
            
            $.after($ => {
                expectType<ExpectedCtx['trx']>({} as typeof $.trx);
                expectType<ExpectedCtx['msg']>({} as Infer<typeof $.msg>);
                expectType<ExpectedCtx['extra']>({} as typeof $.extra);
                expectType<ExpectedCtx['job']>({} as typeof $.job);
                expectType<ExpectedCtx['obj']>({} as typeof $.obj);
            })
        })
}

/**
 * test: .create().input() should work with big message
*/

{
    type Users = { api: Mock.Space['users']['api'] };
    new ResourceBuilder<Mock.Space, Mock.Module, Mock.VanillaResource>(_Mock.module, _Mock.resource)
        .auth('api')
        .bucket('mock')
        .create($ => $
            .input($ => ({
                propBoolean: $.boolean,
                propDate: $.date,
                propDatetime: $.datetime,
                propDecimal: $.decimal(),
                propEnum: $.enum(['a', 'b', 'c'] as const),
                propId: $.id('mock'),
                propInt: $.int,
                propString: $.string,
                propObj: $.obj({
                    deepBoolean: $.boolean,
                    deepDate: $.date,
                    deepDatetime: $.datetime,
                    deepDecimal: $.decimal(),
                    deepEnum: $.enum(['1', '2', '3'] as const),
                    deepId: $.id('mock'),
                    deepInt: $.int,
                    deepString: $.string,
                    deepObj: $.obj({
                        ok: $.boolean,
                    })
                }),
                propBooleanOptional: $.boolean.optional,
                propDateOptional: $.date.optional,
                propDatetimeOptional: $.datetime.optional,
                propDecimalOptional: $.decimal().optional,
                propEnumOptional: $.enum(['a', 'b', 'c'] as const).optional,
                propIdOptional: $.id('mock').optional,
                propIntOptional: $.int.optional,
                propStringOptional: $.string.optional,
                propObjOptional: $.obj({
                    deepBoolean: $.boolean,
                    deepDate: $.date,
                    deepDatetime: $.datetime,
                    deepDecimal: $.decimal(),
                    deepEnumOptional: $.enum(['1', '2', '3'] as const).optional,
                    deepInt: $.int,
                    deepString: $.string,
                    deepObj: $.obj({
                        okOptional: $.boolean.optional,
                    })
                }).optional,
                propBooleanNullable: $.boolean.nullable,
                propDateNullable: $.date.nullable,
                propDatetimeNullable: $.datetime.nullable,
                propDecimalNullable: $.decimal().nullable,
                propEnumNullable: $.enum(['a', 'b', 'c'] as const).nullable,
                propIdNullable: $.id('mock').nullable,
                propIntNullable: $.int.nullable,
                propStringNullable: $.string.nullable,
                propObjNullable: $.obj({
                    deepBoolean: $.boolean,
                    deepDate: $.date,
                    deepDatetime: $.datetime,
                    deepEnumNullable: $.enum(['1', '2', '3'] as const).nullable,
                    deepId: $.id('mock'),
                    deepInt: $.int,
                    deepString: $.string,
                    deepObj: $.obj({
                        okNullable: $.boolean.nullable,
                    })
                }).nullable,
                propBooleanList: $.list($.boolean),
                propDateList: $.list($.date),
                propDatetimeList: $.list($.datetime),
                propDecimalList: $.list($.decimal()),
                propEnumList: $.list($.enum(['a', 'b', 'c'] as const)),
                propIdList: $.list($.id('mock')),
                propIntList: $.list($.int),
                propStringList: $.list($.string),
                propObjList: $.list($.obj({
                    deepBoolean: $.boolean,
                    deepDate: $.date,
                    deepDatetime: $.datetime,
                    deepEnumList: $.list($.enum(['1', '2', '3'] as const)),
                    deepId: $.id('mock'),
                    deepInt: $.int,
                    deepString: $.string,
                    deepObj: $.obj({
                        okList: $.list($.boolean),
                    })
                }))
            }))
            .extra($ => {
                type Message = typeof $.msg

                type ExpectedMsg = {
                    $: 'vanilla.create',
                    propBoolean: boolean,
                    propDate: NesoiDate,
                    propDatetime: NesoiDatetime,
                    propDecimal: NesoiDecimal,
                    propEnum: 'a' | 'b' | 'c'
                    propId: Mock.MockBucket['#data']
                    propInt: number,
                    propString: string,
                    propObj: {
                        deepBoolean: boolean,
                        deepDate: NesoiDate,
                        deepDatetime: NesoiDatetime,
                        deepDecimal: NesoiDecimal,
                        deepEnum: '1' | '2' | '3',
                        deepId: Mock.MockBucket['#data']
                        deepInt: number,
                        deepString: string,
                        deepObj: {
                            ok: boolean,
                        }
                    },
                    propBooleanOptional?: boolean,
                    propDateOptional?: NesoiDate,
                    propDatetimeOptional?: NesoiDatetime,
                    propDecimalOptional?: NesoiDecimal,
                    propEnumOptional?: 'a' | 'b' | 'c',
                    propIdOptional?: Mock.MockBucket['#data']
                    propIntOptional?: number,
                    propStringOptional?: string,
                    propObjOptional?: {
                        deepBoolean: boolean,
                        deepDate: NesoiDate,
                        deepDatetime: NesoiDatetime,
                        deepDecimal: NesoiDecimal,
                        deepEnumOptional?: '1' | '2' | '3',
                        deepInt: number,
                        deepString: string,
                        deepObj: {
                            okOptional?: boolean,
                        }
                    }
                    propBooleanNullable: boolean | null
                    propDateNullable: NesoiDate | null
                    propDatetimeNullable: NesoiDatetime | null
                    propDecimalNullable: NesoiDecimal | null
                    propEnumNullable: ('a' | 'b' | 'c') | null
                    propIdNullable: Mock.MockBucket['#data'] | null
                    propIntNullable: number | null
                    propStringNullable: string | null
                    propObjNullable: {
                        deepBoolean: boolean,
                        deepDate: NesoiDate,
                        deepDatetime: NesoiDatetime,
                        deepEnumNullable: ('1' | '2' | '3') | null
                        deepId: Mock.MockBucket['#data']
                        deepInt: number,
                        deepString: string,
                        deepObj: {
                            okNullable: boolean | null
                        }
                    } | null
                    propBooleanList: boolean[]
                    propDateList: NesoiDate[]
                    propDatetimeList: NesoiDatetime[]
                    propDecimalList: NesoiDecimal[]
                    propEnumList: ('a' | 'b' | 'c')[]
                    propIdList: Mock.MockBucket['#data'][]
                    propIntList: number[]
                    propStringList: string[]
                    propObjList: {
                        deepBoolean: boolean,
                        deepDate: NesoiDate,
                        deepDatetime: NesoiDatetime,
                        deepEnumList: ('1' | '2' | '3')[]
                        deepId: Mock.MockBucket['#data']
                        deepInt: number,
                        deepString: string,
                        deepObj: {
                            okList: boolean[]
                        }
                    }[]
                }
                expectType<ExpectedMsg>({} as Infer<Message>)
                return {}
            })
        )
}