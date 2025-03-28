import { $Bucket } from '../bucket.schema';
import { $Module } from '~/schema';
import { NesoiDate } from '~/engine/data/date';
import { NesoiDatetime } from '~/engine/data/datetime';

/*
 * 
 * Compiled NQL
 * 
 */

export type NQL_QueryMeta = {
    bucket?: $Bucket
    scope?: string
    avgTime: number
}

export type NQL_Union = {
    meta: NQL_QueryMeta
    inters: NQL_Intersection[]
    order?: { by: string, dir: 'asc'|'desc' }
    _debug_id?: number
}

export type NQL_Intersection = {
    meta: NQL_QueryMeta
    rules: (NQL_Rule | NQL_Union)[]
    _debug_id?: number
}

export type NQL_Rule = {
    meta: NQL_QueryMeta
    fieldpath: string
    op: NQL_Operation
    case_i: boolean
    not: boolean
    value: 
        { static: any | any[] }
        | { param: string | string[] }
        | { subquery: NQL_Union }
    select?: string
    part?: number
    _debug_id?: number
}

export type NQL_Part = {
    i: number,
    many: boolean,
    union: NQL_Union
    parent?: NQL_Part
}

export type NQL_Node = NQL_Union | NQL_Intersection | NQL_Rule

/*
 * 
 * NQL Internal Types
 * 
 */

/**
 * All operations
 */
export type NQL_Operation =
        '==' | '>'| '<'| '>='| '<='
        | 'in'| 'contains'| 'contains_any' | 'present'

export type NQL_Order<Fieldpath> = {
    by?: keyof Fieldpath,
    dir?: 'asc' | 'desc'
}

export type NQL_Pagination = {
    page?: number
    perPage?: number
    count?: boolean
}

/*
 * 
 * NQL Dynamic Type
 * 
 */


/**
 * A union of all operators which apply to the selected field
 */
type NQL_OpFromField<T> =
    T extends boolean
        ? '' | ' ==' | ' in' | ' present'
    : T extends number | NesoiDate | NesoiDatetime
        ? '' | ' ==' | ' >' | ' <' | ' >=' | ' <=' | ' in' | ' present'
    : T extends string
        ? '' | ' ==' | ' in' | ' contains' | ' contains_any' | ' present' | ' ~' | ' ~in' | ' ~contains' | ' ~contains_any'
    : T extends boolean[] | number[] | NesoiDate[] | NesoiDatetime[] | string[]
        ? '' | ' ==' | ' in' | ' contains' | ' contains_any' | ' present'
    : T extends object
        ? ' contains' | ' contains_any' | ' present'
    : ' present'

/**
 * A dict of accepted values for a given operator on a bucket field
 */
type NQL_ValueFromOp<T> = {
    '': T
    ' ==': T
    ' ~': T
    ' >': T
    ' <': T
    ' >=': T
    ' <=': T
    ' in': T[]
    ' ~in': T[]
    ' contains': (T extends (infer X)[]
        ? X
        : string
    )
    ' ~contains': (T extends (infer X)[]
        ? X
        : string
    )
    ' contains_any': (T extends any[]
        ? T
        : string[]
    )
    ' ~contains_any': (T extends any[]
        ? T
        : string[]
    )
    ' present': ''
}

/**
 * The expected type for a value, or a compatible parameter from the list
 */
type NQL_ConditionValue<
    T,
    Parameters,
    Titem = NoInfer<T extends (infer X)[] ? X : never>,
    P = NoInfer<{
        [X in keyof Parameters]:
            NonNullable<Parameters[X]> extends NonNullable<T> ? X : never
    }[keyof Parameters]>,
    PArr = NoInfer<{
        [X in keyof Parameters]:
            NonNullable<Parameters[X]> extends NonNullable<Titem> ? X : never
    }[keyof Parameters]>,
> = T | { '.': P } | { '.': PArr }[]



/* SUBQUERY */

/**
 * A field name of the subquery bucket which resolves to
 * a type that's compatible with the query
 */
type NQL_SubQueryField<
    $ extends $Bucket,
    Field,
    Fieldpath = NoInfer<$['#fieldpath']>,
    T = NoInfer<Fieldpath[Field & keyof Fieldpath]>
> = keyof {
    [X in keyof Fieldpath as NonNullable<T> extends NonNullable<Fieldpath[X]> ? X : never]: any
}

/**
 * A subquery passed as value to a query
 * It must be of the form:
 * {
 *      @BUCKETNAME.FIELDNAME: { ... }
 * }
 */
type NQL_SubQuery<
    M extends $Module,
    Field,
    Parameters
> = {
    [B in keyof M['buckets'] as `${''|'or '}@${B & string}.${NQL_SubQueryField<M['buckets'][B], Field> & string}`]?:
        NQL_Query<M, M['buckets'][B], Parameters>
}

/**
 * Graph link
 */
type NQL_GraphLinks<
    M extends $Module,
    $ extends $Bucket,
    Parameters =  {}
> = {
    [K in keyof $['graph']['links'] as `*${K & string}`]?: NQL_Terms<M, $['graph']['links'][K]['#bucket'], Parameters>
}

/**
    All possible query rules on the format:
    (or |)FIELDNAME( not|)OPERATOR
*/
type NQL_Terms<
    M extends $Module,
    $ extends $Bucket,
    Parameters =  {},
    Fieldpath = NoInfer<$['#fieldpath']>,
    Conditions = NoInfer<{
        [Field in keyof Fieldpath as Field]: {
            [Op in NQL_OpFromField<Fieldpath[Field]> as `${'or '|''}${Field & string}${' not'|''}${Op}`]?:
                NQL_ConditionValue<NQL_ValueFromOp<Fieldpath[Field]>[Op], Parameters>
                | NQL_SubQuery<M, Field, Parameters>
        }
    }>
> = 
    // Conditions
    Conditions[keyof Conditions]

    // Expressions
    & {
        [K in `${'#and'|'#or'}${string}`]?: NQL_Terms<M, $, Parameters>
    }

    // Graph Links
    & NQL_GraphLinks<M,$,Parameters>

    // Ordering
    & {
        '#order'?: NQL_Order<Fieldpath>
    }

/**
 * NQL Dynamic Query Type
 */
export type NQL_Query<
    M extends $Module,
    $ extends $Bucket,
    Parameters = {}
> = NQL_Terms<M, $, Parameters>

export type NQL_AnyQuery = NQL_Query<any, any>

/**
 * @deprecated Use `NQL_Query` instead
 */
export type AnyQuery<
    M extends $Module,
    $ extends $Bucket,
    Parameters = {}
> = NQL_Query<M, $, Parameters>