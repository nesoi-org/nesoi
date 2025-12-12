import type { NesoiDate } from '~/engine/data/date';
import type { NesoiDatetime } from '~/engine/data/datetime';
import type { NesoiDecimal } from '~/engine/data/decimal';
import type { NesoiDuration } from '~/engine/data/duration';
import type { NesoiFile } from '~/engine/data/file';

/**
 * Force TypeScript to fully infer the type, without intermediates.
 * This is currently used at:
 * - Test types, to force an exact type match
 */
export type Infer<
    T,
    NonSpecial = Exclude<T, NesoiDate | NesoiDatetime | NesoiDuration | NesoiDecimal | NesoiFile>,
    Special = Exclude<T, NonSpecial>,
    Primitive = Exclude<NonSpecial, Record<string, any>>,
    Object = Exclude<NonSpecial, Primitive>,
    Next = {
        [K in keyof Object]: Infer<Object[K]>
    }
> = Special | Primitive | Next


/* Type Comparisons */

export type IsAnyOrUnknown<T> = Exclude<any extends T ? true : false, true> extends never ? true : false

export type IsNever<T> = Exclude<Exclude<T, never> extends never ? true : false, true> extends never ? true : false

export type IsObject<T> =
    IsNever<T> extends true ? false
    : IsAnyOrUnknown<T> extends true ? false
    : T extends object
        ? T extends any[] ? false : true
        : false

export type IsPossiblyUndefined<T> =
    unknown extends T ? true
    : Exclude<T, never> extends never ? true
    : Extract<T, undefined> extends never ? false : true


/* Type Utils */

/**
 * Extract all items of a `Record<string, any>` as a union
 */
export type DictItem<
    Dict
> = Dict[string & keyof Dict] extends never
    ? NonNullable<Dict>[string & keyof Dict] | undefined
    : Dict[string & keyof Dict] 

/**
 * Extract all items of a `any[]` as a union
 */
export type ListItem<
    List
> = List[number & keyof List] extends never
    ? NonNullable<List>[number & keyof List] | undefined
    : List[number & keyof List] 

/**
 * Extract all items of a `{}` as a union
 */
export type ObjItem<
    Obj,
    K
> = Obj[K & keyof Obj] extends never
    ? NonNullable<Obj>[K & keyof NonNullable<Obj>] | undefined
    : Obj[K & keyof Obj] 

/**
 * Turn `T | undefined` into `T[]` 
 */
export type AsArray<
    T
> = IsPossiblyUndefined<T> extends true
    ? NonNullable<T>[] | undefined
    : T[]

    
/* Inspector */

export type IsEqual<A,B> = Exclude<
    // Never type requires special handling
    IsNever<A> extends true ? IsNever<B>
    : (A extends B
        // Boolean types are not 'symmetrical'
        ? B extends boolean
            ? true
            // All other types can be checked with extends
            : B extends A
                ? true
                : false
        : false)
, true> extends never ? true : false

export type InspectDifferences<
    A extends Record<string, any>,
    B extends Record<string, any>,
    Prefix extends string = ''
> =
// Find properties of A that are not in B
{
    [K in keyof A]: K extends keyof B
        ? never
        : ['A+', `${Prefix}${K & string}`, A[K]]
}[keyof A] |
// Find properties of B that are not in A
{
    [K in keyof B]: K extends keyof A
        ? never
        : ['B+', `${Prefix}${K & string}`, B[K]]
}[keyof B]
|
// Find properties that are different on either side
{
    [K in keyof B]: K extends keyof A
        ? IsEqual<A[K], B[K]> extends true
            ? never
            : IsObject<A[K]> extends true
                ? IsObject<B[K]> extends true
                    ? InspectDifferences<A[K], B[K], `${Prefix}${K & string}.`>
                    : ['!=', `${Prefix}${K & string}`, A[K], B[K]]
                : ['!=', `${Prefix}${K & string}`, A[K], B[K]]
        : never
}[keyof B]
