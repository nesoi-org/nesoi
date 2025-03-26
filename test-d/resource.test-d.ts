/* eslint-disable unused-imports/no-unused-vars */
import { expectType } from 'tsd';
import { Mock } from './mock';
import { ResourceBuilder } from '~/elements/blocks/resource/resource.builder';
import { TrxNode } from '~/engine/transaction/trx_node';
import { Infer } from './meta/types';
import { $Job } from '~/elements';
import { ResourceAssertionDef } from '~/elements/blocks/job/internal/resource_job.builder';
import { NesoiDate } from '~/engine/data/date';
import { Decimal } from '~/engine/data/decimal';
import { NesoiDatetime } from '~/engine/data/datetime';

const _Mock = {
    module: 'MOCK_MODULE',
    resource: 'vanilla' as const
}

/* Types */

/**
 * test: .authn(*) should reference space auth users
*/

{
    const builder = new ResourceBuilder<Mock.Space, Mock.Module, Mock.VanillaResource>(_Mock.module, _Mock.resource)
    
    type AuthnParam = Parameters<typeof builder.authn>[number]
    expectType<keyof Mock.Space['authnUsers']>({} as AuthnParam)
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
 * test: .view(*) should reference module view names
*/

{
    const builder = new ResourceBuilder<Mock.Space, Mock.Module, Mock.VanillaResource>(_Mock.module, _Mock.resource)
        .bucket('mock')

    type BucketParam = Parameters<typeof builder.view>[number]
    expectType<keyof Mock.MockBucket['views']>({} as BucketParam)
}

/**
 * test: .query(*) should reference module view names
*/

{
    const builder = new ResourceBuilder<Mock.Space, Mock.Module, Mock.VanillaResource>(_Mock.module, _Mock.resource)
        .bucket('full')

    type BucketParam = Parameters<typeof builder.view>[number]
    expectType<keyof Mock.FullBucket['views']>({} as BucketParam)
}

/**
 * test: .create().[extra|assert|prepare|after]() should expose context correctly
*/

{
    type Users = { api: Mock.Space['authnUsers']['api'] };
    new ResourceBuilder<Mock.Space, Mock.Module, Mock.VanillaResource>(_Mock.module, _Mock.resource)
        .authn('api')
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
    type Users = { api: Mock.Space['authnUsers']['api'] };
    new ResourceBuilder<Mock.Space, Mock.Module, Mock.VanillaResource>(_Mock.module, _Mock.resource)
        .authn('api')
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
    type Users = { api: Mock.Space['authnUsers']['api'] };
    new ResourceBuilder<Mock.Space, Mock.Module, Mock.VanillaResource>(_Mock.module, _Mock.resource)
        .authn('api')
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
    type Users = { api: Mock.Space['authnUsers']['api'] };
    new ResourceBuilder<Mock.Space, Mock.Module, Mock.VanillaResource>(_Mock.module, _Mock.resource)
        .authn('api')
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
                propBooleanArray: $.boolean.array,
                propDateArray: $.date.array,
                propDatetimeArray: $.datetime.array,
                propDecimalArray: $.decimal().array,
                propEnumArray: $.enum(['a', 'b', 'c'] as const).array,
                propIdArray: $.id('mock').array,
                propIntArray: $.int.array,
                propStringArray: $.string.array,
                propObjArray: $.obj({
                    deepBoolean: $.boolean,
                    deepDate: $.date,
                    deepDatetime: $.datetime,
                    deepEnumArray: $.enum(['1', '2', '3'] as const).array,
                    deepId: $.id('mock'),
                    deepInt: $.int,
                    deepString: $.string,
                    deepObj: $.obj({
                        okArray: $.boolean.array,
                    })
                }).array
            }))
            .extra($ => {
                type Message = typeof $.msg

                type ExpectedMsg = {
                    $: 'vanilla.create',
                    propBoolean: boolean,
                    propDate: NesoiDate,
                    propDatetime: NesoiDatetime,
                    propDecimal: Decimal,
                    propEnum: 'a' | 'b' | 'c'
                    propId: Mock.MockBucket['#data']
                    propInt: number,
                    propString: string,
                    propObj: {
                        deepBoolean: boolean,
                        deepDate: NesoiDate,
                        deepDatetime: NesoiDatetime,
                        deepDecimal: Decimal,
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
                    propDecimalOptional?: Decimal,
                    propEnumOptional?: 'a' | 'b' | 'c',
                    propIdOptional?: Mock.MockBucket['#data']
                    propIntOptional?: number,
                    propStringOptional?: string,
                    propObjOptional?: {
                        deepBoolean: boolean,
                        deepDate: NesoiDate,
                        deepDatetime: NesoiDatetime,
                        deepDecimal: Decimal,
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
                    propDecimalNullable: Decimal | null
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
                    propBooleanArray: boolean[]
                    propDateArray: NesoiDate[]
                    propDatetimeArray: NesoiDatetime[]
                    propDecimalArray: Decimal[]
                    propEnumArray: ('a' | 'b' | 'c')[]
                    propIdArray: Mock.MockBucket['#data'][]
                    propIntArray: number[]
                    propStringArray: string[]
                    propObjArray: {
                        deepBoolean: boolean,
                        deepDate: NesoiDate,
                        deepDatetime: NesoiDatetime,
                        deepEnumArray: ('1' | '2' | '3')[]
                        deepId: Mock.MockBucket['#data']
                        deepInt: number,
                        deepString: string,
                        deepObj: {
                            okArray: boolean[]
                        }
                    }[]
                }
                expectType<ExpectedMsg>({} as Infer<Message>)
                return {}
            })
        )
}