;
import type { BucketViewFieldBuilder, BucketViewFieldBuilders } from './bucket_view_field.builder';

export type $BucketViewFieldsInfer<Builders extends BucketViewFieldBuilders<any, any, any>> = {
    [K in keyof Builders]: 
        // Infer builder type
        Builders[K] extends BucketViewFieldBuilder<any, any, any, any, infer Value, any>
            ? $BucketViewField & {
                '#data': Value
            }
            : never
}

export type $BucketViewDataInfer<Builders extends BucketViewFieldBuilders<any, any, any>> = 
    {
        [K in keyof Builders]: 
            Builders[K] extends BucketViewFieldBuilder<any, any, any, any, infer Value, any>
                ? Value
                : never
    }

// This is used to allow dynamic typing of an
// extended view. It infers a builder type
// from a given input and output. 
// It's impossible to rebuild the view structure,
// since we can't know how far down the type tree
// we must stop (a group of fields != a field that's typed as an object)
// So, this returns only the surface level, which
// should be enough for most cases.
export type $BucketViewFieldBuilderInfer<
    Data
> = {
    [K in keyof Data]: BucketViewFieldBuilder<any, any, any, any, Data[K], any>
}