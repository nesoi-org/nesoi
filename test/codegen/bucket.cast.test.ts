import { Log } from '~/engine/util/log'
import { Mock } from '../elements/mock';
import { $BucketModel, $BucketModelField } from '~/elements/entities/bucket/model/bucket_model.schema';
import { CodegenErrorHandler } from '~/compiler/codegen/codegen';
import { BucketModel__cast } from '~/compiler/codegen/bucket_cast.codegen';

Log.level = 'off';

function make_model(schema: $BucketModel) {
    const model = {
        bucket: {
            module: 'test',
            alias: 'test',
        },
        cast: BucketModel__cast.make(schema)
    } as any;
    model._e = {
        data: CodegenErrorHandler.bucket_model.data.bind(model as any),
        required: CodegenErrorHandler.bucket_model.required.bind(model as any),
        type: CodegenErrorHandler.bucket_model.type.bind(model as any),
        union: CodegenErrorHandler.bucket_model.union.bind(model as any),
    }
    return model
}

describe('Bucket Codegen: Cast', () => {

    describe('Primitives + Nesoi', () => {
        
        // boolean
        
        const schema_boolean = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            f_boolean: new $BucketModelField('f_boolean','f_boolean','boolean','f_boolean',true)
        });
        
        it('boolean', () =>  {    
            const parsed = make_model(schema_boolean).cast({
                id: Mock.Int,
                f_boolean: Mock.Bool,
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                f_boolean: Mock.Bool
            })
        })
        
        it('boolean (wrong type)', () =>  {    
            expect(() => make_model(schema_boolean).cast({
                id: Mock.Int,
                f_boolean: Mock.String,
            }))
                .toThrow('[test::test#123] Value \'abcdef\' at \'f_boolean\' should be a boolean')
        })
        
        // date
        
        const schema_date = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            f_date: new $BucketModelField('f_date','f_date','date','f_date',true)
        });
        
        it('date', () =>  {    
            const parsed = make_model(schema_date).cast({
                id: Mock.Int,
                f_date: Mock.Date.toISO(),
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                f_date: Mock.Date
            })
        })
        
        it('date (wrong type)', () =>  {    
            expect(() => make_model(schema_date).cast({
                id: Mock.Int,
                f_date: Mock.Bool,
            }))
                .toThrow('[test::test#123] Value \'true\' at \'f_date\' should be a date')
        })
        
        it('date (invalid date)', () =>  {    
            expect(() => make_model(schema_date).cast({
                id: Mock.Int,
                f_date: Mock.String,
            }))
                .toThrow('[test::test#123] Value \'abcdef\' at \'f_date\' is not a valid ISO date')
        })
        
        // datetime
        
        const schema_datetime = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            f_datetime: new $BucketModelField('f_datetime','f_datetime','datetime','f_datetime',true)
        });
        
        it('datetime', () =>  {    
            const parsed = make_model(schema_datetime).cast({
                id: Mock.Int,
                f_datetime: Mock.Datetime.toISO(),
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                f_datetime: Mock.Datetime
            })
        })
        
        it('datetime (wrong type)', () =>  {    
            expect(() => make_model(schema_datetime).cast({
                id: Mock.Int,
                f_datetime: Mock.Bool,
            }))
                .toThrow('[test::test#123] Value \'true\' at \'f_datetime\' should be a datetime')
        })
        
        it('datetime (invalid datetime)', () =>  {    
            expect(() => make_model(schema_datetime).cast({
                id: Mock.Int,
                f_datetime: Mock.String,
            }))
                .toThrow('[test::test#123] Value \'abcdef\' at \'f_datetime\' is not a valid ISO datetime')
        })
        
        // duration
        
        const schema_duration = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            f_duration: new $BucketModelField('f_duration','f_duration','duration','f_duration',true)
        });
        
        it('duration', () =>  {    
            const parsed = make_model(schema_duration).cast({
                id: Mock.Int,
                f_duration: Mock.Duration.toString(),
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                f_duration: Mock.Duration
            })
        })
        
        it('duration (wrong type)', () =>  {    
            expect(() => make_model(schema_duration).cast({
                id: Mock.Int,
                f_duration: Mock.Bool,
            }))
                .toThrow('[test::test#123] Value \'true\' at \'f_duration\' should be a duration')
        })
        
        it('duration (invalid duration)', () =>  {    
            expect(() => make_model(schema_duration).cast({
                id: Mock.Int,
                f_duration: Mock.String,
            }))
                .toThrow('[test::test#123] Value \'abcdef\' at \'f_duration\' is not a valid duration')
        })
        
        // decimal
        
        const schema_decimal = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            f_decimal: new $BucketModelField('f_decimal','f_decimal','decimal','f_decimal',true)
        });
        it('decimal', () =>  {    
            const parsed = make_model(schema_decimal).cast({
                id: Mock.Int,
                f_decimal: Mock.Decimal.toString(),
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                f_decimal: Mock.Decimal
            })
        })
        
        it('decimal (wrong type)', () =>  {    
            expect(() => make_model(schema_decimal).cast({
                id: Mock.Int,
                f_decimal: Mock.Bool,
            }))
                .toThrow('[test::test#123] Value \'true\' at \'f_decimal\' should be a decimal')
        })
        
        it('decimal (invalid decimal)', () =>  {    
            expect(() => make_model(schema_decimal).cast({
                id: Mock.Int,
                f_decimal: Mock.String,
            }))
                .toThrow('[test::test#123] Value \'abcdef\' at \'f_decimal\' is not a valid decimal')
        })
        
        // enum
        
        const schema_enum = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            f_enum: new $BucketModelField('f_enum','f_enum','enum','f_enum',true, {
                enum: { options: { 'a': {}, 'b': {} }}
            }),
        });
        
        it('enum', () =>  {    
            const parsed = make_model(schema_enum).cast({
                id: Mock.Int,
                f_enum: 'a',
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                f_enum: 'a'
            })
        })
        
        it('enum (wrong type)', () =>  {    
            expect(() => make_model(schema_enum).cast({
                id: Mock.Int,
                f_enum: Mock.Bool,
            }))
                .toThrow('[test::test#123] Value \'true\' at \'f_enum\' should be a string')
        })
        
        it('enum (invalid option)', () =>  {    
            expect(() => make_model(schema_enum).cast({
                id: Mock.Int,
                f_enum: 'c',
            }))
                .toThrow('[test::test#123] Value \'c\' at \'f_enum\' is not a valid enum option. Options: a,b')
        })
        
        // file
        
        // it('file', () =>  {
        //     // ...
        // })
        
        // float
        
        const schema_float = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            f_float: new $BucketModelField('f_float','f_float','float','f_float',true)
        });
        
        it('float', () =>  {    
            const parsed = make_model(schema_float).cast({
                id: Mock.Int,
                f_float: Mock.Float,
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                f_float: Mock.Float
            })
        })
        
        it('float (wrong type)', () =>  {    
            expect(() => make_model(schema_float).cast({
                id: Mock.Int,
                f_float: Mock.Bool,
            }))
                .toThrow('[test::test#123] Value \'true\' at \'f_float\' should be a number')
        })
                
        // int
        
        const schema_int = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            f_int: new $BucketModelField('f_int','f_int','int','f_int',true)
        });
        
        it('int', () =>  {    
            const parsed = make_model(schema_int).cast({
                id: Mock.Int,
                f_int: Mock.Int,
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                f_int: Mock.Int
            })
        })
        
        it('int (wrong type)', () =>  {    
            expect(() => make_model(schema_int).cast({
                id: Mock.Int,
                f_int: Mock.Bool,
            }))
                .toThrow('[test::test#123] Value \'true\' at \'f_int\' should be a number')
        })
        
        it('int (float)', () =>  {    
            expect(() => make_model(schema_int).cast({
                id: Mock.Int,
                f_int: Mock.Float,
            }))
                .toThrow('[test::test#123] Value \'123.456\' at \'f_int\' should be integer')
        })

        it('int (neg float)', () =>  {    
            expect(() => make_model(schema_int).cast({
                id: Mock.Int,
                f_int: -Mock.Float,
            }))
                .toThrow('[test::test#123] Value \'-123.456\' at \'f_int\' should be integer')
        })
        
        // literal
        
        const schema_literal = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            f_literal: new $BucketModelField('f_literal','f_literal','literal','f_literal',true, {
                literal: { template: 'abc' }
            })
        });
        
        it('literal', () =>  {
            const parsed = make_model(schema_literal).cast({
                id: Mock.Int,
                f_literal: 'abc',
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                f_literal: 'abc'
            })
        })
        
        it('literal (wrong type)', () =>  {    
            expect(() => make_model(schema_literal).cast({
                id: Mock.Int,
                f_literal: Mock.Bool,
            }))
                .toThrow('[test::test#123] Value \'true\' at \'f_literal\' should be a string')
        })
        
        it('literal (wrong literal)', () =>  {    
            expect(() => make_model(schema_literal).cast({
                id: Mock.Int,
                f_literal: 'abcd',
            }))
                .toThrow('[test::test#123] Value \'abcd\' at \'f_literal\' should be \'abc\'')
        })
        
        // regex
        
        const schema_regex = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            f_regex: new $BucketModelField('f_regex','f_regex','regex','f_regex',true, {
                regex: { template: 'abc' }
            })
        });
        
        it('regex', () =>  {    
            const parsed = make_model(schema_regex).cast({
                id: Mock.Int,
                f_regex: '!abc!',
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                f_regex: '!abc!'
            })
        })
        
        it('regex (wrong type)', () =>  {    
            expect(() => make_model(schema_regex).cast({
                id: Mock.Int,
                f_regex: Mock.Bool,
            }))
                .toThrow('[test::test#123] Value \'true\' at \'f_regex\' should be a string')
        })
        
        it('regex (wrong regex)', () =>  {    
            expect(() => make_model(schema_regex).cast({
                id: Mock.Int,
                f_regex: 'ac',
            }))
                .toThrow('[test::test#123] Value \'ac\' at \'f_regex\' should match the regex /abc/')
        })
        
        // string
        
        const schema_string = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            f_string: new $BucketModelField('f_string','f_string','string','f_string',true)
        });
        
        it('string', () =>  {    
            const parsed = make_model(schema_string).cast({
                id: Mock.Int,
                f_string: Mock.String,
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                f_string: Mock.String
            })
        })
        
        it('string (wrong type)', () =>  {    
            expect(() => make_model(schema_string).cast({
                id: Mock.Int,
                f_string: Mock.Bool,
            }))
                .toThrow('[test::test#123] Value \'true\' at \'f_string\' should be a string')
        })
        
    })
        
    describe('Required/Optional', () => {
        
        it('required defined', () =>  {    
            const schema = new $BucketModel({
                id: new $BucketModelField('id','id','int','id',true),
                name: new $BucketModelField('name','name','string','name',true)
            });
            const parsed = make_model(schema).cast({
                id: Mock.Int,
                name: Mock.String,
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                name: Mock.String
            })
        })
        
        it('required undefined', () =>  {    
            const schema = new $BucketModel({
                id: new $BucketModelField('id','id','int','id',true),
                name: new $BucketModelField('name','name','string','name',true)
            });
            expect(() => make_model(schema).cast({
                id: Mock.Int,
            }))
                .toThrow('[test::test#123] Value at \'name\' is required')
        })
        
        it('optional defined', () =>  {    
            const schema = new $BucketModel({
                id: new $BucketModelField('id','id','int','id',true),
                name: new $BucketModelField('name','name','string','name',false)
            });
            const parsed = make_model(schema).cast({
                id: Mock.Int,
                name: Mock.String,
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                name: Mock.String
            })
        })
        
        it('optional undefined', () =>  {    
            const schema = new $BucketModel({
                id: new $BucketModelField('id','id','int','id',true),
                name: new $BucketModelField('name','name','string','name',false)
            });
            const parsed = make_model(schema).cast({
                id: Mock.Int,
            })
            expect(parsed).toEqual({
                id: Mock.Int,
            })
        })
        
    })
            
    describe('Obj', () => {
        
        const schema_primitives = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            coord: new $BucketModelField('coord','coord','obj','coord',true,undefined,undefined,{
                x: new $BucketModelField('x','coord.x','int','coord.x',true),
                y: new $BucketModelField('y','coord.y','int','coord.y',true)                    
            })
        });
                
        it('primitive fields', () =>  {    
            const parsed = make_model(schema_primitives).cast({
                id: Mock.Int,
                coord: { x: 1, y: 2 }
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                coord: { x: 1, y: 2 }
            })
        })
        
        it('primitives (wrong type)', () =>  {    
            expect(() => make_model(schema_primitives).cast({
                id: Mock.Int,
                coord: Mock.Bool,
            }))
                .toThrow('[test::test#123] Value \'true\' at \'coord\' should be a object')
        })
        
        it('primitives (wrong child type)', () =>  {    
            expect(() => make_model(schema_primitives).cast({
                id: Mock.Int,
                coord: { x: 1, y: 'b' }
            }))
                .toThrow('[test::test#123] Value \'b\' at \'coord.y\' should be a number')
        })
        
    })
        
    describe('List', () => {
        
        const schema_primitives = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            data: new $BucketModelField('data','data','list','data',true,undefined,undefined,{
                '#': new $BucketModelField('#','data.#','int','data #',true),                 
            })
        });
        
        it('primitives', () =>  {    
            const parsed = make_model(schema_primitives).cast({
                id: Mock.Int,
                data: [1,2,3]
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                data: [1,2,3]
            })
        })
        
        it('primitives (wrong type)', () =>  {    
            expect(() => make_model(schema_primitives).cast({
                id: Mock.Int,
                data: Mock.Bool,
            }))
                .toThrow('[test::test#123] Value \'true\' at \'data\' should be a list')
        })
        
        it('primitives (wrong child type)', () =>  {    
            expect(() => make_model(schema_primitives).cast({
                id: Mock.Int,
                data: [1,'b',3]
            }))
                .toThrow('[test::test#123] Value \'b\' at \'data.1\' should be a number')
        })
        
        const schema_objs = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            coords: new $BucketModelField('coords','coords','list','coords',true,undefined,undefined,{
                '#': new $BucketModelField('#','coords.#','obj','coords.#',true, undefined, undefined, {
                    x: new $BucketModelField('x','coords.#.x','int','coords.#.x',true),
                    y: new $BucketModelField('y','coords.#.y','int','coords.#.y',true)
                }),                 
            })
        });
        
        it('objs', () =>  {    
            const parsed = make_model(schema_objs).cast({
                id: Mock.Int,
                coords: [
                    { x:1, y:2 },
                    { x:3, y:4 }
                ]
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                coords: [
                    { x:1, y:2 },
                    { x:3, y:4 }
                ]
            })
        })
        
    })
        
    describe('Dict', () => {
        
        const schema_primitives = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            data: new $BucketModelField('data','data','dict','data',true,undefined,undefined,{
                '#': new $BucketModelField('#','data.#','int','data #',true),                 
            })
        });
        
        it('primitives', () =>  {    
            const parsed = make_model(schema_primitives).cast({
                id: Mock.Int,
                data: {a:1, b:2, c:3}
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                data: {a:1, b:2, c:3}
            })
        })
        
        it('primitives (wrong type)', () =>  {    
            expect(() => make_model(schema_primitives).cast({
                id: Mock.Int,
                data: Mock.Bool,
            }))
                .toThrow('[test::test#123] Value \'true\' at \'data\' should be a dict')
        })
        
        it('primitives (wrong child type)', () =>  {    
            expect(() => make_model(schema_primitives).cast({
                id: Mock.Int,
                data: {a:1, b:'b', c:3}
            }))
                .toThrow('[test::test#123] Value \'b\' at \'data.b\' should be a number')
        })
        
        
        const schema_objs = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            coords: new $BucketModelField('coords','coords','dict','coords',true,undefined,undefined,{
                '#': new $BucketModelField('#','coords.#','obj','coords.#',true, undefined, undefined, {
                    x: new $BucketModelField('x','coords.#.x','int','coords.#.x',true),
                    y: new $BucketModelField('y','coords.#.y','int','coords.#.y',true)
                }),                 
            })
        });
        
        it('objs', () =>  {    
            const parsed = make_model(schema_objs).cast({
                id: Mock.Int,
                coords: {
                    'a': { x:1, y:2 },
                    'b': { x:3, y:4 }
                }
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                coords: {
                    'a': { x:1, y:2 },
                    'b': { x:3, y:4 }
                }
            })
        })
        
    })
        
    describe('Union', () => {
        
        const schema_primitives = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            union: new $BucketModelField('union','union','union','union',true,undefined,undefined,{
                '0': new $BucketModelField('0','union.0','boolean','union.0',true),                 
                '1': new $BucketModelField('1','union.1','int','union.1',true),                 
                '2': new $BucketModelField('2','union.2','string','union.2',true),                 
            })
        });
        
        it('primitives (bool)', () =>  {    
            const parsed = make_model(schema_primitives).cast({
                id: Mock.Int,
                union: Mock.Bool
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                union: Mock.Bool
            })
        })
        
        it('primitives (int)', () =>  {    
            const parsed = make_model(schema_primitives).cast({
                id: Mock.Int,
                union: Mock.Int
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                union: Mock.Int
            })
        })
        
        it('primitives (string)', () =>  {    
            const parsed = make_model(schema_primitives).cast({
                id: Mock.Int,
                union: Mock.String
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                union: Mock.String
            })
        })
        
        it('primitives (wrong type)', () =>  {    
            expect(() => make_model(schema_primitives).cast({
                id: Mock.Int,
                union: Mock.Float,
            }))
                .toThrow('[test::test#123] Value \'123.456\' at \'union\' doesn\'t match any of the union options')
        })
        
    })



})
