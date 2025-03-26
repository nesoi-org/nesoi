/* eslint-disable @typescript-eslint/no-namespace */
import { $Resource, $Bucket, $Job, $Message, $Module, $Space } from '~/elements'
import { $BucketGraph, $BucketGraphLink } from '~/elements/entities/bucket/graph/bucket_graph.schema'
import { $ConstantEnum, $Constants } from '~/elements/entities/constants/constants.schema'
import { NesoiDate } from '~/engine/data/date'
import { NesoiDatetime } from '~/engine/data/datetime'
import { Decimal } from '~/engine/data/decimal'
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
            'enum3.*': {
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
        '#fieldpath': {
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
            default: any
        }
    }>

    export type PivotBucket = Overlay<$Bucket, {
        name: 'pivot'
        '#data': {
            id: string
            mock_id: string
            vanilla_id: number
        }
        '#fieldpath': {
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
            pDecimal: Decimal,
            pEnum: 'a' | 'b' | 'c',
            pInt: number,
            pFloat: number,
            pString: string,
            pObj: {
                deepBoolean: boolean,
                deepDate: NesoiDate,
                deepDatetime: NesoiDatetime,
                deepDecimal: Decimal,
                deepEnum: '1' | '2' | '3',
                deepInt: number,
                deepFloat: number,
                deepString: string,
                deepObj: {
                    ok: boolean,
                }
            },
            pDict: Record<string, number>
    
            pAnyArray: any[],
            pBooleanArray: boolean[],
            pDateArray: NesoiDate[],
            pDatetimeArray: NesoiDatetime[],
            pDecimalArray: Decimal[],
            pEnumArray: ('a' | 'b' | 'c')[],
            pIntArray: number[],
            pFloatArray: number[],
            pStringArray: string[],
            pObjArray: {
                deepBooleanArray: boolean[],
                deepDateArray: NesoiDate[],
                deepDatetimeArray: NesoiDatetime[],
                deepDecimalArray: Decimal[],
                deepEnumArray: ('1' | '2' | '3')[],
                deepIntArray: number[],
                deepFloatArray: number[],
                deepStringArray: string[],
                deepObjArray: {
                    okArray: boolean[],
                }[]
            }[],
            pDictArray: Record<string, number>[]
    
            pAnyOptional: any | undefined,
            pBooleanOptional: boolean | undefined,
            pDateOptional: NesoiDate | undefined,
            pDatetimeOptional: NesoiDatetime | undefined,
            pDecimalOptional: Decimal | undefined,
            pEnumOptional: 'a' | 'b' | 'c' | undefined,
            pIntOptional: number | undefined,
            pFloatOptional: number | undefined,
            pStringOptional: string | undefined,
            pObjOptional: {
                deepBooleanOptional: boolean | undefined,
                deepDateOptional: NesoiDate | undefined,
                deepDatetimeOptional: NesoiDatetime | undefined,
                deepDecimalOptional: Decimal | undefined,
                deepEnumOptional: '1' | '2' | '3' | undefined,
                deepIntOptional: number | undefined,
                deepFloatOptional: number | undefined,
                deepStringOptional: string | undefined,
                deepObjOptional: {
                    okOptional: boolean | undefined,
                } | undefined
            } | undefined,
            pDictOptional: Record<string, number> | undefined
    
            pAnyArrayOptional: any[] | undefined,
            pBooleanArrayOptional: boolean[] | undefined,
            pDateArrayOptional: NesoiDate[] | undefined,
            pDatetimeArrayOptional: NesoiDatetime[] | undefined,
            pDecimalArrayOptional: Decimal[] | undefined,
            pEnumArrayOptional: ('a' | 'b' | 'c')[] | undefined,
            pIntArrayOptional: number[] | undefined,
            pFloatArrayOptional: number[] | undefined,
            pStringArrayOptional: string[] | undefined,
            pObjArrayOptional: {
                deepBooleanArrayOptional: boolean[] | undefined,
                deepDateArrayOptional: NesoiDate[] | undefined,
                deepDatetimeArrayOptional: NesoiDatetime[] | undefined,
                deepDecimalArrayOptional: Decimal[] | undefined,
                deepEnumArrayOptional: ('1' | '2' | '3')[] | undefined,
                deepIntArrayOptional: number[] | undefined,
                deepFloatArrayOptional: number[] | undefined,
                deepStringArrayOptional: string[] | undefined,
                deepObjArrayOptional: {
                    okArrayOptional: boolean[] | undefined,
                }[] | undefined
            }[] | undefined,
            pDictArrayOptional: Record<string, number>[] | undefined

            pAnyOptionalArray: any[] | undefined,
            pBooleanOptionalArray: boolean[] | undefined,
            pDateOptionalArray: NesoiDate[] | undefined,
            pDatetimeOptionalArray: NesoiDatetime[] | undefined,
            pDecimalOptionalArray: Decimal[] | undefined,
            pEnumOptionalArray: ('a' | 'b' | 'c')[] | undefined,
            pIntOptionalArray: number[] | undefined,
            pFloatOptionalArray: number[] | undefined,
            pStringOptionalArray: string[] | undefined,
            pObjOptionalArray: {
                deepBooleanOptionalArray: boolean[] | undefined,
                deepDateOptionalArray: NesoiDate[] | undefined,
                deepDatetimeOptionalArray: NesoiDatetime[] | undefined,
                deepDecimalOptionalArray: Decimal[] | undefined,
                deepEnumOptionalArray: ('1' | '2' | '3')[] | undefined,
                deepIntOptionalArray: number[] | undefined,
                deepFloatOptionalArray: number[] | undefined,
                deepStringOptionalArray: string[] | undefined,
                deepObjOptionalArray: {
                    okOptionalArray: boolean[] | undefined,
                }[] | undefined
            }[] | undefined,
            pDictOptionalArray: Record<string, number>[] | undefined
        }
        '#fieldpath': {
            'id': number
            'pAny': any
            'pBoolean': boolean
            'pDate': NesoiDate
            'pDatetime': NesoiDatetime
            'pDecimal': Decimal
            'pEnum': 'a' | 'b' | 'c'
            'pInt': number
            'pFloat': number
            'pString': string
            'pObj': {
                'deepBoolean': boolean
                'deepDate': NesoiDate
                'deepDatetime': NesoiDatetime
                'deepDecimal': Decimal
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
            'pObj.deepDecimal': Decimal
            'pObj.deepEnum': '1' | '2' | '3'
            'pObj.deepInt': number
            'pObj.deepFloat': number
            'pObj.deepString': string
            'pObj.deepObj': {
                'ok': boolean
            }
            'pObj.deepObj.ok': boolean
            'pDict': Record<string, number>
            'pDict.*': number

            'pAnyArray': any[]
            'pAnyArray.*': any
            'pBooleanArray': boolean[]
            'pBooleanArray.*': boolean
            'pDateArray': NesoiDate[]
            'pDateArray.*': NesoiDate
            'pDatetimeArray': NesoiDatetime[]
            'pDatetimeArray.*': NesoiDatetime
            'pDecimalArray': Decimal[]
            'pDecimalArray.*': Decimal
            'pEnumArray': ('a' | 'b' | 'c')[]
            'pEnumArray.*': ('a' | 'b' | 'c')
            'pIntArray': number[]
            'pIntArray.*': number
            'pFloatArray': number[]
            'pFloatArray.*': number
            'pStringArray': string[]
            'pStringArray.*': string
            'pObjArray': {
                'deepBooleanArray': boolean[]
                'deepDateArray': NesoiDate[]
                'deepDatetimeArray': NesoiDatetime[]
                'deepDecimalArray': Decimal[]
                'deepEnumArray': ('1' | '2' | '3')[]
                'deepIntArray': number[]
                'deepFloatArray': number[]
                'deepStringArray': string[]
                'deepObjArray': {
                    'okArray': boolean[]
                }[]
            }[]
            'pObjArray.*': {
                'deepBooleanArray': boolean[]
                'deepDateArray': NesoiDate[]
                'deepDatetimeArray': NesoiDatetime[]
                'deepDecimalArray': Decimal[]
                'deepEnumArray': ('1' | '2' | '3')[]
                'deepIntArray': number[]
                'deepFloatArray': number[]
                'deepStringArray': string[]
                'deepObjArray': {
                    'okArray': boolean[]
                }[]
            }
            'pObjArray.*.deepBooleanArray': boolean[]
            'pObjArray.*.deepBooleanArray.*': boolean
            'pObjArray.*.deepDateArray': NesoiDate[]
            'pObjArray.*.deepDateArray.*': NesoiDate
            'pObjArray.*.deepDatetimeArray': NesoiDatetime[]
            'pObjArray.*.deepDatetimeArray.*': NesoiDatetime
            'pObjArray.*.deepDecimalArray': Decimal[]
            'pObjArray.*.deepDecimalArray.*': Decimal
            'pObjArray.*.deepEnumArray': ('1' | '2' | '3')[]
            'pObjArray.*.deepEnumArray.*': ('1' | '2' | '3')
            'pObjArray.*.deepIntArray': number[]
            'pObjArray.*.deepIntArray.*': number
            'pObjArray.*.deepFloatArray': number[]
            'pObjArray.*.deepFloatArray.*': number
            'pObjArray.*.deepStringArray': string[]
            'pObjArray.*.deepStringArray.*': string
            'pObjArray.*.deepObjArray': {
                'okArray': boolean[]
            }[]
            'pObjArray.*.deepObjArray.*': {
                'okArray': boolean[]
            }
            'pObjArray.*.deepObjArray.*.okArray': boolean[]
            'pObjArray.*.deepObjArray.*.okArray.*': boolean
            'pDictArray': Record<string, number>[]
            'pDictArray.*': Record<string, number>
            'pDictArray.*.*': number

            'pAnyOptional': any | undefined
            'pBooleanOptional': boolean | undefined
            'pDateOptional': NesoiDate | undefined
            'pDatetimeOptional': NesoiDatetime | undefined
            'pDecimalOptional': Decimal | undefined
            'pEnumOptional': 'a' | 'b' | 'c' | undefined
            'pIntOptional': number | undefined
            'pFloatOptional': number | undefined
            'pStringOptional': string | undefined
            'pObjOptional': {
                'deepBooleanOptional': boolean | undefined
                'deepDateOptional': NesoiDate | undefined
                'deepDatetimeOptional': NesoiDatetime | undefined
                'deepDecimalOptional': Decimal | undefined
                'deepEnumOptional': '1' | '2' | '3' | undefined
                'deepIntOptional': number | undefined
                'deepFloatOptional': number | undefined
                'deepStringOptional': string | undefined
                'deepObjOptional': {
                    'okOptional': boolean | undefined
                } | undefined
            } | undefined
            'pObjOptional.deepBooleanOptional': boolean | undefined
            'pObjOptional.deepDateOptional': NesoiDate | undefined
            'pObjOptional.deepDatetimeOptional': NesoiDatetime | undefined
            'pObjOptional.deepDecimalOptional': Decimal | undefined
            'pObjOptional.deepEnumOptional': '1' | '2' | '3' | undefined
            'pObjOptional.deepIntOptional': number | undefined
            'pObjOptional.deepFloatOptional': number | undefined
            'pObjOptional.deepStringOptional': string | undefined
            'pObjOptional.deepObjOptional': {
                'okOptional': boolean | undefined
            } | undefined
            'pObjOptional.deepObjOptional.okOptional': boolean | undefined
            'pDictOptional': Record<string, number> | undefined
            'pDictOptional.*': number | undefined

            'pAnyArrayOptional': any[] | undefined
            'pAnyArrayOptional.*': any | undefined
            'pBooleanArrayOptional': boolean[] | undefined
            'pBooleanArrayOptional.*': boolean | undefined
            'pDateArrayOptional': NesoiDate[] | undefined
            'pDateArrayOptional.*': NesoiDate | undefined
            'pDatetimeArrayOptional': NesoiDatetime[] | undefined
            'pDatetimeArrayOptional.*': NesoiDatetime | undefined
            'pDecimalArrayOptional': Decimal[] | undefined
            'pDecimalArrayOptional.*': Decimal | undefined
            'pEnumArrayOptional': ('a' | 'b' | 'c')[] | undefined
            'pEnumArrayOptional.*': ('a' | 'b' | 'c') | undefined
            'pIntArrayOptional': number[] | undefined
            'pIntArrayOptional.*': number | undefined
            'pFloatArrayOptional': number[] | undefined
            'pFloatArrayOptional.*': number | undefined
            'pStringArrayOptional': string[] | undefined
            'pStringArrayOptional.*': string | undefined
            'pObjArrayOptional': {
                'deepBooleanArrayOptional': boolean[] | undefined
                'deepDateArrayOptional': NesoiDate[] | undefined
                'deepDatetimeArrayOptional': NesoiDatetime[] | undefined
                'deepDecimalArrayOptional': Decimal[] | undefined
                'deepEnumArrayOptional': ('1' | '2' | '3')[] | undefined
                'deepIntArrayOptional': number[] | undefined
                'deepFloatArrayOptional': number[] | undefined
                'deepStringArrayOptional': string[] | undefined
                'deepObjArrayOptional': {
                    'okArrayOptional': boolean[] | undefined
                }[] | undefined
            }[] | undefined
            'pObjArrayOptional.*': {
                'deepBooleanArrayOptional': boolean[] | undefined
                'deepDateArrayOptional': NesoiDate[] | undefined
                'deepDatetimeArrayOptional': NesoiDatetime[] | undefined
                'deepDecimalArrayOptional': Decimal[] | undefined
                'deepEnumArrayOptional': ('1' | '2' | '3')[] | undefined
                'deepIntArrayOptional': number[] | undefined
                'deepFloatArrayOptional': number[] | undefined
                'deepStringArrayOptional': string[] | undefined
                'deepObjArrayOptional': {
                    'okArrayOptional': boolean[] | undefined
                }[] | undefined
            } | undefined
            'pObjArrayOptional.*.deepBooleanArrayOptional': boolean[] | undefined
            'pObjArrayOptional.*.deepBooleanArrayOptional.*': boolean | undefined
            'pObjArrayOptional.*.deepDateArrayOptional': NesoiDate[] | undefined
            'pObjArrayOptional.*.deepDateArrayOptional.*': NesoiDate | undefined
            'pObjArrayOptional.*.deepDatetimeArrayOptional': NesoiDatetime[] | undefined
            'pObjArrayOptional.*.deepDatetimeArrayOptional.*': NesoiDatetime | undefined
            'pObjArrayOptional.*.deepDecimalArrayOptional': Decimal[] | undefined
            'pObjArrayOptional.*.deepDecimalArrayOptional.*': Decimal | undefined
            'pObjArrayOptional.*.deepEnumArrayOptional': ('1' | '2' | '3')[] | undefined
            'pObjArrayOptional.*.deepEnumArrayOptional.*': ('1' | '2' | '3') | undefined
            'pObjArrayOptional.*.deepIntArrayOptional': number[] | undefined
            'pObjArrayOptional.*.deepIntArrayOptional.*': number | undefined
            'pObjArrayOptional.*.deepFloatArrayOptional': number[] | undefined
            'pObjArrayOptional.*.deepFloatArrayOptional.*': number | undefined
            'pObjArrayOptional.*.deepStringArrayOptional': string[] | undefined
            'pObjArrayOptional.*.deepStringArrayOptional.*': string | undefined
            'pObjArrayOptional.*.deepObjArrayOptional': {
                'okArrayOptional': boolean[] | undefined
            }[] | undefined
            'pObjArrayOptional.*.deepObjArrayOptional.*': {
                'okArrayOptional': boolean[] | undefined
            } | undefined
            'pObjArrayOptional.*.deepObjArrayOptional.*.okArrayOptional': boolean[] | undefined
            'pObjArrayOptional.*.deepObjArrayOptional.*.okArrayOptional.*': boolean | undefined
            'pDictArrayOptional': Record<string, number>[] | undefined
            'pDictArrayOptional.*': Record<string, number> | undefined
            'pDictArrayOptional.*.*': number | undefined

            'pAnyOptionalArray': any[] | undefined
            'pAnyOptionalArray.*': any | undefined
            'pBooleanOptionalArray': boolean[] | undefined
            'pBooleanOptionalArray.*': boolean | undefined
            'pDateOptionalArray': NesoiDate[] | undefined
            'pDateOptionalArray.*': NesoiDate | undefined
            'pDatetimeOptionalArray': NesoiDatetime[] | undefined
            'pDatetimeOptionalArray.*': NesoiDatetime | undefined
            'pDecimalOptionalArray': Decimal[] | undefined
            'pDecimalOptionalArray.*': Decimal | undefined
            'pEnumOptionalArray': ('a' | 'b' | 'c')[] | undefined
            'pEnumOptionalArray.*': ('a' | 'b' | 'c') | undefined
            'pIntOptionalArray': number[] | undefined
            'pIntOptionalArray.*': number | undefined
            'pFloatOptionalArray': number[] | undefined
            'pFloatOptionalArray.*': number | undefined
            'pStringOptionalArray': string[] | undefined
            'pStringOptionalArray.*': string | undefined
            'pObjOptionalArray': {
                'deepBooleanOptionalArray': boolean[] | undefined
                'deepDateOptionalArray': NesoiDate[] | undefined
                'deepDatetimeOptionalArray': NesoiDatetime[] | undefined
                'deepDecimalOptionalArray': Decimal[] | undefined
                'deepEnumOptionalArray': ('1' | '2' | '3')[] | undefined
                'deepIntOptionalArray': number[] | undefined
                'deepFloatOptionalArray': number[] | undefined
                'deepStringOptionalArray': string[] | undefined
                'deepObjOptionalArray': {
                    'okOptionalArray': boolean[] | undefined
                }[] | undefined
            }[] | undefined
            'pObjOptionalArray.*': {
                'deepBooleanOptionalArray': boolean[] | undefined
                'deepDateOptionalArray': NesoiDate[] | undefined
                'deepDatetimeOptionalArray': NesoiDatetime[] | undefined
                'deepDecimalOptionalArray': Decimal[] | undefined
                'deepEnumOptionalArray': ('1' | '2' | '3')[] | undefined
                'deepIntOptionalArray': number[] | undefined
                'deepFloatOptionalArray': number[] | undefined
                'deepStringOptionalArray': string[] | undefined
                'deepObjOptionalArray': {
                    'okOptionalArray': boolean[] | undefined
                }[] | undefined
            } | undefined
            'pObjOptionalArray.*.deepBooleanOptionalArray': boolean[] | undefined
            'pObjOptionalArray.*.deepBooleanOptionalArray.*': boolean | undefined
            'pObjOptionalArray.*.deepDateOptionalArray': NesoiDate[] | undefined
            'pObjOptionalArray.*.deepDateOptionalArray.*': NesoiDate | undefined
            'pObjOptionalArray.*.deepDatetimeOptionalArray': NesoiDatetime[] | undefined
            'pObjOptionalArray.*.deepDatetimeOptionalArray.*': NesoiDatetime | undefined
            'pObjOptionalArray.*.deepDecimalOptionalArray': Decimal[] | undefined
            'pObjOptionalArray.*.deepDecimalOptionalArray.*': Decimal | undefined
            'pObjOptionalArray.*.deepEnumOptionalArray': ('1' | '2' | '3')[] | undefined
            'pObjOptionalArray.*.deepEnumOptionalArray.*': ('1' | '2' | '3') | undefined
            'pObjOptionalArray.*.deepIntOptionalArray': number[] | undefined
            'pObjOptionalArray.*.deepIntOptionalArray.*': number | undefined
            'pObjOptionalArray.*.deepFloatOptionalArray': number[] | undefined
            'pObjOptionalArray.*.deepFloatOptionalArray.*': number | undefined
            'pObjOptionalArray.*.deepStringOptionalArray': string[] | undefined
            'pObjOptionalArray.*.deepStringOptionalArray.*': string | undefined
            'pObjOptionalArray.*.deepObjOptionalArray': {
                'okOptionalArray': boolean[] | undefined
            }[] | undefined
            'pObjOptionalArray.*.deepObjOptionalArray.*': {
                'okOptionalArray': boolean[] | undefined
            } | undefined
            'pObjOptionalArray.*.deepObjOptionalArray.*.okOptionalArray': boolean[] | undefined
            'pObjOptionalArray.*.deepObjOptionalArray.*.okOptionalArray.*': boolean | undefined
            'pDictOptionalArray': Record<string, number>[] | undefined
            'pDictOptionalArray.*': Record<string, number> | undefined
            'pDictOptionalArray.*.*': number | undefined
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
            propDecimal: string,
            propEnum: 'a' | 'b' | 'c',
            propId_id: Mock.MockBucket['#data']['id'],
            propInt: number,
            propString: string,
            propObj: {
                deepBoolean: boolean,
                deepDate: string,
                deepDatetime: string,
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
            propDecimalOptional?: string,
            propEnumOptional?: 'a' | 'b' | 'c',
            propIdOptional_id?: Mock.MockBucket['#data']['id']
            propIntOptional?: number,
            propStringOptional?: string,
            propObjOptional?: {
                deepBoolean: boolean,
                deepDate: string,
                deepDatetime: string,
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
            propDecimalNullable: string | null
            propEnumNullable: ('a' | 'b' | 'c') | null
            propIdNullable_id: Mock.MockBucket['#data']['id'] | null
            propIntNullable: number | null
            propStringNullable: string | null
            propObjNullable: {
                deepBoolean: boolean,
                deepDate: string,
                deepDatetime: string,
                deepEnumNullable: ('1' | '2' | '3') | null
                deepId_id: Mock.MockBucket['#data']['id']
                deepInt: number,
                deepString: string,
                deepObj: {
                    okNullable: boolean | null
                }
            } | null
            propBooleanArray: boolean[]
            propDateArray: string[]
            propDatetimeArray: string[]
            propDecimalArray: string[]
            propEnumArray: ('a' | 'b' | 'c')[]
            propIdArray_id: Mock.MockBucket['#data']['id'][]
            propIntArray: number[]
            propStringArray: string[]
            propObjArray: {
                deepBoolean: boolean,
                deepDate: string,
                deepDatetime: string,
                deepEnumArray: ('1' | '2' | '3')[]
                deepId_id: Mock.MockBucket['#data']['id']
                deepInt: number,
                deepString: string,
                deepObj: {
                    okArray: boolean[]
                }
            }[]
        }
        '#parsed': {
            $: 'full',
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
    }>
    
    // Jobs

    export type VanillaJob = Overlay<$Job, {
        name: 'vanilla',
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