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

/* Modelpath */


type __TypeOfModelpath_List<T extends any[], K> = K extends '*'|`$${number}`
    ? T[number]
    : never

type __TypeOfModelpath_NoList<T, K> = K extends '*'|`$${number}`
    ? T[keyof T]
    : T[K & keyof T]

type __TypeOfModelpath<T, X> =
    T extends any[] ? __TypeOfModelpath_List<T, X>
    : T extends object ? __TypeOfModelpath_NoList<T, X>
    : never

export type TypeOfModelpath<Obj, Modelpath> =
    Modelpath extends `${infer X}.${infer Y}`
        ? TypeOfModelpath<__TypeOfModelpath<Obj, X>, Y>
        : __TypeOfModelpath<Obj, Modelpath>

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

        
/* Querypath */

type __TypeOfQuerypath_List<T extends any[], K> = K extends '*'|`$${number}`
    ? T[number]
    : never

type __TypeOfQuerypath_NoList<T, K> = K extends '*'|`$${number}`
    ? T[keyof T]
    : T[K & keyof T]

type __TypeOfQuerypath<T, X> =
    T extends any[] ? __TypeOfQuerypath_List<T, X>
    : T extends object ? __TypeOfQuerypath_NoList<T, X>
    : never
    
export type TypeOfQuerypath<Obj, Querypath> =
    Querypath extends `${infer X}.${infer Y}`
        ? TypeOfQuerypath<__TypeOfQuerypath<Obj, X>, Y>
        : __TypeOfQuerypath<Obj, Querypath>
    
