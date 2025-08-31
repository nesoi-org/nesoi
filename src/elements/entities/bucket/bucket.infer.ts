import { $BucketViewField, $BucketViewFields } from './view/bucket_view.schema';
import { BucketViewFieldBuilder, BucketViewFieldBuilders } from './view/bucket_view_field.builder';

export type $BucketViewFieldsInfer<Builder extends BucketViewFieldBuilders> = 
// Tree is a generator function (generally from .extends)
Builder extends (...args: any[]) => $BucketViewFields
    ? ReturnType<Builder>
    // Tree
    : {
        [K in keyof Builder]: 
            // Field is another tree, recurse
            Builder[K] extends BucketViewFieldBuilders
                ? ($BucketViewField & { '#data': $BucketViewFieldsInfer<Builder[K]> })

                // Field is a builder, infer type
                : Builder[K] extends BucketViewFieldBuilder<any, any, any>
                    ? $BucketViewField & {
                        '#data': Builder[K] extends BucketViewFieldBuilder<infer X, any>
                            ? X
                            : never
                    }
                    : never
    }

export type $BucketViewDataInfer<Builder extends BucketViewFieldBuilders> = 
    {
        [K in keyof Builder]: 
            // Field is another tree, recurse
            Builder[K] extends BucketViewFieldBuilders
                ? $BucketViewDataInfer<Builder[K]>

                // Field is a builder, infer type
                : Builder[K] extends BucketViewFieldBuilder<infer X, any>
                    ? X
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
    [K in keyof Data]: BucketViewFieldBuilder<Data[K], any>
}

/**
 * [Fieldpaths]
 * 
 * The code below works but is very slow.
 * It's here for reference and should be deleted in the future.
 * It's been replaced by a generic Fieldpath on the builder.
 */

// type IsAnyOrUnknown<T> = Exclude<any extends T ? true : false, true> extends never ? true : false

// type $BucketFieldpathInferStep<
//     Data extends Record<string, Record<string, any> | any[]>
// > = MergeUnion<{
//     [P in keyof Data]: 
//         // If the prefixed object is any or unknown, ignore it
//         IsAnyOrUnknown<Data[P]> extends true ? never

//         : NonNullable<Data[P]> extends object ?
//             // If the prefixed object is a list, return
//             // an object where the key ends with '*' and it's
//             // a single element of the list
//             NonNullable<Data[P]> extends any[] ? { [_ in `${P & string}*`]: ListItem<Data[P]> }

//             // If the prefixed object is a dict, return
//             // an object where the key ends with '*' and it's
//             // a single element of the dict
//             : string extends keyof NonNullable<Data[P]> ? { [_ in `${P & string}*`]: DictItem<Data[P]> }

//             // If it's an object, add it to the union
//             // based on the type
//             : {
//                 [K in keyof NonNullable<Data[P]>]:
//                     IsAnyOrUnknown<NonNullable<Data[P][K]>> extends true
//                         // any
//                         ? {[_ in `${P & string}${K & string}`]: any}
//                         : NonNullable<Data[P][K]> extends any[]
//                             // array (prop and prop.*)
//                             ? (
//                                 {[_ in `${P & string}${K & string}`]: ObjItem<Data[P], K>}
//                                 | { [_ in `${P & string}${K & string}.*`]: ListItem<Data[P][K]> }
//                             )
//                             // dict (prop and prop.*)
//                             : string extends keyof NonNullable<Data[P][K]>
//                                 ? (
//                                     {[_ in `${P & string}${K & string}`]: ObjItem<Data[P], K>}
//                                     | { [_ in `${P & string}${K & string}.*`]: DictItem<Data[P][K]> }
//                                 )
//                                 // simple type
//                                 : {[_ in `${P & string}${K & string}`]: ObjItem<Data[P], K>}
//             }[keyof NonNullable<Data[P]>]
        
//         // Primitive
//         : never
//         // : { [_ in (P extends `${infer X}.` ? X : P)]: Data[P] }

// }[keyof Data]>

// type $BucketFieldpathInferNext<
//     Data,
//     ObjectFields extends object = {
//         [K in keyof Data as (
//             // Exclude injected keys, to avoid duplicate nexts
//             Data[`${K & string}.*` & keyof Data] extends never ?
//                 // any/unknown, not an object
//                 IsAnyOrUnknown<Data[K]> extends true ?
//                     never
//                 : NonNullable<Data[K]> extends object ?
//                     NonNullable<Data[K]> extends NesoiDate ? never
//                     : `${K & string}.`
//                 : never
//             : never
//         )]: Data[K]
//     }
// > = ObjectFields[keyof ObjectFields] extends never ? never : ObjectFields

// /**
//  * Infer the #fieldpaths from a type
//  */
// export type $BucketFieldpathInfer<
//     Data extends Record<string, any>,
//     Input extends Record<string, any> = { '': Data },
//     Step extends object = $BucketFieldpathInferStep<Input>,
//     Next extends Record<string, any> = $BucketFieldpathInferNext<Step>
// // > = {
// //     step: Step,
// //     // next: Next
// //     next: Next extends never ? never : $BucketFieldpathInfer<any, Next>
// // }
// > = MergeUnion<{
//     step: Step,
//     next: Next extends never ? never : $BucketFieldpathInfer<any, Next>
// }['step'|'next']>