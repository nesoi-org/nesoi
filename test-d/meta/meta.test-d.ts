import { expectType } from 'tsd';
import { AsArray, DictItem, InspectDifferences, IsAnyOrUnknown, IsEqual, IsNever, IsObject, IsPossiblyUndefined, ListItem, ObjItem } from './types';

/**
 * test: IsPossiblyUndefined operator
 */
{
    expectType<false>({} as IsPossiblyUndefined<number>)
    expectType<false>({} as IsPossiblyUndefined<string>)
    expectType<false>({} as IsPossiblyUndefined<boolean>)
    expectType<false>({} as IsPossiblyUndefined<bigint>)
    expectType<false>({} as IsPossiblyUndefined<symbol>)
    expectType<false>({} as IsPossiblyUndefined<null>)
    expectType<true>({} as IsPossiblyUndefined<undefined>)
    expectType<true>({} as IsPossiblyUndefined<any>)
    expectType<true>({} as IsPossiblyUndefined<unknown>)
    
    expectType<false>({} as IsPossiblyUndefined<number[]>)
    expectType<false>({} as IsPossiblyUndefined<string[]>)
    expectType<false>({} as IsPossiblyUndefined<boolean[]>)
    expectType<false>({} as IsPossiblyUndefined<bigint[]>)
    expectType<false>({} as IsPossiblyUndefined<symbol[]>)
    expectType<false>({} as IsPossiblyUndefined<null[]>)
    expectType<false>({} as IsPossiblyUndefined<undefined[]>)
    expectType<false>({} as IsPossiblyUndefined<any[]>)
    expectType<false>({} as IsPossiblyUndefined<unknown[]>)

    expectType<false>({} as IsPossiblyUndefined<object>)
    expectType<false>({} as IsPossiblyUndefined<object[]>)
    expectType<false>({} as IsPossiblyUndefined<Record<string, any>>)
    expectType<false>({} as IsPossiblyUndefined<Record<string, any>[]>)

    expectType<false>({} as IsPossiblyUndefined<{}>)
    expectType<false>({} as IsPossiblyUndefined<{}[]>)
    expectType<false>({} as IsPossiblyUndefined<{ a: number }>)
    expectType<false>({} as IsPossiblyUndefined<{ a: number }[]>)
    
    expectType<true>({} as IsPossiblyUndefined<never>)
    expectType<false>({} as IsPossiblyUndefined<never[]>)

    expectType<true>({} as IsPossiblyUndefined<number | undefined>)
    expectType<true>({} as IsPossiblyUndefined<string | undefined>)
    expectType<true>({} as IsPossiblyUndefined<boolean | undefined>)
    expectType<true>({} as IsPossiblyUndefined<bigint | undefined>)
    expectType<true>({} as IsPossiblyUndefined<symbol | undefined>)
    expectType<true>({} as IsPossiblyUndefined<null | undefined>)
    expectType<true>({} as IsPossiblyUndefined<any | undefined>)
    expectType<true>({} as IsPossiblyUndefined<unknown | undefined>)
    
    expectType<true>({} as IsPossiblyUndefined<number[] | undefined>)
    expectType<true>({} as IsPossiblyUndefined<string[] | undefined>)
    expectType<true>({} as IsPossiblyUndefined<boolean[] | undefined>)
    expectType<true>({} as IsPossiblyUndefined<bigint[] | undefined>)
    expectType<true>({} as IsPossiblyUndefined<symbol[] | undefined>)
    expectType<true>({} as IsPossiblyUndefined<null[] | undefined>)
    expectType<true>({} as IsPossiblyUndefined<undefined[] | undefined>)
    expectType<true>({} as IsPossiblyUndefined<any[] | undefined>)
    expectType<true>({} as IsPossiblyUndefined<unknown[] | undefined>)

    expectType<true>({} as IsPossiblyUndefined<object | undefined>)
    expectType<true>({} as IsPossiblyUndefined<object[] | undefined>)
    expectType<true>({} as IsPossiblyUndefined<Record<string, any> | undefined>)
    expectType<true>({} as IsPossiblyUndefined<Record<string, any>[] | undefined>)

    expectType<true>({} as IsPossiblyUndefined<{} | undefined>)
    expectType<true>({} as IsPossiblyUndefined<{}[] | undefined>)
    expectType<true>({} as IsPossiblyUndefined<{ a: number } | undefined>)
    expectType<true>({} as IsPossiblyUndefined<{ a: number }[] | undefined>)
    
    expectType<true>({} as IsPossiblyUndefined<never | undefined>)
    expectType<true>({} as IsPossiblyUndefined<never[] | undefined>)
}

/**
 * test: IsNever operator
 */
{
    expectType<false>({} as IsNever<number>)
    expectType<false>({} as IsNever<string>)
    expectType<false>({} as IsNever<boolean>)
    expectType<false>({} as IsNever<bigint>)
    expectType<false>({} as IsNever<symbol>)
    expectType<false>({} as IsNever<null>)
    expectType<false>({} as IsNever<undefined>)
    expectType<false>({} as IsNever<any>)
    expectType<false>({} as IsNever<unknown>)
    
    expectType<false>({} as IsNever<number[]>)
    expectType<false>({} as IsNever<string[]>)
    expectType<false>({} as IsNever<boolean[]>)
    expectType<false>({} as IsNever<bigint[]>)
    expectType<false>({} as IsNever<symbol[]>)
    expectType<false>({} as IsNever<null[]>)
    expectType<false>({} as IsNever<undefined[]>)
    expectType<false>({} as IsNever<any[]>)
    expectType<false>({} as IsNever<unknown[]>)

    expectType<false>({} as IsNever<object>)
    expectType<false>({} as IsNever<object[]>)
    expectType<false>({} as IsNever<Record<string, any>>)
    expectType<false>({} as IsNever<Record<string, any>[]>)

    expectType<false>({} as IsNever<{}>)
    expectType<false>({} as IsNever<{}[]>)
    expectType<false>({} as IsNever<{ a: number }>)
    expectType<false>({} as IsNever<{ a: number }[]>)
    
    expectType<true>({} as IsNever<never>)
    expectType<false>({} as IsNever<never[]>)
}

/**
 * test: IsAnyOrUnknown operator
 */
{
    expectType<false>({} as IsAnyOrUnknown<number>)
    expectType<false>({} as IsAnyOrUnknown<string>)
    expectType<false>({} as IsAnyOrUnknown<boolean>)
    expectType<false>({} as IsAnyOrUnknown<bigint>)
    expectType<false>({} as IsAnyOrUnknown<symbol>)
    expectType<false>({} as IsAnyOrUnknown<null>)
    expectType<false>({} as IsAnyOrUnknown<undefined>)
    expectType<true>({} as IsAnyOrUnknown<any>)
    expectType<true>({} as IsAnyOrUnknown<unknown>)
    
    expectType<false>({} as IsAnyOrUnknown<number[]>)
    expectType<false>({} as IsAnyOrUnknown<string[]>)
    expectType<false>({} as IsAnyOrUnknown<boolean[]>)
    expectType<false>({} as IsAnyOrUnknown<bigint[]>)
    expectType<false>({} as IsAnyOrUnknown<symbol[]>)
    expectType<false>({} as IsAnyOrUnknown<null[]>)
    expectType<false>({} as IsAnyOrUnknown<undefined[]>)
    expectType<false>({} as IsAnyOrUnknown<any[]>)
    expectType<false>({} as IsAnyOrUnknown<unknown[]>)

    expectType<false>({} as IsAnyOrUnknown<object>)
    expectType<false>({} as IsAnyOrUnknown<object[]>)
    expectType<false>({} as IsAnyOrUnknown<Record<string, any>>)
    expectType<false>({} as IsAnyOrUnknown<Record<string, any>[]>)

    expectType<false>({} as IsAnyOrUnknown<{}>)
    expectType<false>({} as IsAnyOrUnknown<{}[]>)
    expectType<false>({} as IsAnyOrUnknown<{ a: number }>)
    expectType<false>({} as IsAnyOrUnknown<{ a: number }[]>)
    
    expectType<false>({} as IsAnyOrUnknown<never>)
    expectType<false>({} as IsAnyOrUnknown<never[]>)
    
    expectType<false>({} as IsAnyOrUnknown<number | undefined>)
    expectType<false>({} as IsAnyOrUnknown<string | undefined>)
    expectType<false>({} as IsAnyOrUnknown<boolean | undefined>)
    expectType<false>({} as IsAnyOrUnknown<bigint | undefined>)
    expectType<false>({} as IsAnyOrUnknown<symbol | undefined>)
    expectType<false>({} as IsAnyOrUnknown<null | undefined>)
    expectType<false>({} as IsAnyOrUnknown<undefined | undefined>)
    expectType<true>({} as IsAnyOrUnknown<any | undefined>)
    expectType<true>({} as IsAnyOrUnknown<unknown | undefined>)
    
    expectType<false>({} as IsAnyOrUnknown<number[] | undefined>)
    expectType<false>({} as IsAnyOrUnknown<string[] | undefined>)
    expectType<false>({} as IsAnyOrUnknown<boolean[] | undefined>)
    expectType<false>({} as IsAnyOrUnknown<bigint[] | undefined>)
    expectType<false>({} as IsAnyOrUnknown<symbol[] | undefined>)
    expectType<false>({} as IsAnyOrUnknown<null[] | undefined>)
    expectType<false>({} as IsAnyOrUnknown<undefined[] | undefined>)
    expectType<false>({} as IsAnyOrUnknown<any[] | undefined>)
    expectType<false>({} as IsAnyOrUnknown<unknown[] | undefined>)

    expectType<false>({} as IsAnyOrUnknown<object | undefined>)
    expectType<false>({} as IsAnyOrUnknown<object[] | undefined>)
    expectType<false>({} as IsAnyOrUnknown<Record<string, any> | undefined>)
    expectType<false>({} as IsAnyOrUnknown<Record<string, any>[] | undefined>)

    expectType<false>({} as IsAnyOrUnknown<{} | undefined>)
    expectType<false>({} as IsAnyOrUnknown<{}[] | undefined>)
    expectType<false>({} as IsAnyOrUnknown<{ a: number } | undefined>)
    expectType<false>({} as IsAnyOrUnknown<{ a: number }[] | undefined>)
    
    expectType<false>({} as IsAnyOrUnknown<never | undefined>)
    expectType<false>({} as IsAnyOrUnknown<never[] | undefined>)
}

/**
 * test: IsObject operator
 */
{
    expectType<false>({} as IsObject<number>)
    expectType<false>({} as IsObject<string>)
    expectType<false>({} as IsObject<boolean>)
    expectType<false>({} as IsObject<bigint>)
    expectType<false>({} as IsObject<symbol>)
    expectType<false>({} as IsObject<null>)
    expectType<false>({} as IsObject<undefined>)
    expectType<false>({} as IsObject<any>)
    expectType<false>({} as IsObject<unknown>)
    
    expectType<false>({} as IsObject<number[]>)
    expectType<false>({} as IsObject<string[]>)
    expectType<false>({} as IsObject<boolean[]>)
    expectType<false>({} as IsObject<bigint[]>)
    expectType<false>({} as IsObject<symbol[]>)
    expectType<false>({} as IsObject<null[]>)
    expectType<false>({} as IsObject<undefined[]>)
    expectType<false>({} as IsObject<any[]>)
    expectType<false>({} as IsObject<unknown[]>)

    expectType<true>({} as IsObject<object>)
    expectType<false>({} as IsObject<object[]>)
    expectType<true>({} as IsObject<Record<string, any>>)
    expectType<false>({} as IsObject<Record<string, any>[]>)

    expectType<true>({} as IsObject<{}>)
    expectType<false>({} as IsObject<{}[]>)
    expectType<true>({} as IsObject<{ a: number }>)
    expectType<false>({} as IsObject<{ a: number }[]>)
    
    expectType<false>({} as IsObject<never>)
    expectType<false>({} as IsObject<never[]>)

    expectType<false>({} as IsObject<number | undefined>)
    expectType<false>({} as IsObject<string | undefined>)
    expectType<false>({} as IsObject<boolean | undefined>)
    expectType<false>({} as IsObject<bigint | undefined>)
    expectType<false>({} as IsObject<symbol | undefined>)
    expectType<false>({} as IsObject<null | undefined>)
    expectType<false>({} as IsObject<undefined | undefined>)
    expectType<false>({} as IsObject<any | undefined>)
    expectType<false>({} as IsObject<unknown | undefined>)
    
    expectType<false>({} as IsObject<number[] | undefined>)
    expectType<false>({} as IsObject<string[] | undefined>)
    expectType<false>({} as IsObject<boolean[] | undefined>)
    expectType<false>({} as IsObject<bigint[] | undefined>)
    expectType<false>({} as IsObject<symbol[] | undefined>)
    expectType<false>({} as IsObject<null[] | undefined>)
    expectType<false>({} as IsObject<undefined[] | undefined>)
    expectType<false>({} as IsObject<any[] | undefined>)
    expectType<false>({} as IsObject<unknown[] | undefined>)

    expectType<true|false>({} as IsObject<object | undefined>)
    expectType<false>({} as IsObject<object[] | undefined>)
    expectType<true|false>({} as IsObject<Record<string, any> | undefined>)
    expectType<false>({} as IsObject<Record<string, any>[] | undefined>)

    expectType<true|false>({} as IsObject<{} | undefined>)
    expectType<false>({} as IsObject<{}[] | undefined>)
    expectType<true|false>({} as IsObject<{ a: number } | undefined>)
    expectType<false>({} as IsObject<{ a: number }[] | undefined>)
    
    expectType<false>({} as IsObject<never | undefined>)
    expectType<false>({} as IsObject<never[] | undefined>)
}

/**
 * test: IsEqual operator
 */
{
    expectType<true>({} as IsEqual<number, number>)
    expectType<false>({} as IsEqual<number, string>)
    expectType<false>({} as IsEqual<number, boolean>)
    expectType<false>({} as IsEqual<number, bigint>)
    expectType<false>({} as IsEqual<number, symbol>)
    expectType<false>({} as IsEqual<number, null>)
    expectType<false>({} as IsEqual<number, undefined>)
    expectType<false>({} as IsEqual<number, any>)
    expectType<false>({} as IsEqual<number, unknown>)
    expectType<false>({} as IsEqual<number, never>)

    expectType<false>({} as IsEqual<string, number>)
    expectType<true>({} as IsEqual<string, string>)
    expectType<false>({} as IsEqual<string, boolean>)
    expectType<false>({} as IsEqual<string, bigint>)
    expectType<false>({} as IsEqual<string, symbol>)
    expectType<false>({} as IsEqual<string, null>)
    expectType<false>({} as IsEqual<string, undefined>)
    expectType<false>({} as IsEqual<string, any>)
    expectType<false>({} as IsEqual<string, unknown>)
    expectType<false>({} as IsEqual<string, never>)

    expectType<false>({} as IsEqual<boolean, number>)
    expectType<false>({} as IsEqual<boolean, string>)
    expectType<true>({} as IsEqual<boolean, boolean>)
    expectType<false>({} as IsEqual<boolean, bigint>)
    expectType<false>({} as IsEqual<boolean, symbol>)
    expectType<false>({} as IsEqual<boolean, null>)
    expectType<false>({} as IsEqual<boolean, undefined>)
    expectType<false>({} as IsEqual<boolean, any>)
    expectType<false>({} as IsEqual<boolean, unknown>)
    expectType<false>({} as IsEqual<boolean, never>)

    expectType<false>({} as IsEqual<bigint, number>)
    expectType<false>({} as IsEqual<bigint, string>)
    expectType<false>({} as IsEqual<bigint, boolean>)
    expectType<true>({} as IsEqual<bigint, bigint>)
    expectType<false>({} as IsEqual<bigint, symbol>)
    expectType<false>({} as IsEqual<bigint, null>)
    expectType<false>({} as IsEqual<bigint, undefined>)
    expectType<false>({} as IsEqual<bigint, any>)
    expectType<false>({} as IsEqual<bigint, unknown>)
    expectType<false>({} as IsEqual<bigint, never>)

    expectType<false>({} as IsEqual<symbol, number>)
    expectType<false>({} as IsEqual<symbol, string>)
    expectType<false>({} as IsEqual<symbol, boolean>)
    expectType<false>({} as IsEqual<symbol, bigint>)
    expectType<true>({} as IsEqual<symbol, symbol>)
    expectType<false>({} as IsEqual<symbol, null>)
    expectType<false>({} as IsEqual<symbol, undefined>)
    expectType<false>({} as IsEqual<symbol, any>)
    expectType<false>({} as IsEqual<symbol, unknown>)
    expectType<false>({} as IsEqual<symbol, never>)

    expectType<false>({} as IsEqual<null, number>)
    expectType<false>({} as IsEqual<null, string>)
    expectType<false>({} as IsEqual<null, boolean>)
    expectType<false>({} as IsEqual<null, bigint>)
    expectType<false>({} as IsEqual<null, symbol>)
    expectType<true>({} as IsEqual<null, null>)
    expectType<false>({} as IsEqual<null, undefined>)
    expectType<false>({} as IsEqual<null, any>)
    expectType<false>({} as IsEqual<null, unknown>)
    expectType<false>({} as IsEqual<null, never>)

    expectType<false>({} as IsEqual<undefined, number>)
    expectType<false>({} as IsEqual<undefined, string>)
    expectType<false>({} as IsEqual<undefined, boolean>)
    expectType<false>({} as IsEqual<undefined, bigint>)
    expectType<false>({} as IsEqual<undefined, symbol>)
    expectType<false>({} as IsEqual<undefined, null>)
    expectType<true>({} as IsEqual<undefined, undefined>)
    expectType<false>({} as IsEqual<undefined, any>)
    expectType<false>({} as IsEqual<undefined, unknown>)
    expectType<false>({} as IsEqual<undefined, never>)

    expectType<false>({} as IsEqual<any, number>)
    expectType<false>({} as IsEqual<any, string>)
    expectType<false>({} as IsEqual<any, boolean>)
    expectType<false>({} as IsEqual<any, bigint>)
    expectType<false>({} as IsEqual<any, symbol>)
    expectType<false>({} as IsEqual<any, null>)
    expectType<false>({} as IsEqual<any, undefined>)
    expectType<true>({} as IsEqual<any, any>)
    expectType<true>({} as IsEqual<any, unknown>) // Exception
    expectType<false>({} as IsEqual<any, never>)

    expectType<false>({} as IsEqual<unknown, number>)
    expectType<false>({} as IsEqual<unknown, string>)
    expectType<false>({} as IsEqual<unknown, boolean>)
    expectType<false>({} as IsEqual<unknown, bigint>)
    expectType<false>({} as IsEqual<unknown, symbol>)
    expectType<false>({} as IsEqual<unknown, null>)
    expectType<false>({} as IsEqual<unknown, undefined>)
    expectType<true>({} as IsEqual<unknown, any>) // Exception
    expectType<true>({} as IsEqual<unknown, unknown>)
    expectType<false>({} as IsEqual<unknown, never>)

    expectType<false>({} as IsEqual<never, number>)
    expectType<false>({} as IsEqual<never, string>)
    expectType<false>({} as IsEqual<never, boolean>)
    expectType<false>({} as IsEqual<never, bigint>)
    expectType<false>({} as IsEqual<never, symbol>)
    expectType<false>({} as IsEqual<never, null>)
    expectType<false>({} as IsEqual<never, undefined>)
    expectType<false>({} as IsEqual<never, any>)
    expectType<false>({} as IsEqual<never, unknown>)
    expectType<true>({} as IsEqual<never, never>)
}

/* Dict Item */

{
    type A = Record<string, number>
    expectType<number>({} as DictItem<A>)
    
    type B = Record<string, number> | undefined
    expectType<number | undefined>({} as DictItem<B>)
    
    type C = Record<string, number | undefined>
    expectType<number | undefined>({} as DictItem<C>)

    type D = Record<string, {
        a: number
    }>
    expectType<{ a: number }>({} as DictItem<D>)

    type E = Record<string, {
        a: number
    }> | undefined
    expectType<{ a: number } | undefined>({} as DictItem<E>)
}

/* List Item */

{
    type A = number[]
    expectType<number>({} as ListItem<A>)
    
    type B = number[] | undefined
    expectType<number | undefined>({} as ListItem<B>)
    
    type C = (number | undefined)[]
    expectType<number | undefined>({} as ListItem<C>)

    type D = {
        a: number
    }[]
    expectType<{ a: number }>({} as ListItem<D>)

    type E = {
        a: number
    }[] | undefined
    expectType<{ a: number } | undefined>({} as ListItem<E>)
}

/* Obj Item */

{
    type A = {
        a: number
    }
    expectType<number>({} as ObjItem<A, 'a'>)
    
    type B = {
        a: number
    } | undefined
    expectType<number | undefined>({} as ObjItem<B, 'a'>)
    
    type C = {
        a: number | undefined
    } | undefined
    expectType<number | undefined>({} as ObjItem<C, 'a'>)
}

/* AsArray */

{
    type A = number
    expectType<number[]>({} as AsArray<A>)
    
    type B = {
        a: number
    }
    expectType<{ a: number }[]>({} as AsArray<B>)
    
    type C = number | undefined
    expectType<number[] | undefined>({} as AsArray<C>)
    
    type D = {
        a: number
    } | undefined
    expectType<{ a: number }[] | undefined>({} as AsArray<D>)    
}

/* Inspect Differences */

/**
 * test: A has property that B doesn't
*/
{  
    type A = {
        a: number
    }
    type B = {}

    type Diff = InspectDifferences<A,B>
    type ExpectedDiff = ['A+', 'a', number]

    expectType<ExpectedDiff>({} as Diff)
}

/**
 * test: B has property that A doesn't
*/
{  
    type A = {}
    type B = {
        b: string
    }

    type Diff = InspectDifferences<A,B>
    type ExpectedDiff = ['B+', 'b', string]

    expectType<ExpectedDiff>({} as Diff)
}

/**
 * test: A and B are disjoint
*/
{  
    type A = {
        a: number
    }
    type B = {
        b: string
    }

    type Diff = InspectDifferences<A,B>
    type ExpectedDiff = 
        ['A+', 'a', number]
        | ['B+', 'b', string]

    expectType<ExpectedDiff>({} as Diff)
}

/**
 * test: A and B are the same
*/
{  
    type A = {
        a: number
    }
    type B = {
        a: number
    }

    type Diff = InspectDifferences<A,B>
    type ExpectedDiff = never

    expectType<ExpectedDiff>({} as Diff)
}

/**
 * test: A and B share some properties
*/
{  
    type A = {
        a: number
        b: string
        c: boolean
    }
    type B = {
        a: number
        b: string
        d: '0' | '1' | '2'
    }

    type Diff = InspectDifferences<A,B>
    type ExpectedDiff = 
        ['A+', 'c', boolean]
        | ['B+', 'd', '0' | '1' | '2']

    expectType<ExpectedDiff>({} as Diff)
}

/**
 * test: A and B have the same property with different types
*/
{  
    type A = {
        a: number
    }
    type B = {
        a: string
    }

    type Diff = InspectDifferences<A,B>
    type ExpectedDiff = 
        ['!=', 'a', number, string]

    expectType<ExpectedDiff>({} as Diff)
}

/**
 * test: A and B have three same properties with different types
*/
{  
    type A = {
        a: number
        b: string
        c: boolean
    }
    type B = {
        a: string
        b: boolean
        c: number
    }

    type Diff = InspectDifferences<A,B>
    type ExpectedDiff = 
        ['!=', 'a', number, string]
        | ['!=', 'b', string, boolean]
        | ['!=', 'c', boolean, number]

    expectType<ExpectedDiff>({} as Diff)
}

/**
 * test: A has a nested property that B doesn't
*/
{  
    type A = {
        a: number
        b: {
            c: string
        }
    }
    type B = {
        a: number
        b: {}
    }

    type Diff = InspectDifferences<A,B>
    type ExpectedDiff = 
        ['A+', 'b.c', string]

    expectType<ExpectedDiff>({} as Diff)
}

/**
 * test: B has a nested property that A doesn't
*/
{  
    type A = {
        a: number
        b: {}
    }
    type B = {
        a: number
        b: {
            c: string
        }
    }

    type Diff = InspectDifferences<A,B>
    type ExpectedDiff = 
        ['B+', 'b.c', string]

    expectType<ExpectedDiff>({} as Diff)
}

/**
 * test: A has a deeply-nested property that B doesn't
*/
{  
    type A = {
        a: number
        b: {
            c: {
                d: string
            }
        }
    }
    type B = {
        a: number
        b: {}
    }

    type Diff = InspectDifferences<A,B>
    type ExpectedDiff = 
        ['A+', 'b.c', { d: string }]

    expectType<ExpectedDiff>({} as Diff)
}

/**
 * test: A has a deeply-nested property that B partially does
*/
{  
    type A = {
        a: number
        b: {
            c: {
                d: string
            }
        }
    }
    type B = {
        a: number
        b: {
            c: {}
        }
    }

    type Diff = InspectDifferences<A,B>
    type ExpectedDiff = 
        ['A+', 'b.c.d', string]

    expectType<ExpectedDiff>({} as Diff)
}

/**
 * test: A has a property that's an array on B
*/
{  
    type A = {
        a: number
    }
    type B = {
        a: number[]
    }

    type Diff = InspectDifferences<A,B>
    type ExpectedDiff = 
        ['!=', 'a', number, number[]]

    expectType<ExpectedDiff>({} as Diff)
}

/**
 * test: A has an object property that's an array on B
*/
{  
    type A = {
        a: {
            b: string
        }
    }
    type B = {
        a: {
            b: string
        }[]
    }

    type Diff = InspectDifferences<A,B>
    type ExpectedDiff = 
        ['!=', 'a', { b: string }, { b: string }[]]

    expectType<ExpectedDiff>({} as Diff)
}