import type { BucketModelDef } from './bucket_model.builder';
import type { BucketModelFieldBuilders } from './bucket_model_field.builder';

export type BucketModelObjInfer<
    Fields extends BucketModelFieldBuilders<any>,
    Prefix = ''
> = {
    // Required fields
    [K in keyof Fields as 
        Fields[K]['#optional'][1] extends true ? never : `${Prefix&string}${K&string}`
    ]: Fields[K]['#output']
} & {
    // Optional fields
    [K in keyof Fields as 
        Fields[K]['#optional'][1] extends true ? `${Prefix&string}${K&string}` : never
    ]?: Fields[K]['#output']
}

export type BucketModelInfer<
    Def extends BucketModelDef<any, any>
> = BucketModelObjInfer<ReturnType<Def>>

export type IfEver<PossiblyNever, T> = PossiblyNever extends never ? never : T

/* ViewModelpath */

// This type picks * as a single element, so the view operations
// work properly.

type __TypeOfViewModelpath_List<T extends any[], K> = K extends '*'|`$${number}`
    ? T[number]
    : never

type __TypeOfViewModelpath_NoList<T, K> = K extends '*'|`$${number}`
    ? T[keyof T]
    : T[K & keyof T]

type __TypeOfViewModelpath<T, X> =
    T extends any[] ? __TypeOfViewModelpath_List<T, X>
    : T extends object ? __TypeOfViewModelpath_NoList<T, X>
    : never

export type TypeOfViewModelpath<Obj, Modelpath> =
    Modelpath extends `${infer X}.${infer Y}`
        ? TypeOfViewModelpath<__TypeOfViewModelpath<Obj, X>, Y>
        : __TypeOfViewModelpath<Obj, Modelpath>

type A = {
    a: string
    b: boolean
    c: {
        d: number
        e: string[]
    }
    f: {
        g: boolean
    }[]
}

type B = TypeOfViewModelpath<A, 'c.$0'>

        
/* QueryModelpath */

type __TypeOfQueryModelpath_List<T extends any[], K> = K extends '*'|`$${number}`
    ? T[number]
    : never

type __TypeOfQueryModelpath_NoList<T, K> = K extends '*'|`$${number}`
    ? T[keyof T]
    : T[K & keyof T]

type __TypeOfQueryModelpath<T, X> =
    T extends any[] ? __TypeOfQueryModelpath_List<T, X>
    : T extends object ? __TypeOfQueryModelpath_NoList<T, X>
    : never
    
export type TypeOfQueryModelpath<Obj, QueryModelpath> =
    QueryModelpath extends `${infer X}.${infer Y}`
        ? TypeOfQueryModelpath<__TypeOfQueryModelpath<Obj, X>, Y>
        : __TypeOfQueryModelpath<Obj, QueryModelpath>
    
