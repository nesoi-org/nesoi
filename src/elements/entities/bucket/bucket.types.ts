import { NewOrOldObj } from '~/engine/data/obj'
import { $Bucket } from './bucket.schema'
import { DeepPartialNullable } from '~/engine/util/deep'

export type PutObj<$ extends $Bucket> =
    NewOrOldObj<$['#data']> & (
        keyof $['#composition'] extends never
            ? {}
            : {
                '#composition': {
                    [K in keyof $['#composition']]: $['#composition'][K]['many'] extends true
                        ? (PutObj<$['#composition'][K]['bucket']> | ($['#composition'][K]['optional'] extends true ? undefined : never))[]
                        : PutObj<$['#composition'][K]['bucket']> | ($['#composition'][K]['optional'] extends true ? undefined : never)
                }
            }
    )


export type CreateObj<$ extends $Bucket> =
    Omit<$['#data'], 'id' | keyof $['#defaults']> & {
        [K in keyof $['#defaults']]?: $['#data'][K]
    } & (
        string extends keyof $['#composition'] ? {}
        : keyof $['#composition'] extends never ? {}
        : {
            '#composition': {
                [K in keyof $['#composition']]: $['#composition'][K]['many'] extends true
                    ? (PutObj<$['#composition'][K]['bucket']> | ($['#composition'][K]['optional'] extends true ? undefined : never))[]
                    : PutObj<$['#composition'][K]['bucket']> | ($['#composition'][K]['optional'] extends true ? undefined : never)
            }
        }
    )

export type ReplaceObj<$ extends $Bucket> =
    $['#data'] & (
        string extends keyof $['#composition'] ? {}
        : keyof $['#composition'] extends never ? {}
        : {
            '#composition': {
                [K in keyof $['#composition']]: $['#composition'][K]['many'] extends true
                    ? ReplaceObj<$['#composition'][K]['bucket']>[]
                    : ReplaceObj<$['#composition'][K]['bucket']>
            }
        }
    )

export type PatchObj<$ extends $Bucket> =
    DeepPartialNullable<$['#data']> & { id: $['#data']['id'] } & (
        string extends keyof $['#composition'] ? {}
        : keyof $['#composition'] extends never ? {}
        : {
            '#composition'?: {
                [K in keyof $['#composition']]?: $['#composition'][K]['many'] extends true
                    ? PatchObj<$['#composition'][K]['bucket']>[]
                    : Omit<PatchObj<$['#composition'][K]['bucket']>, 'id'>
            }
        }
    )


export type PatchResourceObj<$ extends $Bucket> =
    DeepPartialNullable<Omit<$['#data'], 'id'>> & (
        keyof $['#composition'] extends never
            ? {}
            : {
                '#composition'?: {
                    [K in keyof $['#composition']]?: $['#composition'][K]['many'] extends true
                        ? PatchObj<$['#composition'][K]['bucket']>[]
                        : PatchResourceObj<$['#composition'][K]['bucket']>
                }
            }
    )