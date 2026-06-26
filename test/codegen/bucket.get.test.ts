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
            const results = make_model(schema).get(obj, ['non_existing'])
            expect(results).toEqual([])
        })
        
        it('primitive', () =>  {
            const results = make_model(schema).get(obj, ['f_boolean'])
            expect(results).toEqual([
                { index: [], value: Mock.Bool }
            ])
        })

        it('obj', () =>  {
            const results = make_model(schema).get(obj, ['coord'])
            expect(results).toEqual([
                { index: [], value: {x:1, y:2} }
            ])
        })
        
        it('obj > primitive', () =>  {
            const results = make_model(schema).get(obj, ['coord', 'x'])
            expect(results).toEqual([
                { index: [], value: 1 }
            ])
        })

        it('obj > !', () =>  {
            const results = make_model(schema).get(obj, ['coord', 'z'])
            expect(results).toEqual([])
        })

        it('obj > *', () =>  {
            const results = make_model(schema).get(obj, ['coord', '*'])
            expect(results).toEqual([
                { index: ['x'], value: 1 },
                { index: ['y'], value: 2 },
            ])
        })
        
        it('obj[]', () =>  {
            const results = make_model(schema).get(obj, ['list_coord'])
            expect(results).toEqual([
                {
                    index: [],
                    value: [
                        { x:1, y:2 },
                        { x:3, y:4 },
                        { x:5, y:6 },
                    ]
                }
            ])
        })
        
        it('obj[] > #', () =>  {
            const results = make_model(schema).get(obj, ['list_coord','1'])
            expect(results).toEqual([
                { index: [], value: { x:3, y:4 } }
            ])
        })

        it('obj[] > # (nan)', () =>  {
            const results = make_model(schema).get(obj, ['list_coord','abc'])
            expect(results).toEqual([])
        })

        it('obj[] > # (negative)', () =>  {
            const results = make_model(schema).get(obj, ['list_coord','-1'])
            expect(results).toEqual([
                { index: [], value: { x:5, y:6 } }
            ])
        })

        it('obj[] > # (out of bounds)', () =>  {
            const results = make_model(schema).get(obj, ['list_coord','3'])
            expect(results).toEqual([])
        })

        it('obj[] > # > prtv', () =>  {
            const results = make_model(schema).get(obj, ['list_coord','1','x'])
            expect(results).toEqual([
                { index: [], value: 3 }
            ])
        })

        it('obj{}', () =>  {
            const results = make_model(schema).get(obj, ['dict_coord'])
            expect(results).toEqual([
                { 
                    index: [],
                    value: {
                        'a': { x:1, y:2 },
                        'b': { x:3, y:4 },
                        'c': { x:5, y:6 },
                    }
                }
            ])
        })

        it('obj{} > #', () =>  {
            const results = make_model(schema).get(obj, ['dict_coord','b'])
            expect(results).toEqual([
                { index: [], value: { x:3, y:4 } }
            ])
        })

        it('obj{} > # (non existing)', () =>  {
            const results = make_model(schema).get(obj, ['dict_coord','z'])
            expect(results).toEqual([])
        })

        it('obj{} > # > primitive', () =>  {
            const results = make_model(schema).get(obj, ['dict_coord','b','x'])
            expect(results).toEqual([
                { index: [], value: 3 }
            ])
        })
    })

    describe('List',() => {
        
        const schema_list = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            numbers: new $BucketModelField('numbers','numbers','list','numbers',true,undefined,undefined,{
                '#': new $BucketModelField('#','numbers.#','int','#',true)
            }),
            coords: new $BucketModelField('coords','coords','list','coords',true,undefined,undefined,{
                '#': new $BucketModelField('#','coords.#','obj','#',true,undefined,undefined,{
                    x: new $BucketModelField('x','coords.#.x','int','coords.#.x',true),
                    y: new $BucketModelField('y','coords.#.y','int','coords.#.y',true)                    
                })
            }),
            info: new $BucketModelField('info','info','list','info',true,undefined,undefined,{
                '#': new $BucketModelField('#','info.#','obj','#',true,undefined,undefined,{
                    game: new $BucketModelField('game','info.#.game','string','game',true),
                    score: new $BucketModelField('score','info.#.score','list','score',true,undefined,undefined,{
                        '#': new $BucketModelField('#','info.#.score.#','int','#',true)
                    }),
                    count: new $BucketModelField('count','info.#.count','dict','count',true,undefined,undefined,{
                        '#': new $BucketModelField('#','info.#.count.#','int','#',true)
                    }),
                })
            }),
            maps: new $BucketModelField('maps','maps','list','maps',true,undefined,undefined,{
                '#': new $BucketModelField('#','maps.#','dict','#',true,undefined,undefined,{
                    '#': new $BucketModelField('#','maps.#.#','int','#',true,undefined,undefined)
                })
            }),
            matrix: new $BucketModelField('matrix','matrix','list','matrix',true,undefined,undefined,{
                '#': new $BucketModelField('#','matrix.#','list','#',true,undefined,undefined,{
                    '#': new $BucketModelField('#','matrix.#.#','int','#',true,undefined,undefined)
                })
            }),
        })

        const obj = {
            id: Mock.Int,
            numbers: [1,2,3],
            coords: [
                { x:1, y:2 },
                { x:3, y:4 },
                { x:5, y:6 },
            ],
            info: [
                { game: 'chess', score: [1,2,3], count: {'a':1,'b':2} },
                { game: 'rubik', score: [4,5,6], count: {'c':3,'d':4}  },
            ],
            maps: [
                {'a':1,'b':2},
                {'c':3,'d':4},
            ],
            matrix: [
                [1,2],
                [3,4]
            ]
        }
        
        it('obj[] > *', () =>  {
            const results = make_model(schema_list).get(obj, ['numbers','*'])
            expect(results).toEqual([
                { index: [0], value: 1 },
                { index: [1], value: 2 },
                { index: [2], value: 3 },
            ])
        })
                
        it('obj[] > *', () =>  {
            const results = make_model(schema_list).get(obj, ['coords','*'])
            expect(results).toEqual([
                { index: [0], value: { x:1, y:2 } },
                { index: [1], value: { x:3, y:4 } },
                { index: [2], value: { x:5, y:6 } },
            ])
        })
        
        it('obj[] > * > primitive', () =>  {
            const results = make_model(schema_list).get(obj, ['coords','*','x'])
            expect(results).toEqual([
                { index: [0], value: 1 },
                { index: [1], value: 3 },
                { index: [2], value: 5 },
            ])
        })
        
        it('obj[] > * > [prtv]', () =>  {
            const results = make_model(schema_list).get(obj, ['info','*','score'])
            expect(results).toEqual([
                { index: [0], value: [1,2,3] },
                { index: [1], value: [4,5,6] },
            ])
        })
        
        it('obj[] > * > [prtv] > *', () =>  {
            const results = make_model(schema_list).get(obj, ['info','*','score','*'])
            expect(results).toEqual([
                { index: [0,0], value: 1 },
                { index: [0,1], value: 2 },
                { index: [0,2], value: 3 },
                { index: [1,0], value: 4 },
                { index: [1,1], value: 5 },
                { index: [1,2], value: 6 },
            ])
        })

        it('obj[] > * > prtv{}', () =>  {
            const results = make_model(schema_list).get(obj, ['info','*','count'])
            expect(results).toEqual([
                { index: [0], value: {'a':1,'b':2} },
                { index: [1], value: {'c':3,'d':4} },
            ])
        })

        it('obj[] > * > prtv{} > *', () =>  {
            const results = make_model(schema_list).get(obj, ['info','*','count','*'])
            expect(results).toEqual([
                { index: [0,'a'], value: 1 },
                { index: [0,'b'], value: 2 },
                { index: [1,'c'], value: 3 },
                { index: [1,'d'], value: 4 }
            ])
        })

        it('dict[]', () =>  {
            const results = make_model(schema_list).get(obj, ['maps'])
            expect(results).toEqual([
                {
                    index: [],
                    value: [
                        {'a':1,'b':2},
                        {'c':3,'d':4},
                    ]
                }
            ])
        })

        it('dict[] > *', () =>  {
            const results = make_model(schema_list).get(obj, ['maps', '*'])
            expect(results).toEqual([
                { index: [0], value: {'a':1,'b':2} },
                { index: [1], value: {'c':3,'d':4} }
            ])
        })

        it('dict[] > * > prtv', () =>  {
            const results = make_model(schema_list).get(obj, ['maps', '*', 'a'])
            expect(results).toEqual([
                { index: [0], value: 1 }
            ])
        })

        it('dict[] > * > *', () =>  {
            const results = make_model(schema_list).get(obj, ['maps', '*', '*'])
            expect(results).toEqual([
                { index: [0,'a'], value: 1 },
                { index: [0,'b'], value: 2 },
                { index: [1,'c'], value: 3 },
                { index: [1,'d'], value: 4 }
            ])
        })

        it('list[]', () =>  {
            const results = make_model(schema_list).get(obj, ['matrix'])
            expect(results).toEqual([
                {
                    index: [],
                    value: [
                        [1,2],
                        [3,4],
                    ]
                }
            ])
        })

        it('list[] > *', () =>  {
            const results = make_model(schema_list).get(obj, ['matrix', '*'])
            expect(results).toEqual([
                { index: [0], value: [1,2] },
                { index: [1], value: [3,4] },
            ])
        })

        it('list[] > * > prtv', () =>  {
            const results = make_model(schema_list).get(obj, ['matrix', '*', '0'])
            expect(results).toEqual([
                { index: [0], value: 1 },
                { index: [1], value: 3 },
            ])
        })

        it('list[] > * > *', () =>  {
            const results = make_model(schema_list).get(obj, ['matrix', '*', '*'])
            expect(results).toEqual([
                { index: [0,0], value: 1 },
                { index: [0,1], value: 2 },
                { index: [1,0], value: 3 },
                { index: [1,1], value: 4 },
            ])
        })
    })

    describe('Dict',() => {
        
        const schema = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            count: new $BucketModelField('count','count','dict','count',true,undefined,undefined,{
                '#': new $BucketModelField('#','count.#','int','#',true)
            }),
            coords: new $BucketModelField('coords','coords','dict','coords',true,undefined,undefined,{
                '#': new $BucketModelField('#','coords.#','obj','#',true,undefined,undefined,{
                    x: new $BucketModelField('x','coords.#.x','int','x',true),
                    y: new $BucketModelField('y','coords.#.y','int','y',true)                    
                })
            }),
            info: new $BucketModelField('info','info','dict','info',true,undefined,undefined,{
                '#': new $BucketModelField('#','info.#','obj','#',true,undefined,undefined,{
                    game: new $BucketModelField('game','info.#.game','string','game',true),
                    score: new $BucketModelField('score','info.#.score','dict','score',true,undefined,undefined,{
                        '#': new $BucketModelField('#','info.#.score.#','int','#',true)
                    })
                })
            }),
        })

        const obj = {
            id: Mock.Int,
            count: {
                'a': 1,
                'b': 2,
                'c': 3,
            },
            coords: {
                'a': { x:1, y:2 },
                'b': { x:3, y:4 },
                'c': { x:5, y:6 },
            },
            info: {
                'chess': {
                    game: 'chess',
                    score: {
                        'a': 1, 'b': 2, 'c': 3
                    }
                },
                'rubik': {
                    game: 'rubik',
                    score: {
                        'd': 4, 'e': 5, 'f': 6
                    }
                }
            }
        }
        
        it('obj{} > *', () =>  {
            const results = make_model(schema).get(obj, ['count','*'])
            expect(results).toEqual([
                { index: ['a'], value: 1 },
                { index: ['b'], value: 2 },
                { index: ['c'], value: 3 },
            ])
        })
        
        it('obj{} > *', () =>  {
            const results = make_model(schema).get(obj, ['coords','*'])
            expect(results).toEqual([
                { index: ['a'], value: { x:1, y:2 } },
                { index: ['b'], value: { x:3, y:4 } },
                { index: ['c'], value: { x:5, y:6 } },
            ])
        })
        
        it('obj{} > * > prt', () =>  {
            const results = make_model(schema).get(obj, ['coords','*','x'])
            expect(results).toEqual([
                { index: ['a'], value: 1 },
                { index: ['b'], value: 3 },
                { index: ['c'], value: 5 },
            ])
        })
        
        it('obj{} > * > prtv{}', () =>  {
            const results = make_model(schema).get(obj, ['info','*','score'])
            expect(results).toEqual([
                {
                    index: ['chess'],
                    value: {
                        'a': 1, 'b': 2, 'c': 3
                    }
                },
                {
                    index: ['rubik'],
                    value: {
                        'd': 4, 'e': 5, 'f': 6
                    }
                }
            ])
        })
        
        it('obj{} > * > prtv{} > *', () =>  {
            const results = make_model(schema).get(obj, ['info','*','score','*'])
            expect(results).toEqual([
                { index: ['chess', 'a'], value: 1 },
                { index: ['chess', 'b'], value: 2 },
                { index: ['chess', 'c'], value: 3 },
                { index: ['rubik', 'd'], value: 4 },
                { index: ['rubik', 'e'], value: 5 },
                { index: ['rubik', 'f'], value: 6 },
            ])
        })
    })

})
