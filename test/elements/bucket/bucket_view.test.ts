import { Log } from '~/engine/util/log'
import type { BucketInject} from 'nesoi/tools/joaquin/bucket';
import { t } from 'nesoi/tools/joaquin/bucket';

Log.level = 'off';

const primitive_bucket = t.bucket('test', $ => $
    .model($ => ({
        id: $.int,
        name: $.string
    }))
)
    .with.obj({ id: 1, name: 'One' })

const obj_bucket = t.bucket('test', $ => $
    .model($ => ({
        id: $.int,
        obj: $.obj({
            x: $.int,
            y: $.int,
        })
    }))
)
    .with.obj({ id: 1, obj: {x:1,y:2} })

const list_bucket = t.bucket('test', $ => $
    .model($ => ({
        id: $.int,
        list: $.list($.int)
    }))
)
    .with.obj({ id: 1, list: [1,2,3] })

const dict_bucket = t.bucket('test', $ => $
    .model($ => ({
        id: $.int,
        dict: $.dict($.int)
    }))
)
    .with.obj({ id: 1, dict: {'a':1,'b':2,'c':3} })

const obj_obj_bucket = t.bucket('test', $ => $
    .model($ => ({
        id: $.int,
        obj: $.obj({
            x: $.obj({ xx: $.int, xy: $.int }),
            y: $.obj({ xy: $.int, yz: $.int }),
        })
    }))
)
    .with.obj({ id: 1, obj: {
        x: { xx: 1, xy: 2 },
        y: { xy: 3, yz: 4 },
    }})

const obj_list_bucket = t.bucket('test', $ => $
    .model($ => ({
        id: $.int,
        obj: $.obj({
            x: $.list($.string),
            y: $.list($.int)
        })
    }))
)
    .with.obj({ id: 1, obj: {
        x: ['test1','test2','test3'],
        y: [1,2,3],
    }})

const obj_dict_bucket = t.bucket('test', $ => $
    .model($ => ({
        id: $.int,
        obj: $.obj({
            x: $.dict($.string),
            y: $.dict($.int)
        })
    }))
)
    .with.obj({ id: 1, obj: {
        x: {'a':1,'b':2,'c':3},
        y: {'c':4,'d':5,'e':6}
    }})

const list_obj_bucket = t.bucket('test', $ => $
    .model($ => ({
        id: $.int,
        list: $.list($.obj({
            x: $.int,
            y: $.int
        }))
    }))
)
    .with.obj({ id: 1, list: [
        {x:1,y:2},
        {x:3,y:4},
    ]})

const list_list_bucket = t.bucket('test', $ => $
    .model($ => ({
        id: $.int,
        list: $.list($.list($.int))
    }))
)
    .with.obj({ id: 1, list: [
        [1,2,3],
        [4,5,6]
    ]})

const list_dict_bucket = t.bucket('test', $ => $
    .model($ => ({
        id: $.int,
        list: $.list($.dict($.int))
    }))
)
    .with.obj({ id: 1, list: [
        {'a':1,'b':2,'c':3},
        {'d':4,'e':5,'f':6}
    ]})

const dict_obj_bucket = t.bucket('test', $ => $
    .model($ => ({
        id: $.int,
        dict: $.dict($.obj({
            x: $.int,
            y: $.int
        }))
    }))
)
    .with.obj({ id: 1, dict: {
        'a': {x:1,y:2},
        'b': {x:3,y:4}
    }})

const dict_list_bucket = t.bucket('test', $ => $
    .model($ => ({
        id: $.int,
        dict: $.dict($.list($.int))
    }))
)
    .with.obj({ id: 1, dict: {
        'a': [1,2,3],
        'b': [4,5,6],
    }})

const dict_dict_bucket = t.bucket('test', $ => $
    .model($ => ({
        id: $.int,
        dict: $.dict($.dict($.int))
    }))
)
    .with.obj({ id: 1, dict: {
        'a': {'aa':1,'ab':2,'ac':3},
        'b': {'ba':4,'bb':5,'bc':6},
    }})

function test<
    B extends BucketInject<any, any>
>(
    bucket: B,
    extend: Parameters<B['extend']>[0],
    output: {
        ok: Record<string, any>
    } | {
        error: string
    }
) {
    return t.given(bucket
        .extend(extend)
    )
        .when.bucket('test' as any, $ => {
            return $.bucket.viewOne($.trx, 1 as any, 'default' as any)
        })
        .then($ => {
            if ('ok' in output) {
                if ($.status.state === 'error') {
                    throw $.status.error;
                }
                expect($.status.state).toEqual('ok')
                expect($.status.output!).toEqual({
                    $v: 'default',
                    id: 1,
                    ...output.ok
                })
            }
            else {
                expect($.status.state).toEqual('error')
                expect($.status.error!.name).toEqual(output.error)
            }
        })
}

describe('Bucket: View', () => {

    describe('Edge Cases', () => {
        
        it('empty view', () => t
            .given(t
                .bucket('test', $ => $
                    .model($ => ({
                        id: $.int,
                        name: $.string,
                    }))
                    .view('default', $ => ({}))
                )
                .with.obj({
                    id: 1, name: 'One'
                })
            )
            .when.bucket('test', $ => {
                return $.bucket.viewOne($.trx, 1, 'default')
            })
            .then($ => {
                expect($.status.state).toEqual('ok')
                expect($.status.output!).toEqual({
                    $v: 'default',
                    id: 1
                })
            })
        )

    })

    describe('Field: model', () => {
        
        it('primitive', () =>
            test(primitive_bucket,
                $ => $.view('default', $ => ({
                    v_name: $.model('name')
                })),
                { ok: {
                    v_name: 'One'
                }}))
        
        it('obj', () =>
            test(obj_bucket,
                $ => $.view('default', $ => ({
                    v_obj: $.model('obj'),
                    v_obj_x: $.model('obj.x'),
                    v_obj_y: $.model('obj.y')
                })),
                { ok: {
                    v_obj: {x:1,y:2},
                    v_obj_x: 1,
                    v_obj_y: 2,
                }}))
        
        it('obj spread', () =>
            test(obj_bucket,
                $ => $.view('default', $ => ({
                    v_spread: $.model('obj.*')
                })),
                { ok: {
                    v_spread: {x:1, y:2}
                }}))
        
        it('list', () =>
            test(list_bucket,
                $ => $.view('default', $ => ({
                    v_list: $.model('list'),
                    v_list_first: $.model('list.0'),
                    v_list_last: $.model('list.-1'),
                    v_list_none: $.model('list.3'),
                })),
                { ok: {
                    v_list: [1,2,3],
                    v_list_first: 1,
                    v_list_last: 3,
                    // v_list_none: undefined,
                }}))
        
        it('list spread', () =>
            test(list_bucket,
                $ => $.view('default', $ => ({
                    v_spread: $.model('list.*')
                })),
                { ok: {
                    v_spread: [1,2,3]
                }}))
        
        it('dict', () =>
            test(dict_bucket,
                $ => $.view('default', $ => ({
                    v_dict: $.model('dict'),
                    v_dict_a: $.model('dict.a'),
                    v_dict_b: $.model('dict.b'),
                    v_dict_none: $.model('dict.z')
                })),
                { ok: {
                    v_dict: {'a':1,'b':2,'c':3},
                    v_dict_a: 1,
                    v_dict_b: 2,
                    // v_dict_none: undefined
                }}))
        
        it('dict spread', () =>
            test(dict_bucket,
                $ => $.view('default', $ => ({
                    v_spread: $.model('dict.*'),
                })),
                { ok: {
                    v_spread: {'a':1,'b':2,'c':3}
                }}))

        it('obj|obj', () =>
            test(obj_obj_bucket,
                $ => $.view('default', $ => ({
                    v_obj: $.model('obj'),
                    v_obj_x: $.model('obj.x'),
                    v_obj_x_xx: $.model('obj.x.xx'),
                    v_obj_y_yz: $.model('obj.y.yz'),
                })),
                { ok: {
                    v_obj: {
                        x: { xx: 1, xy: 2 },
                        y: { xy: 3, yz: 4 },
                    },
                    v_obj_x: { xx: 1, xy: 2 },
                    v_obj_x_xx: 1,
                    v_obj_y_yz: 4,
                }}))

        it('obj|obj spread', () =>
            test(obj_obj_bucket,
                $ => $.view('default', $ => ({
                    v_spread: $.model('obj.*'),
                    v_spread_xx: $.model('obj.*.xx'),
                    v_spread_xy: $.model('obj.*.xy'),
                    v_spread_yz: $.model('obj.*.yz'),
                    v_spread_spread: $.model('obj.*.*'),
                })),
                { ok: {
                    v_spread: {
                        x: { xx: 1, xy: 2 },
                        y: { xy: 3, yz: 4 },
                    },
                    v_spread_xx: [1],
                    v_spread_xy: [2,3],
                    v_spread_yz: [4],
                    v_spread_spread: [
                        { xx: 1, xy: 2 },
                        { xy: 3, yz: 4 },
                    ],
                }}))

        it('obj|list', () =>
            test(obj_list_bucket,
                $ => $.view('default', $ => ({
                    v_obj: $.model('obj'),
                    v_obj_x: $.model('obj.x'),
                    v_obj_x_middle: $.model('obj.x.1'),
                    v_obj_y_last: $.model('obj.y.-1'),
                })),
                { ok: {
                    v_obj: {
                        x: ['test1','test2','test3'],
                        y: [1,2,3],
                    },
                    v_obj_x: ['test1','test2','test3'],
                    v_obj_x_middle: 'test2',
                    v_obj_y_last: 3,
                }}))

        it('obj|list spread', () =>
            test(obj_list_bucket,
                $ => $.view('default', $ => ({
                    v_spread: $.model('obj.*'),
                    v_spread_first: $.model('obj.*.0'),
                    v_spread_last: $.model('obj.*.-1'),
                    v_spread_spread: $.model('obj.*.*'),
                })),
                { ok: {
                    v_spread: {
                        x: ['test1','test2','test3'],
                        y: [1,2,3],
                    },
                    v_spread_first: ['test1',1],
                    v_spread_last: ['test3',3],
                    v_spread_spread: ['test1','test2','test3',1,2,3],
                }}))

        it('obj|dict', () =>
            test(obj_dict_bucket,
                $ => $.view('default', $ => ({
                    v_obj: $.model('obj'),
                    v_obj_x: $.model('obj.x'),
                    v_obj_x_a: $.model('obj.x.a'),
                    v_obj_y_e: $.model('obj.y.e'),
                })),
                { ok: {
                    v_obj: {
                        x: {'a':1,'b':2,'c':3},
                        y: {'c':4,'d':5,'e':6}
                    },
                    v_obj_x: {'a':1,'b':2,'c':3},
                    v_obj_x_a: 1,
                    v_obj_y_e: 6,
                }}))

        it('obj|dict spread', () =>
            test(obj_dict_bucket,
                $ => $.view('default', $ => ({
                    v_spread: $.model('obj.*'),
                    v_spread_a: $.model('obj.*.a'),
                    v_spread_c: $.model('obj.*.c'),
                    v_spread_spread: $.model('obj.*.*'),
                })),
                { ok: {
                    v_spread: {
                        x: {'a':1,'b':2,'c':3},
                        y: {'c':4,'d':5,'e':6}
                    },
                    v_spread_a: [1],
                    v_spread_c: [3,4],
                    v_spread_spread: [
                        {'a':1,'b':2,'c':3},
                        {'c':4,'d':5,'e':6}
                    ]
                }}))

        it('list|obj', () =>
            test(list_obj_bucket,
                $ => $.view('default', $ => ({
                    v_list: $.model('list'),
                    v_list_first: $.model('list.0'),
                    v_list_first_x: $.model('list.0.x'),
                    v_list_last_y: $.model('list.-1.y'),
                })),
                { ok: {
                    v_list: [
                        {x:1,y:2},
                        {x:3,y:4},
                    ],
                    v_list_first: {x:1,y:2},
                    v_list_first_x: 1,
                    v_list_last_y: 4,
                }}))

        it('list|obj spread', () =>
            test(list_obj_bucket,
                $ => $.view('default', $ => ({
                    v_spread: $.model('list.*'),
                    v_spread_x: $.model('list.*.x'),
                    v_spread_y: $.model('list.*.y'),
                    v_spread_spread: $.model('list.*.*'),
                })),
                { ok: {
                    v_spread: [
                        {x:1,y:2},
                        {x:3,y:4},
                    ],
                    v_spread_x: [1,3],
                    v_spread_y: [2,4],
                    v_spread_spread: [
                        {x:1,y:2},
                        {x:3,y:4},
                    ]
                }}))

        it('list|list', () =>
            test(list_list_bucket,
                $ => $.view('default', $ => ({
                    v_list: $.model('list'),
                    v_list_first: $.model('list.0'),
                    v_list_first_middle: $.model('list.0.1'),
                    v_list_last_last: $.model('list.-1.-1'),
                })),
                { ok: {
                    v_list: [
                        [1,2,3],
                        [4,5,6]
                    ],
                    v_list_first: [1,2,3],
                    v_list_first_middle: 2,
                    v_list_last_last: 6,
                }}))

        it('list|list spread', () =>
            test(list_list_bucket,
                $ => $.view('default', $ => ({
                    v_spread: $.model('list.*'),
                    v_spread_first: $.model('list.*.0'),
                    v_spread_last: $.model('list.*.-1'),
                    v_spread_spread: $.model('list.*.*'),
                })),
                { ok: {
                    v_spread: [
                        [1,2,3],
                        [4,5,6]
                    ],
                    v_spread_first: [1,4],
                    v_spread_last: [3,6],
                    v_spread_spread: [1,2,3,4,5,6]
                }}))

        it('list|dict', () =>
            test(list_dict_bucket,
                $ => $.view('default', $ => ({
                    v_list: $.model('list'),
                    v_list_first: $.model('list.0'),
                    v_list_first_a: $.model('list.0.a'),
                    v_list_last_f: $.model('list.-1.f'),
                })),
                { ok: {
                    v_list: [
                        {'a':1,'b':2,'c':3},
                        {'d':4,'e':5,'f':6}
                    ],
                    v_list_first: {'a':1,'b':2,'c':3},
                    v_list_first_a: 1,
                    v_list_last_f: 6,
                }}))

        it('list|dict spread', () =>
            test(list_dict_bucket,
                $ => $.view('default', $ => ({
                    v_spread: $.model('list.*'),
                    v_spread_a: $.model('list.*.a'),
                    v_spread_f: $.model('list.*.f'),
                    v_spread_spread: $.model('list.*.*'),
                })),
                { ok: {
                    v_spread: [
                        {'a':1,'b':2,'c':3},
                        {'d':4,'e':5,'f':6}
                    ],
                    v_spread_a: [1],
                    v_spread_f: [6],
                    v_spread_spread: [
                        {'a':1,'b':2,'c':3},
                        {'d':4,'e':5,'f':6}
                    ],
                }}))

        it('dict|obj', () =>
            test(dict_obj_bucket,
                $ => $.view('default', $ => ({
                    v_dict: $.model('dict'),
                    v_dict_a: $.model('dict.a'),
                    v_dict_a_x: $.model('dict.a.x'),
                    v_dict_b_y: $.model('dict.b.y'),
                })),
                { ok: {
                    v_dict: {
                        'a': {x:1,y:2},
                        'b': {x:3,y:4}
                    },
                    v_dict_a: {x:1,y:2},
                    v_dict_a_x: 1,
                    v_dict_b_y: 4,
                }}))

        it('dict|obj spread', () =>
            test(dict_obj_bucket,
                $ => $.view('default', $ => ({
                    v_spread: $.model('dict.*'),
                    v_spread_x: $.model('dict.*.x'),
                    v_spread_y: $.model('dict.*.y'),
                    v_spread_spread: $.model('dict.*.*'),
                })),
                { ok: {
                    v_spread: {
                        'a': {x:1,y:2},
                        'b': {x:3,y:4}
                    },
                    v_spread_x: [1,3],
                    v_spread_y: [2,4],
                    v_spread_spread: [
                        {x:1,y:2},
                        {x:3,y:4}
                    ],
                }}))

        it('dict|list', () =>
            test(dict_list_bucket,
                $ => $.view('default', $ => ({
                    v_dict: $.model('dict'),
                    v_dict_a: $.model('dict.a'),
                    v_dict_a_first: $.model('dict.a.0'),
                    v_dict_b_last: $.model('dict.b.-1'),
                })),
                { ok: {
                    v_dict: {
                        'a': [1,2,3],
                        'b': [4,5,6],
                    },
                    v_dict_a: [1,2,3],
                    v_dict_a_first: 1,
                    v_dict_b_last: 6,
                }}))

        it('dict|list spread', () =>
            test(dict_list_bucket,
                $ => $.view('default', $ => ({
                    v_spread: $.model('dict.*'),
                    v_spread_first: $.model('dict.*.0'),
                    v_spread_last: $.model('dict.*.-1'),
                    v_spread_spread: $.model('dict.*.*'),
                })),
                { ok: {
                    v_spread: {
                        'a': [1,2,3],
                        'b': [4,5,6],
                    },
                    v_spread_first: [1,4],
                    v_spread_last: [3,6],
                    v_spread_spread: [1,2,3,4,5,6],
                }}))

        it('dict|dict', () =>
            test(dict_dict_bucket,
                $ => $.view('default', $ => ({
                    v_dict: $.model('dict'),
                    v_dict_a: $.model('dict.a'),
                    v_dict_a_aa: $.model('dict.a.aa'),
                    v_dict_b_bc: $.model('dict.b.bc'),
                })),
                { ok: {
                    v_dict: {
                        'a': {'aa':1,'ab':2,'ac':3},
                        'b': {'ba':4,'bb':5,'bc':6},
                    },
                    v_dict_a: {'aa':1,'ab':2,'ac':3},
                    v_dict_a_aa: 1,
                    v_dict_b_bc: 6,
                }}))

        it('dict|dict spread', () =>
            test(dict_dict_bucket,
                $ => $.view('default', $ => ({
                    v_spread: $.model('dict.*'),
                    v_spread_aa: $.model('dict.*.aa'),
                    v_spread_bc: $.model('dict.*.bc'),
                    v_spread_spread: $.model('dict.*.*'),
                })),
                { ok: {
                    v_spread: {
                        'a': {'aa':1,'ab':2,'ac':3},
                        'b': {'ba':4,'bb':5,'bc':6},
                    },
                    v_spread_aa: [1],
                    v_spread_bc: [6],
                    v_spread_spread: [
                        {'aa':1,'ab':2,'ac':3},
                        {'ba':4,'bb':5,'bc':6},
                    ],
                }}))

    })

    // describe('Op: pick', () => {
        
    //     it('prtv # pick (throw)', () => 
    //         test(primitive_bucket,
    //             $ => $.view('default', $ => ({
    //                 // This should not be allowed on type checking, so it's disabled to test the js runtime.
    //                 v_pick: $.model('name').pick('a' as never) as never
    //             })),
    //             { error:
    //                 'Bucket.View.PickNonObj'
    //             }))
        
    //     it('obj # pick', () => 
    //         test(obj_bucket,
    //             $ => $.view('default', $ => ({
    //                 v_pick: $.model('obj').pick('x')
    //             })),
    //             { ok: {
    //                 v_pick: 1
    //             }}))
        
    //     it('list # pick', () => 
    //         test(list_bucket,
    //             $ => $.view('default', $ => ({
    //                 v_pick_middle: $.model('list').pick(1),
    //                 v_pick_last: $.model('list').pick(-1),
    //             })),
    //             { ok: {
    //                 v_pick_middle: 2,
    //                 v_pick_last: 3
    //             }}))
    
    //     it('dict # pick', () => 
    //         test(dict_bucket,
    //             $ => $.view('default', $ => ({
    //                 v_pick_a: $.model('dict').pick('a'),
    //                 v_pick_c: $.model('dict').pick('c'),
    //             })),
    //             { ok: {
    //                 v_pick_a: 1,
    //                 v_pick_c: 3
    //             }}))

    // })

    // describe('Op: to_list', () => {
        
    //     it('prtv (throw)', () => 
    //         test(primitive_bucket,
    //             $ => $.view('default', $ => ({
    //                 // This should not be allowed on type checking, so it's disabled to test the js runtime.
    //                 v_to_list: $.model('name').to_list() as never
    //             })),
    //             { error:
    //                 'Bucket.View.ToListNonObj'
    //             }))
        
    //     it('obj', () => 
    //         test(obj_bucket,
    //             $ => $.view('default', $ => ({
    //                 v_to_list: $.model('obj').to_list()
    //             })),
    //             { ok: {
    //                 v_to_list: [1,2]
    //             }}))
        
    //     it('list', () => 
    //         test(list_bucket,
    //             $ => $.view('default', $ => ({
    //                 v_to_list: $.model('list').to_list()
    //             })),
    //             { ok: {
    //                 v_to_list: [1,2,3]
    //             }}))
        
    //     it('dict', () => 
    //         test(dict_bucket,
    //             $ => $.view('default', $ => ({
    //                 v_to_list: $.model('dict').to_list()
    //             })),
    //             { ok: {
    //                 v_to_list: [1,2,3]
    //             }}))

    // })

    // describe('Op: to_dict', () => {
        
    //     it('prtv (throw)', () => 
    //         test(primitive_bucket,
    //             $ => $.view('default', $ => ({
    //                 // This should not be allowed on type checking, so it's disabled to test the js runtime.
    //                 v_to_dict: $.model('name').to_dict() as never
    //             })),
    //             { error:
    //                 'Bucket.View.ToDictNonArray'
    //             }))
        
    //     it('obj (throw)', () => 
    //         test(obj_bucket,
    //             $ => $.view('default', $ => ({
    //                 // This should not be allowed on type checking, so it's disabled to test the js runtime.
    //                 v_to_dict: $.model('obj').to_dict() as never
    //             })),
    //             { error:
    //                 'Bucket.View.ToDictNonArray'
    //             }))
        
    //     it('obj.* (throw)', () => 
    //         // This throws because adding .* to a model is the equivalent of a .map operation,
    //         // which means the to_dict would be applied for each element, not the list of results.
    //         test(obj_bucket,
    //             $ => $.view('default', $ => ({
    //                 // This should not be allowed on type checking, so it's disabled to test the js runtime.
    //                 v_to_dict: $.model('obj.*').to_dict() as never
    //             })),
    //             { error:
    //                 'Bucket.View.ToDictNonArray'
    //             }))
        
    //     it('list', () => 
    //         test(list_bucket,
    //             $ => $.view('default', $ => ({
    //                 v_to_dict: $.model('list').to_dict()
    //             })),
    //             { ok: {
    //                 v_to_dict: {'0':1, '1':2, '2': 3}
    //             }}))
        
    //     it('list +key (throw)', () => 
    //         test(list_bucket,
    //             $ => $.view('default', $ => ({
    //                 v_to_dict: $.model('list').to_dict('x' as never)
    //             })),
    //             { error:
    //                 'Bucket.View.ToDictNonObjChild'
    //             }))
        
    //     it('dict (throw)', () => 
    //         test(dict_bucket,
    //             $ => $.view('default', $ => ({
    //                 // This should not be allowed on type checking, so it's disabled to test the js runtime.
    //                 v_to_dict: $.model('dict').to_dict() as never
    //             })),
    //             { error:
    //                 'Bucket.View.ToDictNonArray'
    //             }))
        
    //     it('dict.* (throw)', () => 
    //         // This throws because adding .* to a model is the equivalent of a .map operation,
    //         // which means the to_dict would be applied for each element, not the list of results.
    //         test(dict_bucket,
    //             $ => $.view('default', $ => ({
    //                 v_to_dict: $.model('dict.*').to_dict() as never
    //             })),
    //             { error:
    //                 'Bucket.View.ToDictNonArray'
    //             }))

    // })

    // describe('Op: to_list', () => {
        
    //     it('prtv # to_list (throw)', () => t
    //         .given(t
    //             .bucket('test', $ => $
    //                 .model($ => ({
    //                     id: $.int,
    //                     name: $.string
    //                 }))
    //                 .view('default', $ => ({
    //                     // This should not be allowed on type checking,
    //                     // so it's disabled to test the js runtime.
    //                     val: $.model('name').to_list() as never
    //                 }))
    //             )
    //             .with.obj({
    //                 id: 1,
    //                 name: 'One'
    //             })
    //         )
    //         .when.bucket('test', $ => {
    //             return $.bucket.viewOne($.trx, 1, 'default')
    //         })
    //         .then($ => {
    //             expect($.status.state).toEqual('error')
    //             expect($.status.error!.name).toEqual('Bucket.View.ToListNonObj')
    //         })
    //     )
        
    //     it('obj # to_list', () => t
    //         .given(t
    //             .bucket('test', $ => $
    //                 .model($ => ({
    //                     id: $.int,
    //                     name: $.string
    //                 }))
    //                 .view('default', $ => ({
    //                     // This should not be allowed on type checking,
    //                     // so it's disabled to test the js runtime.
    //                     val: $.model('name').to_list() as never
    //                 }))
    //             )
    //             .with.obj({
    //                 id: 1,
    //                 name: 'One'
    //             })
    //         )
    //         .when.bucket('test', $ => {
    //             return $.bucket.viewOne($.trx, 1, 'default')
    //         })
    //         .then($ => {
    //             expect($.status.state).toEqual('error')
    //             expect($.status.error!.name).toEqual('Bucket.View.ToListNonObj')
    //         })
    //     )
        
    // })
})
