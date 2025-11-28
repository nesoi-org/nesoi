import type { $Bucket } from '../bucket.schema';
import type { $Module } from '~/schema';
import type { NesoiDate } from '~/engine/data/date';
import type { NesoiDatetime } from '~/engine/data/datetime';
import type { NesoiDuration } from '~/engine/data/duration';

/*
 * 
 * Compiled NQL
 * 
 */

export type NQL_QueryMeta = {
    schema?: $Bucket
    scope?: string
    avgTime: number
}

export type NQL_Union = {
    meta: NQL_QueryMeta
    inters: NQL_Intersection[]
    sort?: { key: string, key_is_deep: boolean, dir: ('asc'|'desc') }[]
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
    fieldpath_is_deep: boolean
    op: NQL_Operation
    case_i: boolean
    not: boolean
    value: 
        { static: any | any[] }
        | { param: string | string[], param_is_deep: boolean }
        | { param_with_$: string }
        | { subquery: {
            bucket: $Bucket
            select: string
            union: NQL_Union
        }}
    select?: string
    part?: number
    _debug_id?: number
}

export type NQL_Part = {
    i: number,
    many: boolean,
    union: NQL_Union
    parent?: NQL_Part

    // This property is only defined when a query was sliced
    // due to multiple scopes, and a subquery rule became a root
    // union of one of the parts.
    select?: string
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

export type NQL_Sort<Querypath> = `${keyof Querypath & string}@${'asc'|'desc'}` | `${keyof Querypath & string}@${'asc'|'desc'}`[]

export type NQL_Pagination = {
    page?: number
    perPage?: number
    returnTotal?: boolean
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
    : T extends number | NesoiDate | NesoiDatetime | NesoiDuration
        ? '' | ' ==' | ' >' | ' <' | ' >=' | ' <=' | ' in' | ' present'
    : T extends string
        ? '' | ' ==' | ' in' | ' contains' | ' contains_any' | ' present' | ' ~' | ' ~in' | ' ~contains' | ' ~contains_any'
    // : T extends boolean[] | number[] | NesoiDate[] | NesoiDatetime[] | NesoiDuration[] | string[]
    //     ? ' contains' | ' contains_any' | ' present'
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
> = T | { '.': P } | { '.': PArr }[] | { '$': string }



/* SUBQUERY */

/**
 * A field name of the subquery bucket which resolves to
 * a type that's compatible with the query
 */
type NQL_SubQueryField<
    $ extends $Bucket,
    Field,
    Querypath = NoInfer<$['#modelpath']>,
    T = NoInfer<Querypath[Field & keyof Querypath]>
> = keyof {
    [X in keyof Querypath as NonNullable<T> extends NonNullable<Querypath[X]> ? X : never]: any
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
    Querypath = NoInfer<$['#querypath']>,
    Conditions = NoInfer<{
        [Field in keyof Querypath as Field]: {
            [Op in NQL_OpFromField<Querypath[Field]> as `${'or '|''}${Field & string}${' not'|''}${Op}`]?:
                NQL_ConditionValue<NQL_ValueFromOp<Querypath[Field]>[Op], Parameters>
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

    // Sorting
    & {
        '#sort'?: NQL_Sort<Querypath>
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