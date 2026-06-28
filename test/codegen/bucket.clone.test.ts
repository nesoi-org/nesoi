import { Log } from '~/engine/util/log'
import { Mock } from '../elements/mock';
import { $BucketModel, $BucketModelField } from '~/elements/entities/bucket/model/bucket_model.schema';
import { CodegenErrorHandler } from '~/compiler/codegen/codegen';
import { BucketModel__clone } from '~/compiler/codegen/bucket_clone.codegen';

Log.level = 'off';

function make_model(schema: $BucketModel) {
    const model = {
        bucket: {
            module: 'test',
            alias: 'test',
        },
        clone: BucketModel__clone.make(schema)
    } as any;
    model._e = {
        data: CodegenErrorHandler.bucket_model.data.bind(model as any),
        required: CodegenErrorHandler.bucket_model.required.bind(model as any),
        type: CodegenErrorHandler.bucket_model.type.bind(model as any),
        union: CodegenErrorHandler.bucket_model.union.bind(model as any),
    }
    return model
}

describe('Bucket Codegen: Clone', () => {

    describe('Primitives', () => {
        
        // boolean
        
        const schema_boolean = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            f_boolean: new $BucketModelField('f_boolean','f_boolean','boolean','f_boolean',true)
        });
        
        it('boolean', () =>  {    
            const parsed = make_model(schema_boolean).clone({
                id: Mock.Int,
                f_boolean: Mock.Bool,
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                f_boolean: Mock.Bool
            })
        })
        
        // date
        
        const schema_date = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            f_date: new $BucketModelField('f_date','f_date','date','f_date',true)
        });
        
        it('date', () =>  {    
            const parsed = make_model(schema_date).clone({
                id: Mock.Int,
                f_date: Mock.Date,
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                f_date: Mock.Date
            })
        })
                
        // datetime
        
        const schema_datetime = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            f_datetime: new $BucketModelField('f_datetime','f_datetime','datetime','f_datetime',true)
        });
        
        it('datetime', () =>  {    
            const parsed = make_model(schema_datetime).clone({
                id: Mock.Int,
                f_datetime: Mock.Datetime,
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                f_datetime: Mock.Datetime
            })
        })
                
        // duration
        
        const schema_duration = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            f_duration: new $BucketModelField('f_duration','f_duration','duration','f_duration',true)
        });
        
        it('duration', () =>  {    
            const parsed = make_model(schema_duration).clone({
                id: Mock.Int,
                f_duration: Mock.Duration,
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                f_duration: Mock.Duration
            })
        })
        
        // decimal
        
        const schema_decimal = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            f_decimal: new $BucketModelField('f_decimal','f_decimal','decimal','f_decimal',true)
        });
        it('decimal', () =>  {    
            const parsed = make_model(schema_decimal).clone({
                id: Mock.Int,
                f_decimal: Mock.Decimal,
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                f_decimal: Mock.Decimal
            })
        })
        
        // enum
        
        const schema_enum = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            f_enum: new $BucketModelField('f_enum','f_enum','enum','f_enum',true, {
                enum: { options: { 'a': {}, 'b': {} }}
            }),
        });
        
        it('enum', () =>  {    
            const parsed = make_model(schema_enum).clone({
                id: Mock.Int,
                f_enum: 'a',
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                f_enum: 'a'
            })
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
            const parsed = make_model(schema_float).clone({
                id: Mock.Int,
                f_float: Mock.Float,
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                f_float: Mock.Float
            })
        })
        
        // int
        
        const schema_int = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            f_int: new $BucketModelField('f_int','f_int','int','f_int',true)
        });
        
        it('int', () =>  {    
            const parsed = make_model(schema_int).clone({
                id: Mock.Int,
                f_int: Mock.Int,
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                f_int: Mock.Int
            })
        })
        
        // literal
        
        const schema_literal = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            f_literal: new $BucketModelField('f_literal','f_literal','literal','f_literal',true, {
                literal: { template: 'abc' }
            })
        });
        
        it('literal', () =>  {
            const parsed = make_model(schema_literal).clone({
                id: Mock.Int,
                f_literal: 'abc',
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                f_literal: 'abc'
            })
        })
        
        // regex
        
        const schema_regex = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            f_regex: new $BucketModelField('f_regex','f_regex','regex','f_regex',true, {
                regex: { template: 'abc' }
            })
        });
        
        it('regex', () =>  {    
            const parsed = make_model(schema_regex).clone({
                id: Mock.Int,
                f_regex: '!abc!',
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                f_regex: '!abc!'
            })
        })
        
        // string
        
        const schema_string = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            f_string: new $BucketModelField('f_string','f_string','string','f_string',true)
        });
        
        it('string', () =>  {    
            const parsed = make_model(schema_string).clone({
                id: Mock.Int,
                f_string: Mock.String,
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                f_string: Mock.String
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
            const parsed = make_model(schema_primitives).clone({
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
        
        const schema_primitives = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            data: new $BucketModelField('data','data','list','data',true,undefined,undefined,{
                '#': new $BucketModelField('#','data.#','int','data #',true),                 
            })
        });
        
        it('primitives', () =>  {    
            const parsed = make_model(schema_primitives).clone({
                id: Mock.Int,
                data: [1,2,3]
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                data: [1,2,3]
            })
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
            const parsed = make_model(schema_objs).clone({
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
            const parsed = make_model(schema_primitives).clone({
                id: Mock.Int,
                data: {a:1, b:2, c:3}
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                data: {a:1, b:2, c:3}
            })
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
            const parsed = make_model(schema_objs).clone({
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
            const parsed = make_model(schema_primitives).clone({
                id: Mock.Int,
                union: Mock.Bool
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                union: Mock.Bool
            })
        })
        
        it('primitives (int)', () =>  {    
            const parsed = make_model(schema_primitives).clone({
                id: Mock.Int,
                union: Mock.Int
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                union: Mock.Int
            })
        })
        
        it('primitives (string)', () =>  {    
            const parsed = make_model(schema_primitives).clone({
                id: Mock.Int,
                union: Mock.String
            })
            expect(parsed).toEqual({
                id: Mock.Int,
                union: Mock.String
            })
        })
        
    })

})
