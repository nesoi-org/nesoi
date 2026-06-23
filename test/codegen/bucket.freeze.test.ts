import { Log } from '~/engine/util/log'
import { Mock } from '../elements/mock';
import { $BucketModel, $BucketModelField } from '~/elements/entities/bucket/model/bucket_model.schema';
import { makeFreezeFn } from '~/compiler/codegen/bucket_freeze.codegen';

Log.level = 'off';

describe('Bucket Codegen: Freeze', () => {

    describe('Simple', () => {

        it('should freeze simple object', () => {
            const schema = new $BucketModel({
                id: new $BucketModelField('id','id','int','id',true),
                name: new $BucketModelField('name','name','string','name',true),
                height: new $BucketModelField('height','height','float','height',true)
            });
            const freeze_fn = makeFreezeFn(schema)

            const obj = {
                id: Mock.Int,
                name: Mock.String,
                height: Mock.Float
            }
            freeze_fn(obj);

            expect(() => {
                obj.name = 'test'
            }).toThrow(TypeError);
            expect(() => {
                obj.height = 0
            }).toThrow(TypeError);
        })

    })
    
    describe('Obj', () => {

        it('should freeze object with object of primitives', () => {
            const schema = new $BucketModel({
                id: new $BucketModelField('id','id','int','id',true),
                'data': new $BucketModelField('data','data','obj','data',true,undefined,undefined,{
                    a: new $BucketModelField('a','data.a','int','a',true),
                    b: new $BucketModelField('b','data.b','int','b',true)
                })
            });
            const freeze_fn = makeFreezeFn(schema)

            const obj = {
                id: Mock.Int,
                data: { a: 1, b: 2 }
            }
            freeze_fn(obj);

            expect(() => {
                obj.data.a = 0
            }).toThrow(TypeError);
            expect(() => {
                obj.data.b = 0
            }).toThrow(TypeError);
        })

        it('should freeze object with object of objects', () => {
            const schema = new $BucketModel({
                id: new $BucketModelField('id','id','int','id',true),
                data: new $BucketModelField('data','data','obj','data',true,undefined,undefined,{
                    'x': new $BucketModelField('x','data.x','obj','x',true,undefined,undefined,{
                        a: new $BucketModelField('a','data.x.a','int','a',true),
                        b: new $BucketModelField('b','data.x.b','int','b',true)
                    }),
                    'y': new $BucketModelField('y','data.y','obj','y',true,undefined,undefined,{
                        c: new $BucketModelField('c','data.y.c','int','c',true),
                        d: new $BucketModelField('d','data.y.d','int','d',true)
                    })
                })
            });
            const freeze_fn = makeFreezeFn(schema)

            const obj = {
                id: Mock.Int,
                data: {
                    x: {a:1,b:2},
                    y: {c:3,d:4}
                }
            }
            freeze_fn(obj);

            expect(() => {
                obj.data.x.a = 0
            }).toThrow(TypeError);
            expect(() => {
                obj.data.y.d = 0
            }).toThrow(TypeError);
        })

    })

    describe('List', () => {

        it('should freeze object with list of primitives', () => {
            const schema = new $BucketModel({
                id: new $BucketModelField('id','id','int','id',true),
                data: new $BucketModelField('data','data','list','data',true,undefined,undefined,{
                    '#': new $BucketModelField('#','data.#','int','#',true)
                }),
            });
            const freeze_fn = makeFreezeFn(schema)

            const obj = {
                id: Mock.Int,
                data: [1,2,3]
            }
            freeze_fn(obj);

            expect(() => {
                obj.data[0] = 0
            }).toThrow(TypeError);
            expect(() => {
                obj.data[1] = 0
            }).toThrow(TypeError);
        })

        it('should freeze object with list of objects', () => {
            const schema = new $BucketModel({
                id: new $BucketModelField('id','id','int','id',true),
                data: new $BucketModelField('data','data','list','data',true,undefined,undefined,{
                    '#': new $BucketModelField('#','data.#','obj','#',true,undefined,undefined,{
                        a: new $BucketModelField('a','data.#.a','int','a',true),
                        b: new $BucketModelField('b','data.#.b','int','b',true)
                    })
                }),
            });
            const freeze_fn = makeFreezeFn(schema)

            const obj = {
                id: Mock.Int,
                data: [{a:1,b:2},{a:3,b:4}]
            }
            freeze_fn(obj);

            expect(() => {
                obj.data[0].a = 0
            }).toThrow(TypeError);
            expect(() => {
                obj.data[1].b = 0
            }).toThrow(TypeError);
        })

    })

    describe('Dict', () => {

        it('should freeze object with dict of primitives', () => {
            const schema = new $BucketModel({
                id: new $BucketModelField('id','id','int','id',true),
                data: new $BucketModelField('data','data','dict','data',true,undefined,undefined,{
                    '#': new $BucketModelField('#','data.#','int','#',true)
                })
            });
            const freeze_fn = makeFreezeFn(schema)

            const obj = {
                id: Mock.Int,
                data: { x: 1, y: 2, z: 3 }
            }
            freeze_fn(obj);
            
            expect(() => {
                obj.data['x'] = 0
            }).toThrow(TypeError);
            expect(() => {
                obj.data['y'] = 0
            }).toThrow(TypeError);
        })

        it('should freeze object with dict of objects', () => {
            const schema = new $BucketModel({
                id: new $BucketModelField('id','id','int','id',true),
                data: new $BucketModelField('data','data','dict','data',true,undefined,undefined,{
                    '#': new $BucketModelField('#','data.#','obj','#',true,undefined,undefined,{
                        a: new $BucketModelField('a','data.#.a','int','a',true),
                        b: new $BucketModelField('b','data.#.b','int','b',true)
                    })
                })
            });
            const freeze_fn = makeFreezeFn(schema)

            const obj = {
                id: Mock.Int,
                data: {
                    x: {a:1,b:2},
                    y: {a:3,b:4}
                }
            }
            freeze_fn(obj);

            expect(() => {
                obj.data['x'].a = 0
            }).toThrow(TypeError);
            expect(() => {
                obj.data['y'].b = 0
            }).toThrow(TypeError);
        })

    })
    
    describe('Union', () => {


        it('should freeze object with union of primitives', () => {
            const schema = new $BucketModel({
                id: new $BucketModelField('id','id','int','id',true),
                data: new $BucketModelField('data','data','union','data',true,undefined,undefined,{
                    '0': new $BucketModelField('0','data.0','int','0',true),
                    '1': new $BucketModelField('1','data.1','string','1',true)
                })
            });
            const freeze_fn = makeFreezeFn(schema)

            const obj1 = { id: Mock.Int, data: Mock.Int }
            const obj2 = { id: Mock.Int, data: Mock.String }
            freeze_fn(obj1);
            freeze_fn(obj2);
            
            expect(() => {
                obj1.data = 0
            }).toThrow(TypeError);
            expect(() => {
                obj2.data = 'a'
            }).toThrow(TypeError);
        })

        const primitive_union_freeze = makeFreezeFn(new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            data: new $BucketModelField('data','data','union','data',true,undefined,undefined,{
                '0': new $BucketModelField('0','data.0','int','0',true),
                '1': new $BucketModelField('1','data.1','list','1',true,undefined,undefined,{
                    '#': new $BucketModelField('#','data.1.#','int','#',true)
                }),
                '2': new $BucketModelField('2','data.2','dict','2',true,undefined,undefined,{
                    '#': new $BucketModelField('#','data.2.#','int','#',true)
                }),
                '3': new $BucketModelField('3','data.3','obj','3',true,undefined,undefined,{
                    'a': new $BucketModelField('a','data.3.a','int','a',true)
                }),
            })
        }));
            
        it('should freeze object with complex union (primitive)', () => {
            const obj = {
                id: Mock.Int,
                data: 1
            }
            primitive_union_freeze(obj);
            
            expect(() => {
                obj.data = 0
            }).toThrow(TypeError);
        })
            
        it('should freeze object with complex union (list)', () => {
            const obj = {
                id: Mock.Int,
                data: [1,2,3]
            }
            primitive_union_freeze(obj);
            
            expect(() => {
                obj.data[0] = 0
            }).toThrow(TypeError);
        })
            
        it('should freeze object with complex union (dict)', () => {
            const obj = {
                id: Mock.Int,
                data: {x:1, y:2}
            }
            primitive_union_freeze(obj);
            
            expect(() => {
                obj.data['x'] = 0
            }).toThrow(TypeError);
        })

        it('should freeze object with complex union (obj)', () => {
            const obj = {
                id: Mock.Int,
                data: {a:3}
            }
            primitive_union_freeze(obj);
            
            expect(() => {
                obj.data.a = 0
            }).toThrow(TypeError);
        })

        const complex_union_freeze = makeFreezeFn(new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            data: new $BucketModelField('data','data','union','data',true,undefined,undefined,{
                '0': new $BucketModelField('0','data.0','int','0',true),
                '1': new $BucketModelField('1','data.1','list','1',true,undefined,undefined,{
                    '#': new $BucketModelField('#','data.1.#','obj','#',true,undefined,undefined,{
                        'x': new $BucketModelField('x','data.1.#.x','int','x',true),
                        'y': new $BucketModelField('y','data.1.#.y','int','y',true)
                    })
                }),
                '2': new $BucketModelField('2','data.2','dict','2',true,undefined,undefined,{
                    '#': new $BucketModelField('#','data.2.#','obj','#',true,undefined,undefined,{
                        'x': new $BucketModelField('x','data.2.#.x','int','x',true),
                        'y': new $BucketModelField('y','data.2.#.y','int','y',true)
                    })
                }),
                '3': new $BucketModelField('3','data.3','obj','3',true,undefined,undefined,{
                    'a': new $BucketModelField('a','data.3.a','obj','a',true,undefined,undefined,{
                        'x': new $BucketModelField('x','data.3.a.x','int','x',true),
                        'y': new $BucketModelField('y','data.3.a.y','int','y',true)
                    }),
                    'b': new $BucketModelField('b','data.3.b','obj','b',true,undefined,undefined,{
                        'x': new $BucketModelField('x','data.3.b.x','int','x',true),
                        'y': new $BucketModelField('y','data.3.b.y','int','y',true)
                    })
                }),
            })
        }));

        it('should freeze object with complex union (list of obj)', () => {
            const obj = {
                id: Mock.Int,
                data: [{x:1,y:2},{x:3,y:4}]
            }
            complex_union_freeze(obj);
            
            expect(() => {
                obj.data[0].x = 0
            }).toThrow(TypeError);
            expect(() => {
                obj.data[1].y = 0
            }).toThrow(TypeError);
        })

        it('should freeze object with complex union (list of obj)', () => {
            const obj = {
                id: Mock.Int,
                data: {
                    'i': {x:1,y:2},
                    'j': {x:3,y:4}
                }
            }
            complex_union_freeze(obj);
            
            expect(() => {
                obj.data['i'].x = 0
            }).toThrow(TypeError);
            expect(() => {
                obj.data['j'].y = 0
            }).toThrow(TypeError);
        })

        it('should freeze object with complex union (list of obj)', () => {
            const obj = {
                id: Mock.Int,
                data: {
                    a: {x:1,y:2},
                    b: {x:3,y:4}
                }
            }
            complex_union_freeze(obj);
            
            expect(() => {
                obj.data.a.x = 0
            }).toThrow(TypeError);
            expect(() => {
                obj.data.b.y = 0
            }).toThrow(TypeError);
        })

    })

})