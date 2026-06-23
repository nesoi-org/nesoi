import { Log } from '~/engine/util/log'
import { Mock } from '../elements/mock';
import { $BucketModel, $BucketModelField } from '~/elements/entities/bucket/model/bucket_model.schema';
import { makeGetFn } from '~/compiler/codegen/bucket_model.codegen';
import { CodegenErrorHandler } from '~/compiler/codegen/codegen';

Log.level = 'off';

function make_model(schema: $BucketModel) {
    const model = {
        bucket: {
            module: 'test',
            alias: 'test',
        },
        get: makeGetFn(schema)
    } as any;
    model._e = {
        data: CodegenErrorHandler.bucket_model.data.bind(model as any),
        required: CodegenErrorHandler.bucket_model.required.bind(model as any),
        type: CodegenErrorHandler.bucket_model.type.bind(model as any),
        union: CodegenErrorHandler.bucket_model.union.bind(model as any),
    }
    return model
}

describe('Bucket Codegen: Get', () => {
    
    describe('Basics',() => {
        
        const schema = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            f_boolean: new $BucketModelField('f_boolean','f_boolean','boolean','f_boolean',true),
            coord: new $BucketModelField('coord','coord','obj','coord',true,undefined,undefined,{
                x: new $BucketModelField('x','coord.x','int','coord.x',true),
                y: new $BucketModelField('y','coord.y','int','coord.y',true)                    
            }),
            list_coord: new $BucketModelField('list_coord','list_coord','list','list_coord',true,undefined,undefined,{
                '#': new $BucketModelField('list_coord.#','list_coord.#','obj','list_coord.#',true,undefined,undefined,{
                    x: new $BucketModelField('x','list_coord.#.x','int','list_coord.#.x',true),
                    y: new $BucketModelField('y','list_coord.#.y','int','list_coord.#.y',true)                    
                })
            }),
            dict_coord: new $BucketModelField('dict_coord','dict_coord','dict','dict_coord',true,undefined,undefined,{
                '#': new $BucketModelField('dict_coord.#','dict_coord.#','obj','dict_coord.#',true,undefined,undefined,{
                    x: new $BucketModelField('x','dict_coord.#.x','int','dict_coord.#.x',true),
                    y: new $BucketModelField('y','dict_coord.#.y','int','dict_coord.#.y',true)                    
                })
            }),
        })

        const obj = {
            id: Mock.Int,
            f_boolean: Mock.Bool,
            coord: { x:1, y:2 },
            list_coord: [
                { x:1, y:2 },
                { x:3, y:4 },
                { x:5, y:6 },
            ],
            dict_coord: {
                'a': { x:1, y:2 },
                'b': { x:3, y:4 },
                'c': { x:5, y:6 },
            }
        }
        
        it('!', () =>  {
            const parsed = make_model(schema).get(obj, ['non_existing'])
            expect(parsed).toEqual(undefined)
        })
        
        it('primitive', () =>  {
            const parsed = make_model(schema).get(obj, ['f_boolean'])
            expect(parsed).toEqual(Mock.Bool)
        })

        it('obj', () =>  {
            const parsed = make_model(schema).get(obj, ['coord'])
            expect(parsed).toEqual({x:1, y:2})
        })
        
        it('obj > primitive', () =>  {
            const parsed = make_model(schema).get(obj, ['coord', 'x'])
            expect(parsed).toEqual(1)
        })

        it('obj > !', () =>  {
            const parsed = make_model(schema).get(obj, ['coord', 'z'])
            expect(parsed).toEqual(undefined)
        })
        
        it('list', () =>  {
            const parsed = make_model(schema).get(obj, ['list_coord'])
            expect(parsed).toEqual([
                { x:1, y:2 },
                { x:3, y:4 },
                { x:5, y:6 },
            ])
        })
        
        it('list > #', () =>  {
            const parsed = make_model(schema).get(obj, ['list_coord','1'])
            expect(parsed).toEqual({ x:3, y:4 })
        })

        it('list > # (nan)', () =>  {
            const parsed = make_model(schema).get(obj, ['list_coord','abc'])
            expect(parsed).toEqual(undefined)
        })

        it('list > # (negative)', () =>  {
            const parsed = make_model(schema).get(obj, ['list_coord','-1'])
            expect(parsed).toEqual({ x:5, y:6 })
        })

        it('list > # (out of bounds)', () =>  {
            const parsed = make_model(schema).get(obj, ['list_coord','3'])
            expect(parsed).toEqual(undefined)
        })

        it('list > # > primitive', () =>  {
            const parsed = make_model(schema).get(obj, ['list_coord','1','x'])
            expect(parsed).toEqual(3)
        })

        it('dict', () =>  {
            const parsed = make_model(schema).get(obj, ['dict_coord'])
            expect(parsed).toEqual({
                'a': { x:1, y:2 },
                'b': { x:3, y:4 },
                'c': { x:5, y:6 },
            })
        })

        it('dict > #', () =>  {
            const parsed = make_model(schema).get(obj, ['dict_coord','b'])
            expect(parsed).toEqual({ x:3, y:4 })
        })

        it('dict > # (non existing)', () =>  {
            const parsed = make_model(schema).get(obj, ['dict_coord','z'])
            expect(parsed).toEqual(undefined)
        })

        it('dict > # > primitive', () =>  {
            const parsed = make_model(schema).get(obj, ['dict_coord','b','x'])
            expect(parsed).toEqual(3)
        })
    })

    describe('List Spread',() => {
        
        const schema_list = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            numbers: new $BucketModelField('numbers','numbers','list','numbers',true,undefined,undefined,{
                '#': new $BucketModelField('numbers.#','numbers.#','int','numbers.#',true)
            }),
            coords: new $BucketModelField('coords','coords','list','coords',true,undefined,undefined,{
                '#': new $BucketModelField('coords.#','coords.#','obj','coords.#',true,undefined,undefined,{
                    x: new $BucketModelField('x','coords.#.x','int','coords.#.x',true),
                    y: new $BucketModelField('y','coords.#.y','int','coords.#.y',true)                    
                })
            })
        })

        const obj = {
            id: Mock.Int,
            numbers: [1,2,3],
            coords: [
                { x:1, y:2 },
                { x:3, y:4 },
                { x:5, y:6 },
            ]
        }
        
        it('list > *', () =>  {
            const parsed = make_model(schema_list).get(obj, ['numbers','*'])
            expect(parsed).toEqual([1,2,3])
        })
        
        it('list > 1', () =>  {
            const parsed = make_model(schema_list).get(obj, ['numbers','1'])
            expect(parsed).toEqual(2)
        })
        
        it('list > *', () =>  {
            const parsed = make_model(schema_list).get(obj, ['coords','*'])
            expect(parsed).toEqual([
                { x:1, y:2 },
                { x:3, y:4 },
                { x:5, y:6 },
            ])
        })
        
        it('list > * > primitive', () =>  {
            const parsed = make_model(schema_list).get(obj, ['coords','*','x'])
            expect(parsed).toEqual([
                1,
                3,
                5,
            ])
        })
    })

    describe('Dict Spread',() => {
        
        const schema = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            coords: new $BucketModelField('coords','coords','dict','coords',true,undefined,undefined,{
                '#': new $BucketModelField('coords.#','coords.#','obj','coords.#',true,undefined,undefined,{
                    x: new $BucketModelField('x','coords.#.x','int','coords.#.x',true),
                    y: new $BucketModelField('y','coords.#.y','int','coords.#.y',true)                    
                })
            })
        })

        const obj = {
            id: Mock.Int,
            coords: {
                'a': { x:1, y:2 },
                'b': { x:3, y:4 },
                'c': { x:5, y:6 },
            }
        }
        
        it('dict > *', () =>  {
            const parsed = make_model(schema).get(obj, ['coords','*'])
            expect(parsed).toEqual({
                'a': { x:1, y:2 },
                'b': { x:3, y:4 },
                'c': { x:5, y:6 },
            })
        })
        
        it('dict > * > primitive', () =>  {
            const parsed = make_model(schema).get(obj, ['coords','*','x'])
            expect(parsed).toEqual({
                'a': 1,
                'b': 3,
                'c': 5,
            })
        })
    })

})
