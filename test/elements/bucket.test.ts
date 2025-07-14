import { Log } from '~/engine/util/log'
import { $id, AnyBucket, Bucket } from '~/elements/entities/bucket/bucket';
import { expectBucket } from 'nesoi/tools/joaquin/bucket';
import { Mock } from './mock';

Log.level = 'off';

describe('Bucket', () => {

    describe('Replace Future ID', () => {

        const bucket = new Bucket({} as any, {} as any);
        const replaceFutureId = (bucket as any).replaceFutureId.bind(bucket) as AnyBucket['replaceFutureId'];

        it('should replace id on object', async() => {
            // given
            const obj = {
                future_id: $id,
                number: 12.34,
                string: 'string',
                boolean: true,
                other_future_id: $id,
                nested: {
                    future_id: $id,
                    number: 12.34,
                    string: 'string',
                    boolean: true,
                    other_future_id: $id,
                    deep_nested: {
                        future_id: $id,
                        number: 12.34,
                        string: 'string',
                        boolean: true,
                        other_future_id: $id,
                    }
                },
                array: [
                    $id,
                    12.34,
                    'string',
                    true,
                    $id,
                    [
                        $id,
                        12.34,
                        'string',
                        true,
                        $id
                    ]
                ],
                mixed: {
                    future_id: $id,
                    array: [
                        $id,
                        {
                            future_id: $id
                        }
                    ]
                }
            }
            // when
            replaceFutureId(obj, 999);
            // then
            expect(obj).toEqual({
                future_id: 999,
                number: 12.34,
                string: 'string',
                boolean: true,
                other_future_id: 999,
                nested: {
                    future_id: 999,
                    number: 12.34,
                    string: 'string',
                    boolean: true,
                    other_future_id: 999,
                    deep_nested: {
                        future_id: 999,
                        number: 12.34,
                        string: 'string',
                        boolean: true,
                        other_future_id: 999,
                    }
                },
                array: [
                    999,
                    12.34,
                    'string',
                    true,
                    999,
                    [
                        999,
                        12.34,
                        'string',
                        true,
                        999
                    ]
                ],
                mixed: {
                    future_id: 999,
                    array: [
                        999,
                        {
                            future_id: 999
                        }
                    ]
                }
            })
        })

    })

    describe('View', () => {

        it('should parse view with primitive model fields', () => {
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    name: $.string,
                    height: $.float
                }))
                .view('default', $ => ({
                    built_name: $.model('name'),
                    other_name: $.model('name'),
                    height: $.model('height')
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    name: Mock.String,
                    height: Mock.Float
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    built_name: Mock.String,
                    other_name: Mock.String,
                    height: Mock.Float
                })
        })

        it('should parse view with list model fields', () => {
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    tags: $.list($.string)
                }))
                .view('default', $ => ({
                    tags: $.model('tags'),
                    tags_all: $.model('tags.*'),
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    tags: [Mock.String, Mock.String]
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    tags: [Mock.String, Mock.String],
                    tags_all: [Mock.String, Mock.String]
                })
        })

        it('should parse view with dict model fields', () => {
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    tags: $.dict($.string)
                }))
                .view('default', $ => ({
                    tags: $.model('tags'),
                    tags_all: $.model('tags.*'),
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    tags: { a: Mock.String, b: Mock.String }
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    tags: { a: Mock.String, b: Mock.String },
                    tags_all: { a: Mock.String, b: Mock.String }
                })
        })

        it('should parse view with complex union fields (1)', () => {
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    chaos: $.union(
                        $.obj({ a: $.int, b: $.string }),
                        $.dict($.boolean),
                        $.list($.decimal())
                    )
                }))
                .view('default', $ => ({
                    chaos: $.model('chaos'),
                    items: $.model('chaos.*'),
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    chaos: { a: Mock.String, b: Mock.String }
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    chaos: { a: Mock.String, b: Mock.String },
                    items: { a: Mock.String, b: Mock.String }
                })
        })
        it('should parse view with complex union fields (2)', () => {
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    chaos: $.union(
                        $.obj({ a: $.int, b: $.string }),
                        $.dict($.boolean),
                        $.list($.decimal())
                    )
                }))
                .view('default', $ => ({
                    chaos: $.model('chaos'),
                    items: $.model('chaos.*'),
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    chaos: { c: Mock.Bool }
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    chaos: { c: Mock.Bool },
                    items: { c: Mock.Bool }
                })
        })
        it('should parse view with complex union fields (3)', () => {
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    chaos: $.union(
                        $.obj({ a: $.int, b: $.string }),
                        $.dict($.boolean),
                        $.list($.decimal())
                    )
                }))
                .view('default', $ => ({
                    chaos: $.model('chaos'),
                    items: $.model('chaos.*'),
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    chaos: [ Mock.Decimal, Mock.Decimal ]
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    chaos: [ Mock.Decimal, Mock.Decimal ],
                    items: [ Mock.Decimal, Mock.Decimal ]
                })
        })
            
        it('should parse view with list of objects model fields', () => {
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    tags: $.list($.obj({
                        a: $.string,
                        b: $.string
                    }))
                }))
                .view('default', $ => ({
                    tags: $.model('tags'),
                    tags_all: $.model('tags.*'),
                    tags_all_all: $.model('tags.*.*'),
                    tags_all_a: $.model('tags.*.a'),
                    tags_all_b: $.model('tags.*.b'),
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    tags: [
                        { a: 'A1', b: 'B1' },
                        { a: 'A2', b: 'B2' }
                    ]
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    tags: [
                        { a: 'A1', b: 'B1' },
                        { a: 'A2', b: 'B2' }
                    ],
                    tags_all: [
                        { a: 'A1', b: 'B1' },
                        { a: 'A2', b: 'B2' }
                    ],
                    tags_all_all: [
                        { a: 'A1', b: 'B1' },
                        { a: 'A2', b: 'B2' }
                    ],
                    tags_all_a: [
                        'A1',
                        'A2'
                    ],
                    tags_all_b: [
                        'B1',
                        'B2'
                    ],
                })
        })
        
        it('should parse view with list of dicts model fields', () => {
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    tags: $.list($.dict($.string))
                }))
                .view('default', $ => ({
                    tags: $.model('tags'),
                    tags_all: $.model('tags.*'),
                    tags_all_all: $.model('tags.*.*'),
                    tags_all_a: $.model('tags.*.a'),
                    tags_all_b: $.model('tags.*.b'),
                    tags_all_c: $.model('tags.*.c'),
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    tags: [
                        { a: 'A1', b: 'B1' },
                        { b: 'B2', c: 'C2' }
                    ]
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    tags: [
                        { a: 'A1', b: 'B1' },
                        { b: 'B2', c: 'C2' }
                    ],
                    tags_all: [
                        { a: 'A1', b: 'B1' },
                        { b: 'B2', c: 'C2' }
                    ],
                    tags_all_all: [
                        { a: 'A1', b: 'B1' },
                        { b: 'B2', c: 'C2' }
                    ],
                    tags_all_a: [
                        'A1',
                        undefined
                    ],
                    tags_all_b: [
                        'B1',
                        'B2'
                    ],
                    tags_all_c: [
                        undefined,
                        'C2'
                    ],
                })
        })
        
        it('should parse view with object of list model fields', () => {
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    tags: $.obj({
                        a: $.list($.string),
                        b: $.list($.string)
                    })
                }))
                .view('default', $ => ({
                    tags: $.model('tags'),
                    tags_all: $.model('tags.*'),
                    tags_a: $.model('tags.a'),
                    tags_b: $.model('tags.b'),
                    tags_a_all: $.model('tags.a.*'),
                    tags_b_all: $.model('tags.b.*'),
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    tags: {
                        a: ['A1', 'A2'],
                        b: ['B1', 'B2']
                    }
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    tags: {
                        a: ['A1', 'A2'],
                        b: ['B1', 'B2']
                    },
                    tags_all: {
                        a: ['A1', 'A2'],
                        b: ['B1', 'B2']
                    },
                    tags_a: ['A1', 'A2'],
                    tags_a_all: ['A1', 'A2'],
                    tags_b: ['B1', 'B2'],
                    tags_b_all: ['B1', 'B2'],
                })
        })
        
        it('should parse view with dict of list model fields', () => {
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    tags: $.dict($.list($.string))
                }))
                .view('default', $ => ({
                    tags: $.model('tags'),
                    tags_all: $.model('tags.*'),
                    tags_a: $.model('tags.a'),
                    tags_b: $.model('tags.b'),
                    tags_c: $.model('tags.c'),
                    tags_a_all: $.model('tags.a.*'),
                    tags_b_all: $.model('tags.b.*'),
                    tags_c_all: $.model('tags.c.*'),
                    tags_all_all: $.model('tags.*.*'),
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    tags: {
                        a: ['A1', 'A2'],
                        b: ['B1', 'B2']
                    }
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    tags: {
                        a: ['A1', 'A2'],
                        b: ['B1', 'B2']
                    },
                    tags_all: {
                        a: ['A1', 'A2'],
                        b: ['B1', 'B2']
                    },
                    tags_a: ['A1', 'A2'],
                    tags_b: ['B1', 'B2'],
                    tags_c: undefined,
                    tags_a_all: ['A1', 'A2'],
                    tags_b_all: ['B1', 'B2'],
                    tags_c_all: undefined,
                    tags_all_all: {
                        a: ['A1', 'A2'],
                        b: ['B1', 'B2']
                    }
                })
        })
        
        it('should parse view with dict of object model fields', () => {
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    tags: $.dict($.obj({
                        x: $.string,
                        y: $.string
                    }))
                }))
                .view('default', $ => ({
                    tags: $.model('tags'),
                    tags_all: $.model('tags.*'),
                    tags_all_all: $.model('tags.*.*'),
                    tags_a: $.model('tags.a'),
                    tags_b: $.model('tags.b'),
                    tags_c: $.model('tags.c'),
                    tags_a_all: $.model('tags.a.*'),
                    tags_b_all: $.model('tags.b.*'),
                    tags_c_all: $.model('tags.c.*'),
                    tags_a_x: $.model('tags.a.x'),
                    tags_b_y: $.model('tags.b.y')
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    tags: {
                        a: { x: 'XA', y: 'YA' },
                        b: { x: 'XB', y: 'YB' },
                    }
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    tags: {
                        a: { x: 'XA', y: 'YA' },
                        b: { x: 'XB', y: 'YB' },
                    },
                    tags_all: {
                        a: { x: 'XA', y: 'YA' },
                        b: { x: 'XB', y: 'YB' },
                    },
                    tags_all_all: {
                        a: { x: 'XA', y: 'YA' },
                        b: { x: 'XB', y: 'YB' },
                    },
                    tags_a: { x: 'XA', y: 'YA' },
                    tags_b: { x: 'XB', y: 'YB' },
                    tags_c: undefined,
                    tags_a_all: { x: 'XA', y: 'YA' },
                    tags_b_all: { x: 'XB', y: 'YB' },
                    tags_a_x: 'XA',
                    tags_b_y: 'YB',
                })
        })

        it('should parse view with nested model fields - no children, non-obj, empty output', () => {
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    list_a: $.list($.string),
                    list_b: $.list($.string),
                }))
                .view('default', $ => ({
                    list: $.model('list_a.*', {})
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    list_a: ['A1', 'A2'],
                    list_b: ['B1', 'B2']
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    list: [{}, {}],
                })
        })

        it('should parse view with nested model fields - only raw, non-obj, empty output', () => {
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    list_a: $.list($.string),
                    list_b: $.list($.string),
                }))
                .view('default', $ => ({
                    list: $.model('list_a.*', {
                        ...$.raw()
                    })
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    list_a: ['A1', 'A2'],
                    list_b: ['B1', 'B2']
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    list: [{}, {}],
                })
        })

        it('should parse view with nested model fields - only raw, non-obj, ignore original', () => {
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    list_a: $.list($.string),
                    list_b: $.list($.string),
                }))
                .view('default', $ => ({
                    list: $.model('list_a.*', {
                        ...$.raw(),
                        b: $.model('list_b.$0')
                    })
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    list_a: ['A1', 'A2'],
                    list_b: ['B1', 'B2']
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    list: [{ b: 'B1' }, { b: 'B2' }],
                })
        })

        it('should parse view with nested model fields - only raw, obj, original output', () => {
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    list_a: $.list($.obj({
                        red: $.string,
                        blue: $.string
                    })),
                    list_b: $.list($.string),
                }))
                .view('default', $ => ({
                    list: $.model('list_a.*', {
                        ...$.raw()
                    })
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    list_a: [
                        { red: 'red1', blue: 'blue1' },
                        { red: 'red2', blue: 'blue2' }
                    ],
                    list_b: ['B1', 'B2']
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    list: [
                        { red: 'red1', blue: 'blue1' },
                        { red: 'red2', blue: 'blue2' }
                    ]
                })
        })

        it('should parse view with nested model fields - only raw, non-obj, original output', () => {
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    list_a: $.list($.obj({
                        red: $.string,
                        blue: $.string
                    })),
                    list_b: $.list($.string),
                }))
                .view('default', $ => ({
                    list: $.model('list_a.*', {
                        ...$.raw(),
                        b: $.model('list_b.$0')
                    })
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    list_a: [
                        { red: 'red1', blue: 'blue1' },
                        { red: 'red2', blue: 'blue2' }
                    ],
                    list_b: ['B1', 'B2']
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    list: [
                        { red: 'red1', blue: 'blue1', b: 'B1' },
                        { red: 'red2', blue: 'blue2', b: 'B2' }
                    ],
                })
        })

        it('should parse complex model view', () => {
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    games: $.list(
                        $.obj({
                            score: $.dict($.float),
                        })
                    ),
                    players: $.dict($.string),
                    times: $.list(
                        $.dict($.float)
                    ),
                }))
                .view('default', $ => ({
                    games: $.model('games.*', {
                        score: $.model('games.$0.score.*', {
                            value: $.raw(),
                            player: $.model('players.$1'),
                            time: $.model('times.$0.$1')
                        })
                    })
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    games: [
                        { score: { p1: 1, p2: 2 } },
                        { score: { p1: 3, p2: 4 } },
                        { score: { p1: 5, p2: 6 } },
                    ],
                    players: {
                        p1: 'Player 1',
                        p2: 'Player 2'
                    },
                    times: [
                        { p1: 11, p2: 12 },
                        { p1: 13, p2: 14 },
                        { p1: 15, p2: 16 },
                    ]
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    games: [
                        { score: {
                            p1: { player: 'Player 1', value: 1, time: 11 },
                            p2: { player: 'Player 2', value: 2, time: 12 }
                        } },
                        { score: {
                            p1: { player: 'Player 1', value: 3, time: 13 },
                            p2: { player: 'Player 2', value: 4, time: 14 }
                        } },
                        { score: {
                            p1: { player: 'Player 1', value: 5, time: 15 },
                            p2: { player: 'Player 2', value: 6, time: 16 }
                        } },
                    ],
                })
        })

        it('should parse view with computed fields', () => {
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    height: $.float
                }))
                .view('default', $ => ({
                    height: $.computed($ => $.raw.height),
                    double_height: $.computed($ => $.raw.height*2)
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    height: Mock.Float
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    height: Mock.Float,
                    double_height: Mock.Float*2,
                })
        })
    })

})
