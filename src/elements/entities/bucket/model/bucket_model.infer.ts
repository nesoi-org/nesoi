import { MergeUnion } from '~/engine/util/type';
import { BucketModelDef } from './bucket_model.builder';
import { BucketModelFieldBuilder, BucketModelFieldBuilders } from './bucket_model_field.builder';

export type BucketModelObjInfer<
    Builders extends BucketModelFieldBuilders<any>
> = {
    [K in keyof Builders]: Builders[K] extends BucketModelFieldBuilder<any, any, any, infer X>
        ? X
        : BucketModelObjInfer<Builders[K] & BucketModelFieldBuilders<any>>
}

export type BucketModelInfer<
    Def extends BucketModelDef<any, any>
> = BucketModelObjInfer<ReturnType<Def>>

/* */

export type BucketFieldpathObjInfer<
    Builders extends BucketModelFieldBuilders<any>,
    Prefix extends string
> = MergeUnion<{
    [K in keyof Builders]: Builders[K] extends BucketModelFieldBuilder<any, any, any, any, infer X>
        ? { [J in keyof X as `${Prefix}${K & string}${J & string}`]: X[J]}
        // {} syntax doesnt support dynamic fieldpaths
        : never//BucketFieldpathObjInfer<Builders[K] & BucketModelFieldBuilders<any>, `${Prefix}.${K}`>
}[keyof Builders]>

export type BucketFieldpathInfer<
    Def extends BucketModelDef<any, any>,
    Prefix extends string = ''
> = BucketFieldpathObjInfer<ReturnType<Def>, Prefix>