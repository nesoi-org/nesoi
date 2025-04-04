/* eslint-disable unused-imports/no-unused-vars */
import { expectAssignable, expectNotAssignable, expectType } from 'tsd';
import { Mock } from './mock';
import { JobBuilder } from '~/elements/blocks/job/job.builder';
import { Decimal } from '~/engine/data/decimal';
import { NesoiDate } from '~/engine/data/date';
import { TrxNode } from '~/engine/transaction/trx_node';
import { $Job } from '~/elements';
import { Infer } from './meta/types';
import { TrxEngine } from '~/engine/transaction/trx_engine';

const _Mock = {
    module: 'MOCK_MODULE',
    job: 'vanilla' as const
}

/* Types */

/**
 * test: Authn should reference space auth users
*/

{
    const builder = new JobBuilder<Mock.Space, Mock.Module, Mock.VanillaJob>(_Mock.module, _Mock.job)
    
    type AuthnParam = Parameters<typeof builder.authn>[number]
    expectType<keyof Mock.Space['authnUsers']>({} as AuthnParam)
}

/**
 * test: Should allow specifying a inline message
*/

{
    const builder = new JobBuilder<Mock.Space, Mock.Module, Mock.VanillaJob>(_Mock.module, _Mock.job)
        .messages($ => ({
            inline_msg: {
                a: $.string,
                b: $.decimal(),
                c: $.date,
                d: $.id('mock'),
            }
        }))
    
    type Module = typeof builder extends JobBuilder<any, infer X, any> ? X : never;
    type ExpectedRaw = {
        'vanilla.inline_msg': {
            $: 'vanilla.inline_msg'
            a: string
            b: string
            c: string
            d_id: Mock.MockBucket['#data']['id']
        }
    }
    type ExpectedParsed = {
        'vanilla.inline_msg': {
            $: 'vanilla.inline_msg'
            a: string
            b: Decimal
            c: NesoiDate
            d: Mock.MockBucket['#data']
        }
    }
    expectType<ExpectedRaw>({} as {
        'vanilla.inline_msg': Infer<Module['messages']['vanilla.inline_msg']['#raw']>
    })
    expectType<ExpectedParsed>({} as {
        'vanilla.inline_msg': Infer<Module['messages']['vanilla.inline_msg']['#parsed']>
    })
}

/**
 * test: Input should reference module messages
*/

{
    const builder = new JobBuilder<Mock.Space, Mock.Module, Mock.VanillaJob>(_Mock.module, _Mock.job)
    
    type InputParams = Parameters<typeof builder.input>[number];
    expectType<keyof Mock.Module['messages']>({} as InputParams)
}

/**
 * test: Input should reference module messages and custom messages
*/

{
    const builder = new JobBuilder<Mock.Space, Mock.Module, Mock.VanillaJob>(_Mock.module, _Mock.job)
        .messages($ => ({
            '': {
                a: $.string
            },
            'inline': {
                b: $.boolean
            },
            'inline2': {
                b: $.boolean
            },
        }))
    type InputParams = Parameters<typeof builder.input>[number];
    expectType<keyof Mock.Module['messages']
        | 'vanilla'
        | '@'
        | 'vanilla.inline'
        | '@.inline'
        | 'vanilla.inline2'
        | '@.inline2'
    >({} as InputParams)
}

/**
 * test: Output should reference module messages and buckets
*/

{
    const builder = new JobBuilder<Mock.Space, Mock.Module, Mock.VanillaJob>(_Mock.module, _Mock.job)
        
    type OutputMsgDef = Parameters<typeof builder.output.msg>[number];
    expectType<(keyof Mock.Module['messages'])>({} as OutputMsgDef)

    type OutputObjDef = Parameters<typeof builder.output.obj>[number];
    expectType<(keyof Mock.Module['buckets'])>({} as NonNullable<OutputObjDef>)
}

/**
 * test: .extra($(0)) should have the context types correctly
 */
{
    const builder = new JobBuilder<Mock.Space, Mock.Module, Mock.VanillaJob>(_Mock.module, _Mock.job)
        .authn('api')
        .input('mock')

    type Users = { api: Mock.Space['authnUsers']['api'] };
    builder.extra($ => {
        type A = typeof $['msg']
        expectType<{
            trx: TrxNode<Mock.Space, Mock.Module, Users>
            extra: unknown
            msg: Mock.MockMessage['#parsed'],
            job: $Job
        }>({} as typeof $)
        return {}
    })
}

/**
 * test: .extra return types should accumulate
 */
{
    const builder = new JobBuilder<Mock.Space, Mock.Module, Mock.VanillaJob>(_Mock.module, _Mock.job)
        .authn('api')
        .input('mock')
        .extra($ => ({
            a: 'a'
        }))
        .extra($ => ({
            b: 1
        }))
        .extra($ => ({
            c: NesoiDate.now(),
            d: true
        }))

    builder.extra($ => {
        expectType<{
            a: string,
            b: number,
            c: NesoiDate,
            d: boolean
        }>({} as Infer<typeof $.extra>)
        return {}
    })

    builder.assert($ => {
        expectType<{
            a: string,
            b: number,
            c: NesoiDate,
            d: boolean
        }>({} as Infer<typeof $.extra>)
        return ''
    })

    builder.method($ => {
        expectType<{
            a: string,
            b: number,
            c: NesoiDate,
            d: boolean
        }>({} as Infer<typeof $.extra>)
    })
}

/**
 * test: .assert($(0)) should have the context types correctly
 */
{
    const builder = new JobBuilder<Mock.Space, Mock.Module, Mock.VanillaJob>(_Mock.module, _Mock.job)
        .authn('ext')
        .input('mock')

    type Users = { ext: Mock.Space['authnUsers']['ext'] };
    builder.assert($ => {
        expectType<{
            trx: TrxNode<Mock.Space, Mock.Module, Users>
            extra: unknown
            msg: Mock.MockMessage['#parsed'],
            job: $Job
        }>({} as typeof $)
        return ''
    })
}

/**
 * test: .assert($(0)) should expect correct return
 */
{
    const builder = new JobBuilder<Mock.Space, Mock.Module, Mock.VanillaJob>(_Mock.module, _Mock.job)
        .authn('ext')
        .input('mock')

    type AssertReturn = ReturnType<Parameters<typeof builder.assert>[0]>;
    expectType<
        true | string |
        Promise<true | string>
    >({} as AssertReturn)
}

/**
 * test: .method($(0)) should have the context types correctly
 */
{
    const builder = new JobBuilder<Mock.Space, Mock.Module, Mock.VanillaJob>(_Mock.module, _Mock.job)
        .authn('ext')
        .input('mock')

    type Users = { ext: Mock.Space['authnUsers']['ext'] };
    builder.method($ => {
        expectType<{
            trx: TrxNode<Mock.Space, Mock.Module, Users>
            extra: unknown
            msg: Mock.MockMessage['#parsed'],
            job: $Job
        }>({} as typeof $)
        return ''
    })
}

/**
 * test: .method($(0)) should expect correct return, from output
 */
{
    const builder0 = new JobBuilder<Mock.Space, Mock.Module, Mock.VanillaJob>(_Mock.module, _Mock.job)
    expectType<
        unknown |
        Promise<unknown>
    >({} as ReturnType<Parameters<typeof builder0.method>[0]>)
    
    const builder1 = new JobBuilder<Mock.Space, Mock.Module, Mock.VanillaJob>(_Mock.module, _Mock.job)
        .output.raw<boolean>()
    expectType<
        boolean |
        Promise<boolean>
    >({} as ReturnType<Parameters<typeof builder1.method>[0]>)
    
    const builder2 = new JobBuilder<Mock.Space, Mock.Module, Mock.VanillaJob>(_Mock.module, _Mock.job)
        .output.raw<boolean>()
        .output.raw<'a'>()
        .output.raw<NesoiDate>()
    expectType<
        boolean | 'a' | NesoiDate |
        Promise<boolean | 'a' | NesoiDate>
    >({} as ReturnType<Parameters<typeof builder2.method>[0]>)

    const builder3 = new JobBuilder<Mock.Space, Mock.Module, Mock.VanillaJob>(_Mock.module, _Mock.job)
        .output.msg('mock')        
    expectType<
        Mock.MockMessage['#parsed'] |
        Promise<Mock.MockMessage['#parsed']>
    >({} as ReturnType<Parameters<typeof builder3.method>[0]>)

    const builder4 = new JobBuilder<Mock.Space, Mock.Module, Mock.VanillaJob>(_Mock.module, _Mock.job)
        .output.msg('mock', 'full')     
    expectType<
        Mock.MockMessage['#parsed'] | Mock.FullMessage['#parsed'] |
        Promise<Mock.MockMessage['#parsed'] | Mock.FullMessage['#parsed']>
    >({} as ReturnType<Parameters<typeof builder4.method>[0]>)

    const builder5 = new JobBuilder<Mock.Space, Mock.Module, Mock.VanillaJob>(_Mock.module, _Mock.job)
        .output.msg('mock') 
        .output.msg('full')     
    expectType<
        Mock.MockMessage['#parsed'] | Mock.FullMessage['#parsed'] |
        Promise<Mock.MockMessage['#parsed'] | Mock.FullMessage['#parsed']>
    >({} as ReturnType<Parameters<typeof builder5.method>[0]>)

    const builder6 = new JobBuilder<Mock.Space, Mock.Module, Mock.VanillaJob>(_Mock.module, _Mock.job)
        .output.obj('mock')
    expectType<
        Mock.MockBucket['#data'] |
        Promise<Mock.MockBucket['#data']>
    >({} as ReturnType<Parameters<typeof builder6.method>[0]>)

    const builder7 = new JobBuilder<Mock.Space, Mock.Module, Mock.VanillaJob>(_Mock.module, _Mock.job)
        .output.obj('mock', 'full')
    expectType<
        Mock.MockBucket['#data'] | Mock.FullBucket['#data'] |
        Promise<Mock.MockBucket['#data'] | Mock.FullBucket['#data']>
    >({} as ReturnType<Parameters<typeof builder7.method>[0]>)

    const builder8 = new JobBuilder<Mock.Space, Mock.Module, Mock.VanillaJob>(_Mock.module, _Mock.job)
        .output.obj('mock')
        .output.obj('full')
    expectType<
        Mock.MockBucket['#data'] | Mock.FullBucket['#data'] |
        Promise<Mock.MockBucket['#data'] | Mock.FullBucket['#data']>
    >({} as ReturnType<Parameters<typeof builder8.method>[0]>)
}


/**
 * test: .method($(0)) should expect correct return, from output
 */
{
    const engine = new TrxEngine<Mock.Space, Mock.Module, {}>('app:test', {} as any);
    engine.trx(async trx => {

        const Mock = trx.job('mock');
        type MockRunArg = Parameters<typeof Mock.run>[0]

        expectType<MockRunArg>({} as {
            $: 'mock.trigger',
            a: number
            b: string
        })

        const IntrinsicMsg = trx.job('intrinsic_msg');
        type IntrinsicMsgRunArg = Parameters<typeof IntrinsicMsg.run>[0]

        expectAssignable<IntrinsicMsgRunArg>({} as {
            $: 'intrinsic_msg',
            a: number
            b: string
        })

        expectAssignable<IntrinsicMsgRunArg>({} as {
            a: number
            b: string
        })

        expectAssignable<IntrinsicMsgRunArg>({} as {
            $: 'other_msg',
            c: boolean
        })

        expectNotAssignable<IntrinsicMsgRunArg>({} as {
            $: 'intrinsic_msg',
            c: boolean
        })

        expectNotAssignable<IntrinsicMsgRunArg>({} as {
            c: boolean
        })

        return {} as any;
    })
}