/* eslint-disable unused-imports/no-unused-vars */
import { Mock } from './mock';
import { MessageBuilder } from '~/elements/entities/message/message.builder';
import { expectType } from 'tsd';
import { NesoiDate } from '~/engine/data/date';
import { NesoiDecimal } from '~/engine/data/decimal';
import { $MessageTemplateField } from '~/elements/entities/message/template/message_template.schema';
import { Infer } from './meta/types';
import { NesoiDatetime } from '~/engine/data/datetime';
import { NesoiFile } from '~/engine/data/file';
import { NesoiDuration } from '~/engine/data/duration';

const _Mock = {
    module: 'MOCK_MODULE',
    message: 'mock'
}

/* Types */

/**
 * test: Any field
*/

{
    const builder = new MessageBuilder<Mock.Space, Mock.Module, Mock.VanillaMessage>(_Mock.module, _Mock.message)
        .template($ => ({
            a: $.any
        }))
    
    type Message = typeof builder extends MessageBuilder<any, any, infer X> ? X : never
    type ExpectedInput = {
        $: 'vanilla'
        a: any
    }
    type ExpectedOutput = {
        $: 'vanilla',
        a: any
    }

    expectType<ExpectedInput>({} as Infer<Message['#raw']>)
    expectType<ExpectedOutput>({} as Infer<Message['#parsed']>)
}

/**
 * test: Boolean field
*/

{
    const builder = new MessageBuilder<Mock.Space, Mock.Module, Mock.VanillaMessage>(_Mock.module, _Mock.message)
        .template($ => ({
            a: $.boolean
        }))
    
    type Message = typeof builder extends MessageBuilder<any, any, infer X> ? X : never
    type ExpectedInput = {
        $: 'vanilla'
        a: boolean
    }
    type ExpectedOutput = {
        $: 'vanilla',
        a: boolean
    }
    expectType<ExpectedInput>({} as Infer<Message['#raw']>)
    expectType<ExpectedOutput>({} as Infer<Message['#parsed']>)
}

/**
 * test: Date field
*/

{
    const builder = new MessageBuilder<Mock.Space, Mock.Module, Mock.VanillaMessage>(_Mock.module, _Mock.message)
        .template($ => ({
            a: $.date
        }))
    
    type Message = typeof builder extends MessageBuilder<any, any, infer X> ? X : never
    type ExpectedInput = {
        $: 'vanilla'
        a: string
    }
    type ExpectedOutput = {
        $: 'vanilla',
        a: NesoiDate
    }
    expectType<ExpectedInput>({} as Infer<Message['#raw']>)
    expectType<ExpectedOutput>({} as Infer<Message['#parsed']>)
}

/**
 * test: Datetime field
*/

{
    const builder = new MessageBuilder<Mock.Space, Mock.Module, Mock.VanillaMessage>(_Mock.module, _Mock.message)
        .template($ => ({
            a: $.datetime
        }))
    
    type Message = typeof builder extends MessageBuilder<any, any, infer X> ? X : never
    type ExpectedInput = {
        $: 'vanilla'
        a: string
    }
    type ExpectedOutput = {
        $: 'vanilla',
        a: NesoiDatetime
    }
    expectType<ExpectedInput>({} as Infer<Message['#raw']>)
    expectType<ExpectedOutput>({} as Infer<Message['#parsed']>)
}

/**
 * test: Duration field
*/

{
    const builder = new MessageBuilder<Mock.Space, Mock.Module, Mock.VanillaMessage>(_Mock.module, _Mock.message)
        .template($ => ({
            a: $.duration
        }))
    
    type Message = typeof builder extends MessageBuilder<any, any, infer X> ? X : never
    type ExpectedInput = {
        $: 'vanilla'
        a: string
    }
    type ExpectedOutput = {
        $: 'vanilla',
        a: NesoiDuration
    }
    expectType<ExpectedInput>({} as Infer<Message['#raw']>)
    expectType<ExpectedOutput>({} as Infer<Message['#parsed']>)
}

/**
 * test: Decimal field
*/

{
    const builder = new MessageBuilder<Mock.Space, Mock.Module, Mock.VanillaMessage>(_Mock.module, _Mock.message)
        .template($ => ({
            a: $.decimal()
        }))
    
    type Message = typeof builder extends MessageBuilder<any, any, infer X> ? X : never
    type ExpectedInput = {
        $: 'vanilla'
        a: string
    }
    type ExpectedOutput = {
        $: 'vanilla',
        a: NesoiDecimal
    }
    expectType<ExpectedInput>({} as Infer<Message['#raw']>)
    expectType<ExpectedOutput>({} as Infer<Message['#parsed']>)
}

/**
 * test: Enum field
*/

{
    const builder = new MessageBuilder<Mock.Space, Mock.Module, Mock.VanillaMessage>(_Mock.module, _Mock.message)
        .template($ => ({
            a: $.enum(['a', 'b', 'c'] as const)
        }))
    
    type Message = typeof builder extends MessageBuilder<any, any, infer X> ? X : never
    type ExpectedInput = {
        $: 'vanilla'
        a: 'a' | 'b' | 'c'
    }
    type ExpectedOutput = {
        $: 'vanilla',
        a: 'a' | 'b' | 'c'
    }
    expectType<ExpectedInput>({} as Infer<Message['#raw']>)
    expectType<ExpectedOutput>({} as Infer<Message['#parsed']>)
}

/**
 * test: File field
*/

{
    const builder = new MessageBuilder<Mock.Space, Mock.Module, Mock.VanillaMessage>(_Mock.module, _Mock.message)
        .template($ => ({
            a: $.file()
        }))
    
    type Message = typeof builder extends MessageBuilder<any, any, infer X> ? X : never
    type ExpectedInput = {
        $: 'vanilla'
        a: NesoiFile
    }
    type ExpectedOutput = {
        $: 'vanilla',
        a: NesoiFile
    }
    expectType<ExpectedInput>({} as Infer<Message['#raw']>)
    expectType<ExpectedOutput>({} as Infer<Message['#parsed']>)
}

/**
 * test: Float field
*/

{
    const builder = new MessageBuilder<Mock.Space, Mock.Module, Mock.VanillaMessage>(_Mock.module, _Mock.message)
        .template($ => ({
            a: $.float
        }))
    
    type Message = typeof builder extends MessageBuilder<any, any, infer X> ? X : never
    type ExpectedInput = {
        $: 'vanilla'
        a: number
    }
    type ExpectedOutput = {
        $: 'vanilla',
        a: number
    }
    type A = Message['#raw']
    expectType<ExpectedInput>({} as Infer<Message['#raw']>)
    expectType<ExpectedOutput>({} as Infer<Message['#parsed']>)
}

/**
 * test: Id field
*/

{
    const builder = new MessageBuilder<Mock.Space, Mock.Module, Mock.VanillaMessage>(_Mock.module, _Mock.message)
        .template($ => ({
            a: $.id('mock')
        }))
    
    type Message = typeof builder extends MessageBuilder<any, any, infer X> ? X : never
    type ExpectedInput = {
        $: 'vanilla'
        a_id: Mock.MockBucket['#data']['id']
    }
    type ExpectedOutput = {
        $: 'vanilla',
        a: Mock.MockBucket['#data']
    }
    type A = Message['#raw']
    expectType<ExpectedInput>({} as Infer<Message['#raw']>)
    expectType<ExpectedOutput>({} as Infer<Message['#parsed']>)
}

/**
 * test: Id field with View
*/

{
    const builder = new MessageBuilder<Mock.Space, Mock.Module, Mock.VanillaMessage>(_Mock.module, _Mock.message)
        .template($ => ({
            a: $.id('mock', 'default')
        }))
    
    type Message = typeof builder extends MessageBuilder<any, any, infer X> ? X : never
    type ExpectedInput = {
        $: 'vanilla'
        a_id: Mock.MockBucket['#data']['id']
    }
    type ExpectedOutput = {
        $: 'vanilla',
        a: Mock.MockBucket['views']['default']['#data']
    }
    expectType<ExpectedInput>({} as Infer<Message['#raw']>)
    expectType<ExpectedOutput>({} as Infer<Message['#parsed']>)
}

/**
 * test: String field
*/

{
    const builder = new MessageBuilder<Mock.Space, Mock.Module, Mock.VanillaMessage>(_Mock.module, _Mock.message)
        .template($ => ({
            a: $.string
        }))
    
    type Message = typeof builder extends MessageBuilder<any, any, infer X> ? X : never
    type ExpectedInput = {
        $: 'vanilla'
        a: string
    }
    type ExpectedOutput = {
        $: 'vanilla',
        a: string
    }
    expectType<ExpectedInput>({} as Infer<Message['#raw']>)
    expectType<ExpectedOutput>({} as Infer<Message['#parsed']>)
}

/**
 * test: String or Number field
*/

{
    const builder = new MessageBuilder<Mock.Space, Mock.Module, Mock.VanillaMessage>(_Mock.module, _Mock.message)
        .template($ => ({
            a: $.string_or_number
        }))
    
    type Message = typeof builder extends MessageBuilder<any, any, infer X> ? X : never
    type ExpectedInput = {
        $: 'vanilla'
        a: string | number
    }
    type ExpectedOutput = {
        $: 'vanilla',
        a: string | number
    }
    expectType<ExpectedInput>({} as Infer<Message['#raw']>)
    expectType<ExpectedOutput>({} as Infer<Message['#parsed']>)
}

/**
 * test: Object field
*/

{
    const builder = new MessageBuilder<Mock.Space, Mock.Module, Mock.VanillaMessage>(_Mock.module, _Mock.message)
        .template($ => ({
            a: $.obj({
                b: $.string,
                c: $.boolean
            })
        }))
    
    type Message = typeof builder extends MessageBuilder<any, any, infer X> ? X : never
    type ExpectedInput = {
        $: 'vanilla'
        a: {
            b: string,
            c: boolean
        }
    }
    type ExpectedOutput = {
        $: 'vanilla',
        a: {
            b: string,
            c: boolean
        }
    }

    expectType<ExpectedInput>({} as Infer<Message['#raw']>)
    expectType<ExpectedOutput>({} as Infer<Message['#parsed']>)
}

/**
 * test: Dict field
*/

{
    const builder = new MessageBuilder<Mock.Space, Mock.Module, Mock.VanillaMessage>(_Mock.module, _Mock.message)
        .template($ => ({
            a: $.dict($.boolean)
        }))
    
    type Message = typeof builder extends MessageBuilder<any, any, infer X> ? X : never
    type ExpectedInput = {
        $: 'vanilla'
        a: Record<string, boolean>
    }
    type ExpectedOutput = {
        $: 'vanilla',
        a: Record<string, boolean>
    }
    expectType<ExpectedInput>({} as Infer<Message['#raw']>)
    expectType<ExpectedOutput>({} as Infer<Message['#parsed']>)
}

// TODO: msg
// TODO: extend

/* Modifiers */

/**
 * test: Optional modifier should make field optional on I and O
*/

{
    const builder = new MessageBuilder<Mock.Space, Mock.Module, Mock.VanillaMessage>(_Mock.module, _Mock.message)
        .template($ => ({
            any: $.any.optional,
            boolean: $.boolean.optional,
            date: $.date.optional,
            datetime: $.datetime.optional,
            duration: $.duration.optional,
            decimal: $.decimal().optional,
            enum: $.enum(['a', 'b', 'c'] as const).optional,
            file: $.file().optional,
            float: $.float.optional,
            id: $.id('mock').optional,
            int: $.int.optional,
            string: $.string.optional,
            string_or_number: $.string_or_number.optional,
            obj: $.obj({
                a: $.string,
                b: $.boolean,
            }).optional,
            dict: $.dict($.boolean).optional,
            // TODO: msg/extend
        }))
    
    type Message = typeof builder extends MessageBuilder<any, any, infer X> ? X : never
    type ExpectedInput = {
        $: 'vanilla'
        any?: any
        boolean?: boolean
        date?: string
        datetime?: string
        duration?: string
        decimal?: string
        enum?: ('a' | 'b' | 'c')
        file?: NesoiFile
        float?: number
        id_id?: Mock.MockBucket['#data']['id']
        int?: number
        string?: string
        string_or_number?: (string | number)
        obj?: {
            a: string
            b: boolean
        }
        dict?: Record<string, boolean>
    }
    type ExpectedOutput = {
        $: 'vanilla'
        any?: any
        boolean?: boolean
        date?: NesoiDate
        datetime?: NesoiDatetime
        duration?: NesoiDuration
        decimal?: NesoiDecimal
        enum?: ('a' | 'b' | 'c')
        file?: NesoiFile
        float?: number
        id?: Mock.MockBucket['#data']
        int?: number
        string?: string
        string_or_number?: (string | number)
        obj?: {
            a: string
            b: boolean
        }
        dict?: Record<string, boolean>
    }

    expectType<ExpectedInput>({} as Infer<Message['#raw']>)
    expectType<ExpectedOutput>({} as Infer<Message['#parsed']>)
}

/**
 * test: Default modifier value should match field value
*/

{
    const builder = new MessageBuilder<Mock.Space, Mock.Module, Mock.VanillaMessage>(_Mock.module, _Mock.message)
        .template($ => {
            
            const any = $.any.default
            type DefaultParamAny = Parameters<typeof any>[0]
            expectType<any>({} as DefaultParamAny)
            
            const boolean = $.boolean.default
            type DefaultParamBoolean = Parameters<typeof boolean>[0]
            expectType<boolean>({} as DefaultParamBoolean)
            
            const date = $.date.default
            type DefaultParamDate = Parameters<typeof date>[0]
            expectType<NesoiDate>({} as DefaultParamDate)
            
            const datetime = $.datetime.default
            type DefaultParamDatetime = Parameters<typeof datetime>[0]
            expectType<NesoiDatetime>({} as DefaultParamDatetime)
            
            const duration = $.duration.default
            type DefaultParamDuration = Parameters<typeof duration>[0]
            expectType<NesoiDuration>({} as DefaultParamDuration)

            const decimal = $.decimal().default
            type DefaultParamDecimal = Parameters<typeof decimal>[0]
            expectType<NesoiDecimal>({} as DefaultParamDecimal)
            
            const _enum = $.enum(['a', 'b', 'c'] as const).default
            type DefaultParamEnum = Parameters<typeof _enum>[0]
            expectType<'a' | 'b' | 'c'>({} as DefaultParamEnum)
            
            const file = $.file().default
            type DefaultParamFile = Parameters<typeof file>[0]
            expectType<NesoiFile>({} as DefaultParamFile)
            
            const float = $.float.default
            type DefaultParamFloat = Parameters<typeof float>[0]
            expectType<number>({} as DefaultParamFloat)
            
            const id = $.id('mock').default
            type DefaultParamId = Parameters<typeof id>[0]
            expectType<Mock.MockBucket['#data']>({} as DefaultParamId)
            
            const int = $.int.default
            type DefaultParamInt = Parameters<typeof int>[0]
            expectType<number>({} as DefaultParamInt)

            const string = $.string.default
            type DefaultParamString = Parameters<typeof string>[0]
            expectType<string>({} as DefaultParamString)

            const string_or_number = $.string_or_number.default
            type DefaultParamStringOrNumber = Parameters<typeof string_or_number>[0]
            expectType<string | number>({} as DefaultParamStringOrNumber)

            const obj = $.obj({
                a: $.string,
                b: $.boolean
            }).default
            type DefaultParamObj = Infer<Parameters<typeof obj>[0]>
            expectType<{
                a: string
                b: boolean
            }>({} as DefaultParamObj)

            const dict = $.dict($.boolean).default
            type DefaultParamDict = Parameters<typeof dict>[0]
            expectType<Record<string, boolean>>({} as DefaultParamDict)

            // TODO: msg / extend

            return {}
        })
}


/**
 * test: Default modifier should make field undefined on I but not on O
*/

{
    const builder = new MessageBuilder<Mock.Space, Mock.Module, Mock.VanillaMessage>(_Mock.module, _Mock.message)
        .template($ => ({
            any: $.any.default('any'),
            boolean: $.boolean.default(true),
            date: $.date.default(NesoiDate.now()),
            datetime: $.datetime.default(NesoiDatetime.now()),
            duration: $.duration.default(NesoiDuration.fromString('10 mins')),
            decimal: $.decimal().default(new NesoiDecimal('1.2')),
            enum: $.enum(['a', 'b', 'c'] as const).default('a'),
            file: $.file().default({} as NesoiFile),
            float: $.float.default(12.34),
            id: $.id('mock').default({} as any),
            int: $.int.default(1234),
            string: $.string.default('string'),
            string_or_number: $.string_or_number.default(1),
            obj: $.obj({
                a: $.string,
                b: $.boolean,
            }).default({ a: '', b: false }),
            dict: $.dict($.boolean).default({ '': true }),
        }))
    
    type Message = typeof builder extends MessageBuilder<any, any, infer X> ? X : never

    type ExpectedInput = {
        $: 'vanilla'
        any?: any
        boolean?: boolean
        date?: string
        datetime?: string
        duration?: string
        decimal?: string
        enum?: ('a' | 'b' | 'c')
        file?: NesoiFile
        float?: number
        id_id?: Mock.MockBucket['#data']['id']
        int?: number
        string?: string
        string_or_number?: (string | number)
        obj?: {
            a: string
            b: boolean
        }
        dict?: Record<string, boolean>
    }
    type ExpectedOutput = {
        $: 'vanilla'
        any: any
        boolean: boolean
        date: NesoiDate
        datetime: NesoiDatetime
        duration: NesoiDuration
        decimal: NesoiDecimal
        enum: ('a' | 'b' | 'c')
        file: NesoiFile
        float: number
        id: Mock.MockBucket['#data']
        int: number
        string: string
        string_or_number: (string | number)
        obj: {
            a: string
            b: boolean
        }
        dict: Record<string, boolean>
    }
    expectType<ExpectedInput>({} as Infer<Message['#raw']>)
    expectType<ExpectedOutput>({} as Infer<Message['#parsed']>)
}


/**
 * test: Nullable modifier should make field nullable on I and O
*/

{
    const builder = new MessageBuilder<Mock.Space, Mock.Module, Mock.VanillaMessage>(_Mock.module, _Mock.message)
        .template($ => ({
            any: $.any.nullable,
            boolean: $.boolean.nullable,
            date: $.date.nullable,
            datetime: $.datetime.nullable,
            duration: $.duration.nullable,
            decimal: $.decimal().nullable,
            enum: $.enum(['a', 'b', 'c'] as const).nullable,
            file: $.file().nullable,
            float: $.float.nullable,
            id: $.id('mock').nullable,
            int: $.int.nullable,
            string: $.string.nullable,
            string_or_number: $.string_or_number.nullable,
            obj: $.obj({
                a: $.string,
                b: $.boolean,
            }).nullable,
            dict: $.dict($.boolean).nullable,
            // TODO: msg/extend
        }))
    
    type Message = typeof builder extends MessageBuilder<any, any, infer X> ? X : never

    type ExpectedInput = {
        $: 'vanilla'
        any: any
        boolean: boolean | null
        date: string | null
        datetime: string | null
        duration: string | null
        decimal: string | null
        enum: ('a' | 'b' | 'c') | null
        file: NesoiFile | null
        float: number | null
        id_id: Mock.MockBucket['#data']['id'] | null
        int: number | null
        string: string | null
        string_or_number: (string | number) | null
        obj: {
            a: string
            b: boolean
        } | null
        dict: Record<string, boolean> | null
    }
    type ExpectedOutput = {
        $: 'vanilla'
        any: any
        boolean: boolean | null
        date: NesoiDate | null
        datetime: NesoiDatetime | null
        duration: NesoiDuration | null
        decimal: NesoiDecimal | null
        enum: ('a' | 'b' | 'c') | null
        file: NesoiFile | null
        float: number | null
        id: Mock.MockBucket['#data'] | null
        int: number | null
        string: string | null
        string_or_number: (string | number) | null
        obj: {
            a: string
            b: boolean
        } | null
        dict: Record<string, boolean> | null
    }
    expectType<ExpectedInput>({} as Infer<Message['#raw']>)
    expectType<ExpectedOutput>({} as Infer<Message['#parsed']>)
}

/**
 * test: Rule modifier should expose correct definition
*/

{
    const builder = new MessageBuilder<Mock.Space, Mock.Module, Mock.VanillaMessage>(_Mock.module, _Mock.message)
        .template($ => {

            type RuleFn = Parameters<typeof $.string.rule>[0]
            
            type RuleDef = Parameters<RuleFn>[0]
            expectType<{
                field: $MessageTemplateField
                path: string
                value: string
                msg: unknown
                inject: Record<string, any>
            }>({} as RuleDef)

            return {}
        })
}

/**
 * test: Rule modifier should expect correct return
*/

{
    const builder = new MessageBuilder<Mock.Space, Mock.Module, Mock.VanillaMessage>(_Mock.module, _Mock.message)
        .template($ => {

            type RuleReturn = ReturnType<Parameters<typeof $.boolean.rule>[0]>
            
            expectType<
                string | true | { set: boolean } |
                Promise<string | true | { set: boolean }>
            >({} as RuleReturn)

            return {}
        })
}

/**
 * test: List fields
*/

{
    const builder = new MessageBuilder<Mock.Space, Mock.Module, Mock.VanillaMessage>(_Mock.module, _Mock.message)
        .template($ => ({
            any: $.list($.any),
            boolean: $.list($.boolean),
            date: $.list($.date),
            datetime: $.list($.datetime),
            duration: $.list($.duration),
            decimal: $.list($.decimal()),
            enum: $.list($.enum(['a', 'b', 'c'] as const)),
            file: $.list($.file()),
            float: $.list($.float),
            id: $.list($.id('mock')),
            int: $.list($.int),
            string: $.list($.string),
            string_or_number: $.list($.string_or_number),
            obj: $.list($.obj({
                a: $.string,
                b: $.boolean,
            })),
            dict: $.list($.dict($.boolean)),
        }))
    
    type Message = typeof builder extends MessageBuilder<any, any, infer X> ? X : never

    type ExpectedInput = {
        $: 'vanilla'
        any: any[]
        boolean: boolean[]
        date: string[]
        datetime: string[]
        duration: string[]
        decimal: string[]
        enum: ('a' | 'b' | 'c')[]
        file: NesoiFile[]
        float: number[]
        id: Mock.MockBucket['#data']['id'][]
        int: number[]
        string: string[]
        string_or_number: (string | number)[]
        obj: {
            a: string
            b: boolean
        }[]
        dict: Record<string, boolean>[]
    }
    type ExpectedOutput = {
        $: 'vanilla'
        any: any[]
        boolean: boolean[]
        date: NesoiDate[]
        datetime: NesoiDatetime[]
        duration: NesoiDuration[]
        decimal: NesoiDecimal[]
        enum: ('a' | 'b' | 'c')[]
        file: NesoiFile[]
        float: number[]
        id: Mock.MockBucket['#data'][]
        int: number[]
        string: string[]
        string_or_number: (string | number)[]
        obj: {
            a: string
            b: boolean
        }[]
        dict: Record<string, boolean>[]
    }
    expectType<ExpectedInput>({} as Infer<Message['#raw']>)
    expectType<ExpectedOutput>({} as Infer<Message['#parsed']>)
}

/**
 * test: Unions
*/

{
    const builder = new MessageBuilder<Mock.Space, Mock.Module, Mock.VanillaMessage>(_Mock.module, _Mock.message)
        .template($ => ({
            a: $.union(
                $.boolean,
                $.date
            ),
            b: $.union(
                $.datetime,
                $.decimal()
            ),
            c: $.union(
                $.duration,
                $.decimal()
            ),
            d: $.union(
                $.enum(['a', 'b', 'c'] as const),
                $.file()
            ),
            e: $.union(
                $.float,
                $.id('mock')
            ),
            f: $.union(
                $.int,
                $.string
            ),
            g: $.union(
                $.string_or_number,
                $.obj({
                    a: $.union(
                        $.string,
                        $.boolean
                    ),
                    b: $.union(
                        $.int,
                        $.date
                    )
                })),
            h: $.union(
                $.dict($.union(
                    $.string,
                    $.boolean
                )),
                $.file()
            )
        }))
    
    type Message = typeof builder extends MessageBuilder<any, any, infer X> ? X : never

    type ExpectedInput = {
        $: 'vanilla'
        a: boolean | string
        b: string
        c: string
        d: ('a' | 'b' | 'c') | NesoiFile
        e: number | Mock.MockBucket['#data']['id']
        f: number | string
        g: string | number | {
            a: string | boolean
            b: number | string
        }
        h: Record<string, string | boolean> | NesoiFile
    }
    type ExpectedOutput = {
        $: 'vanilla'
        a: boolean | NesoiDate
        b: NesoiDatetime | NesoiDecimal
        c: NesoiDuration | NesoiDecimal
        d: ('a' | 'b' | 'c') | NesoiFile
        e: number | Mock.MockBucket['#data']
        f: number | string
        g: string | number | {
            a: string | boolean
            b: number | NesoiDate
        }
        h: Record<string, string | boolean> | NesoiFile
    }
    type A = Message['#raw'];
    expectType<ExpectedInput>({} as Infer<Message['#raw']>)
    expectType<ExpectedOutput>({} as Infer<Message['#parsed']>)
}

/**
 * test: Union with modifier chains
*/

{
    const builder = new MessageBuilder<Mock.Space, Mock.Module, Mock.VanillaMessage>(_Mock.module, _Mock.message)
        .template($ => ({
            a: $.union($.boolean, $.date, $.int),
            b: $.list($.union($.boolean, $.date)),
            c: $.union(
                $.list($.boolean),
                $.date
            ),
            d: $.union(
                $.list(
                    $.union(
                        $.boolean,
                        $.date
                    )
                ),
                $.int
            ),
        }))
    
    type Message = typeof builder extends MessageBuilder<any, any, infer X> ? X : never

    type ExpectedInput = {
        $: 'vanilla'
        a: boolean | string | number
        b: (boolean | string)[]
        c: boolean[] | string
        d: (boolean | string)[] | number
    }
    type ExpectedOutput = {
        $: 'vanilla'
        a: boolean | NesoiDate | number
        b: (boolean | NesoiDate)[]
        c: boolean[] | NesoiDate
        d: (boolean | NesoiDate)[] | number
    }
    expectType<ExpectedInput>({} as Infer<Message['#raw']>)
    expectType<ExpectedOutput>({} as Infer<Message['#parsed']>)
}

/**
 * test: Complex Unions
*/

{
    const builder = new MessageBuilder<Mock.Space, Mock.Module, Mock.VanillaMessage>(_Mock.module, _Mock.message)
        .template($ => ({
            a: $.union(
                $.boolean,
                $.list($.date),
                $.list($.int),
                $.dict($.any)
            ),
            b: $.union(
                $.list(
                    $.union(
                        $.list(
                            $.union(
                                $.boolean,
                                $.date
                            )
                        ),
                        $.int
                    )
                ),
                $.dict($.any),
            )
        }))
    
    type Message = typeof builder extends MessageBuilder<any, any, infer X> ? X : never

    type ExpectedInput = {
        $: 'vanilla'
        a: boolean | string[] | number[] | Record<string, any>
        b: ((boolean | string)[] | number)[] | Record<string, any>,
    }
    type ExpectedOutput = {
        $: 'vanilla'
        a: boolean | NesoiDate[] | number[] | Record<string, any>
        b: ((boolean | NesoiDate)[] | number)[] | Record<string, any>
    }
    type A = Message['#parsed'];
    expectType<ExpectedInput>({} as Infer<Message['#raw']>)
    expectType<ExpectedOutput>({} as Infer<Message['#parsed']>)
}

/**
 * test: Message modifiers should mix correctly
*/

{
    const builder = new MessageBuilder<Mock.Space, Mock.Module, Mock.VanillaMessage>(_Mock.module, _Mock.message)
        .template($ => ({
            pOpt: $.boolean.optional,
            pDef: $.boolean.default(true),
            pNul: $.boolean.nullable,
            
            pOptDef: $.boolean.optional.default(true),
            pOptNul: $.boolean.optional.nullable,
            
            pDefOpt: $.boolean.default(true).optional,
            pDefNul: $.boolean.default(true).nullable,
            
            pNulOpt: $.boolean.nullable.optional,
            pNulDef: $.boolean.nullable.default(null),
            
            pOptDefNul: $.boolean.optional.default(true).nullable,
            pOptNulDef: $.boolean.optional.nullable.default(null),
            
            pDefOptNul: $.boolean.default(true).optional.nullable,
            pDefNulOpt: $.boolean.default(true).nullable.optional,
            
            pNulOptDef: $.boolean.nullable.optional.default(null),
            pNulDefOpt: $.boolean.nullable.default(null).optional,
            
        }))
    
    type Message = typeof builder extends MessageBuilder<any, any, infer X> ? X : never

    type ExpectedInput = {
        $: 'vanilla'
        pOpt?: boolean
        pDef?: boolean
        pNul: boolean | null
        
        pOptDef?: boolean
        pOptNul?: boolean | null
        
        pDefOpt?: boolean
        pDefNul?: boolean | null
        
        pNulOpt?: boolean | null
        pNulDef?: boolean | null
        
        pOptDefNul?: boolean | null
        pOptNulDef?: boolean | null
        
        pDefOptNul?: boolean | null
        pDefNulOpt?: boolean | null
        
        pNulOptDef?: boolean | null
        pNulDefOpt?: boolean | null
    }
    type ExpectedOutput = {
        $: 'vanilla',
        pOpt?: boolean;
        pDef: boolean;
        pNul: boolean | null;

        pOptDef?: boolean;
        pOptNul?: boolean | null;
        
        pDefOpt?: boolean;
        pDefNul: boolean | null;

        pNulOpt?: boolean | null;
        pNulDef: boolean | null;

        pOptDefNul?: boolean | null;
        pOptNulDef?: boolean | null;

        pDefOptNul?: boolean | null;
        pDefNulOpt?: boolean | null;

        pNulOptDef?: boolean | null;
        pNulDefOpt?: boolean | null;
    }
    expectType<ExpectedInput>({} as Infer<Message['#raw']>)
    expectType<ExpectedOutput>({} as Infer<Message['#parsed']>)
}

/**
 * test: Big message type
*/

{
    const builder = new MessageBuilder<Mock.Space, Mock.Module, Mock.VanillaMessage>(_Mock.module, _Mock.message)
        .template($ => ({
            propBoolean: $.boolean,
            propDate: $.date,
            propDatetime: $.datetime,
            propDuration: $.duration,
            propDecimal: $.decimal(),
            propEnum: $.enum(['a', 'b', 'c'] as const),
            propId: $.id('mock'),
            propInt: $.int,
            propString: $.string,
            propObj: $.obj({
                deepBoolean: $.boolean,
                deepDate: $.date,
                deepDatetime: $.datetime,
                deepDuration: $.duration,
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
            propDurationOptional: $.duration.optional,
            propDecimalOptional: $.decimal().optional,
            propEnumOptional: $.enum(['a', 'b', 'c'] as const).optional,
            propIdOptional: $.id('mock').optional,
            propIntOptional: $.int.optional,
            propStringOptional: $.string.optional,
            propObjOptional: $.obj({
                deepBoolean: $.boolean,
                deepDate: $.date,
                deepDatetime: $.datetime,
                deepDuration: $.duration,
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
            propDurationNullable: $.duration.nullable,
            propDecimalNullable: $.decimal().nullable,
            propEnumNullable: $.enum(['a', 'b', 'c'] as const).nullable,
            propIdNullable: $.id('mock').nullable,
            propIntNullable: $.int.nullable,
            propStringNullable: $.string.nullable,
            propObjNullable: $.obj({
                deepBoolean: $.boolean,
                deepDate: $.date,
                deepDatetime: $.datetime,
                deepDuration: $.duration,
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
            propDurationList: $.list($.duration),
            propDecimalList: $.list($.decimal()),
            propEnumList: $.list($.enum(['a', 'b', 'c'] as const)),
            propIdList: $.list($.id('mock')),
            propIntList: $.list($.int),
            propStringList: $.list($.string),
            propObjList: $.list($.obj({
                deepBoolean: $.boolean,
                deepDate: $.date,
                deepDatetime: $.datetime,
                deepDuration: $.duration,
                deepEnumList: $.list($.enum(['1', '2', '3'] as const)),
                deepId: $.id('mock'),
                deepInt: $.int,
                deepString: $.string,
                deepObj: $.obj({
                    okList: $.list($.boolean),
                })
            }))
        }))
    
    type Message = typeof builder extends MessageBuilder<any, any, infer X> ? X : never

    type ExpectedInput = {
        $: 'vanilla',
        propBoolean: boolean,
        propDate: string,
        propDatetime: string,
        propDuration: string,
        propDecimal: string,
        propEnum: 'a' | 'b' | 'c',
        propId_id: Mock.MockBucket['#data']['id'],
        propInt: number,
        propString: string,
        propObj: {
            deepBoolean: boolean,
            deepDate: string,
            deepDatetime: string,
            deepDuration: string,
            deepDecimal: string,
            deepEnum: '1' | '2' | '3',
            deepId_id: Mock.MockBucket['#data']['id']
            deepInt: number,
            deepString: string,
            deepObj: {
                ok: boolean,
            }
        },
        propBooleanOptional?: boolean,
        propDateOptional?: string,
        propDatetimeOptional?: string,
        propDurationOptional?: string,
        propDecimalOptional?: string,
        propEnumOptional?: 'a' | 'b' | 'c',
        propIdOptional_id?: Mock.MockBucket['#data']['id']
        propIntOptional?: number,
        propStringOptional?: string,
        propObjOptional?: {
            deepBoolean: boolean,
            deepDate: string,
            deepDatetime: string,
            deepDuration: string,
            deepDecimal: string,
            deepEnumOptional?: '1' | '2' | '3',
            deepInt: number,
            deepString: string,
            deepObj: {
                okOptional?: boolean,
            }
        }
        propBooleanNullable: boolean | null
        propDateNullable: string | null
        propDatetimeNullable: string | null
        propDurationNullable: string | null
        propDecimalNullable: string | null
        propEnumNullable: ('a' | 'b' | 'c') | null
        propIdNullable_id: Mock.MockBucket['#data']['id'] | null
        propIntNullable: number | null
        propStringNullable: string | null
        propObjNullable: {
            deepBoolean: boolean,
            deepDate: string,
            deepDatetime: string,
            deepDuration: string,
            deepEnumNullable: ('1' | '2' | '3') | null
            deepId_id: Mock.MockBucket['#data']['id']
            deepInt: number,
            deepString: string,
            deepObj: {
                okNullable: boolean | null
            }
        } | null
        propBooleanList: boolean[]
        propDateList: string[]
        propDatetimeList: string[]
        propDurationList: string[]
        propDecimalList: string[]
        propEnumList: ('a' | 'b' | 'c')[]
        propIdList: Mock.MockBucket['#data']['id'][]
        propIntList: number[]
        propStringList: string[]
        propObjList: {
            deepBoolean: boolean,
            deepDate: string,
            deepDatetime: string,
            deepDuration: string,
            deepEnumList: ('1' | '2' | '3')[]
            deepId_id: Mock.MockBucket['#data']['id']
            deepInt: number,
            deepString: string,
            deepObj: {
                okList: boolean[]
            }
        }[]
    }
    type ExpectedOutput = {
        $: 'vanilla',
        propBoolean: boolean,
        propDate: NesoiDate,
        propDatetime: NesoiDatetime,
        propDuration: NesoiDuration,
        propDecimal: NesoiDecimal,
        propEnum: 'a' | 'b' | 'c'
        propId: Mock.MockBucket['#data']
        propInt: number,
        propString: string,
        propObj: {
            deepBoolean: boolean,
            deepDate: NesoiDate,
            deepDatetime: NesoiDatetime,
            deepDuration: NesoiDuration,
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
        propDurationOptional?: NesoiDuration,
        propDecimalOptional?: NesoiDecimal,
        propEnumOptional?: 'a' | 'b' | 'c',
        propIdOptional?: Mock.MockBucket['#data']
        propIntOptional?: number,
        propStringOptional?: string,
        propObjOptional?: {
            deepBoolean: boolean,
            deepDate: NesoiDate,
            deepDatetime: NesoiDatetime,
            deepDuration: NesoiDuration,
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
        propDurationNullable: NesoiDuration | null
        propDecimalNullable: NesoiDecimal | null
        propEnumNullable: ('a' | 'b' | 'c') | null
        propIdNullable: Mock.MockBucket['#data'] | null
        propIntNullable: number | null
        propStringNullable: string | null
        propObjNullable: {
            deepBoolean: boolean,
            deepDate: NesoiDate,
            deepDatetime: NesoiDatetime,
            deepDuration: NesoiDuration,
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
        propDurationList: NesoiDuration[]
        propDecimalList: NesoiDecimal[]
        propEnumList: ('a' | 'b' | 'c')[]
        propIdList: Mock.MockBucket['#data'][]
        propIntList: number[]
        propStringList: string[]
        propObjList: {
            deepBoolean: boolean,
            deepDate: NesoiDate,
            deepDatetime: NesoiDatetime,
            deepDuration: NesoiDuration,
            deepEnumList: ('1' | '2' | '3')[]
            deepId: Mock.MockBucket['#data']
            deepInt: number,
            deepString: string,
            deepObj: {
                okList: boolean[]
            }
        }[]
    }
    expectType<ExpectedInput>({} as Infer<Message['#raw']>)
    expectType<ExpectedOutput>({} as Infer<Message['#parsed']>)
}