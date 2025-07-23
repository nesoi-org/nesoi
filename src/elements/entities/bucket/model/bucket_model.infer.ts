import { UnionToIntersection } from '~/engine/util/type';
import { BucketModelDef } from './bucket_model.builder';
import { AnyBucketModelFieldBuilder, BucketModelFieldBuilders } from './bucket_model_field.builder';

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

/* Modelpath */

type BucketModelpathRawInfer<
    Builders extends BucketModelFieldBuilders<any>
> = UnionToIntersection<{
    [K in keyof Builders]: {
        [J in keyof Builders[K]['#modelpath'] as `${K & string}${J & string}`]: Builders[K]['#modelpath'][J]
    }
}[keyof Builders]>

export type BucketModelpathObjInfer<
    Builders extends BucketModelFieldBuilders<any>
> = UnionToIntersection<{
    [K in keyof Builders]: {
        [J in keyof Builders[K]['#modelpath'] as `.${K & string}${J & string}`]: Builders[K]['#modelpath'][J]
    }
}[keyof Builders]>

export type BucketModelpathListInfer<
    Builder extends AnyBucketModelFieldBuilder
> = {
    [J in keyof Builder['#modelpath'] as `.*${J & string}`|`.$${number}${J & string}`|`.${number}${J & string}`]: Builder['#modelpath'][J]
}

export type BucketModelpathDictInfer<
    Builder extends AnyBucketModelFieldBuilder
> = {
    [J in keyof Builder['#modelpath'] as `.*${J & string}`|`.$${number}${J & string}`|`.${string}${J & string}`]: Builder['#modelpath'][J]
}

export type BucketModelpathUnionInfer<
    Builders extends AnyBucketModelFieldBuilder[]
> = Builders[0]['#modelpath'] | Builders[1]['#modelpath']

export type BucketModelpathInfer<
    Def extends BucketModelDef<any, any>
> = BucketModelpathRawInfer<ReturnType<Def>>


/* Querypath */

type BucketQuerypathRawInfer<
    Builders extends BucketModelFieldBuilders<any>
> = {
    [K in keyof Builders]: {
        [J in keyof Builders[K]['#querypath'] as `${K & string}${J & string}`]: Builders[K]['#querypath'][J]
    }
}[keyof Builders]

export type BucketQuerypathObjInfer<
    Builders extends BucketModelFieldBuilders<any>
> = UnionToIntersection<{
    [K in keyof Builders]: {
        [J in keyof Builders[K]['#querypath'] as `.${K & string}${J & string}`]: Builders[K]['#querypath'][J]
    }
}[keyof Builders]>

export type BucketQuerypathListInfer<
    Builder extends AnyBucketModelFieldBuilder
> = {
    [J in keyof Builder['#querypath'] as `.${number|'#'|'*'}${J & string}`]: Builder['#querypath'][J]
}

export type BucketQuerypathDictInfer<
    Builder extends AnyBucketModelFieldBuilder
> = {
    [J in keyof Builder['#querypath'] as `.${string|'#'|'*'}${J & string}`]: Builder['#querypath'][J]
}

export type BucketQuerypathInfer<
    Def extends BucketModelDef<any, any>
> = UnionToIntersection<BucketQuerypathRawInfer<ReturnType<Def>>>