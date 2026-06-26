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
        'b': {x:1,y:2}
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
                    v_spread: [1,2]
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
                    v_spread: [1,2,3]
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
                })),
                { ok: {
                    v_spread: [
                        { xx: 1, xy: 2 },
                        { xy: 3, yz: 4 },
                    ],
                    v_spread_xx: [1],
                    v_spread_xy: [2,3],
                    v_spread_yz: [4],
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
                    v_spread_last: $.model('obj.*.-1')
                })),
                { ok: {
                    v_spread: [
                        ['test1','test2','test3'],
                        [1,2,3],
                    ],
                    v_spread_first: ['test1',1],
                    v_spread_last: ['test3',3]
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
                })),
                { ok: {
                    v_spread: [
                        {'a':1,'b':2,'c':3},
                        {'c':4,'d':5,'e':6}
                    ],
                    v_spread_a: [1],
                    v_spread_c: [3,4],
                }}))

    })

    // describe('Op: pick', () => {
        
    //     it('prtv # pick (throw)', () => t
    //         .given(t
    //             .bucket('test', $ => $
    //                 .model($ => ({
    //                     id: $.int,
    //                     name: $.string
    //                 }))
    //                 .view('default', $ => ({
    //                     // This should not be allowed on type checking,
    //                     // so it's disabled to test the js runtime.
    //                     val: $.model('name').pick('a' as never) as never
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
    //             expect($.status.error!.name).toEqual('Bucket.View.PickNonObj')
    //         })
    //     )
        
    //     it('obj # pick', () => t
    //         .given(t
    //             .bucket('test', $ => $
    //                 .model($ => ({
    //                     id: $.int,
    //                     obj: $.obj({
    //                         a: $.string,
    //                         b: $.float
    //                     }),
    //                 }))
    //                 .view('default', $ => ({
    //                     val: $.model('obj').pick('a')
    //                 }))
    //             )
    //             .with.obj({
    //                 id: 1,
    //                 obj: {
    //                     a: 'test',
    //                     b: 12.34
    //                 }
    //             })
    //         )
    //         .when.bucket('test', $ => {
    //             return $.bucket.viewOne($.trx, 1, 'default')
    //         })
    //         .then($ => {
    //             expect($.status.state).toEqual('ok')
    //             expect($.status.output!).toEqual({
    //                 $v: 'default',
    //                 id: 1,
    //                 val: 'test'
    //             })
    //         })
    //     )
        
    //     it('obj > * # pick', () => t
    //         .given(t
    //             .bucket('test', $ => $
    //                 .model($ => ({
    //                     id: $.int,
    //                     obj: $.obj({
    //                         a: $.obj({ x: $.int, y: $.int }),
    //                         b: $.obj({ y: $.int, z: $.int }),
    //                     }),
    //                 }))
    //                 .view('default', $ => ({
    //                     val: $.model('obj.*').pick('y')
    //                 }))
    //             )
    //             .with.obj({
    //                 id: 1,
    //                 obj: {
    //                     a: {x:1,y:2},
    //                     b: {y:3,z:4},
    //                 }
    //             })
    //         )
    //         .when.bucket('test', $ => {
    //             return $.bucket.viewOne($.trx, 1, 'default')
    //         })
    //         .then($ => {
    //             expect($.status.state).toEqual('ok')
    //             expect($.status.output!).toEqual({
    //                 $v: 'default',
    //                 id: 1,
    //                 val: [2,3]
    //             })
    //         })
    //     )
        
    //     it('list # pick', () => t
    //         .given(t
    //             .bucket('test', $ => $
    //                 .model($ => ({
    //                     id: $.int,
    //                     list: $.list($.obj({
    //                         a: $.string,
    //                         b: $.float
    //                     })),
    //                 }))
    //                 .view('default', $ => ({
    //                     val: $.model('list').pick(1)
    //                 }))
    //             )
    //             .with.obj({
    //                 id: 1,
    //                 list: [
    //                     { a: 'test1', b: 12.34 },
    //                     { a: 'test2', b: 56.78 }
    //                 ]
    //             })
    //         )
    //         .when.bucket('test', $ => {
    //             return $.bucket.viewOne($.trx, 1, 'default')
    //         })
    //         .then($ => {
    //             expect($.status.state).toEqual('ok')
    //             expect($.status.output!).toEqual({
    //                 $v: 'default',
    //                 id: 1,
    //                 val: { a: 'test2', b: 56.78 }
    //             })
    //         })
    //     )
        
    //     it('list > * # pick', () => t
    //         .given(t
    //             .bucket('test', $ => $
    //                 .model($ => ({
    //                     id: $.int,
    //                     list: $.list($.obj({
    //                         a: $.string,
    //                         b: $.float
    //                     })),
    //                 }))
    //                 .view('default', $ => ({
    //                     val: $.model('list.*').pick('a')
    //                 }))
    //             )
    //             .with.obj({
    //                 id: 1,
    //                 list: [
    //                     { a: 'test1', b: 12.34 },
    //                     { a: 'test2', b: 56.78 }
    //                 ]
    //             })
    //         )
    //         .when.bucket('test', $ => {
    //             return $.bucket.viewOne($.trx, 1, 'default')
    //         })
    //         .then($ => {
    //             expect($.status.state).toEqual('ok')
    //             expect($.status.output!).toEqual({
    //                 $v: 'default',
    //                 id: 1,
    //                 val: ['test1', 'test2']
    //             })
    //         })
    //     )

    //     it('dict # pick', () => t
    //         .given(t
    //             .bucket('test', $ => $
    //                 .model($ => ({
    //                     id: $.int,
    //                     dict: $.dict($.obj({
    //                         a: $.string,
    //                         b: $.float
    //                     })),
    //                 }))
    //                 .view('default', $ => ({
    //                     val: $.model('dict').pick('y')
    //                 }))
    //             )
    //             .with.obj({
    //                 id: 1,
    //                 dict: {
    //                     'x': { a: 'test1', b: 12.34 },
    //                     'y': { a: 'test2', b: 56.78 }
    //                 }
    //             })
    //         )
    //         .when.bucket('test', $ => {
    //             return $.bucket.viewOne($.trx, 1, 'default')
    //         })
    //         .then($ => {
    //             expect($.status.state).toEqual('ok')
    //             expect($.status.output!).toEqual({
    //                 $v: 'default',
    //                 id: 1,
    //                 val: { a: 'test2', b: 56.78 }
    //             })
    //         })
    //     )

    //     it('dict > * # pick', () => t
    //         .given(t
    //             .bucket('test', $ => $
    //                 .model($ => ({
    //                     id: $.int,
    //                     dict: $.dict($.obj({
    //                         a: $.string,
    //                         b: $.float
    //                     })),
    //                 }))
    //                 .view('default', $ => ({
    //                     val: $.model('dict.*').pick('a')
    //                 }))
    //             )
    //             .with.obj({
    //                 id: 1,
    //                 dict: {
    //                     'x': { a: 'test1', b: 12.34 },
    //                     'y': { a: 'test2', b: 56.78 }
    //                 }
    //             })
    //         )
    //         .when.bucket('test', $ => {
    //             return $.bucket.viewOne($.trx, 1, 'default')
    //         })
    //         .then($ => {
    //             expect($.status.state).toEqual('ok')
    //             expect($.status.output!).toEqual({
    //                 $v: 'default',
    //                 id: 1,
    //                 val: ['test1', 'test2']
    //             })
    //         })
    //     )
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
