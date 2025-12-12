/* eslint-disable unused-imports/no-unused-vars */
import { expectAssignable, expectType } from 'tsd';
import { BucketBuilder } from '~/elements/entities/bucket/bucket.builder';
import type { AnyBucketModelFieldBuilder, BucketModelFieldBuilders } from '~/elements/entities/bucket/model/bucket_model_field.builder';
import type { Mock } from './mock';
import type { TrxNode } from '~/engine/transaction/trx_node';
import type { Infer } from './meta/types';

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
        id: AnyBucketModelFieldBuilder
    } & BucketModelFieldBuilders<any>
    // TODO: find out why I can't use expectType here
    expectAssignable<ModelShouldRequireId>({} as ModelReturn)
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
            
            const _duration = $.duration;
            type DefaultDuration = Parameters<typeof _duration.default>[0];
            expectType<NesoiDuration>({} as DefaultDuration);
            
            const _decimal = $.decimal();
            type DefaultDecimal = Parameters<typeof _decimal.default>[0];
            expectType<NesoiDecimal>({} as DefaultDecimal);
            
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

            const _literal = $.literal<'some_value'>(/some_value/);
            type DefaultLiteral = Parameters<typeof _literal.default>[0]
            expectType<'some_value'>({} as DefaultLiteral)

            const _obj = $.obj({
                deepBoolean: $.boolean,
                deepDate: $.date,
                deepDatetime: $.datetime,
                deepDuration: $.duration,
                deepDecimal: $.decimal(),
                deepEnum: $.enum(['a', 'b', 'c'] as const),
                deepInt: $.int,
                deepString: $.string,
                deepObj: $.obj({
                    deeperBoolean: $.boolean,
                    deeperDate: $.date,
                    deeperDatetime: $.datetime,
                    deeperDuration: $.duration,
                    deeperEnum: $.enum(['1', '2', '3'] as const),
                    deeperInt: $.int,
                    deeperString: $.string,
                    deeperObj: $.obj({
                        ok: $.boolean,
                    })
                }),
                deepDict: $.dict($.int),
                deepIntList: $.list($.int),
                deepStringOptional: $.string.optional,
            });

            type ExpectedObj = {
                deepBoolean: boolean,
                deepDate: NesoiDate,
                deepDatetime: NesoiDatetime,
                deepDuration: NesoiDuration,
                deepDecimal: NesoiDecimal,
                deepEnum: 'a' | 'b' | 'c',
                deepInt: number,
                deepString: string,
                deepObj: {
                    deeperBoolean: boolean,
                    deeperDate: NesoiDate,
                    deeperDatetime: NesoiDatetime,
                    deeperDuration: NesoiDuration,
                    deeperEnum: '1' | '2' | '3',
                    deeperInt: number,
                    deeperString: string,
                    deeperObj: {
                        ok: boolean,
                    }
                },
                deepDict: Record<string, number>,
                deepIntList: number[],
                deepStringOptional?: string | undefined | null,
            }
            type DefaultObj = Infer<Parameters<typeof _obj.default>[0]>
            expectType<ExpectedObj>({} as DefaultObj)

            const _dict = $.dict($.int);
            type DefaultDict = Parameters<typeof _dict.default>[0]
            expectType<Record<string, number>>({} as DefaultDict)

            return { id: $.int }
        })
        
}

/**
 * test: Model .List.default(0) argument should match field type[]
 */
{
    new BucketBuilder(_Mock.module, _Mock.bucket)
        .model($ => {

            // DISABLED_TEST:
            // I wasn't able to find a solution for this yet.
            //  
            // const _any = $.any.List;
            // type DefaultAny = Parameters<typeof _any.default>[0];
            // expectType<any[]>({} as DefaultAny)

            const _boolean = $.list($.boolean);
            type DefaultBoolean = Parameters<typeof _boolean.default>[0];
            expectType<boolean[]>({} as DefaultBoolean)

            const _date = $.list($.date);
            type DefaultDate = Parameters<typeof _date.default>[0];
            expectType<NesoiDate[]>({} as DefaultDate)
            
            const _datetime = $.list($.datetime);
            type DefaultDatetime = Parameters<typeof _datetime.default>[0];
            expectType<NesoiDatetime[]>({} as DefaultDatetime)
            
            const _duration = $.list($.duration);
            type DefaultDuration = Parameters<typeof _duration.default>[0];
            expectType<NesoiDuration[]>({} as DefaultDuration)
            
            const _decimal = $.list($.decimal());
            type DefaultDecimal = Parameters<typeof _decimal.default>[0];
            expectType<NesoiDecimal[]>({} as DefaultDecimal)
            
            const _enum = $.list($.enum(['a', 'b', 'c'] as const));
            type DefaultEnum = Parameters<typeof _enum.default>[0]
            expectType<('a'| 'b' | 'c')[]>({} as DefaultEnum)

            const _int = $.list($.int);
            type DefaultInt = Parameters<typeof _int.default>[0]
            expectType<number[]>({} as DefaultInt)

            const _float = $.list($.float);
            type DefaultFloat = Parameters<typeof _float.default>[0]
            expectType<number[]>({} as DefaultFloat)

            const _string = $.list($.string);
            type DefaultString = Parameters<typeof _string.default>[0]
            expectType<string[]>({} as DefaultString)

            const _obj = $.list($.obj({
                deepBoolean: $.boolean,
                deepDate: $.date,
                deepDatetime: $.datetime,
                deepDuration: $.duration,
                deepDecimal: $.decimal(),
                deepEnum: $.enum(['a', 'b', 'c'] as const),
                deepInt: $.int,
                deepString: $.string,
                deepObj: $.obj({
                    deeperBoolean: $.boolean,
                    deeperDate: $.date,
                    deeperDatetime: $.datetime,
                    deeperDuration: $.duration,
                    deeperEnum: $.enum(['1', '2', '3'] as const),
                    deeperInt: $.int,
                    deeperString: $.string,
                    deeperObj: $.obj({
                        ok: $.boolean,
                    })
                }),
            }));
            type ExpectedObj = {
                deepBoolean: boolean,
                deepDate: NesoiDate,
                deepDatetime: NesoiDatetime,
                deepDuration: NesoiDuration,
                deepDecimal: NesoiDecimal,
                deepEnum: 'a' | 'b' | 'c',
                deepInt: number,
                deepString: string,
                deepObj: {
                    deeperBoolean: boolean,
                    deeperDate: NesoiDate,
                    deeperDatetime: NesoiDatetime,
                    deeperDuration: NesoiDuration,
                    deeperEnum: '1' | '2' | '3',
                    deeperInt: number,
                    deeperString: string,
                    deeperObj: {
                        ok: boolean,
                    }
                },
            }
            type DefaultObj = Infer<Parameters<typeof _obj.default>[0]>
            expectType<ExpectedObj[]>({} as DefaultObj)

            const _dict = $.list($.dict($.int));
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
            expectType<boolean | null | undefined>({} as DefaultBoolean)

            const _date = $.date.optional;
            type DefaultDate = Parameters<typeof _date.default>[0];
            expectType<NesoiDate | null | undefined>({} as DefaultDate)
            
            const _datetime = $.datetime.optional;
            type DefaultDatetime = Parameters<typeof _datetime.default>[0];
            expectType<NesoiDatetime | null | undefined>({} as DefaultDatetime)
            
            const _duration = $.duration.optional;
            type DefaultDuration = Parameters<typeof _duration.default>[0];
            expectType<NesoiDuration | null | undefined>({} as DefaultDuration)
            
            const _decimal = $.decimal().optional;
            type DefaultDecimal = Parameters<typeof _decimal.default>[0];
            expectType<NesoiDecimal | null | undefined>({} as DefaultDecimal)
            
            const _enum = $.enum(['a', 'b', 'c'] as const).optional;
            type DefaultEnum = Parameters<typeof _enum.default>[0]
            expectType<('a'| 'b' | 'c') | null | undefined>({} as DefaultEnum)

            const _int = $.int.optional;
            type DefaultInt = Parameters<typeof _int.default>[0]
            expectType<number | null | undefined>({} as DefaultInt)

            const _float = $.float.optional;
            type DefaultFloat = Parameters<typeof _float.default>[0]
            expectType<number | null | undefined>({} as DefaultFloat)

            const _string = $.string.optional;
            type DefaultString = Parameters<typeof _string.default>[0]
            expectType<string | null | undefined>({} as DefaultString)

            const _obj = $.obj({
                deepBoolean: $.boolean,
                deepDate: $.date,
                deepDatetime: $.datetime,
                deepDuration: $.duration,
                deepEnum: $.enum(['a', 'b', 'c'] as const),
                deepInt: $.int,
                deepString: $.string,
                deepObj: $.obj({
                    deeperBoolean: $.boolean,
                    deeperDate: $.date,
                    deeperDatetime: $.datetime,
                    deeperDuration: $.duration,
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
                deepDuration: NesoiDuration,
                deepEnum: 'a' | 'b' | 'c',
                deepInt: number,
                deepString: string,
                deepObj: {
                    deeperBoolean: boolean,
                    deeperDate: NesoiDate,
                    deeperDatetime: NesoiDatetime,
                    deeperDuration: NesoiDuration,
                    deeperEnum: '1' | '2' | '3',
                    deeperInt: number,
                    deeperString: string,
                    deeperObj: {
                        ok: boolean,
                    }
                },
            }
            type DefaultObj = Infer<Parameters<typeof _obj.default>[0]>
            expectType<ExpectedObj | null | undefined>({} as DefaultObj)

            const _dict = $.dict($.int).optional;
            type DefaultDict = Parameters<typeof _dict.default>[0]
            expectType<Record<string, number> | null | undefined>({} as DefaultDict)

            return { id: $.int }
        })
}

/**
 * test: Model .List.optional.default(0) argument should match field type[]
 */
{
    new BucketBuilder(_Mock.module, _Mock.bucket)
        .model($ => {

            const _any = $.list($.any).optional;
            type DefaultAny = Parameters<typeof _any.default>[0];
            expectType<any[] | null | undefined>({} as DefaultAny)

            const _boolean = $.list($.boolean).optional;
            type DefaultBoolean = Parameters<typeof _boolean.default>[0];
            expectType<boolean[] | null | undefined>({} as DefaultBoolean)

            const _date = $.list($.date).optional;
            type DefaultDate = Parameters<typeof _date.default>[0];
            expectType<NesoiDate[] | null | undefined>({} as DefaultDate)
            
            const _datetime = $.list($.datetime).optional;
            type DefaultDatetime = Parameters<typeof _datetime.default>[0];
            expectType<NesoiDatetime[] | null | undefined>({} as DefaultDatetime)
            
            const _duration = $.list($.duration).optional;
            type DefaultDuration = Parameters<typeof _duration.default>[0];
            expectType<NesoiDuration[] | null | undefined>({} as DefaultDuration)
            
            const _enum = $.list($.enum(['a', 'b', 'c'] as const)).optional;
            type DefaultEnum = Parameters<typeof _enum.default>[0]
            expectType<('a'| 'b' | 'c')[] | null | undefined>({} as DefaultEnum)

            const _int = $.list($.int).optional;
            type DefaultInt = Parameters<typeof _int.default>[0]
            expectType<number[] | null | undefined>({} as DefaultInt)

            const _float = $.list($.float).optional;
            type DefaultFloat = Parameters<typeof _float.default>[0]
            expectType<number[] | null | undefined>({} as DefaultFloat)

            const _string = $.list($.string).optional;
            type DefaultString = Parameters<typeof _string.default>[0]
            expectType<string[] | null | undefined>({} as DefaultString)

            const _obj = $.list($.obj({
                deepBoolean: $.boolean,
                deepDate: $.date,
                deepDatetime: $.datetime,
                deepDuration: $.duration,
                deepEnum: $.enum(['a', 'b', 'c'] as const),
                deepInt: $.int,
                deepString: $.string,
                deepObj: $.obj({
                    deeperBoolean: $.boolean,
                    deeperDate: $.date,
                    deeperDatetime: $.datetime,
                    deeperDuration: $.duration,
                    deeperEnum: $.enum(['1', '2', '3'] as const),
                    deeperInt: $.int,
                    deeperString: $.string,
                    deeperObj: $.obj({
                        ok: $.boolean,
                    })
                }),
            })).optional;
            type ExpectedObj = {
                deepBoolean: boolean,
                deepDate: NesoiDate,
                deepDatetime: NesoiDatetime,
                deepDuration: NesoiDuration,
                deepEnum: 'a' | 'b' | 'c',
                deepInt: number,
                deepString: string,
                deepObj: {
                    deeperBoolean: boolean,
                    deeperDate: NesoiDate,
                    deeperDatetime: NesoiDatetime,
                    deeperDuration: NesoiDuration,
                    deeperEnum: '1' | '2' | '3',
                    deeperInt: number,
                    deeperString: string,
                    deeperObj: {
                        ok: boolean,
                    }
                },
            }
            type DefaultObj = Infer<Parameters<typeof _obj.default>[0]>
            expectType<ExpectedObj[] | null | undefined>({} as DefaultObj)

            const _dict = $.list($.dict($.int)).optional;
            type DefaultDict = Parameters<typeof _dict.default>[0]
            expectType<Record<string, number>[] | null | undefined>({} as DefaultDict)

            return { id: $.int }
        })
}


/**
 * test: Model .enum(0) should reference module enums
 */
{
    new BucketBuilder<Mock.Space, Mock.Module>(_Mock.module, _Mock.bucket)
        .model($ => {

            type EnumName = Parameters<typeof $.enum>[0];
            type ExpectedEnumName =
                'enum1'
                | 'enum2'
                | 'enum3'
                | 'enum3.sub1'
                | 'enum3.sub2'
                | 'enum4'
            
            expectType<ExpectedEnumName | readonly string[]>({} as EnumName)
            return { id: $.int }
        })
}

/**
 * test: Model .enum(0) should reference external enums
 */
{
    new BucketBuilder<Mock.Space, Mock.OtherModule>(_Mock.module, _Mock.bucket)
        .model($ => {

            type EnumName = Parameters<typeof $.enum>[0];
            type ExpectedEnumName =
                'enum5'
                | 'enum6'
                | 'mock::enum1'
            
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
            pDuration: $.duration,
            pDecimal: $.decimal(),
            pEnum: $.enum(['a', 'b', 'c'] as const),
            pInt: $.int,
            pFloat: $.float,
            pString: $.string,
            pObj: $.obj({
                deepBoolean: $.boolean,
                deepDate: $.date,
                deepDatetime: $.datetime,
                deepDuration: $.duration,
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

            pAnyList: $.list($.any),
            pBooleanList: $.list($.boolean),
            pDateList: $.list($.date),
            pDatetimeList: $.list($.datetime),
            pDurationList: $.list($.duration),
            pDecimalList: $.list($.decimal()),
            pEnumList: $.list($.enum(['a', 'b', 'c'] as const)),
            pIntList: $.list($.int),
            pFloatList: $.list($.float),
            pStringList: $.list($.string),
            pObjList: $.list($.obj({
                deepBooleanList: $.list($.boolean),
                deepDateList: $.list($.date),
                deepDatetimeList: $.list($.datetime),
                deepDurationList: $.list($.duration),
                deepDecimalList: $.list($.decimal()),
                deepEnumList: $.list($.enum(['1', '2', '3'] as const)),
                deepIntList: $.list($.int),
                deepFloatList: $.list($.float),
                deepStringList: $.list($.string),
                deepObjList: $.list($.obj({
                    okList: $.list($.boolean),
                }))
            })),
            pDictList: $.list($.dict($.int)),

            pAnyOptional: $.any.optional,
            pBooleanOptional: $.boolean.optional,
            pDateOptional: $.date.optional,
            pDatetimeOptional: $.datetime.optional,
            pDurationOptional: $.duration.optional,
            pDecimalOptional: $.decimal().optional,
            pEnumOptional: $.enum(['a', 'b', 'c'] as const).optional,
            pIntOptional: $.int.optional,
            pFloatOptional: $.float.optional,
            pStringOptional: $.string.optional,
            pObjOptional: $.obj({
                deepBooleanOptional: $.boolean.optional,
                deepDateOptional: $.date.optional,
                deepDatetimeOptional: $.datetime.optional,
                deepDurationOptional: $.duration.optional,
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

            pAnyListOptional: $.list($.any).optional,
            pBooleanListOptional: $.list($.boolean).optional,
            pDateListOptional: $.list($.date).optional,
            pDatetimeListOptional: $.list($.datetime).optional,
            pDurationListOptional: $.list($.duration).optional,
            pDecimalListOptional: $.list($.decimal()).optional,
            pEnumListOptional: $.list($.enum(['a', 'b', 'c'] as const)).optional,
            pIntListOptional: $.list($.int).optional,
            pFloatListOptional: $.list($.float).optional,
            pStringListOptional: $.list($.string).optional,
            pObjListOptional: $.list($.obj({
                deepBooleanListOptional: $.list($.boolean).optional,
                deepDateListOptional: $.list($.date).optional,
                deepDatetimeListOptional: $.list($.datetime).optional,
                deepDurationListOptional: $.list($.duration).optional,
                deepDecimalListOptional: $.list($.decimal()).optional,
                deepEnumListOptional: $.list($.enum(['1', '2', '3'] as const)).optional,
                deepIntListOptional: $.list($.int).optional,
                deepFloatListOptional: $.list($.float).optional,
                deepStringListOptional: $.list($.string).optional,
                deepObjListOptional: $.list($.obj({
                    okListOptional: $.list($.boolean).optional,
                })).optional
            })).optional,
            pDictListOptional: $.list($.dict($.int)).optional,

            pAnyOptionalList: $.list($.any.optional),
            pBooleanOptionalList: $.list($.boolean.optional),
            pDateOptionalList: $.list($.date.optional),
            pDatetimeOptionalList: $.list($.datetime.optional),
            pDurationOptionalList: $.list($.duration.optional),
            pDecimalOptionalList: $.list($.decimal().optional),
            pEnumOptionalList: $.list($.enum(['a', 'b', 'c'] as const).optional),
            pIntOptionalList: $.list($.int.optional),
            pFloatOptionalList: $.list($.float.optional),
            pStringOptionalList: $.list($.string.optional),
            pObjOptionalList: $.list($.obj({
                deepBooleanOptionalList: $.list($.boolean.optional),
                deepDateOptionalList: $.list($.date.optional),
                deepDatetimeOptionalList: $.list($.datetime.optional),
                deepDurationOptionalList: $.list($.duration.optional),
                deepDecimalOptionalList: $.list($.decimal().optional),
                deepEnumOptionalList: $.list($.enum(['1', '2', '3'] as const).optional),
                deepIntOptionalList: $.list($.int.optional),
                deepFloatOptionalList: $.list($.float.optional),
                deepStringOptionalList: $.list($.string.optional),
                deepObjOptionalList: $.list($.obj({
                    okOptionalList: $.list($.boolean.optional),
                }).optional)
            }).optional),
            pDictOptionalList: $.list($.dict($.int).optional),
        }))
        
        type ComputedModel = typeof builder extends BucketBuilder<any, any, infer X> ? X['#data'] : never;
                
        expectType<Mock.FullBucket['#data']>({} as Infer<ComputedModel>)
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

// /**
//  * test: View .model(0) argument should reference inferred fieldpath
//  */
// {
//     new BucketBuilder(_Mock.module, _Mock.bucket)
//         .model($ => ({
//             id: $.int,
//             pAny: $.any,
//             pBoolean: $.boolean,
//             pDate: $.date,
//             pDatetime: $.datetime,
//             pDuration: $.duration,
//             pEnum: $.enum(['a', 'b', 'c'] as const),
//             pInt: $.int,
//             pFloat: $.float,
//             pString: $.string,
//             pObj: $.obj({
//                 deepBoolean: $.boolean,
//                 deepDate: $.date,
//                 deepDatetime: $.datetime,
//                 deepDuration: $.duration,
//                 deepEnum: $.enum(['1', '2', '3'] as const),
//                 deepInt: $.int,
//                 deepFloat: $.float,
//                 deepString: $.string,
//                 deepObj: $.obj({
//                     ok: $.boolean,
//                 })
//             }),
//             pDict: $.dict($.int),
//             pList: $.list($.int)
//         }))
//         .view('test_view', $ => {
//             type B = typeof $ extends BucketViewFieldFactory<any, any, any, infer X, any> ? X : any;


//             type Modelpath = Parameters<typeof $.model>[0]
//             type ExpectedModelpath = 'id'
//                 | 'pAny'
//                 | 'pBoolean'
//                 | 'pDate'
//                 | 'pDatetime'
//                 | 'pDuration'
//                 | 'pEnum'
//                 | 'pInt'
//                 | 'pFloat'
//                 | 'pString'
//                 | 'pObj'
//                 | 'pObj.*'
//                 | 'pObj.deepBoolean'
//                 | 'pObj.deepDate'
//                 | 'pObj.deepDatetime'
//                 | 'pObj.deepDuration'
//                 | 'pObj.deepEnum'
//                 | 'pObj.deepInt'
//                 | 'pObj.deepFloat'
//                 | 'pObj.deepString'
//                 | 'pObj.deepObj'
//                 | 'pObj.deepObj.*'
//                 | 'pObj.deepObj.ok'
//                 | 'pDict'
//                 | 'pDict.*'
//                 | `pDict.$${number}`
//                 | `pDict.${string}`
//                 | 'pList'
//                 | 'pList.*'
//                 | `pList.$${number}`
//                 | `pList.${number}`
//             // expectType<ExpectedModelpath>({} as Modelpath)
//             return {}
//         })
// }

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
        type Users = Mock.Space['users'];
        expectType<{
            trx: TrxNode<Mock.Space, Mock.Module, Users>
            bucket: $Bucket,
            root: Mock.MockBucket['#data']
            current: Mock.MockBucket['#data']
            value: Mock.MockBucket['#data']
            graph: {
                branch: Record<string, any>[]
                model_index: (string|number)[]
                    } | {
                branch: Record<string, any>[]
                model_indexes: (string|number)[][]
            } | {
                branches: Record<string, any>[][]
                model_indexes: (string|number)[][]
            }
            flags: {
                serialize: boolean
            }
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