import { Log } from '~/engine/util/log'
import { expectBucket, givenBucket } from 'nesoi/tools/joaquin/bucket';
import { Mock } from './mock';

Log.level = 'off';

describe('Bucket View', () => {

    describe('Model Fields', () => {

        it('should parse view with primitive model fields', () => 
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
        )

        it('should parse view with list model fields', () =>
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
        )

        it('should parse view with dict model fields', () =>
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
        )

        it('should parse view with complex union fields (1)', () =>
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
        )

        it('should parse view with complex union fields (2)', () =>
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
        )

        it('should parse view with complex union fields (3)', () =>
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
        )
            
        it('should parse view with list of objects model fields', () =>
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
        )
        
        it('should parse view with list of dicts model fields', () =>
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
        )
        
        it('should parse view with object of list model fields', () =>
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
        )
        
        it('should parse view with dict of list model fields', () =>
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
        )
        
        it('should parse view with dict of object model fields', () =>
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
        )

        it('should parse view with nested model fields - no children, non-obj, empty output', () =>
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
        )

        it('should parse view with nested model fields - only raw, non-obj, empty output', () =>
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
        )

        it('should parse view with nested model fields - only raw, non-obj, ignore original', () =>
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
        )

        it('should parse view with nested model fields - only raw, obj, original output', () =>
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
        )

        it('should parse view with nested model fields - only raw, non-obj, original output', () =>
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
        )

        it('should parse complex model view', () =>
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
        )

    })

    describe('Computed Fields', () => {

        it('should parse view with computed fields', () =>
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
        )
    })

    describe('Graph Fields', () => {

        const colorBucket = givenBucket('color', $ => $
            .model($ => ({
                id: $.int,
                name: $.string
            }))
        ).withData({
            1: { id: 1, name: 'red' },
            2: { id: 2, name: 'green' },
            3: { id: 3, name: 'blue' },
        })

        const expectBucketOneColor = expectBucket($ => $
            .model($ => ({
                id: $.int,
                color_id: $.int
            }))
            .graph($ => ({
                color: $.one('color', {
                    id: {'.':'color_id'}
                })
            }))
            .view('default', $ => ({
                ...$.raw(),
                color: $.graph('color')
            })),
        [
            colorBucket
        ])

        it('should parse view with graph fields', async () => {

            await expectBucketOneColor.toBuildOne({
                id: Mock.Int,
                color_id: 1
            }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    color_id: 1,
                    color: {
                        id: 1,
                        name: 'red'
                    }
                })

            await expectBucketOneColor.toBuildOne({
                id: Mock.Int,
                color_id: 2
            }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    color_id: 2,
                    color: {
                        id: 2,
                        name: 'green'
                    }
                })
        })

        it('should parse view with missing graph fields', async () => 
            expectBucketOneColor.toBuildOne({
                id: Mock.Int,
                color_id: 4
            }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    color_id: 4,
                    color: undefined
                })
        )

        it('should parse many views with graph fields', () =>
            expectBucketOneColor.toBuildMany([
                {
                    id: 1,
                    color_id: 3
                },
                {
                    id: 2,
                    color_id: 2
                },
                {
                    id: 3,
                    color_id: 1
                },
            ], 'default')
                .as([
                    {
                        $v: 'default',
                        id: 1,
                        color_id: 3,
                        color: {
                            id: 3,
                            name: 'blue'
                        }
                    },
                    {
                        $v: 'default',
                        id: 2,
                        color_id: 2,
                        color: {
                            id: 2,
                            name: 'green'
                        }
                    },
                    {
                        $v: 'default',
                        id: 3,
                        color_id: 1,
                        color: {
                            id: 1,
                            name: 'red'
                        }
                    },
                ])
        )

        it('should parse many views with repeated and empty graph fields', () =>
            expectBucketOneColor.toBuildMany([
                {
                    id: 1,
                    color_id: 3
                },
                {
                    id: 2,
                    color_id: 2
                },
                {
                    id: 3,
                    color_id: 1
                },
                {
                    id: 4,
                    color_id: 1
                },
                {
                    id: 5,
                    color_id: 3
                },
                {
                    id: 6,
                    color_id: 2
                },
                {
                    id: 7,
                    color_id: 4
                },
                {
                    id: 8,
                    color_id: undefined
                },
            ], 'default')
                .as([
                    {
                        $v: 'default',
                        id: 1,
                        color_id: 3,
                        color: {
                            id: 3,
                            name: 'blue'
                        }
                    },
                    {
                        $v: 'default',
                        id: 2,
                        color_id: 2,
                        color: {
                            id: 2,
                            name: 'green'
                        }
                    },
                    {
                        $v: 'default',
                        id: 3,
                        color_id: 1,
                        color: {
                            id: 1,
                            name: 'red'
                        }
                    },
                    {
                        $v: 'default',
                        id: 4,
                        color_id: 1,
                        color: {
                            id: 1,
                            name: 'red'
                        }
                    },
                    {
                        $v: 'default',
                        id: 5,
                        color_id: 3,
                        color: {
                            id: 3,
                            name: 'blue'
                        }
                    },
                    {
                        $v: 'default',
                        id: 6,
                        color_id: 2,
                        color: {
                            id: 2,
                            name: 'green'
                        }
                    },
                    {
                        $v: 'default',
                        id: 7,
                        color_id: 4,
                        color: undefined
                    },
                    {
                        $v: 'default',
                        id: 8,
                        color_id: undefined,
                        color: undefined
                    },
                ])
        )

        const extraBucket = givenBucket('extra', $ => $
            .model($ => ({
                id: $.int,
                test_id: $.int,
                extra: $.string
            }))
        ).withData({
            1: { id: 1, test_id: 1, extra: 'red' },
            2: { id: 2, test_id: 1, extra: 'green' },
            3: { id: 3, test_id: 2, extra: 'blue' },
            4: { id: 4, test_id: 2, extra: 'red' },
            5: { id: 5, test_id: 3, extra: 'green' },
            6: { id: 6, test_id: 3, extra: 'blue' },
        })

        const expectBucketManyExtras = expectBucket($ => $
            .model($ => ({
                id: $.int,
            }))
            .graph($ => ({
                extras: $.many('extra', {
                    test_id: {'.':'id'}
                } as any)
            }))
            .view('default', $ => ({
                ...$.raw(),
                extras: $.graph('extras')
            })),
        [
            extraBucket
        ])

        it('should parse view with graph.many fields', async () => {

            await expectBucketManyExtras.toBuildOne({
                id: 1,
            }, 'default')
                .as({
                    $v: 'default',
                    id: 1,
                    extras: [
                        { id: 1, test_id: 1, extra: 'red' },
                        { id: 2, test_id: 1, extra: 'green' },
                    ]
                })

            await expectBucketManyExtras.toBuildOne({
                id: 2,
            }, 'default')
                .as({
                    $v: 'default',
                    id: 2,
                    extras: [
                        { id: 3, test_id: 2, extra: 'blue' },
                        { id: 4, test_id: 2, extra: 'red' },
                    ]
                })
        })

        it('should parse view with missing graph.many fields', async () =>
            expectBucketManyExtras.toBuildOne({
                id: 4,
            }, 'default')
                .as({
                    $v: 'default',
                    id: 4,
                    extras: []
                })
        )

        it('should parse many views with graph.many fields', async () =>
            expectBucketManyExtras.toBuildMany([
                {
                    id: 1,
                },
                {
                    id: 2,
                },
                {
                    id: 3,
                },
            ], 'default')
                .as([
                    {
                        $v: 'default',
                        id: 1,
                        extras: [
                            { id: 1, test_id: 1, extra: 'red' },
                            { id: 2, test_id: 1, extra: 'green' },
                        ]
                    },
                    {
                        $v: 'default',
                        id: 2,
                        extras: [
                            { id: 3, test_id: 2, extra: 'blue' },
                            { id: 4, test_id: 2, extra: 'red' },
                        ]
                    },
                    {
                        $v: 'default',
                        id: 3,
                        extras: [
                            { id: 5, test_id: 3, extra: 'green' },
                            { id: 6, test_id: 3, extra: 'blue' },
                        ]
                    }
                ])
        )

        it('should parse many views with empty graph.many fields', async () =>
            expectBucketManyExtras.toBuildMany([
                {
                    id: 1,
                },
                {
                    id: 2,
                },
                {
                    id: 3,
                },
                {
                    id: 4,
                },
            ], 'default')
                .as([
                    {
                        $v: 'default',
                        id: 1,
                        extras: [
                            { id: 1, test_id: 1, extra: 'red' },
                            { id: 2, test_id: 1, extra: 'green' },
                        ]
                    },
                    {
                        $v: 'default',
                        id: 2,
                        extras: [
                            { id: 3, test_id: 2, extra: 'blue' },
                            { id: 4, test_id: 2, extra: 'red' },
                        ]
                    },
                    {
                        $v: 'default',
                        id: 3,
                        extras: [
                            { id: 5, test_id: 3, extra: 'green' },
                            { id: 6, test_id: 3, extra: 'blue' },
                        ]
                    },
                    {
                        $v: 'default',
                        id: 4,
                        extras: []
                    }
                ])
        )

        const tagBucket = givenBucket('tag', $ => $
            .model($ => ({
                id: $.int,
                name: $.string,
                color_id: $.int
            }))
            .graph($ => ({
                color: $.one('color', {
                    'id': {'.': 'color_id'}
                })
            }))
            .view('default', $ => ({
                ...$.raw(),
                color: $.graph('color', 'default' as any)
            })) as any
        ).withData({
            1: { id: 1, name: '#red', color_id: 1 },
            2: { id: 2, name: '#green', color_id: 2 },
            3: { id: 3, name: '#blue', color_id: 3 },
        })

        const expectBucketOneTag = expectBucket($ => $
            .model($ => ({
                id: $.int,
                tag_id: $.int
            }))
            .graph($ => ({
                tag: $.one('tag', {
                    id: {'.':'tag_id'}
                })
            }))
            .view('default', $ => ({
                ...$.raw(),
                tag: $.graph('tag', 'default' as any)
            })),
        [
            tagBucket,
            colorBucket
        ])


        it('should parse view with deep graph fields', async () => {

            await expectBucketOneTag.toBuildOne({
                id: Mock.Int,
                tag_id: 1
            }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    tag_id: 1,
                    tag: {
                        $v: 'default',
                        id: 1,
                        name: '#red',
                        color_id: 1,
                        color: {
                            $v: 'default',
                            id: 1,
                            name: 'red'
                        }
                    }
                })

        })

        it('should parse many views with deep graph fields', async () => {

            await expectBucketOneTag.toBuildMany([
                {
                    id: 1,
                    tag_id: 1
                },
                {
                    id: 2,
                    tag_id: 2
                },
                {
                    id: 3,
                    tag_id: 3
                }
            ], 'default')
                .as([
                    {
                        $v: 'default',
                        id: 1,
                        tag_id: 1,
                        tag: {
                            $v: 'default',
                            id: 1,
                            name: '#red',
                            color_id: 1,
                            color: {
                                $v: 'default',
                                id: 1,
                                name: 'red'
                            }
                        }
                    },
                    {
                        $v: 'default',
                        id: 2,
                        tag_id: 2,
                        tag: {
                            $v: 'default',
                            id: 2,
                            name: '#green',
                            color_id: 2,
                            color: {
                                $v: 'default',
                                id: 2,
                                name: 'green'
                            }
                        }
                    },
                    {
                        $v: 'default',
                        id: 3,
                        tag_id: 3,
                        tag: {
                            $v: 'default',
                            id: 3,
                            name: '#blue',
                            color_id: 3,
                            color: {
                                $v: 'default',
                                id: 3,
                                name: 'blue'
                            }
                        }
                    },
                ])

        })
    })

})
