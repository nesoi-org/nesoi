import { Log } from '~/engine/util/log'
import { Mock } from '../elements/mock';
import { $BucketModel, $BucketModelField } from '~/elements/entities/bucket/model/bucket_model.schema';
import { makeParseFn } from '~/compiler/codegen/bucket.codegen';

Log.level = 'off';

describe('Bucket Codegen: Parse', () => {

    describe('Primitives', () => {

        it('boolean', () =>  {    
            const schema = new $BucketModel({
                id: new $BucketModelField('id','id','int','id',true),
                f_boolean: new $BucketModelField('f_boolean','f_boolean','boolean','f_boolean',true)
            });
            const parsed = makeParseFn(schema)({
                id: Mock.Int,
                f_boolean: Mock.Bool,
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                f_boolean: Mock.Bool
            })
        })

        it('date', () =>  {    
            const schema = new $BucketModel({
                id: new $BucketModelField('id','id','int','id',true),
                f_date: new $BucketModelField('f_date','f_date','date','f_date',true)
            });
            const parsed = makeParseFn(schema)({
                id: Mock.Int,
                f_date: Mock.Date.toISO(),
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                f_date: Mock.Date
            })
        })

        it('datetime', () =>  {    
            const schema = new $BucketModel({
                id: new $BucketModelField('id','id','int','id',true),
                f_datetime: new $BucketModelField('f_datetime','f_datetime','datetime','f_datetime',true)
            });
            const parsed = makeParseFn(schema)({
                id: Mock.Int,
                f_datetime: Mock.Datetime.toISO(),
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                f_datetime: Mock.Datetime
            })
        })

        it('duration', () =>  {    
            const schema = new $BucketModel({
                id: new $BucketModelField('id','id','int','id',true),
                f_duration: new $BucketModelField('f_duration','f_duration','duration','f_duration',true)
            });
            const parsed = makeParseFn(schema)({
                id: Mock.Int,
                f_duration: Mock.Duration.toString(),
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                f_duration: Mock.Duration
            })
        })

        it('decimal', () =>  {    
            const schema = new $BucketModel({
                id: new $BucketModelField('id','id','int','id',true),
                f_decimal: new $BucketModelField('f_decimal','f_decimal','decimal','f_decimal',true)
            });
            const parsed = makeParseFn(schema)({
                id: Mock.Int,
                f_decimal: Mock.Decimal.toString(),
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                f_decimal: Mock.Decimal
            })
        })

        it('enum', () =>  {    
            const schema = new $BucketModel({
                id: new $BucketModelField('id','id','int','id',true),
                f_enum: new $BucketModelField('f_enum','f_enum','enum','f_enum',true, {
                    enum: { options: { 'a': {}, 'b': {} }}
                }),
            });
            const parsed = makeParseFn(schema)({
                id: Mock.Int,
                f_enum: 'a',
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                f_enum: 'a'
            })
        })

        // it('file', () =>  {
        //     // ...
        // })

        it('float', () =>  {    
            const schema = new $BucketModel({
                id: new $BucketModelField('id','id','int','id',true),
                f_float: new $BucketModelField('f_float','f_float','float','f_float',true)
            });
            const parsed = makeParseFn(schema)({
                id: Mock.Int,
                f_float: Mock.Float,
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                f_float: Mock.Float
            })
        })

        it('int', () =>  {    
            const schema = new $BucketModel({
                id: new $BucketModelField('id','id','int','id',true),
                f_int: new $BucketModelField('f_int','f_int','int','f_int',true)
            });
            const parsed = makeParseFn(schema)({
                id: Mock.Int,
                f_int: Mock.Int,
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                f_int: Mock.Int
            })
        })

        it('literal', () =>  {    
            const schema = new $BucketModel({
                id: new $BucketModelField('id','id','int','id',true),
                f_literal: new $BucketModelField('f_literal','f_literal','literal','f_literal',true, {
                    literal: { template: 'abc' }
                })
            });
            const parsed = makeParseFn(schema)({
                id: Mock.Int,
                f_literal: 'abc',
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                f_literal: 'abc'
            })
        })

        it('regex', () =>  {    
            const schema = new $BucketModel({
                id: new $BucketModelField('id','id','int','id',true),
                f_regex: new $BucketModelField('f_regex','f_regex','regex','f_regex',true, {
                    regex: { template: 'abc' }
                })
            });
            const parsed = makeParseFn(schema)({
                id: Mock.Int,
                f_regex: '!abc!',
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                f_regex: '!abc!'
            })
        })

        it('string', () =>  {    
            const schema = new $BucketModel({
                id: new $BucketModelField('id','id','int','id',true),
                f_string: new $BucketModelField('f_string','f_string','string','f_string',true)
            });
            const parsed = makeParseFn(schema)({
                id: Mock.Int,
                f_string: Mock.String,
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                f_string: Mock.String
            })
        })

    })

    describe('Optional', () => {

        it('defined', () =>  {    
            const schema = new $BucketModel({
                id: new $BucketModelField('id','id','int','id',true),
                name: new $BucketModelField('name','name','string','name',false)
            });
            const parsed = makeParseFn(schema)({
                id: Mock.Int,
                name: Mock.String,
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                name: Mock.String
            })
        })

        it('undefined', () =>  {    
            const schema = new $BucketModel({
                id: new $BucketModelField('id','id','int','id',true),
                name: new $BucketModelField('name','name','string','name',false)
            });
            const parsed = makeParseFn(schema)({
                id: Mock.Int,
            })
            expect(parsed).toEqual({
                id: Mock.Int,
            })
        })

    })

    describe('Obj', () => {

        it('simple', () =>  {    
            const schema = new $BucketModel({
                id: new $BucketModelField('id','id','int','id',true),
                coord: new $BucketModelField('coord','coord','obj','coord',true,undefined,undefined,{
                    x: new $BucketModelField('x','coord.x','int','coord x',true),
                    y: new $BucketModelField('y','coord.y','int','coord y',true)                    
                })
            });
            const parsed = makeParseFn(schema)({
                id: Mock.Int,
                coord: { x: 1, y: 2 }
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                coord: { x: 1, y: 2 }
            })
        })

    })

    describe('List', () => {

        it('simple', () =>  {    
            const schema = new $BucketModel({
                id: new $BucketModelField('id','id','int','id',true),
                data: new $BucketModelField('data','data','list','data',true,undefined,undefined,{
                    '#': new $BucketModelField('#','data.#','int','data #',true),                 
                })
            });
            const parsed = makeParseFn(schema)({
                id: Mock.Int,
                data: [1,2,3]
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                data: [1,2,3]
            })
        })

    })

    describe('Dict', () => {

        it('simple', () =>  {    
            const schema = new $BucketModel({
                id: new $BucketModelField('id','id','int','id',true),
                data: new $BucketModelField('data','data','dict','data',true,undefined,undefined,{
                    '#': new $BucketModelField('#','data.#','int','data #',true),                 
                })
            });
            const parsed = makeParseFn(schema)({
                id: Mock.Int,
                data: {a:1, b:2, c:3}
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                data: {a:1, b:2, c:3}
            })
        })

    })

    // it('should fail to copy object with corrupted list', () => 
    //     expectBucket($ => $
    //         .model($ => ({
    //             id: $.int,
    //             data: $.list($.int)
    //         }))
    //     )
    //         .toParseOne({
    //             id: Mock.Int,
    //             data: ['a',2,3]
    //         })
    //         .butFail(NesoiError.Bucket.Model.CorruptedData)
    // )

    // it('should parse object with list of obj', () => 
    //     expectBucket($ => $
    //         .model($ => ({
    //             id: $.int,
    //             coords: $.list($.obj({
    //                 x: $.int,
    //                 y: $.int,
    //             }))
    //         }))
    //     )
    //         .toParseOne({
    //             id: Mock.Int,
    //             coords: [
    //                 {x: 1, y: 2},
    //                 {x: 3, y: 4},
    //             ]
    //         })
    //         .toEqual({
    //             id: Mock.Int,
    //             coords: [
    //                 {x: 1, y: 2},
    //                 {x: 3, y: 4},
    //             ]
    //         })
    // )


    // it('should parse object with list of dict of obj', () => 
    //     expectBucket($ => $
    //         .model($ => ({
    //             id: $.int,
    //             coords: $.list($.dict($.obj({
    //                 x: $.int,
    //                 y: $.int,
    //             })))
    //         }))
    //     )
    //         .toParseOne({
    //             id: Mock.Int,
    //             coords: [
    //                 { 'a': {x: 1, y: 2}, 'b': {x: 3, y: 4}, },
    //                 { 'c': {x: 5, y: 6}, 'd': {x: 7, y: 8}, },
    //             ]
    //         })
    //         .toEqual({
    //             id: Mock.Int,
    //             coords: [
    //                 { 'a': {x: 1, y: 2}, 'b': {x: 3, y: 4}, },
    //                 { 'c': {x: 5, y: 6}, 'd': {x: 7, y: 8}, },
    //             ]
    //         })
    // )


    // it('should fail to copy object with corrupted dict', () => 
    //     expectBucket($ => $
    //         .model($ => ({
    //             id: $.int,
    //             data: $.dict($.int)
    //         }))
    //     )
    //         .toParseOne({
    //             id: Mock.Int,
    //             data: { a: 'a', b: 2, c: 3 }
    //         })
    //         .butFail(NesoiError.Bucket.Model.CorruptedData)
    // )

    // it('should parse object with dict of obj', () => 
    //     expectBucket($ => $
    //         .model($ => ({
    //             id: $.int,
    //             coords: $.dict($.obj({
    //                 x: $.int,
    //                 y: $.int,
    //             }))
    //         }))
    //     )
    //         .toParseOne({
    //             id: Mock.Int,
    //             coords: {
    //                 'a': {x: 1, y: 2},
    //                 'b': {x: 3, y: 4},
    //             }
    //         })
    //         .toEqual({
    //             id: Mock.Int,
    //             coords: {
    //                 'a': {x: 1, y: 2},
    //                 'b': {x: 3, y: 4},
    //             }
    //         })
    // )

    // it('should parse object with dict of list of obj', () => 
    //     expectBucket($ => $
    //         .model($ => ({
    //             id: $.int,
    //             coords: $.dict($.list($.obj({
    //                 x: $.int,
    //                 y: $.int,
    //             })))
    //         }))
    //     )
    //         .toParseOne({
    //             id: Mock.Int,
    //             coords: {
    //                 'a': [{x: 1, y: 2}, {x: 3, y: 4}],
    //                 'b': [{x: 5, y: 6}, {x: 7, y: 8}]
    //             }
    //         })
    //         .toEqual({
    //             id: Mock.Int,
    //             coords: {
    //                 'a': [{x: 1, y: 2}, {x: 3, y: 4}],
    //                 'b': [{x: 5, y: 6}, {x: 7, y: 8}]
    //             }
    //         })
    // )

    // it('should parse object with union', () => 
    //     expectBucket($ => $
    //         .model($ => ({
    //             id: $.int,
    //             union: $.union(
    //                 $.obj({ a: $.int, b: $.string }),
    //                 $.obj({ a: $.int, c: $.string }),
    //             )
    //         }))
    //     )
    //         .toParseOne({
    //             id: Mock.Int,
    //             union: {
    //                 a: 1,
    //                 c: 'c'
    //             }
    //         })
    //         .toEqual({
    //             id: Mock.Int,
    //             union: {
    //                 a: 1,
    //                 c: 'c'
    //             }
    //         })
    // )

    // it('should parse object with union (2)', () => 
    //     expectBucket($ => $
    //         .model($ => ({
    //             id: $.int,
    //             union: $.union(
    //                 $.obj({ a: $.int, b: $.string, c: $.string }),
    //                 $.obj({ a: $.int, c: $.string }),
    //             )
    //         }))
    //     )
    //         .toParseOne({
    //             id: Mock.Int,
    //             union: {
    //                 a: 1,
    //                 c: 'c'
    //             }
    //         })
    //         .toEqual({
    //             id: Mock.Int,
    //             union: {
    //                 a: 1,
    //                 c: 'c'
    //             }
    //         })
    // )
})
