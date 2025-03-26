/* eslint-disable unused-imports/no-unused-vars */
import { expectType } from 'tsd';
import { BucketBuilder } from '~/elements/entities/bucket/bucket.builder';
import { BucketModelFieldBuilder, BucketModelFieldBuilders } from '~/elements/entities/bucket/model/bucket_model_field.builder';
import { NesoiDate } from '~/engine/data/date';
import { Mock } from './mock';
import { Decimal } from '~/engine/data/decimal';
import { $Bucket } from '~/elements';
import { TrxNode } from '~/engine/transaction/trx_node';
import { Infer } from './meta/types';
import { NesoiDatetime } from '~/engine/data/datetime';

const _Mock = {
    module: 'MOCK_MODULE',
    bucket: 'mock'
}

/**
 * test: Model should require id property
*/
{
    const builder = new BucketBuilder(_Mock.module, _Mock.bucket);

    type ModelReturn = ReturnType<Parameters<typeof builder.model>[0]>
    type ModelShouldRequireId = {
        id: BucketModelFieldBuilder<any, any>
    } & BucketModelFieldBuilders<any>
    expectType<ModelShouldRequireId>({} as ModelReturn)
}

/**
 * test: Model .default(0) argument should match field type
 */
{
    new BucketBuilder(_Mock.module, _Mock.bucket)
        .model($ => {

            const _any = $.any;
            type DefaultAny = Parameters<typeof _any.default>[0];
            expectType<any>({} as DefaultAny)

            const _boolean = $.boolean;
            type DefaultBoolean = Parameters<typeof _boolean.default>[0];
            expectType<boolean>({} as DefaultBoolean)

            const _date = $.date;
            type DefaultDate = Parameters<typeof _date.default>[0];
            expectType<NesoiDate>({} as DefaultDate)
            
            const _datetime = $.datetime;
            type DefaultDatetime = Parameters<typeof _datetime.default>[0];
            expectType<NesoiDatetime>({} as DefaultDatetime);
            
            const _decimal = $.decimal();
            type DefaultDecimal = Parameters<typeof _decimal.default>[0];
            expectType<Decimal>({} as DefaultDecimal);
            
            const _enum = $.enum(['a', 'b', 'c'] as const);
            type DefaultEnum = Parameters<typeof _enum.default>[0]
            expectType<'a' | 'b' | 'c'>({} as DefaultEnum)

            const _int = $.int;
            type DefaultInt = Parameters<typeof _int.default>[0]
            expectType<number>({} as DefaultInt)

            const _float = $.float;
            type DefaultFloat = Parameters<typeof _float.default>[0]
            expectType<number>({} as DefaultFloat)

            const _string = $.string;
            type DefaultString = Parameters<typeof _string.default>[0]
            expectType<string>({} as DefaultString)

            const _obj = $.obj({
                deepBoolean: $.boolean,
                deepDate: $.date,
                deepDatetime: $.datetime,
                deepDecimal: $.decimal(),
                deepEnum: $.enum(['a', 'b', 'c'] as const),
                deepInt: $.int,
                deepString: $.string,
                deepObj: $.obj({
                    deeperBoolean: $.boolean,
                    deeperDate: $.date,
                    deeperDatetime: $.datetime,
                    deeperEnum: $.enum(['1', '2', '3'] as const),
                    deeperInt: $.int,
                    deeperString: $.string,
                    deeperObj: $.obj({
                        ok: $.boolean,
                    })
                }),
                deepDict: $.dict($.int),
                deepIntArray: $.int.array,
                deepStringOptional: $.string.optional,
            });

            type ExpectedObj = {
                deepBoolean: boolean,
                deepDate: NesoiDate,
                deepDatetime: NesoiDatetime,
                deepDecimal: Decimal,
                deepEnum: 'a' | 'b' | 'c',
                deepInt: number,
                deepString: string,
                deepObj: {
                    deeperBoolean: boolean,
                    deeperDate: NesoiDate,
                    deeperDatetime: NesoiDatetime,
                    deeperEnum: '1' | '2' | '3',
                    deeperInt: number,
                    deeperString: string,
                    deeperObj: {
                        ok: boolean,
                    }
                },
                deepDict: Record<string, number>,
                deepIntArray: number[],
                deepStringOptional: string | undefined,
            }
            type DefaultObj = Parameters<typeof _obj.default>[0]
            expectType<ExpectedObj>({} as DefaultObj)

            const _dict = $.dict($.int);
            type DefaultDict = Parameters<typeof _dict.default>[0]
            expectType<Record<string, number>>({} as DefaultDict)

            return { id: $.int }
        })
        
}

/**
 * test: Model .array.default(0) argument should match field type[]
 */
{
    new BucketBuilder(_Mock.module, _Mock.bucket)
        .model($ => {

            // DISABLED_TEST:
            // I wasn't able to find a solution for this yet.
            //  
            // const _any = $.any.array;
            // type DefaultAny = Parameters<typeof _any.default>[0];
            // expectType<any[]>({} as DefaultAny)

            const _boolean = $.boolean.array;
            type DefaultBoolean = Parameters<typeof _boolean.default>[0];
            expectType<boolean[]>({} as DefaultBoolean)

            const _date = $.date.array;
            type DefaultDate = Parameters<typeof _date.default>[0];
            expectType<NesoiDate[]>({} as DefaultDate)
            
            const _datetime = $.datetime.array;
            type DefaultDatetime = Parameters<typeof _datetime.default>[0];
            expectType<NesoiDatetime[]>({} as DefaultDatetime)
            
            const _decimal = $.decimal().array;
            type DefaultDecimal = Parameters<typeof _decimal.default>[0];
            expectType<Decimal[]>({} as DefaultDecimal)
            
            const _enum = $.enum(['a', 'b', 'c'] as const).array;
            type DefaultEnum = Parameters<typeof _enum.default>[0]
            expectType<('a'| 'b' | 'c')[]>({} as DefaultEnum)

            const _int = $.int.array;
            type DefaultInt = Parameters<typeof _int.default>[0]
            expectType<number[]>({} as DefaultInt)

            const _float = $.float.array;
            type DefaultFloat = Parameters<typeof _float.default>[0]
            expectType<number[]>({} as DefaultFloat)

            const _string = $.string.array;
            type DefaultString = Parameters<typeof _string.default>[0]
            expectType<string[]>({} as DefaultString)

            const _obj = $.obj({
                deepBoolean: $.boolean,
                deepDate: $.date,
                deepDatetime: $.datetime,
                deepDecimal: $.decimal(),
                deepEnum: $.enum(['a', 'b', 'c'] as const),
                deepInt: $.int,
                deepString: $.string,
                deepObj: $.obj({
                    deeperBoolean: $.boolean,
                    deeperDate: $.date,
                    deeperDatetime: $.datetime,
                    deeperEnum: $.enum(['1', '2', '3'] as const),
                    deeperInt: $.int,
                    deeperString: $.string,
                    deeperObj: $.obj({
                        ok: $.boolean,
                    })
                }),
            }).array;
            type ExpectedObj = {
                deepBoolean: boolean,
                deepDate: NesoiDate,
                deepDatetime: NesoiDatetime,
                deepDecimal: Decimal,
                deepEnum: 'a' | 'b' | 'c',
                deepInt: number,
                deepString: string,
                deepObj: {
                    deeperBoolean: boolean,
                    deeperDate: NesoiDate,
                    deeperDatetime: NesoiDatetime,
                    deeperEnum: '1' | '2' | '3',
                    deeperInt: number,
                    deeperString: string,
                    deeperObj: {
                        ok: boolean,
                    }
                },
            }
            type DefaultObj = Parameters<typeof _obj.default>[0]
            expectType<ExpectedObj[]>({} as DefaultObj)

            const _dict = $.dict($.int).array;
            type DefaultDict = Parameters<typeof _dict.default>[0]
            expectType<Record<string, number>[]>({} as DefaultDict)

            return { id: $.int }
        })
}

/**
 * test: Model .optional.default(0) argument should match field type
 */
{
    new BucketBuilder(_Mock.module, _Mock.bucket)
        .model($ => {

            const _any = $.any.optional;
            type DefaultAny = Parameters<typeof _any.default>[0];
            expectType<any>({} as DefaultAny)

            const _boolean = $.boolean.optional;
            type DefaultBoolean = Parameters<typeof _boolean.default>[0];
            expectType<boolean>({} as DefaultBoolean)

            const _date = $.date.optional;
            type DefaultDate = Parameters<typeof _date.default>[0];
            expectType<NesoiDate>({} as DefaultDate)
            
            const _datetime = $.datetime.optional;
            type DefaultDatetime = Parameters<typeof _datetime.default>[0];
            expectType<NesoiDatetime>({} as DefaultDatetime)
            
            const _decimal = $.decimal().optional;
            type DefaultDecimal = Parameters<typeof _decimal.default>[0];
            expectType<Decimal>({} as DefaultDecimal)
            
            const _enum = $.enum(['a', 'b', 'c'] as const).optional;
            type DefaultEnum = Parameters<typeof _enum.default>[0]
            expectType<('a'| 'b' | 'c')>({} as DefaultEnum)

            const _int = $.int.optional;
            type DefaultInt = Parameters<typeof _int.default>[0]
            expectType<number>({} as DefaultInt)

            const _float = $.float.optional;
            type DefaultFloat = Parameters<typeof _float.default>[0]
            expectType<number>({} as DefaultFloat)

            const _string = $.string.optional;
            type DefaultString = Parameters<typeof _string.default>[0]
            expectType<string>({} as DefaultString)

            const _obj = $.obj({
                deepBoolean: $.boolean,
                deepDate: $.date,
                deepDatetime: $.datetime,
                deepEnum: $.enum(['a', 'b', 'c'] as const),
                deepInt: $.int,
                deepString: $.string,
                deepObj: $.obj({
                    deeperBoolean: $.boolean,
                    deeperDate: $.date,
                    deeperDatetime: $.datetime,
                    deeperEnum: $.enum(['1', '2', '3'] as const),
                    deeperInt: $.int,
                    deeperString: $.string,
                    deeperObj: $.obj({
                        ok: $.boolean,
                    })
                }),
            }).optional;
            type ExpectedObj = {
                deepBoolean: boolean,
                deepDate: NesoiDate,
                deepDatetime: NesoiDatetime,
                deepEnum: 'a' | 'b' | 'c',
                deepInt: number,
                deepString: string,
                deepObj: {
                    deeperBoolean: boolean,
                    deeperDate: NesoiDate,
                    deeperDatetime: NesoiDatetime,
                    deeperEnum: '1' | '2' | '3',
                    deeperInt: number,
                    deeperString: string,
                    deeperObj: {
                        ok: boolean,
                    }
                },
            }
            type DefaultObj = Parameters<typeof _obj.default>[0]
            expectType<ExpectedObj>({} as DefaultObj)

            const _dict = $.dict($.int).optional;
            type DefaultDict = Parameters<typeof _dict.default>[0]
            expectType<Record<string, number>>({} as DefaultDict)

            return { id: $.int }
        })
}

/**
 * test: Model .array.optional.default(0) argument should match field type[]
 */
{
    new BucketBuilder(_Mock.module, _Mock.bucket)
        .model($ => {

            const _any = $.any.array.optional;
            type DefaultAny = Parameters<typeof _any.default>[0];
            expectType<any[]>({} as DefaultAny)

            const _boolean = $.boolean.array.optional;
            type DefaultBoolean = Parameters<typeof _boolean.default>[0];
            expectType<boolean[]>({} as DefaultBoolean)

            const _date = $.date.array.optional;
            type DefaultDate = Parameters<typeof _date.default>[0];
            expectType<NesoiDate[]>({} as DefaultDate)
            
            const _datetime = $.datetime.array.optional;
            type DefaultDatetime = Parameters<typeof _datetime.default>[0];
            expectType<NesoiDatetime[]>({} as DefaultDatetime)
            
            const _enum = $.enum(['a', 'b', 'c'] as const).array.optional;
            type DefaultEnum = Parameters<typeof _enum.default>[0]
            expectType<('a'| 'b' | 'c')[]>({} as DefaultEnum)

            const _int = $.int.array.optional;
            type DefaultInt = Parameters<typeof _int.default>[0]
            expectType<number[]>({} as DefaultInt)

            const _float = $.float.array.optional;
            type DefaultFloat = Parameters<typeof _float.default>[0]
            expectType<number[]>({} as DefaultFloat)

            const _string = $.string.array.optional;
            type DefaultString = Parameters<typeof _string.default>[0]
            expectType<string[]>({} as DefaultString)

            const _obj = $.obj({
                deepBoolean: $.boolean,
                deepDate: $.date,
                deepDatetime: $.datetime,
                deepEnum: $.enum(['a', 'b', 'c'] as const),
                deepInt: $.int,
                deepString: $.string,
                deepObj: $.obj({
                    deeperBoolean: $.boolean,
                    deeperDate: $.date,
                    deeperDatetime: $.datetime,
                    deeperEnum: $.enum(['1', '2', '3'] as const),
                    deeperInt: $.int,
                    deeperString: $.string,
                    deeperObj: $.obj({
                        ok: $.boolean,
                    })
                }),
            }).array.optional;
            type ExpectedObj = {
                deepBoolean: boolean,
                deepDate: NesoiDate,
                deepDatetime: NesoiDatetime,
                deepEnum: 'a' | 'b' | 'c',
                deepInt: number,
                deepString: string,
                deepObj: {
                    deeperBoolean: boolean,
                    deeperDate: NesoiDate,
                    deeperDatetime: NesoiDatetime,
                    deeperEnum: '1' | '2' | '3',
                    deeperInt: number,
                    deeperString: string,
                    deeperObj: {
                        ok: boolean,
                    }
                },
            }
            type DefaultObj = Parameters<typeof _obj.default>[0]
            expectType<ExpectedObj[]>({} as DefaultObj)

            const _dict = $.dict($.int).array.optional;
            type DefaultDict = Parameters<typeof _dict.default>[0]
            expectType<Record<string, number>[]>({} as DefaultDict)

            return { id: $.int }
        })
}


/**
 * test: Model .enum(0) should reference space enums
 */
{
    new BucketBuilder<Mock.Space, Mock.Module>(_Mock.module, _Mock.bucket)
        .model($ => {

            type EnumName = Parameters<typeof $.enum>[0];
            type ExpectedEnumName =
                'mock::enum1'
                | 'mock::enum2'
                | 'mock::enum3'
                | 'mock::enum3.sub1'
                | 'mock::enum3.sub2'
                | 'mock::enum4'
                | 'other::enum5'
                | 'other::enum6'
            
            expectType<ExpectedEnumName | readonly string[]>({} as EnumName)
            return { id: $.int }
        })
}

/**
 * test: Model type and fieldpaths should be properly computed
 */
{
    const builder = new BucketBuilder(_Mock.module, _Mock.bucket)
        .model($ => ({
            id: $.int,
            pAny: $.any,
            pBoolean: $.boolean,
            pDate: $.date,
            pDatetime: $.datetime,
            pDecimal: $.decimal(),
            pEnum: $.enum(['a', 'b', 'c'] as const),
            pInt: $.int,
            pFloat: $.float,
            pString: $.string,
            pObj: $.obj({
                deepBoolean: $.boolean,
                deepDate: $.date,
                deepDatetime: $.datetime,
                deepDecimal: $.decimal(),
                deepEnum: $.enum(['1', '2', '3'] as const),
                deepInt: $.int,
                deepFloat: $.float,
                deepString: $.string,
                deepObj: $.obj({
                    ok: $.boolean,
                })
            }),
            pDict: $.dict($.int),

            pAnyArray: $.any.array,
            pBooleanArray: $.boolean.array,
            pDateArray: $.date.array,
            pDatetimeArray: $.datetime.array,
            pDecimalArray: $.decimal().array,
            pEnumArray: $.enum(['a', 'b', 'c'] as const).array,
            pIntArray: $.int.array,
            pFloatArray: $.float.array,
            pStringArray: $.string.array,
            pObjArray: $.obj({
                deepBooleanArray: $.boolean.array,
                deepDateArray: $.date.array,
                deepDatetimeArray: $.datetime.array,
                deepDecimalArray: $.decimal().array,
                deepEnumArray: $.enum(['1', '2', '3'] as const).array,
                deepIntArray: $.int.array,
                deepFloatArray: $.float.array,
                deepStringArray: $.string.array,
                deepObjArray: $.obj({
                    okArray: $.boolean.array,
                }).array
            }).array,
            pDictArray: $.dict($.int).array,

            pAnyOptional: $.any.optional,
            pBooleanOptional: $.boolean.optional,
            pDateOptional: $.date.optional,
            pDatetimeOptional: $.datetime.optional,
            pDecimalOptional: $.decimal().optional,
            pEnumOptional: $.enum(['a', 'b', 'c'] as const).optional,
            pIntOptional: $.int.optional,
            pFloatOptional: $.float.optional,
            pStringOptional: $.string.optional,
            pObjOptional: $.obj({
                deepBooleanOptional: $.boolean.optional,
                deepDateOptional: $.date.optional,
                deepDatetimeOptional: $.datetime.optional,
                deepDecimalOptional: $.decimal().optional,
                deepEnumOptional: $.enum(['1', '2', '3'] as const).optional,
                deepIntOptional: $.int.optional,
                deepFloatOptional: $.float.optional,
                deepStringOptional: $.string.optional,
                deepObjOptional: $.obj({
                    okOptional: $.boolean.optional,
                }).optional
            }).optional,
            pDictOptional: $.dict($.int).optional,

            pAnyArrayOptional: $.any.array.optional,
            pBooleanArrayOptional: $.boolean.array.optional,
            pDateArrayOptional: $.date.array.optional,
            pDatetimeArrayOptional: $.datetime.array.optional,
            pDecimalArrayOptional: $.decimal().array.optional,
            pEnumArrayOptional: $.enum(['a', 'b', 'c'] as const).array.optional,
            pIntArrayOptional: $.int.array.optional,
            pFloatArrayOptional: $.float.array.optional,
            pStringArrayOptional: $.string.array.optional,
            pObjArrayOptional: $.obj({
                deepBooleanArrayOptional: $.boolean.array.optional,
                deepDateArrayOptional: $.date.array.optional,
                deepDatetimeArrayOptional: $.datetime.array.optional,
                deepDecimalArrayOptional: $.decimal().array.optional,
                deepEnumArrayOptional: $.enum(['1', '2', '3'] as const).array.optional,
                deepIntArrayOptional: $.int.array.optional,
                deepFloatArrayOptional: $.float.array.optional,
                deepStringArrayOptional: $.string.array.optional,
                deepObjArrayOptional: $.obj({
                    okArrayOptional: $.boolean.array.optional,
                }).array.optional
            }).array.optional,
            pDictArrayOptional: $.dict($.int).array.optional,

            pAnyOptionalArray: $.any.optional.array,
            pBooleanOptionalArray: $.boolean.optional.array,
            pDateOptionalArray: $.date.optional.array,
            pDatetimeOptionalArray: $.datetime.optional.array,
            pDecimalOptionalArray: $.decimal().optional.array,
            pEnumOptionalArray: $.enum(['a', 'b', 'c'] as const).optional.array,
            pIntOptionalArray: $.int.optional.array,
            pFloatOptionalArray: $.float.optional.array,
            pStringOptionalArray: $.string.optional.array,
            pObjOptionalArray: $.obj({
                deepBooleanOptionalArray: $.boolean.optional.array,
                deepDateOptionalArray: $.date.optional.array,
                deepDatetimeOptionalArray: $.datetime.optional.array,
                deepDecimalOptionalArray: $.decimal().optional.array,
                deepEnumOptionalArray: $.enum(['1', '2', '3'] as const).optional.array,
                deepIntOptionalArray: $.int.optional.array,
                deepFloatOptionalArray: $.float.optional.array,
                deepStringOptionalArray: $.string.optional.array,
                deepObjOptionalArray: $.obj({
                    okOptionalArray: $.boolean.optional.array,
                }).optional.array
            }).optional.array,
            pDictOptionalArray: $.dict($.int).optional.array,

        }))
        
        type ComputedModel = typeof builder extends BucketBuilder<any, any, infer X> ? X['#data'] : never;
        type ComputedFieldpath = typeof builder extends BucketBuilder<any, any, infer X> ? X['#fieldpath'] : never;
        
        expectType<Mock.FullBucket['#data']>({} as Infer<ComputedModel>)
        expectType<Mock.FullBucket['#fieldpath']>({} as ComputedFieldpath)
}

/**
 * test: Graph .*(0) argument should reference module buckets
 */
{
    new BucketBuilder<Mock.Space, Mock.Module, Mock.VanillaBucket>(_Mock.module, _Mock.bucket)
        .model($ => ({
            id: $.int
        }))
        .graph($ => {
            type ExpectedBucketNames = 'mock' | 'pivot' | 'full' | 'vanilla'
            expectType<ExpectedBucketNames>({} as Parameters<typeof $.one>[0])
            expectType<ExpectedBucketNames>({} as Parameters<typeof $.many>[0])
            return {}
        })     
}

/**
 * test: Graph .*().query(0)
 */
{
    // Implemented on query.test-d.ts
}

/**
 * test: View .model(0) argument should reference inferred fieldpath
 */
{
    new BucketBuilder(_Mock.module, _Mock.bucket)
        .model($ => ({
            id: $.int,
            pAny: $.any,
            pBoolean: $.boolean,
            pDate: $.date,
            pDatetime: $.datetime,
            pEnum: $.enum(['a', 'b', 'c'] as const),
            pInt: $.int,
            pFloat: $.float,
            pString: $.string,
            pObj: $.obj({
                deepBoolean: $.boolean,
                deepDate: $.date,
                deepDatetime: $.datetime,
                deepEnum: $.enum(['1', '2', '3'] as const),
                deepInt: $.int,
                deepFloat: $.float,
                deepString: $.string,
                deepObj: $.obj({
                    ok: $.boolean,
                })
            }),
            pDict: $.dict($.int)
        }))
        .view('test_view', $ => {
            type ModelField = Parameters<typeof $.model>[0]
            type ExpectedFieldName = 'id'
                | 'pAny'
                | 'pBoolean'
                | 'pDate'
                | 'pDatetime'
                | 'pEnum'
                | 'pInt'
                | 'pFloat'
                | 'pString'
                | 'pObj'
                | 'pObj.deepBoolean'
                | 'pObj.deepDate'
                | 'pObj.deepDatetime'
                | 'pObj.deepEnum'
                | 'pObj.deepInt'
                | 'pObj.deepFloat'
                | 'pObj.deepString'
                | 'pObj.deepObj'
                | 'pObj.deepObj.ok'
                | 'pDict'
                | 'pDict.*'
            expectType<ExpectedFieldName>({} as ModelField)
            return {}
        })
}

/**
 * test: View .graph(0) argument should reference graph key
 */
{
    new BucketBuilder(_Mock.module, _Mock.bucket)
        .model($ => ({
            id: $.int,
            name: $.string
        }))
        .graph($ => ({
            gAggregateOne: $.one('some_bucket', {}),
            gAggregateMany: $.many('some_bucket', {}),
            gComposeOne: $.compose.one('some_bucket', {}),
            gComposeMany: $.compose.many('some_bucket', {}),
        }))
        .view('test_view', $ => {
            type GraphLink = Parameters<typeof $.graph>[0]
            expectType<'gAggregateOne' | 'gAggregateMany' | 'gComposeOne' | 'gComposeMany'>({} as GraphLink)
            return {}
        })
}

/**
 * test: View .computed($(0)) should have the context types correctly
 */
{
    const builder = new BucketBuilder<Mock.Space, Mock.Module, Mock.MockBucket>(_Mock.module, _Mock.bucket)

    builder.view('test_view', $ => {
        type GraphLink = Parameters<Parameters<typeof $.computed>[0]>[0]

        type Users = Mock.Space['authnUsers'];
        expectType<{
            trx: TrxNode<Mock.Space, Mock.Module, Users>
            raw: Mock.MockBucket['#data']
            bucket: $Bucket
        }>({} as GraphLink)
        return {}
    })
}

/**
 * test: View .view(0) should reference bucket views
 */
{
    new BucketBuilder(_Mock.module, _Mock.bucket)
        .model($ => ({
            id: $.int,
        }))
        .view('view1', $ => ({}))
        .view('view2', $ => ({}))
        .view('test_view', $ => {
            type ExpectedViewNames = 'view1' | 'view2'
            type ViewNames = Parameters<typeof $.view>[0]   
            expectType<ExpectedViewNames>({} as  ViewNames)
            return {}
        })
}

/**
 * test: View .extend(0) should reference bucket views
 */
{
    new BucketBuilder(_Mock.module, _Mock.bucket)
        .model($ => ({
            id: $.int,
        }))
        .view('view1', $ => ({}))
        .view('view2', $ => ({}))
        .view('test_view', $ => {
            type ExpectedViewNames = 'view1' | 'view2'
            type ViewNames = Parameters<typeof $.extend>[0]
            expectType<ExpectedViewNames>({} as ViewNames)
            return {}   
        })
}

/**
 * test: View should infer types correctly
 */
{
    const builder = new BucketBuilder<Mock.Space, Mock.Module, Mock.VanillaBucket>(_Mock.module, _Mock.bucket)
        .model($ => ({
            id: $.int,
            value: $.float
        }))
        .graph($ => ({
            graph1: $.one('mock', {})
        }))
        .view('view1', $ => ({
            prop1: $.model('id')
        }))
        .view('view2', $ => ({
            prop2: $.computed($ => 'const' as const)
        }))
        .view('view3', $ => ({
            prop3: $.graph('graph1')
        }))
        .view('test_view', $ => ({
            model: $.model('value'),
            computed: $.computed($ => true),
            graph: $.graph('graph1'),
            ext1: $.view('view1'),
            ext2: $.view('view2'),
            ext3: $.view('view3'),
        }))
    type Schema = typeof builder extends BucketBuilder<any, any, infer X> ? X : never
    type TestView = Schema['views']['test_view']['#data']
    type ExpectedTestView = {
        model: number,
        computed: boolean,
        graph: Mock.MockBucket['#data'],
        ext1: {
            prop1: number
        },
        ext2: {
            prop2: 'const'
        },
        ext3: {
            prop3: Mock.MockBucket['#data'],
        },
    }
    expectType<ExpectedTestView>({} as TestView)
}

/**
 * test: View .extend() should infer types correctly
 */
{
    const builder = new BucketBuilder(_Mock.module, _Mock.bucket)
        .model($ => ({
            id: $.int,
        }))
        .view('view1', $ => ({
            prop1: $.model('id'),
            prop2: $.computed($ => 'const' as const)
        }))
        .view('test_view', $ => $.extend('view1',{
            computed: $.computed($ => 3),
            model: $.model('id')
        }))
    type Bucket = typeof builder extends BucketBuilder<any, any, infer X> ? X : never
    type TestView = Bucket['views']['test_view']['#data']
    type ExpectedTestView = {
        prop1: number
        prop2: 'const'
        computed: number
        model: number
    }
    expectType<ExpectedTestView>({} as TestView)
}