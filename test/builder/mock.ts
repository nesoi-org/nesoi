// import { NesoiDate } from "~/engine/data/date";
// import { $Bucket } from "~/elements/entities/bucket/bucket.schema";
// import { $BucketGraph, $BucketGraphLink } from "~/elements/entities/bucket/graph/bucket_graph.schema";
// import { $BucketModel, $BucketModelField } from "~/elements/entities/bucket/model/bucket_model.schema";
// import { $BucketView, $BucketViewField } from "~/elements/entities/bucket/view/bucket_view.schema";
// import { $Constants } from "~/elements/entities/constants/constants.schema";
// import { $Module } from "~/schema";
// import { $Externals } from "~/elements/blocks/externals/externals.schema";
// import { $Dependency } from "~/engine/dependency";

// export const $ModuleFixture: $Module = {
//     '#authn': {} as any,
//     '#input': {} as any,
//     externals: new $Externals(''),
//     constants: new $Constants(''),
//     name: 'test_module',
//     buckets: {},
//     controllers: {},
//     jobs: {},
//     machines: {},
//     messages: {},
//     queues: {},
//     resources: {}    
// };

// export const $BucketModelFixture = new $BucketModel({
//     id: new $BucketModelField('id', 'int', 'id', false, true),
//     prop_boolean: new $BucketModelField('prop_boolean', 'boolean', 'prop_boolean', false, true),
//     prop_date: new $BucketModelField('prop_date', 'date', 'prop_date', false, true),
//     prop_datetime: new $BucketModelField('prop_datetime', 'datetime', 'prop_datetime', false, true),
//     prop_enum: new $BucketModelField('prop_enum', 'enum', 'prop_enum', false, true, { options:[ 'a', 'b', 'c' ] }),
//     // prop_file: new $BucketModelField('prop_file', 'file', 'prop_file', false, true),
//     prop_float: new $BucketModelField('prop_float', 'float', 'prop_float', false, true),
//     prop_int: new $BucketModelField('prop_int', 'int', 'prop_int', false, true),
//     prop_string: new $BucketModelField('prop_string', 'string', 'prop_string', false, true),
//     prop_int_optional: new $BucketModelField('prop_int_optional', 'int', 'prop_int_optional', false, false),
//     prop_boolean_array: new $BucketModelField('prop_boolean_array', 'boolean', 'prop_boolean_array', true, true),
//     prop_int_array_optional: new $BucketModelField('prop_int_array_optional', 'int', 'prop_int_array_optional', true, false),
//     prop_obj: new $BucketModelField('prop_obj', 'obj', 'prop_obj', false, true, undefined, undefined, {
//         deep_prop_int: new $BucketModelField('deep_prop_int', 'int', 'deep_prop_int', false, true),
//         deep_prop_string: new $BucketModelField('deep_prop_string', 'string', 'deep_prop_string', false, true),
//     }),
//     prop_obj_array: new $BucketModelField('prop_obj_array', 'obj', 'prop_obj_array', true, true, undefined, undefined, {
//         deep_prop_boolean: new $BucketModelField('deep_prop_boolean', 'boolean', 'deep_prop_boolean', false, true),
//         deep_prop_date: new $BucketModelField('deep_prop_date', 'date', 'deep_prop_date', false, true),
//     }),
//     prop_obj_array_optional: new $BucketModelField('prop_obj_array_optional', 'obj', 'prop_obj_array_optional', true, false, undefined, undefined, {
//         deep_prop_enum: new $BucketModelField('deep_prop_enum', 'enum', 'deep_prop_enum', false, true, { options: [ 'a', 'b', 'c' ] }),
//     }),
// })

// const $TestBucketDependency = new $Dependency('test_module', 'bucket', 'test_bucket')

// export const $BucketGraphFixture = new $BucketGraph({
//     aggr_one: new $BucketGraphLink('aggr_one', 'aggr_one', $TestBucketDependency, 'aggregation', false, 'self', '', ''),
//     aggr_many: new $BucketGraphLink('aggr_many', 'aggr_many', $TestBucketDependency, 'aggregation', true, 'self', '', ''),
//     comp_one: new $BucketGraphLink('comp_one', 'comp_one', $TestBucketDependency, 'composition', false, 'self', '', ''),
//     comp_many: new $BucketGraphLink('comp_many', 'comp_many', $TestBucketDependency, 'composition', true, 'self', '', ''),
// })

// export const $BucketViewFixture = new $BucketView('test_view',{
//     model_float: new $BucketViewField('model_float', 'model', 'float', 'model_float', false, true, { model: { key: 'name' } }),
//     model_int: new $BucketViewField('model_int', 'model', 'int', 'model_int', false, true, { model: { key: 'name' } }),
//     model_int_optional: new $BucketViewField('model_int_optional', 'model', 'int', 'model_int_optional', false, false, { model: { key: 'name' } }),
//     model_int_array_optional: new $BucketViewField('model_int_array_optional', 'model', 'int', 'model_int_array_optional', true, false, { model: { key: 'name' } }),
// })

// export const $BucketFixture = new $Bucket(
//     'test_module',
//     'test_bucket',
//     'Test Bucket',
//     $BucketModelFixture,
//     $BucketGraphFixture,
//     {
//         'test_view': $BucketViewFixture
//     }
// )

// export const Data = {
//     1: {
//         id: 1,
//         prop_boolean: true,
//         prop_date: new NesoiDate(),
//         prop_datetime: new NesoiDate(),
//         prop_enum: 'a',
//         prop_float: 1.23,
//         prop_int: 999,
//         prop_string: 'something',
//         prop_int_optional: undefined,
//         prop_boolean_array: [true, false, false],
//         prop_int_array_optional: [],
//         prop_obj: {
//             deep_prop_int:123,
//             deep_prop_string: 'something',
//         },
//         prop_obj_array: {
//             deep_prop_boolean: true,
//             deep_prop_date: new NesoiDate(),
//         },
//         prop_obj_array_optional: [
//             {
//                 deep_prop_enum: 'b',
//             },
//             {
//                 deep_prop_enum: 'c',
//             }
//         ],       
//     },
//     2: {
//         id: 2,
//         prop_boolean: false,
//         prop_date: new NesoiDate(),
//         prop_datetime: new NesoiDate(),
//         prop_enum: 'b',
//         prop_float: 2.34,
//         prop_int: 888,
//         prop_string: '5omething',
//         prop_int_optional: 111,
//         prop_boolean_array: [true, true],
//         prop_int_array_optional: undefined,
//         prop_obj: {
//             deep_prop_int: 321,
//             deep_prop_string: 's0mething',
//         },
//         prop_obj_array: {
//             deep_prop_boolean: false,
//             deep_prop_date: new NesoiDate(),
//         },
//         prop_obj_array_optional: undefined,
//     },
//     3: {
//         id: 3,
//         prop_boolean: true,
//         prop_date: new NesoiDate(),
//         prop_datetime: new NesoiDate(),
//         prop_enum: 'c',
//         prop_float: 3.45,
//         prop_int: 777,
//         prop_string: 'someth1ng',
//         prop_int_optional: undefined,
//         prop_boolean_array: [],
//         prop_int_array_optional: [1, 8 ,9],
//         prop_obj: {
//             deep_prop_int: 456,
//             deep_prop_string: 'somethin6',
//         },
//         prop_obj_array: {
//             deep_prop_boolean: false,
//             deep_prop_date: new NesoiDate(),
//         },
//         prop_obj_array_optional: [
//             {
//                 deep_prop_enum: '1',
//             }
//         ],       
//     },
// }