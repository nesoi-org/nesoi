import { Log } from '~/engine/util/log'
import { $BucketModel, $BucketModelField } from '~/elements/entities/bucket/model/bucket_model.schema';
import { BucketViewCode} from '~/compiler/codegen/bucket_view.codegen';
import { CodegenErrorHandler } from '~/compiler/codegen/codegen';
import { $BucketView, $BucketViewField } from '~/elements/entities/bucket/view/bucket_view.schema';

Log.level = 'off';

function make_view(schema: $BucketView, model: $BucketModel) {
    const view = {
        bucket: {
            module: 'test',
            alias: 'test'
        },
        view: BucketViewCode.make({
            module: 'test',
            alias: 'test',
            model
        } as any, schema)
    } as any;
    view._e = {
        data: CodegenErrorHandler.bucket_model.data.bind(model as any),
        required: CodegenErrorHandler.bucket_model.required.bind(model as any),
        type: CodegenErrorHandler.bucket_model.type.bind(model as any),
        union: CodegenErrorHandler.bucket_model.union.bind(model as any),
    }
    return view
}

describe('Bucket Codegen: View', () => {

    describe('[field] model d2', () => {
        
        const model = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            prtv: new $BucketModelField('prtv','prtv','string','prtv',true),
            obj: new $BucketModelField('obj','obj','obj','obj',true,undefined,undefined,{
                x: new $BucketModelField('x','x','int','x',true),
                y: new $BucketModelField('y','y','int','y',true),
            }),
            list: new $BucketModelField('list','list','list','list',true,undefined,undefined,{
                '#': new $BucketModelField('#','#','int','#',true)
            }),
            dict: new $BucketModelField('dict','dict','dict','dict',true,undefined,undefined,{
                '#': new $BucketModelField('#','#','int','#',true)
            }),
        });

        describe('view d1', () => {
        
            it('primitive', () =>  {    

                const view = new $BucketView('default', {
                    v_prtv: new $BucketViewField('v_prtv', 'model', 'v_prtv', { model: { path: 'prtv' } })
                });
                const parsed = make_view(view, model).view({
                    id: 1,
                    prtv: 'test',
                })
                expect(parsed).toEqual({
                    $v: 'default',
                    id: 1,
                    v_prtv: 'test'
                })
            })
        
            it('obj', () =>  {    
                const view = new $BucketView('default', {
                    v_obj: new $BucketViewField('v_obj', 'model', 'v_obj', { model: { path: 'obj' } })
                });
                const parsed = make_view(view, model).view({
                    id: 1,
                    obj: {x:1,y:2}
                })
                expect(parsed).toEqual({
                    $v: 'default',
                    id: 1,
                    v_obj: {x:1,y:2}
                })
            })
        
            it('list', () =>  {    
                const view = new $BucketView('default', {
                    v_list: new $BucketViewField('v_list', 'model', 'v_list', { model: { path: 'list' } })
                });
                const parsed = make_view(view, model).view({
                    id: 1,
                    list: [1,2,3]
                })
                expect(parsed).toEqual({
                    $v: 'default',
                    id: 1,
                    v_list: [1,2,3]
                })
            })
                
        })

        describe('view d2', () => {
        
            it('obj.x', () =>  {    
                const view = new $BucketView('default', {
                    v_obj: new $BucketViewField('v_obj', 'model', 'v_obj', { model: { path: 'obj.x' } })
                });
                const parsed = make_view(view, model).view({
                    id: 1,
                    obj: {x:1,y:2}
                })
                expect(parsed).toEqual({
                    $v: 'default',
                    id: 1,
                    v_obj: 1
                })
            })
        
            it('obj.*', () =>  {    
                const view = new $BucketView('default', {
                    v_obj: new $BucketViewField('v_obj', 'model', 'v_obj', { model: { path: 'obj.*' } })
                });
                const parsed = make_view(view, model).view({
                    id: 1,
                    obj: {x:1,y:2}
                })
                expect(parsed).toEqual({
                    $v: 'default',
                    id: 1,
                    v_obj: {x:1,y:2}
                })
            })
        
            it('list.0', () =>  {    
                const view = new $BucketView('default', {
                    v_list: new $BucketViewField('v_list', 'model', 'v_list', { model: { path: 'list.0' } })
                });
                const parsed = make_view(view, model).view({
                    id: 1,
                    list: [1,2,3]
                })
                expect(parsed).toEqual({
                    $v: 'default',
                    id: 1,
                    v_list: 1
                })
            })
        
            it('list.-1', () =>  {    
                const view = new $BucketView('default', {
                    v_list: new $BucketViewField('v_list', 'model', 'v_list', { model: { path: 'list.-1' } })
                });
                const parsed = make_view(view, model).view({
                    id: 1,
                    list: [1,2,3]
                })
                expect(parsed).toEqual({
                    $v: 'default',
                    id: 1,
                    v_list: 3
                })
            })
                
            it('list.*', () =>  {    
                const view = new $BucketView('default', {
                    v_list: new $BucketViewField('v_list', 'model', 'v_list', { model: { path: 'list.*' } })
                });
                const parsed = make_view(view, model).view({
                    id: 1,
                    list: [1,2,3]
                })
                expect(parsed).toEqual({
                    $v: 'default',
                    id: 1,
                    v_list: [1,2,3]
                })
            })
        })

    })

    describe('[field] model d3', () => {
        
        const model = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            prtv: new $BucketModelField('prtv','prtv','string','prtv',true),
            obj: new $BucketModelField('obj','obj','obj','obj',true,undefined,undefined,{
                obj: new $BucketModelField('obj','obj.obj','obj','obj',true,undefined,undefined,{
                    x: new $BucketModelField('x','obj.obj.x','int','x',true),
                    y: new $BucketModelField('y','obj.obj.y','int','y',true),
                }),
                list: new $BucketModelField('list','obj.list','list','list',true,undefined,undefined,{
                    '#': new $BucketModelField('#','obj.list.#','int','#',true)
                }),
                dict: new $BucketModelField('dict','obj.dict','dict','dict',true,undefined,undefined,{
                    '#': new $BucketModelField('#','obj.dict.#','int','#',true)
                }),
            }),
            list: new $BucketModelField('list','list','list','list',true,undefined,undefined,{
                '#': new $BucketModelField('obj','list.#','obj','obj',true,undefined,undefined,{
                    obj: new $BucketModelField('obj','list.#.obj','obj','obj',true,undefined,undefined,{
                        x: new $BucketModelField('x','list.#.obj.x','int','x',true),
                        y: new $BucketModelField('y','list.#.obj.y','int','y',true),
                    }),
                    list: new $BucketModelField('list','list.#.list','list','list',true,undefined,undefined,{
                        '#': new $BucketModelField('#','list.#.list.#','int','#',true)
                    }),
                    dict: new $BucketModelField('dict','list.#.dict','dict','dict',true,undefined,undefined,{
                        '#': new $BucketModelField('#','list.#.dict.#','int','#',true)
                    }),
                }),
            }),
        });

        describe('view d1', () => {
        
            it('list', () =>  {    
                const view = new $BucketView('default', {
                    v_list_last: new $BucketViewField('v_list_last', 'model', 'v_list_last', { model: { path: 'list' } })
                });
                const parsed = make_view(view, model).view({
                    id: 1,
                    list: [
                        {
                            obj: {x:1,y:2},
                            list: [1,2,3],
                            dict: {'a':1,'b':2,'c':3}
                        },
                        {
                            obj: {x:3,y:4},
                            list: [4,5,6],
                            dict: {'a':4,'b':5,'c':6}
                        },
                    ]
                })
                expect(parsed).toEqual({
                    $v: 'default',
                    id: 1,
                    v_list_last: [
                        {
                            obj: {x:1,y:2},
                            list: [1,2,3],
                            dict: {'a':1,'b':2,'c':3}
                        },
                        {
                            obj: {x:3,y:4},
                            list: [4,5,6],
                            dict: {'a':4,'b':5,'c':6}
                        },
                    ]
                })
            })
                
        })

        describe('view d2', () => {
        
            it('list.-1', () =>  {    
                const view = new $BucketView('default', {
                    v_list_last: new $BucketViewField('v_list_last', 'model', 'v_list_last', { model: { path: 'list.-1' } })
                });
                const parsed = make_view(view, model).view({
                    id: 1,
                    list: [
                        {
                            obj: {x:1,y:2},
                            list: [1,2,3],
                            dict: {'a':1,'b':2,'c':3}
                        },
                        {
                            obj: {x:3,y:4},
                            list: [4,5,6],
                            dict: {'a':4,'b':5,'c':6}
                        },
                    ]
                })
                expect(parsed).toEqual({
                    $v: 'default',
                    id: 1,
                    v_list_last: {
                        obj: {x:3,y:4},
                        list: [4,5,6],
                        dict: {'a':4,'b':5,'c':6}
                    }
                })
            })
                
        })

        describe('view d3', () => {
        
            it('obj.obj.x', () =>  {    
                const view = new $BucketView('default', {
                    v_obj_obj_x: new $BucketViewField('v_obj_obj_x', 'model', 'v_obj_obj_x', { model: { path: 'obj.obj.x' } })
                });
                const parsed = make_view(view, model).view({
                    id: 1,
                    obj: {
                        obj: {x:1,y:2},
                        list: [1,2,3],
                        dict: {'a':1,'b':2,'c':3}
                    }
                })
                expect(parsed).toEqual({
                    $v: 'default',
                    id: 1,
                    v_obj_obj_x: 1
                })
            })
        
            it('obj.obj.*', () =>  {    
                const view = new $BucketView('default', {
                    v_obj_all_all: new $BucketViewField('v_obj_all_all', 'model', 'v_obj_all_all', { model: { path: 'obj.obj.*' } })
                });
                const parsed = make_view(view, model).view({
                    id: 1,
                    obj: {
                        obj: {x:1,y:2},
                        list: [1,2,3],
                        dict: {'a':1,'b':2,'c':3}
                    }
                })
                expect(parsed).toEqual({
                    $v: 'default',
                    id: 1,
                    v_obj_all_all: {x:1,y:2}
                })
            })
        
            it('obj.*.*', () =>  {    
                const view = new $BucketView('default', {
                    v_obj_all_all: new $BucketViewField('v_obj_all_all', 'model', 'v_obj_all_all', { model: { path: 'obj.*.*' } })
                });
                const parsed = make_view(view, model).view({
                    id: 1,
                    obj: {
                        obj: {x:1,y:2},
                        list: [1,2,3],
                        dict: {'a':1,'b':2,'c':3}
                    }
                })
                expect(parsed).toEqual({
                    $v: 'default',
                    id: 1,
                    v_obj_all_all: {
                        obj: {x:1,y:2},
                        list: [1,2,3],
                        dict: {'a':1,'b':2,'c':3}
                    }
                })
            })
        
            it('list.0.obj', () =>  {    
                const view = new $BucketView('default', {
                    v_list_first_obj: new $BucketViewField('v_list_first_obj', 'model', 'v_list_first_obj', { model: { path: 'list.0.obj' } })
                });
                const parsed = make_view(view, model).view({
                    id: 1,
                    list: [
                        {
                            obj: {x:1,y:2},
                            list: [1,2,3],
                            dict: {'a':1,'b':2,'c':3}
                        },
                        {
                            obj: {x:3,y:4},
                            list: [4,5,6],
                            dict: {'a':4,'b':5,'c':6}
                        },
                    ]
                })
                expect(parsed).toEqual({
                    $v: 'default',
                    id: 1,
                    v_list_first_obj: {x:1,y:2}
                })
            })
        
            it('list.*.obj', () =>  {    
                const view = new $BucketView('default', {
                    v_list_all_obj: new $BucketViewField('v_list_all_obj', 'model', 'v_list_all_obj', { model: { path: 'list.*.obj' } })
                });
                const parsed = make_view(view, model).view({
                    id: 1,
                    list: [
                        {
                            obj: {x:1,y:2},
                            list: [1,2,3],
                            dict: {'a':1,'b':2,'c':3}
                        },
                        {
                            obj: {x:3,y:4},
                            list: [4,5,6],
                            dict: {'a':4,'b':5,'c':6}
                        },
                    ]
                })
                expect(parsed).toEqual({
                    $v: 'default',
                    id: 1,
                    v_list_all_obj: [
                        {x:1,y:2},
                        {x:3,y:4},
                    ]
                })
            })
                
        })


    })

    describe('[op] pick d2', () => {
        
        const model = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            prtv: new $BucketModelField('prtv','prtv','string','prtv',true),
            obj: new $BucketModelField('obj','obj','obj','obj',true,undefined,undefined,{
                x: new $BucketModelField('x','x','int','x',true),
                y: new $BucketModelField('y','y','int','y',true),
            }),
            list: new $BucketModelField('list','list','list','list',true,undefined,undefined,{
                '#': new $BucketModelField('#','#','int','#',true)
            }),
            dict: new $BucketModelField('dict','dict','dict','dict',true,undefined,undefined,{
                '#': new $BucketModelField('#','#','int','#',true)
            }),
        });

        it('prtv.pick(x)', () =>  {    
            const view = new $BucketView('default', {
                v_pick: new $BucketViewField('v_pick', 'model', 'v_pick', { model: { path: 'prtv' } }, [
                    { type: 'pick', prop: 'x' }
                ])
            });
            expect(() => make_view(view, model).view({
                id: 1,
                obj: {x:1,y:2}
            }))
                .toThrow('Unable to pick \'x\' from type \'string\' on view \'default\' of bucket \'test\'')
        })
    
        it('obj.pick(x)', () =>  {    
            const view = new $BucketView('default', {
                v_pick: new $BucketViewField('v_pick', 'model', 'v_pick', { model: { path: 'obj' } }, [
                    { type: 'pick', prop: 'x' }
                ])
            });
            const parsed = make_view(view, model).view({
                id: 1,
                obj: {x:1,y:2}
            })
            expect(parsed).toEqual({
                $v: 'default',
                id: 1,
                v_pick: 1
            })
        })
    
        it('list.pick(x)', () =>  {    
            const view = new $BucketView('default', {
                v_pick: new $BucketViewField('v_pick', 'model', 'v_pick', { model: { path: 'list' } }, [
                    { type: 'pick', prop: 'x' }
                ])
            });
            expect(() => make_view(view, model).view({
                id: 1,
                obj: [1,2,3]
            }))
                .toThrow('Unable to pick \'x\' from type \'number[]\' on view \'default\' of bucket \'test\'')
        })
    
        it('list.pick(1)', () =>  {    
            const view = new $BucketView('default', {
                v_pick: new $BucketViewField('v_pick', 'model', 'v_pick', { model: { path: 'list' } }, [
                    { type: 'pick', prop: '1' }
                ])
            });
            const parsed = make_view(view, model).view({
                id: 1,
                list: [1,2,3]
            })
            expect(parsed).toEqual({
                $v: 'default',
                id: 1,
                v_pick: 2
            })
        })
    
        it('list.pick(-1)', () =>  {    
            const view = new $BucketView('default', {
                v_pick: new $BucketViewField('v_pick', 'model', 'v_pick', { model: { path: 'list' } }, [
                    { type: 'pick', prop: '-1' }
                ])
            });
            const parsed = make_view(view, model).view({
                id: 1,
                list: [1,2,3]
            })
            expect(parsed).toEqual({
                $v: 'default',
                id: 1,
                v_pick: 3
            })
        })
        
    })

    describe('[op] to_list d2', () => {
        
        const model = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            prtv: new $BucketModelField('prtv','prtv','string','prtv',true),
            obj: new $BucketModelField('obj','obj','obj','obj',true,undefined,undefined,{
                x: new $BucketModelField('x','x','int','x',true),
                y: new $BucketModelField('y','y','int','y',true),
            }),
            list: new $BucketModelField('list','list','list','list',true,undefined,undefined,{
                '#': new $BucketModelField('#','#','int','#',true)
            }),
            dict: new $BucketModelField('dict','dict','dict','dict',true,undefined,undefined,{
                '#': new $BucketModelField('#','#','int','#',true)
            }),
        });

        it('prtv.to_list()', () =>  {    
            const view = new $BucketView('default', {
                v_list: new $BucketViewField('v_list', 'model', 'v_list', { model: { path: 'prtv' } }, [
                    { type: 'list' }
                ])
            });
            expect(() => make_view(view, model).view({
                id: 1,
                prtv: 'test'
            }))
                .toThrow('Operation to_list on view \'default\' of bucket \'test\' expects an object/array, found string')
        })
    
        it('obj.to_list()', () =>  {    
            const view = new $BucketView('default', {
                v_list: new $BucketViewField('v_list', 'model', 'v_list', { model: { path: 'obj' } }, [
                    { type: 'list' }
                ])
            });
            const parsed = make_view(view, model).view({
                id: 1,
                obj: {x:1,y:2}
            })
            expect(parsed).toEqual({
                $v: 'default',
                id: 1,
                v_list: [1,2]
            })
        })
    
        it('list.to_list()', () =>  {    
            const view = new $BucketView('default', {
                v_list: new $BucketViewField('v_list', 'model', 'v_list', { model: { path: 'list' } }, [
                    { type: 'list' }
                ])
            });
            const parsed = make_view(view, model).view({
                id: 1,
                list: [1,2,3]
            })
            expect(parsed).toEqual({
                $v: 'default',
                id: 1,
                v_list: [1,2,3]
            })
        })
    
        it('dict.to_list()', () =>  {    
            const view = new $BucketView('default', {
                v_list: new $BucketViewField('v_list', 'model', 'v_list', { model: { path: 'dict' } }, [
                    { type: 'list' }
                ])
            });
            const parsed = make_view(view, model).view({
                id: 1,
                dict: {'a':1,'b':2,'c':3}
            })
            expect(parsed).toEqual({
                $v: 'default',
                id: 1,
                v_list: [1,2,3]
            })
        })

    })

    describe('[op] to_dict d2', () => {
        
        const model = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            prtv: new $BucketModelField('prtv','prtv','string','prtv',true),
            obj: new $BucketModelField('obj','obj','obj','obj',true,undefined,undefined,{
                x: new $BucketModelField('x','x','int','x',true),
                y: new $BucketModelField('y','y','int','y',true),
            }),
            list: new $BucketModelField('list','list','list','list',true,undefined,undefined,{
                '#': new $BucketModelField('#','#','int','#',true)
            }),
            dict: new $BucketModelField('dict','dict','dict','dict',true,undefined,undefined,{
                '#': new $BucketModelField('#','#','int','#',true)
            }),
        });

        it('prtv.to_dict()', () =>  {    
            const view = new $BucketView('default', {
                v_dict: new $BucketViewField('v_dict', 'model', 'v_dict', { model: { path: 'prtv' } }, [
                    { type: 'dict' }
                ])
            });
            expect(() => make_view(view, model).view({
                id: 1,
                prtv: 'test'
            }))
                .toThrow('Operation to_dict on view \'default\' of bucket \'test\' expects an array, found string')
        })

        it('obj.to_dict()', () =>  {    
            const view = new $BucketView('default', {
                v_dict: new $BucketViewField('v_dict', 'model', 'v_dict', { model: { path: 'obj' } }, [
                    { type: 'dict' }
                ])
            });
            expect(() => make_view(view, model).view({
                id: 1,
                obj: {x:1,y:2}
            }))
                .toThrow('Operation to_dict on view \'default\' of bucket \'test\' expects an array, found {\n  \'x\': number\n  \'y\': number\n}')
        })
        
        it('list.to_dict()', () =>  {
            const view = new $BucketView('default', {
                v_dict: new $BucketViewField('v_dict', 'model', 'v_dict', { model: { path: 'list' } }, [
                    { type: 'dict' }
                ])
            });
            const parsed = make_view(view, model).view({
                id: 1,
                list: [1,2,3]
            })
            expect(parsed).toEqual({
                $v: 'default',
                id: 1,
                v_dict: { '0': 1, '1': 2, '2': 3 }
            })
        })
    
        it('dict.to_dict()', () =>  {    
            const view = new $BucketView('default', {
                v_dict: new $BucketViewField('v_dict', 'model', 'v_dict', { model: { path: 'dict' } }, [
                    { type: 'dict' }
                ])
            });
            expect(() => make_view(view, model).view({
                id: 1,
                obj: {x:1,y:2}
            }))
                .toThrow('Operation to_dict on view \'default\' of bucket \'test\' expects an array, found { [x: string]: number }')
        })

    })

    describe('[op] group_by d3', () => {
        
        const model = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            prtv: new $BucketModelField('prtv','prtv','string','prtv',true),
            obj: new $BucketModelField('obj','obj','obj','obj',true,undefined,undefined,{
                obj: new $BucketModelField('obj','obj.obj','obj','obj',true,undefined,undefined,{
                    x: new $BucketModelField('x','obj.obj.x','int','x',true),
                    y: new $BucketModelField('y','obj.obj.y','int','y',true),
                }),
                list: new $BucketModelField('list','obj.list','list','list',true,undefined,undefined,{
                    '#': new $BucketModelField('#','obj.list.#','int','#',true)
                }),
                dict: new $BucketModelField('dict','obj.dict','dict','dict',true,undefined,undefined,{
                    '#': new $BucketModelField('#','obj.dict.#','int','#',true)
                }),
            }),
            list: new $BucketModelField('list','list','list','list',true,undefined,undefined,{
                '#': new $BucketModelField('obj','list.#','obj','obj',true,undefined,undefined,{
                    prtv: new $BucketModelField('prtv','prtv','string','prtv',true),
                    obj: new $BucketModelField('obj','list.#.obj','obj','obj',true,undefined,undefined,{
                        x: new $BucketModelField('x','list.#.obj.x','int','x',true),
                        y: new $BucketModelField('y','list.#.obj.y','int','y',true),
                    }),
                    list: new $BucketModelField('list','list.#.list','list','list',true,undefined,undefined,{
                        '#': new $BucketModelField('#','list.#.list.#','int','#',true)
                    }),
                    dict: new $BucketModelField('dict','list.#.dict','dict','dict',true,undefined,undefined,{
                        '#': new $BucketModelField('#','list.#.dict.#','int','#',true)
                    }),
                }),
            }),
        });

        it('list.group_by(prtv)', () =>  {    
            const view = new $BucketView('default', {
                v_group: new $BucketViewField('v_group', 'model', 'v_group', { model: { path: 'list' } }, [
                    { type: 'group', key: 'prtv' }
                ])
            });
            const parsed = make_view(view, model).view({
                id: 1,
                list: [
                    { prtv: 'one', obj: {x:1,y:2}, list: [1,2,3], dict: {'a':1,'b':2,'c':3} },
                    { prtv: 'two', obj: {x:3,y:4}, list: [2,3,4], dict: {'a':2,'b':3,'c':4} },
                    { prtv: 'one', obj: {x:5,y:6}, list: [3,4,5], dict: {'a':3,'b':4,'c':5} },
                ]
            })
            expect(parsed).toEqual({
                $v: 'default',
                id: 1,
                v_group: {
                    'one': [
                        { prtv: 'one', obj: {x:1,y:2}, list: [1,2,3], dict: {'a':1,'b':2,'c':3} },
                        { prtv: 'one', obj: {x:5,y:6}, list: [3,4,5], dict: {'a':3,'b':4,'c':5} },
                    ],
                    'two': [
                        { prtv: 'two', obj: {x:3,y:4}, list: [2,3,4], dict: {'a':2,'b':3,'c':4} },
                    ]
                }
            })
        })

        it('list.group_by(obj)', () =>  {    
            const view = new $BucketView('default', {
                v_group: new $BucketViewField('v_group', 'model', 'v_group', { model: { path: 'list' } }, [
                    { type: 'group', key: 'obj' }
                ])
            });
            expect(() => make_view(view, model).view({
                id: 1,
                list: [
                    { prtv: 'one', obj: {x:1,y:2}, list: [1,2,3], dict: {'a':1,'b':2,'c':3} },
                    { prtv: 'two', obj: {x:3,y:4}, list: [2,3,4], dict: {'a':2,'b':3,'c':4} },
                    { prtv: 'one', obj: {x:5,y:6}, list: [3,4,5], dict: {'a':3,'b':4,'c':5} },
                ]
            }))
                .toThrow('Operation group_by on view \'default\' of bucket \'test\' expects property used as group index to be castable to string, instead found {\n  \'prtv\': string\n  \'obj\': {\n    \'x\': number\n    \'y\': number\n  }\n  \'list\': number[]\n  \'dict\': { [x: string]: number }\n}[]')
        })
    

    })

    describe('[op] transform d2', () => {
        
        const model = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            prtv: new $BucketModelField('prtv','prtv','string','prtv',true),
            obj: new $BucketModelField('obj','obj','obj','obj',true,undefined,undefined,{
                x: new $BucketModelField('x','x','int','x',true),
                y: new $BucketModelField('y','y','int','y',true),
            }),
            list: new $BucketModelField('list','list','list','list',true,undefined,undefined,{
                '#': new $BucketModelField('#','#','int','#',true)
            }),
            dict: new $BucketModelField('dict','dict','dict','dict',true,undefined,undefined,{
                '#': new $BucketModelField('#','#','int','#',true)
            }),
        });

        it('prtv.transform()', () =>  {    
            const view = new $BucketView('default', {
                v_transform: new $BucketViewField('v_transform', 'model', 'v_transform', { model: { path: 'prtv' } }, [
                    {
                        type: 'transform',
                        fn: $ => {
                            const x = $.value.length;
                            return `${$.value}:${x}`;
                        }
                    }
                ])
            });
            const parsed = make_view(view, model).view({
                id: 1,
                prtv: 'test'
            })
            expect(parsed).toEqual({
                $v: 'default',
                id: 1,
                v_transform: 'test:4'
            })
        })
        
    })

    describe('[op] map d2', () => {
        
        const model = new $BucketModel({
            id: new $BucketModelField('id','id','int','id',true),
            prtv: new $BucketModelField('prtv','prtv','string','prtv',true),
            obj: new $BucketModelField('obj','obj','obj','obj',true,undefined,undefined,{
                x: new $BucketModelField('x','x','int','x',true),
                y: new $BucketModelField('y','y','int','y',true),
            }),
            list: new $BucketModelField('list','list','list','list',true,undefined,undefined,{
                '#': new $BucketModelField('#','#','int','#',true)
            }),
            dict: new $BucketModelField('dict','dict','dict','dict',true,undefined,undefined,{
                '#': new $BucketModelField('#','#','int','#',true)
            }),
        });

        it('obj.map()', () =>  {
            const view = new $BucketView('default', {
                v_map: new $BucketViewField('v_map', 'model', 'v_map', { model: { path: 'obj' } }, [
                    {
                        type: 'map', ops: [
                            { type: 'transform', fn: $ => $.value*3 }
                        ]
                    }
                ])
            });
            const parsed = make_view(view, model).view({
                id: 1,
                obj: {x:1,y:2}
            })
            expect(parsed).toEqual({
                $v: 'default',
                id: 1,
                v_map: {x:3,y:6}
            })
        })

        it('list.map()', () =>  {
            const view = new $BucketView('default', {
                v_map: new $BucketViewField('v_map', 'model', 'v_map', { model: { path: 'list' } }, [
                    {
                        type: 'map', ops: [
                            { type: 'transform', fn: $ => $.value*3 }
                        ]
                    }
                ])
            });
            const parsed = make_view(view, model).view({
                id: 1,
                list: [1,2,3]
            })
            expect(parsed).toEqual({
                $v: 'default',
                id: 1,
                v_map: [3,6,9]
            })
        })
        
    })
})
