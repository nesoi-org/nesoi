/* eslint-disable @typescript-eslint/no-namespace */
import { $Resource, $Bucket, $Job, $Message, $Module, $Space } from '~/elements'
import { $BucketGraph, $BucketGraphLink } from '~/elements/entities/bucket/graph/bucket_graph.schema'
import { $BucketView } from '~/elements/entities/bucket/view/bucket_view.schema'
import { $ConstantEnum, $Constants } from '~/elements/entities/constants/constants.schema'
import { NesoiDate } from '~/engine/data/date'
import { NesoiDatetime } from '~/engine/data/datetime'
import { NesoiDecimal } from '~/engine/data/decimal'
import { NesoiDuration } from '~/engine/data/duration'
import { Overlay } from '~/engine/util/type'

export namespace Mock {

    // Constants

    export type MockConstants = Overlay<$Constants, {
        enums: {
            'enum1': Overlay<$ConstantEnum, {
                '#data': {
                    'opt1': 'Option 1',
                    'opt2': 'Option 2',
                    'opt3': 'Option 3',
                }
            }>
            'enum2': Overlay<$ConstantEnum, {
                '#data': {
                    'opt4': 'Option 4',
                    'opt5': 'Option 5',
                    'opt6': 'Option 6',
                }
            }>
            'enum3': Overlay<$ConstantEnum, {
                '#data': {
                    'opt7': 'Option 7'
                    'opt8': 'Option 8'
                    'opt9': 'Option 9'
                    'opt10': 'Option 10'
                }
            }>
            'enum3.sub1': Overlay<$ConstantEnum, {
                '#data': {
                    'opt7': 'Option 7',
                    'opt8': 'Option 8'
                }
            }>
            'enum3.sub2': Overlay<$ConstantEnum, {
                '#data': {
                    'opt9': 'Option 9',
                    'opt10': 'Option 10'
                }
            }>
            'enum4': Overlay<$ConstantEnum, {
                '#data': {
                    'sub1': 'Sub 1',
                    'sub2': 'Sub 2'
                }
            }>
        }
        '#enumpath': {
            'enum1': {
                _enum: MockConstants['enums']['enum1'],
                _subs: never
            },
            'enum2': {
                _enum: MockConstants['enums']['enum2'],
                _subs: never
            },
            'enum3': {
                _enum: MockConstants['enums']['enum3'],
                _subs: never
            },
            'enum3.#': {
                _enum: MockConstants['enums']['enum3'],
                _subs: 'sub1' | 'sub2'
            },
            'enum3.sub1': {
                _enum: MockConstants['enums']['enum3.sub1'],
                _subs: never
            },
            'enum3.sub2': {
                _enum: MockConstants['enums']['enum3.sub2'],
                _subs: never
            },
            'enum4': {
                _enum: MockConstants['enums']['enum4'],
                _subs: never
            },
        }
    }>
    
    export type OtherConstants = Overlay<$Constants, {
        enums: {
            'enum5': Overlay<$ConstantEnum, {
                '#data': {
                    'opt1': 'Option 1',
                    'opt2': 'Option 2',
                    'opt3': 'Option 3',
                }
            }>
            'enum6': Overlay<$ConstantEnum, {
                '#data': {
                    'sub1': 'Sub 1',
                    'sub2': 'Sub 2'
                }
            }>
        }
        '#enumpath': {
            'enum5': {
                _enum: OtherConstants['enums']['enum5'],
                _subs: never
            },
            'enum6': {
                _enum: OtherConstants['enums']['enum6'],
                _subs: never
            },
        }
    }>

    // Buckets

    export type VanillaBucket = Overlay<$Bucket, {
        name: 'vanilla',
    }>

    export type MockBucket = Overlay<$Bucket, {
        name: 'mock'
        '#data': {
            id: string
            name: string
            volume: number,
            timestamp: NesoiDatetime
            color: {
                r: number
                g: number
                b: number
            }
            flags: boolean[]
            vanilla_id: number
        }
        '#modelpath': {
            'id': string
            'name': string
            'volume': number,
            'timestamp': NesoiDatetime
            'color': {
                'r': number
                'g': number
                'b': number
            }
            'color.r': number
            'color.g': number
            'color.b': number
            'flags': boolean[]
            'flags.*': boolean[]
        }&{ [x in `flags.$${number}`]: boolean }&{
            'vanilla_id': number
        }
        '#querypath': {
            'id': string
            'name': string
            'volume': number,
            'timestamp': NesoiDatetime
            'color': {
                'r': number
                'g': number
                'b': number
            }
            'color.r': number
            'color.g': number
            'color.b': number
            'flags': boolean[]
            'flags.*': boolean
            'flags.#': boolean
            'vanilla_id': number
        }
        graph: Overlay<$BucketGraph, {
            links: {
                clone: Overlay<$BucketGraphLink, {
                    '#bucket': MockBucket
                }>
            }
        }>
        views: {
            default: Overlay<$BucketView, {
                '#data': {
                    id: string
                    name: string
                    volume: number,
                    timestamp: NesoiDatetime
                    color: {
                        r: number
                        g: number
                        b: number
                    }
                    flags: boolean[]
                    vanilla_id: number
                }
            }>
        }
    }>

    export type PivotBucket = Overlay<$Bucket, {
        name: 'pivot'
        '#data': {
            id: string
            mock_id: string
            vanilla_id: number
        }
        '#modelpath': {
            'id': string
            'mock_id': string
            'vanilla_id': number
        }
        '#querypath': {
            'id': string
            'mock_id': string
            'vanilla_id': number
        }
        views: {
            default: any
        }
    }>

    export type FullBucket = Overlay<$Bucket, {
        name: 'full'
        '#data': {
            id: number,
            pAny: any,
            pBoolean: boolean,
            pDate: NesoiDate,
            pDatetime: NesoiDatetime,
            pDuration: NesoiDuration,
            pDecimal: NesoiDecimal,
            pEnum: 'a' | 'b' | 'c',
            pInt: number,
            pFloat: number,
            pString: string,
            pObj: {
                deepBoolean: boolean,
                deepDate: NesoiDate,
                deepDatetime: NesoiDatetime,
                deepDuration: NesoiDuration,
                deepDecimal: NesoiDecimal,
                deepEnum: '1' | '2' | '3',
                deepInt: number,
                deepFloat: number,
                deepString: string,
                deepObj: {
                    ok: boolean,
                }
            },
            pDict: Record<string, number>
    
            pAnyList: any[],
            pBooleanList: boolean[],
            pDateList: NesoiDate[],
            pDatetimeList: NesoiDatetime[],
            pDurationList: NesoiDuration[],
            pDecimalList: NesoiDecimal[],
            pEnumList: ('a' | 'b' | 'c')[],
            pIntList: number[],
            pFloatList: number[],
            pStringList: string[],
            pObjList: {
                deepBooleanList: boolean[],
                deepDateList: NesoiDate[],
                deepDatetimeList: NesoiDatetime[],
                deepDurationList: NesoiDuration[],
                deepDecimalList: NesoiDecimal[],
                deepEnumList: ('1' | '2' | '3')[],
                deepIntList: number[],
                deepFloatList: number[],
                deepStringList: string[],
                deepObjList: {
                    okList: boolean[],
                }[]
            }[],
            pDictList: Record<string, number>[]
    
            pAnyOptional?: any | null | undefined,
            pBooleanOptional?: boolean | null | undefined,
            pDateOptional?: NesoiDate | null | undefined,
            pDatetimeOptional?: NesoiDatetime | null | undefined,
            pDurationOptional?: NesoiDuration | null | undefined,
            pDecimalOptional?: NesoiDecimal | null | undefined,
            pEnumOptional?: 'a' | 'b' | 'c' | null | undefined,
            pIntOptional?: number | null | undefined,
            pFloatOptional?: number | null | undefined,
            pStringOptional?: string | null | undefined,
            pObjOptional?: {
                deepBooleanOptional?: boolean | null | undefined,
                deepDateOptional?: NesoiDate | null | undefined,
                deepDatetimeOptional?: NesoiDatetime | null | undefined,
                deepDurationOptional?: NesoiDuration | null | undefined,
                deepDecimalOptional?: NesoiDecimal | null | undefined,
                deepEnumOptional?: '1' | '2' | '3' | null | undefined,
                deepIntOptional?: number | null | undefined,
                deepFloatOptional?: number | null | undefined,
                deepStringOptional?: string | null | undefined,
                deepObjOptional?: {
                    okOptional?: boolean | null | undefined,
                } | null | undefined
            } | null | undefined,
            pDictOptional?: Record<string, number> | null | undefined
    
            pAnyListOptional?: any[] | null | undefined,
            pBooleanListOptional?: boolean[] | null | undefined,
            pDateListOptional?: NesoiDate[] | null | undefined,
            pDatetimeListOptional?: NesoiDatetime[] | null | undefined,
            pDurationListOptional?: NesoiDuration[] | null | undefined,
            pDecimalListOptional?: NesoiDecimal[] | null | undefined,
            pEnumListOptional?: ('a' | 'b' | 'c')[] | null | undefined,
            pIntListOptional?: number[] | null | undefined,
            pFloatListOptional?: number[] | null | undefined,
            pStringListOptional?: string[] | null | undefined,
            pObjListOptional?: {
                deepBooleanListOptional?: boolean[] | null | undefined,
                deepDateListOptional?: NesoiDate[] | null | undefined,
                deepDatetimeListOptional?: NesoiDatetime[] | null | undefined,
                deepDurationListOptional?: NesoiDuration[] | null | undefined,
                deepDecimalListOptional?: NesoiDecimal[] | null | undefined,
                deepEnumListOptional?: ('1' | '2' | '3')[] | null | undefined,
                deepIntListOptional?: number[] | null | undefined,
                deepFloatListOptional?: number[] | null | undefined,
                deepStringListOptional?: string[] | null | undefined,
                deepObjListOptional?: {
                    okListOptional?: boolean[] | null | undefined,
                }[] | null | undefined
            }[] | null | undefined,
            pDictListOptional?: Record<string, number>[] | null | undefined

            pAnyOptionalList: (any | null | undefined)[],
            pBooleanOptionalList: (boolean | null | undefined)[],
            pDateOptionalList: (NesoiDate | null | undefined)[],
            pDatetimeOptionalList: (NesoiDatetime | null | undefined)[],
            pDurationOptionalList: (NesoiDuration | null | undefined)[],
            pDecimalOptionalList: (NesoiDecimal | null | undefined)[],
            pEnumOptionalList: (('a' | 'b' | 'c') | null | undefined)[],
            pIntOptionalList: (number | null | undefined)[],
            pFloatOptionalList: (number | null | undefined)[],
            pStringOptionalList: (string | null | undefined)[],
            pObjOptionalList: ({
                deepBooleanOptionalList: (boolean | null | undefined)[],
                deepDateOptionalList: (NesoiDate | null | undefined)[],
                deepDatetimeOptionalList: (NesoiDatetime | null | undefined)[],
                deepDurationOptionalList: (NesoiDuration | null | undefined)[],
                deepDecimalOptionalList: (NesoiDecimal | null | undefined)[],
                deepEnumOptionalList: (('1' | '2' | '3') | null | undefined)[],
                deepIntOptionalList: (number | null | undefined)[],
                deepFloatOptionalList: (number | null | undefined)[],
                deepStringOptionalList: (string | null | undefined)[],
                deepObjOptionalList: ({
                    okOptionalList: (boolean | null | undefined)[],
                } | null | undefined)[]
            } | null | undefined)[],
            pDictOptionalList: (Record<string, number> | null | undefined)[]
        }

        // TODO: rewrite modelpath
        '#modelpath': {
            'id': number
            'pAny': any
            'pBoolean': boolean
            'pDate': NesoiDate
            'pDatetime': NesoiDatetime
            'pDuration': NesoiDuration
            'pDecimal': NesoiDecimal
            'pEnum': 'a' | 'b' | 'c'
            'pInt': number
            'pFloat': number
            'pString': string
            'pObj': {
                'deepBoolean': boolean
                'deepDate': NesoiDate
                'deepDatetime': NesoiDatetime
                'deepDuration': NesoiDuration
                'deepDecimal': NesoiDecimal
                'deepEnum': '1' | '2' | '3'
                'deepInt': number
                'deepFloat': number
                'deepString': string
                'deepObj': {
                    'ok': boolean
                }
            }
            'pObj.deepBoolean': boolean
            'pObj.deepDate': NesoiDate
            'pObj.deepDatetime': NesoiDatetime
            'pObj.deepDuration': NesoiDuration
            'pObj.deepDecimal': NesoiDecimal
            'pObj.deepEnum': '1' | '2' | '3'
            'pObj.deepInt': number
            'pObj.deepFloat': number
            'pObj.deepString': string
            'pObj.deepObj': {
                'ok': boolean
            }
            'pObj.deepObj.ok': boolean
            'pDict': Record<string, number>
        } & { [x in `pDict.${string}`]: number } & {
            'pAnyList': any[]
            'pAnyList.*': any[]
        } & { [x in `pAnyList.${number}`]: any } & {
            'pBooleanList': boolean[]
            'pBooleanList.*': boolean[]
        } & { [x in `pBooleanList.${number}`]: boolean } & {
            'pDateList': NesoiDate[]
            'pDateList.*': NesoiDate[]
        } & { [x in `pDateList.${number}`]: NesoiDate } & {
            'pDatetimeList': NesoiDatetime[]
            'pDatetimeList.*': NesoiDatetime[]
        } & { [x in `pDatetimeList.${number}`]: NesoiDatetime } & {
            'pDurationList': NesoiDuration[]
            'pDurationList.*': NesoiDuration[]
        } & { [x in `pDurationList.${number}`]: NesoiDuration } & {
            'pDecimalList': NesoiDecimal[]
            'pDecimalList.*': NesoiDecimal[]
        } & { [x in `pDecimalList.${number}`]: NesoiDecimal } & {
            'pEnumList': ('a' | 'b' | 'c')[]
            'pEnumList.*': ('a' | 'b' | 'c')[]
        } & { [x in `pEnumList.${number}`]: ('a' | 'b' | 'c') } & {
            'pIntList': number[]
            'pIntList.*': number[]
        } & { [x in `pIntList.${number}`]: number } & {
            'pFloatList': number[]
            'pFloatList.*': number[]
        } & { [x in `pFloatList.${number}`]: number } & {
            'pStringList': string[]
            'pStringList.*': string[]
        } & { [x in `pStringList.${number}`]: string } & {
            'pObjList': {
                'deepBooleanList': boolean[]
                'deepDateList': NesoiDate[]
                'deepDatetimeList': NesoiDatetime[]
                'deepDurationList': NesoiDuration[]
                'deepDecimalList': NesoiDecimal[]
                'deepEnumList': ('1' | '2' | '3')[]
                'deepIntList': number[]
                'deepFloatList': number[]
                'deepStringList': string[]
                'deepObjList': {
                    'okList': boolean[]
                }[]
            }[]
            } & { [x in `pObjList.${number}`]: { } & {
                'deepBooleanList': boolean[]
                'deepDateList': NesoiDate[]
                'deepDatetimeList': NesoiDatetime[]
                'deepDurationList': NesoiDuration[]
                'deepDecimalList': NesoiDecimal[]
                'deepEnumList': ('1' | '2' | '3')[]
                'deepIntList': number[]
                'deepFloatList': number[]
                'deepStringList': string[]
                'deepObjList': {
                    'okList': boolean[]
                }[]
            }
            } & { [x in `pObjList.${number}.deepBooleanList`]: boolean[] } & {
            } & { [x in `pObjList.${number}.deepBooleanList.${number}`]: boolean } & {
            } & { [x in `pObjList.${number}.deepDateList`]: NesoiDate[] } & {
            } & { [x in `pObjList.${number}.deepDateList.${number}`]: NesoiDate } & {
            } & { [x in `pObjList.${number}.deepDatetimeList`]: NesoiDatetime[] } & {
            } & { [x in `pObjList.${number}.deepDatetimeList.${number}`]: NesoiDatetime } & {
            } & { [x in `pObjList.${number}.deepDurationList`]: NesoiDuration[] } & {
            } & { [x in `pObjList.${number}.deepDurationList.${number}`]: NesoiDuration } & {
            } & { [x in `pObjList.${number}.deepDecimalList`]: NesoiDecimal[] } & {
            } & { [x in `pObjList.${number}.deepDecimalList.${number}`]: NesoiDecimal } & {
            } & { [x in `pObjList.${number}.deepEnumList`]: ('1' | '2' | '3')[] } & {
            } & { [x in `pObjList.${number}.deepEnumList.${number}`]: ('1' | '2' | '3') } & {
            } & { [x in `pObjList.${number}.deepIntList`]: number[] } & {
            } & { [x in `pObjList.${number}.deepIntList.${number}`]: number } & {
            } & { [x in `pObjList.${number}.deepFloatList`]: number[] } & {
            } & { [x in `pObjList.${number}.deepFloatList.${number}`]: number } & {
            } & { [x in `pObjList.${number}.deepStringList`]: string[] } & {
            } & { [x in `pObjList.${number}.deepStringList.${number}`]: string } & {
            } & { [x in `pObjList.${number}.deepObjList`]: { } & {
                'okList': boolean[]
            }[]
            } & { [x in `pObjList.${number}.deepObjList.${number}`]: { } & {
                'okList': boolean[]
            }
            } & { [x in `pObjList.${number}.deepObjList.${number}.okList`]: boolean[] } & {
            } & { [x in `pObjList.${number}.deepObjList.${number}.okList.${number}`]: boolean } & {
            'pDictList': Record<string, number>[]
            } & { [x in `pDictList.${number}`]: Record<string, number> } & {
            } & { [x in `pDictList.${number}.${string}`]: number } & {

            // 'pAnyOptional': any | null | undefined
            // 'pBooleanOptional': boolean | null | undefined
            // 'pDateOptional': NesoiDate | null | undefined
            // 'pDatetimeOptional': NesoiDatetime | null | undefined
            // 'pDurationOptional': NesoiDuration | null | undefined
            // 'pDecimalOptional': NesoiDecimal | null | undefined
            // 'pEnumOptional': 'a' | 'b' | 'c' | null | undefined
            // 'pIntOptional': number | null | undefined
            // 'pFloatOptional': number | null | undefined
            // 'pStringOptional': string | null | undefined
            // 'pObjOptional': {
            //     'deepBooleanOptional'?: boolean | null | undefined
            //     'deepDateOptional'?: NesoiDate | null | undefined
            //     'deepDatetimeOptional'?: NesoiDatetime | null | undefined
            //     'deepDurationOptional'?: NesoiDuration | null | undefined
            //     'deepDecimalOptional'?: NesoiDecimal | null | undefined
            //     'deepEnumOptional'?: '1' | '2' | '3' | null | undefined
            //     'deepIntOptional'?: number | null | undefined
            //     'deepFloatOptional'?: number | null | undefined
            //     'deepStringOptional'?: string | null | undefined
            //     'deepObjOptional'?: {
            //         'okOptional'?: boolean | null | undefined
            //     } | null | undefined
            // } | null | undefined
            // 'pObjOptional.deepBooleanOptional': boolean | null | undefined
            // 'pObjOptional.deepDateOptional': NesoiDate | null | undefined
            // 'pObjOptional.deepDatetimeOptional': NesoiDatetime | null | undefined
            // 'pObjOptional.deepDurationOptional': NesoiDuration | null | undefined
            // 'pObjOptional.deepDecimalOptional': NesoiDecimal | null | undefined
            // 'pObjOptional.deepEnumOptional': '1' | '2' | '3' | null | undefined
            // 'pObjOptional.deepIntOptional': number | null | undefined
            // 'pObjOptional.deepFloatOptional': number | null | undefined
            // 'pObjOptional.deepStringOptional': string | null | undefined
            // 'pObjOptional.deepObjOptional': {
            //     'okOptional'?: boolean | null | undefined
            // } | null | undefined
            // 'pObjOptional.deepObjOptional.okOptional': boolean | null | undefined
            // 'pDictOptional': Record<string, number> | null | undefined
            // 'pDictOptional.#': number | null | undefined

            // 'pAnyListOptional': any[] | null | undefined
            // 'pAnyListOptional.#': any | null | undefined
            // 'pBooleanListOptional': boolean[] | null | undefined
            // 'pBooleanListOptional.#': boolean | null | undefined
            // 'pDateListOptional': NesoiDate[] | null | undefined
            // 'pDateListOptional.#': NesoiDate | null | undefined
            // 'pDatetimeListOptional': NesoiDatetime[] | null | undefined
            // 'pDatetimeListOptional.#': NesoiDatetime | null | undefined
            // 'pDurationListOptional': NesoiDuration[] | null | undefined
            // 'pDurationListOptional.#': NesoiDuration | null | undefined
            // 'pDecimalListOptional': NesoiDecimal[] | null | undefined
            // 'pDecimalListOptional.#': NesoiDecimal | null | undefined
            // 'pEnumListOptional': ('a' | 'b' | 'c')[] | null | undefined
            // 'pEnumListOptional.#': ('a' | 'b' | 'c') | null | undefined
            // 'pIntListOptional': number[] | null | undefined
            // 'pIntListOptional.#': number | null | undefined
            // 'pFloatListOptional': number[] | null | undefined
            // 'pFloatListOptional.#': number | null | undefined
            // 'pStringListOptional': string[] | null | undefined
            // 'pStringListOptional.#': string | null | undefined
            // 'pObjListOptional': {
            //     'deepBooleanListOptional'?: boolean[] | null | undefined
            //     'deepDateListOptional'?: NesoiDate[] | null | undefined
            //     'deepDatetimeListOptional'?: NesoiDatetime[] | null | undefined
            //     'deepDurationListOptional'?: NesoiDuration[] | null | undefined
            //     'deepDecimalListOptional'?: NesoiDecimal[] | null | undefined
            //     'deepEnumListOptional'?: ('1' | '2' | '3')[] | null | undefined
            //     'deepIntListOptional'?: number[] | null | undefined
            //     'deepFloatListOptional'?: number[] | null | undefined
            //     'deepStringListOptional'?: string[] | null | undefined
            //     'deepObjListOptional'?: {
            //         'okListOptional'?: boolean[] | null | undefined
            //     }[] | null | undefined
            // }[] | null | undefined
            // 'pObjListOptional.#': {
            //     'deepBooleanListOptional'?: boolean[] | null | undefined
            //     'deepDateListOptional'?: NesoiDate[] | null | undefined
            //     'deepDatetimeListOptional'?: NesoiDatetime[] | null | undefined
            //     'deepDurationListOptional'?: NesoiDuration[] | null | undefined
            //     'deepDecimalListOptional'?: NesoiDecimal[] | null | undefined
            //     'deepEnumListOptional'?: ('1' | '2' | '3')[] | null | undefined
            //     'deepIntListOptional'?: number[] | null | undefined
            //     'deepFloatListOptional'?: number[] | null | undefined
            //     'deepStringListOptional'?: string[] | null | undefined
            //     'deepObjListOptional'?: {
            //         'okListOptional'?: boolean[] | null | undefined
            //     }[] | null | undefined
            // } | null | undefined
            // 'pObjListOptional.#.deepBooleanListOptional': boolean[] | null | undefined
            // 'pObjListOptional.#.deepBooleanListOptional.#': boolean | null | undefined
            // 'pObjListOptional.#.deepDateListOptional': NesoiDate[] | null | undefined
            // 'pObjListOptional.#.deepDateListOptional.#': NesoiDate | null | undefined
            // 'pObjListOptional.#.deepDatetimeListOptional': NesoiDatetime[] | null | undefined
            // 'pObjListOptional.#.deepDatetimeListOptional.#': NesoiDatetime | null | undefined
            // 'pObjListOptional.#.deepDurationListOptional': NesoiDuration[] | null | undefined
            // 'pObjListOptional.#.deepDurationListOptional.#': NesoiDuration | null | undefined
            // 'pObjListOptional.#.deepDecimalListOptional': NesoiDecimal[] | null | undefined
            // 'pObjListOptional.#.deepDecimalListOptional.#': NesoiDecimal | null | undefined
            // 'pObjListOptional.#.deepEnumListOptional': ('1' | '2' | '3')[] | null | undefined
            // 'pObjListOptional.#.deepEnumListOptional.#': ('1' | '2' | '3') | null | undefined
            // 'pObjListOptional.#.deepIntListOptional': number[] | null | undefined
            // 'pObjListOptional.#.deepIntListOptional.#': number | null | undefined
            // 'pObjListOptional.#.deepFloatListOptional': number[] | null | undefined
            // 'pObjListOptional.#.deepFloatListOptional.#': number | null | undefined
            // 'pObjListOptional.#.deepStringListOptional': string[] | null | undefined
            // 'pObjListOptional.#.deepStringListOptional.#': string | null | undefined
            // 'pObjListOptional.#.deepObjListOptional': {
            //     'okListOptional'?: boolean[] | null | undefined
            // }[] | null | undefined
            // 'pObjListOptional.#.deepObjListOptional.#': {
            //     'okListOptional'?: boolean[] | null | undefined
            // } | null | undefined
            // 'pObjListOptional.#.deepObjListOptional.#.okListOptional': boolean[] | null | undefined
            // 'pObjListOptional.#.deepObjListOptional.#.okListOptional.#': boolean | null | undefined
            // 'pDictListOptional': Record<string, number>[] | null | undefined
            // 'pDictListOptional.#': Record<string, number> | null | undefined
            // 'pDictListOptional.#.#': number | null | undefined

            // 'pAnyOptionalList': (any | null | undefined)[]
            // 'pAnyOptionalList.#': any | null | undefined
            // 'pBooleanOptionalList': (boolean | null | undefined)[]
            // 'pBooleanOptionalList.#': boolean | null | undefined
            // 'pDateOptionalList': (NesoiDate | null | undefined)[]
            // 'pDateOptionalList.#': NesoiDate | null | undefined
            // 'pDatetimeOptionalList': (NesoiDatetime | null | undefined)[]
            // 'pDatetimeOptionalList.#': NesoiDatetime | null | undefined
            // 'pDurationOptionalList': (NesoiDuration | null | undefined)[]
            // 'pDurationOptionalList.#': NesoiDuration | null | undefined
            // 'pDecimalOptionalList': (NesoiDecimal | null | undefined)[]
            // 'pDecimalOptionalList.#': NesoiDecimal | null | undefined
            // 'pEnumOptionalList': (('a' | 'b' | 'c') | null | undefined)[]
            // 'pEnumOptionalList.#': ('a' | 'b' | 'c') | null | undefined
            // 'pIntOptionalList': (number | null | undefined)[]
            // 'pIntOptionalList.#': number | null | undefined
            // 'pFloatOptionalList': (number | null | undefined)[]
            // 'pFloatOptionalList.#': number | null | undefined
            // 'pStringOptionalList': (string | null | undefined)[]
            // 'pStringOptionalList.#': string | null | undefined
            // 'pObjOptionalList': ({
            //     'deepBooleanOptionalList'?: (boolean | null | undefined)[]
            //     'deepDateOptionalList'?: (NesoiDate | null | undefined)[]
            //     'deepDatetimeOptionalList'?: (NesoiDatetime | null | undefined)[]
            //     'deepDurationOptionalList'?: (NesoiDuration | null | undefined)[]
            //     'deepDecimalOptionalList'?: (NesoiDecimal | null | undefined)[]
            //     'deepEnumOptionalList'?: (('1' | '2' | '3') | null | undefined)[]
            //     'deepIntOptionalList'?: (number | null | undefined)[]
            //     'deepFloatOptionalList'?: (number | null | undefined)[]
            //     'deepStringOptionalList'?: (string | null | undefined)[]
            //     'deepObjOptionalList'?: ({
            //         'okOptionalList'?: (boolean | null | undefined)[]
            //     } | null | undefined)[]
            // } | null | undefined)[]
            // 'pObjOptionalList.#': {
            //     'deepBooleanOptionalList'?: (boolean | null | undefined)[]
            //     'deepDateOptionalList'?: (NesoiDate | null | undefined)[]
            //     'deepDatetimeOptionalList'?: (NesoiDatetime | null | undefined)[]
            //     'deepDurationOptionalList'?: (NesoiDuration | null | undefined)[]
            //     'deepDecimalOptionalList'?: (NesoiDecimal | null | undefined)[]
            //     'deepEnumOptionalList'?: (('1' | '2' | '3') | null | undefined)[]
            //     'deepIntOptionalList'?: (number | null | undefined)[]
            //     'deepFloatOptionalList'?: (number | null | undefined)[]
            //     'deepStringOptionalList'?: (string | null | undefined)[]
            //     'deepObjOptionalList'?: ({
            //         'okOptionalList'?: (boolean | null | undefined)[]
            //     } | null | undefined)[]
            // } | null | undefined
            // 'pObjOptionalList.#.deepBooleanOptionalList': (boolean | null | undefined)[] | null | undefined
            // 'pObjOptionalList.#.deepBooleanOptionalList.#': boolean | null | undefined
            // 'pObjOptionalList.#.deepDateOptionalList': (NesoiDate | null | undefined)[] | null | undefined
            // 'pObjOptionalList.#.deepDateOptionalList.#': NesoiDate | null | undefined
            // 'pObjOptionalList.#.deepDatetimeOptionalList': (NesoiDatetime | null | undefined)[] | null | undefined
            // 'pObjOptionalList.#.deepDatetimeOptionalList.#': NesoiDatetime | null | undefined
            // 'pObjOptionalList.#.deepDurationOptionalList': (NesoiDuration | null | undefined)[] | null | undefined
            // 'pObjOptionalList.#.deepDurationOptionalList.#': NesoiDuration | null | undefined
            // 'pObjOptionalList.#.deepDecimalOptionalList': (NesoiDecimal | null | undefined)[] | null | undefined
            // 'pObjOptionalList.#.deepDecimalOptionalList.#': NesoiDecimal | null | undefined
            // 'pObjOptionalList.#.deepEnumOptionalList': (('1' | '2' | '3') | null | undefined)[] | null | undefined
            // 'pObjOptionalList.#.deepEnumOptionalList.#': ('1' | '2' | '3') | null | undefined
            // 'pObjOptionalList.#.deepIntOptionalList': (number | null | undefined)[] | null | undefined
            // 'pObjOptionalList.#.deepIntOptionalList.#': number | null | undefined
            // 'pObjOptionalList.#.deepFloatOptionalList': (number | null | undefined)[] | null | undefined
            // 'pObjOptionalList.#.deepFloatOptionalList.#': number | null | undefined
            // 'pObjOptionalList.#.deepStringOptionalList': (string | null | undefined)[] | null | undefined
            // 'pObjOptionalList.#.deepStringOptionalList.#': string | null | undefined
            // 'pObjOptionalList.#.deepObjOptionalList': ({
            //     'okOptionalList'?: (boolean | null | undefined)[]
            // } | null | undefined)[] | null | undefined
            // 'pObjOptionalList.#.deepObjOptionalList.#': {
            //     'okOptionalList'?: (boolean | null | undefined)[]
            // } | null | undefined
            // 'pObjOptionalList.#.deepObjOptionalList.#.okOptionalList': (boolean | null | undefined)[] | null | undefined
            // 'pObjOptionalList.#.deepObjOptionalList.#.okOptionalList.#': boolean | null | undefined
            // 'pDictOptionalList': (Record<string, number> | null | undefined)[] | null | undefined
            // 'pDictOptionalList.#': Record<string, number> | null | undefined
            // 'pDictOptionalList.#.#': number | null | undefined
        }
        views: {
            default: any
            simple: any
            ui_list: any
        }
        graph: Overlay<$BucketGraph, {
            links: {
                mock: Overlay<$BucketGraphLink, {
                    '#data': MockBucket['#data']
                }>
                clone: Overlay<$BucketGraphLink, {
                    '#data': FullBucket['#data']
                }>
            }
        }>
    }>
    
    // Messages

    export type VanillaMessage = Overlay<$Message, {
        name: 'vanilla',
    }>

    export type MockMessage = Overlay<$Message, {
        name: 'mock',
        '#raw': {
            $: 'mock'
            name: string
            timestamp: string
            color: {
                r: number
                g: number
                b: number
            }
            mock_id: number
        }
        '#parsed': {
            $: 'mock'
            name: string
            timestamp: NesoiDate
            color: {
                r: number
                g: number
                b: number
            }
            mock: MockBucket['#data']
        }
    }>

    export type FullMessage = Overlay<$Message, {
        name: 'full',
        '#raw': {
            $: 'full',
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
            propIdList_id: Mock.MockBucket['#data']['id'][]
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
        '#parsed': {
            $: 'full',
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
    }>
    
    // Jobs

    export type VanillaJob = Overlay<$Job, {
        name: 'vanilla',
        '#input': never
    }>

    export type MockJob = Overlay<$Job, {
        name: 'mock',
        '#input': Overlay<$Message, {
            '#raw': {
                $: 'mock.trigger',
                a: number,
                b: string
            }
        }>
    }>

    export type IntrinsicMsgJob = Overlay<$Job, {
        name: 'intrinsic_msg',
        '#input': Overlay<$Message, {
            '#raw': {
                $: 'intrinsic_msg',
                a: number,
                b: string
            } | {
                $: 'other_msg'
                c: boolean
            }
        }>
    }>
    
    // Resources

    export type VanillaResource = Overlay<$Resource, {
        name: 'vanilla',
    }>

    // Modules

    export type Module = Overlay<$Module, {
        constants: MockConstants,
        buckets: {
            mock: MockBucket,
            pivot: PivotBucket,
            full: FullBucket
        }
        messages: {
            mock: MockMessage
            full: FullMessage
        }
        jobs: {
            mock: MockJob,
            intrinsic_msg: IntrinsicMsgJob
        }
    }>

    export type OtherModule = Overlay<$Module, {
        constants: OtherConstants,
        buckets: {
            mock2: MockBucket,
            full2: FullBucket
        }
    }>

    // Space

    export type Space = Overlay<$Space, {
        authnUsers: {
            api: {
                id: number
                name: string
            }
            ext: {
                id: number
                birthday: NesoiDate
            }
        }
        modules: {
            mock: Module
            other: OtherModule
        }
    }>
}