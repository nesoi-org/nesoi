import { Log } from '~/engine/util/log'
import { expectBucket, givenBucket } from 'nesoi/tools/joaquin/bucket';
import { Mock } from './mock';

Log.level = 'off';

describe('Bucket View', () => {

    describe('Model Fields', () => {

        it('should parse view with primitive model fields', async () => 
            await expectBucket($ => $
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

        it('should parse view with object model fields', async () => 
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    obj: $.obj({
                        name: $.string,
                        height: $.float
                    })
                }))
                .view('default', $ => ({
                    obj_root: $.model('obj'),
                    obj_name: $.model('obj.name'),
                    obj_name2: $.model('obj').pick('name')
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    obj: {
                        name: Mock.String,
                        height: Mock.Float
                    }
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    obj_root: {
                        name: Mock.String,
                        height: Mock.Float
                    },
                    obj_name: Mock.String,
                    obj_name2: Mock.String,
                })
        )

        it('should parse view with list model fields', async () =>
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    tags: $.list($.string)
                }))
                .view('default', $ => ({
                    tags: $.model('tags'),
                    tags_all: $.model('tags.*'),
                    tags_first: $.model('tags').pick(0),
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    tags: [Mock.String, Mock.String2]
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    tags: [Mock.String, Mock.String2],
                    tags_all: [Mock.String, Mock.String2],
                    tags_first: Mock.String
                })
        )

        it('should parse view with list model fields as dict', async () =>
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    tags: $.list($.string)
                }))
                .view('default', $ => ({
                    tags_dict: $.model('tags').as_dict(),
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    tags: [Mock.String, Mock.String2]
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    tags_dict: {
                        0: Mock.String,
                        1: Mock.String2,
                    }
                })
        )

        it('should parse view with object list model fields as dict', async () =>
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    tags: $.list($.obj({
                        name: $.string,
                        value: $.int,
                        enabled: $.boolean
                    }))
                }))
                .view('default', $ => ({
                    tags_dict: $.model('tags').as_dict('name'),
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    tags: [
                        { name: Mock.String, value: Mock.Int, enabled: false },
                        { name: Mock.String2, value: Mock.Int*2, enabled: false },
                    ]
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    tags_dict: {
                        [Mock.String]: { name: Mock.String, value: Mock.Int, enabled: false },
                        [Mock.String2]: { name: Mock.String2, value: Mock.Int*2, enabled: false },
                    }
                })
        )

        it('should parse view with dict model fields', async () =>
            await expectBucket($ => $
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
                    tags: { a: Mock.String, b: Mock.String2 }
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    tags: { a: Mock.String, b: Mock.String2 },
                    tags_all: [ Mock.String, Mock.String2 ]
                })
        )

        it('should parse view with dict model fields as list', async () =>
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    tags: $.dict($.string)
                }))
                .view('default', $ => ({
                    tags_list: $.model('tags').as_list(),
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    tags: { a: Mock.String, b: Mock.String2 }
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    tags_list: [
                        Mock.String,
                        Mock.String2
                    ]
                })
        )

        const expectUnionBucket = expectBucket($ => $
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

        it('should parse view with complex union fields (1)', async () => {
            await expectUnionBucket.toBuildOne({
                id: Mock.Int,
                chaos: { a: Mock.Int, b: Mock.String }
            }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    chaos: { a: Mock.Int, b: Mock.String },
                    items: [Mock.Int, Mock.String]
                })
        })

        it('should parse view with complex union fields (2)', async () =>
            await expectUnionBucket
                .toBuildOne({
                    id: Mock.Int,
                    chaos: { c: Mock.Bool }
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    chaos: { c: Mock.Bool },
                    items: [ Mock.Bool ]
                })
        )

        it('should parse view with complex union fields (3)', async () =>
            await expectUnionBucket
                .toBuildOne({
                    id: Mock.Int,
                    chaos: [ Mock.Decimal, Mock.Decimal2 ]
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    chaos: [ Mock.Decimal, Mock.Decimal2 ],
                    items: [ Mock.Decimal, Mock.Decimal2 ]
                })
        )
            
        it('should parse view with list of objects model fields', async () =>
            await expectBucket($ => $
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
                        'A1', 'B1', 'A2', 'B2'
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
        
        it('should parse view with list of dicts model fields', async () =>
            await expectBucket($ => $
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
                        'A1', 'B1', 'B2', 'C2'
                    ],
                    tags_all_a: [
                        'A1'
                    ],
                    tags_all_b: [
                        'B1',
                        'B2'
                    ],
                    tags_all_c: [
                        'C2'
                    ],
                })
        )
        
        it('should parse view with object of list model fields', async () =>
            await expectBucket($ => $
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
                    tags_all: [
                        ['A1', 'A2'], ['B1', 'B2']
                    ],
                    tags_a: ['A1', 'A2'],
                    tags_a_all: ['A1', 'A2'],
                    tags_b: ['B1', 'B2'],
                    tags_b_all: ['B1', 'B2'],
                })
        )
        
        it('should parse view with dict of list model fields', async () =>
            await expectBucket($ => $
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
                    tags_all: [
                        ['A1', 'A2'], ['B1', 'B2']
                    ],
                    tags_a: ['A1', 'A2'],
                    tags_b: ['B1', 'B2'],
                    // tags_c: undefined,
                    tags_a_all: ['A1', 'A2'],
                    tags_b_all: ['B1', 'B2'],
                    tags_c_all: [],
                    tags_all_all: [
                        'A1', 'A2', 'B1', 'B2'
                    ]
                })
        )
        
        it('should parse view with dict of object model fields', async () =>
            await expectBucket($ => $
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
                    tags_all: [
                        { x: 'XA', y: 'YA' },
                        { x: 'XB', y: 'YB' }
                    ],
                    tags_all_all: [
                        'XA', 'YA', 'XB', 'YB',
                    ],
                    tags_a: { x: 'XA', y: 'YA' },
                    tags_b: { x: 'XB', y: 'YB' },
                    // tags_c: undefined,
                    tags_a_all: ['XA', 'YA'],
                    tags_b_all: ['XB', 'YB'],
                    tags_c_all: [],
                    tags_a_x: 'XA',
                    tags_b_y: 'YB',
                })
        )

        it('should parse complex model view', async () =>
            await expectBucket($ => $
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
                    games: $.model('games.*').obj($ => ({
                        score: $.model('games.$0.score').map($ => $.obj($ => ({
                            value: $.value,
                            player: $.model('players.$1'),
                            time: $.model('times.$0.$1')
                        })))
                    }))
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
    
    describe('Model Field - Ops', () => {

        it('[pick] should pick property from single object', async () =>
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    obj: $.obj({
                        a: $.string,
                        b: $.float
                    }),
                }))
                .view('default', $ => ({
                    val: $.model('obj').pick('a')
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    obj: {
                        a: Mock.String,
                        b: Mock.Float
                    }
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    val: Mock.String
                })
        )

        it('[pick] should pick property from list of objects', async () =>
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    list: $.list($.obj({
                        a: $.string,
                        b: $.float
                    })),
                }))
                .view('default', $ => ({
                    val: $.model('list').pick(1)
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    list: [
                        { a: Mock.String, b: Mock.Float },
                        { a: Mock.String2, b: Mock.Float*2 },
                    ]
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    val: { a: Mock.String2, b: Mock.Float*2 }
                })
        )

        it('[map|pick] should pick property from each object of the list', async () =>
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    list: $.list($.obj({
                        a: $.string,
                        b: $.float
                    })),
                }))
                .view('default', $ => ({
                    val: $.model('list.*').pick('a')
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    list: [
                        { a: Mock.String, b: Mock.Float },
                        { a: Mock.String2, b: Mock.Float*2 },
                    ]
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    val: [
                        Mock.String, Mock.String2
                    ]
                })
        )

        it('[obj] should expand non-list field as single object', async () =>
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    list_a: $.list($.string),
                    list_b: $.list($.string),
                }))
                .view('default', $ => ({
                    list: $.model('id').obj(() => ({}))
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
                    list: {},
                })
        )

        it('[obj] should expand list field without spread as single object', async () =>
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    list_a: $.list($.string),
                    list_b: $.list($.string),
                }))
                .view('default', $ => ({
                    list: $.model('list_a').obj(() => ({}))
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
                    list: {},
                })
        )
        
        it('[map|obj] should expand list field with spread as a list of objects', async () =>
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    list_a: $.list($.string),
                    list_b: $.list($.string),
                }))
                .view('default', $ => ({
                    list: $.model('list_a.*').obj($ => ({}))
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
                    list: [{}, {}]
                })
        )

        it('[map|obj] should inject root on each item', async () =>
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    list_a: $.list($.string),
                    list_b: $.list($.string),
                }))
                .view('default', $ => ({
                    list: $.model('list_a.*').obj($ => ({
                        ...$.inject.root
                    }))
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
                    list: [{
                        id: Mock.Int,
                        list_a: ['A1', 'A2'],
                        list_b: ['B1', 'B2']
                    }, {
                        id: Mock.Int,
                        list_a: ['A1', 'A2'],
                        list_b: ['B1', 'B2']
                    }],
                })
        )

        it('[map|obj] should inject current on each item', async () =>
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    list_a: $.list($.string),
                    list_b: $.list($.string),
                }))
                .view('default', $ => ({
                    list: $.model('list_a.*').obj($ => ({
                        ...$.inject.current
                    }))
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
                    list: [
                        { id: Mock.Int, list_a: ['A1', 'A2'], list_b: ['B1', 'B2'] },
                        { id: Mock.Int, list_a: ['A1', 'A2'], list_b: ['B1', 'B2'] }
                    ],
                })
        )

        it('[map|obj] should add root, current and value to each item', async () =>
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    list_a: $.list($.string),
                    list_b: $.list($.string),
                }))
                .view('default', $ => ({
                    list: $.model('list_a.*').obj($ => ({
                        root: $.root,
                        current: $.current,
                        value: $.value
                    }))
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
                    list: [
                        {
                            root: { id: Mock.Int, list_a: ['A1', 'A2'], list_b: ['B1', 'B2'] },
                            current: { id: Mock.Int, list_a: ['A1', 'A2'], list_b: ['B1', 'B2'] },
                            value: 'A1'
                        },
                        {
                            root: { id: Mock.Int, list_a: ['A1', 'A2'], list_b: ['B1', 'B2'] },
                            current: { id: Mock.Int, list_a: ['A1', 'A2'], list_b: ['B1', 'B2'] },
                            value: 'A2'
                        },
                    ],
                })
        )

        it('[map|obj] should allow declaring 1 model index', async () =>
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    list_a: $.list($.string),
                    list_b: $.list($.string),
                }))
                .view('default', $ => ({
                    list: $.model('list_a.*').obj($ => ({
                        a: $.value,
                        b: $.model('list_b.$0')
                    }))
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
                    list: [
                        { a: 'A1', b: 'B1' },
                        { a: 'A2', b: 'B2' }
                    ],
                })
        )

        it('[map|obj] should allow declaring nested model indexes', async () =>
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    list: $.list($.obj({
                        dict: $.dict($.obj({
                            a: $.list($.string),
                            b: $.list($.string),
                        }))
                    })),
                }))
                .view('default', $ => ({
                    list: $.model('list.*').obj($ => ({
                        value: $.value,
                        deep: $.model('list.$0.dict').map($ =>
                            $.obj($ => ({
                                value: $.value,
                                a: $.model('list.$0.dict.$1.a.*').obj($ => ({
                                    value: $.value
                                })),
                                b: $.model('list.$0.dict.$1.b.*').obj($ => ({
                                    value: $.value
                                })),
                            }))
                        )
                    }))
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    list: [
                        { dict: {
                            key0: { a: ['A1', 'A2'], b: ['B1', 'B2'] },
                            key1: { a: ['A3', 'A4'], b: ['B3', 'B4'] },
                        } },
                        { dict: {
                            key0: { a: ['C1', 'C2'], b: ['D1', 'D2'] },
                            key1: { a: ['C3', 'C4'], b: ['D3', 'D4'] },
                        } },
                    ]
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    list: [
                        {
                            value: { dict: { key0: { a: ['A1', 'A2'], b: ['B1', 'B2'] }, key1: { a: ['A3', 'A4'], b: ['B3', 'B4'] } } },
                            deep: {
                                key0: {
                                    value: { a: ['A1', 'A2'], b: ['B1', 'B2'] },
                                    a: [ { value: 'A1' }, { value: 'A2' } ],
                                    b: [ { value: 'B1' }, { value: 'B2' } ]
                                },
                                key1: {
                                    value: { a: ['A3', 'A4'], b: ['B3', 'B4'] },
                                    a: [ { value: 'A3' }, { value: 'A4' } ],
                                    b: [ { value: 'B3' }, { value: 'B4' } ]
                                },
                            }
                        },
                        {
                            value: { dict: { key0: { a: ['C1', 'C2'], b: ['D1', 'D2'] }, key1: { a: ['C3', 'C4'], b: ['D3', 'D4'] } } },
                            deep: {
                                key0: {
                                    value: { a: ['C1', 'C2'], b: ['D1', 'D2'] },
                                    a: [ { value: 'C1' }, { value: 'C2' } ],
                                    b: [ { value: 'D1' }, { value: 'D2' } ]
                                },
                                key1: {
                                    value: { a: ['C3', 'C4'], b: ['D3', 'D4'] },
                                    a: [ { value: 'C3' }, { value: 'C4' } ],
                                    b: [ { value: 'D3' }, { value: 'D4' } ]
                                },
                            }
                        },
                    ],
                })
        )

        it('[transform] should transform single value', async () => {
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    obj: $.obj({
                        a: $.string,
                        b: $.float
                    }),
                }))
                .view('default', $ => ({
                    val: $.model('obj')
                        .transform($ => $.value.a + $.value.b)
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    obj: {
                        a: Mock.String,
                        b: Mock.Float
                    }
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    val: Mock.String+Mock.Float
                })
        })

        it('[transform] should transform list of values', async () => {
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    objs: $.list($.obj({
                        a: $.string,
                        b: $.float
                    })),
                }))
                .view('default', $ => ({
                    val: $.model('objs')
                        .transform($ => $.value.length + $.value[1].a)
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    objs: [
                        { a: Mock.String, b: Mock.Float },
                        { a: Mock.String2, b: Mock.Float*2 },
                    ]
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    val: 2+Mock.String2
                })
        })

        it('[transform] should transform each value of spread list', async () => {
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    objs: $.list($.obj({
                        a: $.string,
                        b: $.float
                    })),
                }))
                .view('default', $ => ({
                    val: $.model('objs.*')
                        .transform($ => $.value.a + $.value.b)
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    objs: [
                        { a: Mock.String, b: Mock.Float },
                        { a: Mock.String2, b: Mock.Float*2 },
                    ]
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    val: [
                        Mock.String+Mock.Float,
                        Mock.String2+Mock.Float*2,
                    ]
                })
        })

        it('[map|transform] should transform each value of list', async () => {
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    objs: $.list($.obj({
                        a: $.string,
                        b: $.float
                    })),
                }))
                .view('default', $ => ({
                    val: $.model('objs').map($ => $
                        .transform($ => $.value.a + $.value.b)
                    )
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    objs: [
                        { a: Mock.String, b: Mock.Float },
                        { a: Mock.String2, b: Mock.Float*2 },
                    ]
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    val: [
                        Mock.String+Mock.Float,
                        Mock.String2+Mock.Float*2,
                    ]
                })
        })

        it('[transform|computed] should track indexes correctly', async () => {
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    list: $.list($.dict($.obj({
                        a: $.string,
                        b: $.float
                    })))
                }))
                .view('default', $ => ({
                    val: $.model('list.*')
                        .obj($ => ({
                            model_index: $.computed($ => ('model_index' in $.graph ? $.graph.model_index : null)),
                            value: $.value,
                            dict: $.model('list.$0').map($ =>
                                $.obj($ => ({
                                    model_index: $.computed($ => ('model_index' in $.graph ? $.graph.model_index : null)),
                                    value: $.value,
                                    obj: $.model('list.$0.$1.*')
                                        .obj($ => ({
                                            model_index: $.computed($ => ('model_index' in $.graph ? $.graph.model_index : null)),
                                            value: $.value
                                        }))
                                }))
                            )
                        }))
                        
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    list: [
                        {
                            key0: { a: 'A1', b: 12.34 },
                            key1: { a: 'A2', b: 23.45 },
                        },
                        {
                            key1: { a: 'A3', b: 34.56 },
                            key2: { a: 'A4', b: 45.67 },
                        },
                    ]
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    val: [
                        {
                            model_index: [0],
                            value: { key0: { a: 'A1', b: 12.34 }, key1: { a: 'A2', b: 23.45 } },
                            dict: {
                                'key0': {
                                    model_index: [0, 'key0'],
                                    value: { a: 'A1', b: 12.34 },
                                    obj: [
                                        {
                                            model_index: [0, 'key0', 0],
                                            value: 'A1'
                                        },
                                        {
                                            model_index: [0, 'key0', 1],
                                            value: 12.34
                                        },
                                    ]
                                },
                                'key1': {
                                    model_index: [0, 'key1'],
                                    value: { a: 'A2', b: 23.45 },
                                    obj: [
                                        {
                                            model_index: [0, 'key1', 0],
                                            value: 'A2'
                                        },
                                        {
                                            model_index: [0, 'key1', 1],
                                            value: 23.45
                                        },
                                    ]
                                }
                            }
                        },
                        {
                            model_index: [1],
                            value: { key1: { a: 'A3', b: 34.56 }, key2: { a: 'A4', b: 45.67 } },
                            dict: {
                                'key1': {
                                    model_index: [1, 'key1'],
                                    value: { a: 'A3', b: 34.56 },
                                    obj: [
                                        {
                                            model_index: [1, 'key1', 0],
                                            value: 'A3'
                                        },
                                        {
                                            model_index: [1, 'key1', 1],
                                            value: 34.56
                                        },
                                    ]
                                },
                                'key2': {
                                    model_index: [1, 'key2'],
                                    value: { a: 'A4', b: 45.67 },
                                    obj: [
                                        {
                                            model_index: [1, 'key2', 0],
                                            value: 'A4'
                                        },
                                        {
                                            model_index: [1, 'key2', 1],
                                            value: 45.67
                                        },
                                    ]
                                }
                            }
                        }
                    ]
                })
        })

    })

    describe('Computed Fields', () => {

        it('should parse view with computed fields', async () =>
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    height: $.float
                }))
                .view('default', $ => ({
                    height: $.computed($ => $.root.height),
                    double_height: $.computed($ => $.root.height*2)
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

    const extraBucket = givenBucket('extra', $ => $
        .model($ => ({
            id: $.int,
            test_id: $.int,
            extra: $.string,
            data: $.list($.int)
        }))
        .graph($ => ({
            color: $.one('color', {
                'name': {'.':'extra'}
            } as any)
        }))
    ).withData({
        1: { id: 1, test_id: 1, extra: 'red', data: [1,2] },
        2: { id: 2, test_id: 1, extra: 'green', data: [3,4] },
        3: { id: 3, test_id: 2, extra: 'blue', data: [5,6] },
        4: { id: 4, test_id: 2, extra: 'red', data: [7,8] },
        5: { id: 5, test_id: 3, extra: 'green', data: [9,10] },
        6: { id: 6, test_id: 3, extra: 'blue', data: [11,12] },
    })

    describe('Graph Fields', () => {

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
                ...$.inject.root,
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
            await expectBucketOneColor.toBuildOne({
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

        it('should parse many views with graph fields', async () =>
            await expectBucketOneColor.toBuildMany([
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

        it('should parse many views with repeated and missing graph fields', async () =>
            await expectBucketOneColor.toBuildMany([
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
                }
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
                    }
                ])
        )

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
                ...$.inject.root,
                extras: $.graph('extras')
            })),
        [
            extraBucket,
            colorBucket
        ])

        it('should parse view with graph.many fields', async () => {

            await expectBucketManyExtras.toBuildOne({
                id: 1,
            }, 'default')
                .as({
                    $v: 'default',
                    id: 1,
                    extras: [
                        { id: 1, test_id: 1, extra: 'red', data: [1,2] },
                        { id: 2, test_id: 1, extra: 'green', data: [3,4] },
                    ]
                })

            await expectBucketManyExtras.toBuildOne({
                id: 2,
            }, 'default')
                .as({
                    $v: 'default',
                    id: 2,
                    extras: [
                        { id: 3, test_id: 2, extra: 'blue', data: [5,6] },
                        { id: 4, test_id: 2, extra: 'red', data: [7,8] },
                    ]
                })
        })

        it('should parse view with missing graph.many fields', async () =>
            await expectBucketManyExtras.toBuildOne({
                id: 4,
            }, 'default')
                .as({
                    $v: 'default',
                    id: 4,
                    extras: []
                })
        )

        it('should parse many views with graph.many fields', async () =>
            await expectBucketManyExtras.toBuildMany([
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
                            { id: 1, test_id: 1, extra: 'red', data: [1,2] },
                            { id: 2, test_id: 1, extra: 'green', data: [3,4] },
                        ]
                    },
                    {
                        $v: 'default',
                        id: 2,
                        extras: [
                            { id: 3, test_id: 2, extra: 'blue', data: [5,6] },
                            { id: 4, test_id: 2, extra: 'red', data: [7,8] },
                        ]
                    },
                    {
                        $v: 'default',
                        id: 3,
                        extras: [
                            { id: 5, test_id: 3, extra: 'green', data: [9,10] },
                            { id: 6, test_id: 3, extra: 'blue', data: [11,12] },
                        ]
                    }
                ])
        )

        it('should parse many views with empty graph.many fields', async () =>
            await expectBucketManyExtras.toBuildMany([
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
                            { id: 1, test_id: 1, extra: 'red', data: [1,2] },
                            { id: 2, test_id: 1, extra: 'green', data: [3,4] },
                        ]
                    },
                    {
                        $v: 'default',
                        id: 2,
                        extras: [
                            { id: 3, test_id: 2, extra: 'blue', data: [5,6] },
                            { id: 4, test_id: 2, extra: 'red', data: [7,8] },
                        ]
                    },
                    {
                        $v: 'default',
                        id: 3,
                        extras: [
                            { id: 5, test_id: 3, extra: 'green', data: [9,10] },
                            { id: 6, test_id: 3, extra: 'blue', data: [11,12] },
                        ]
                    },
                    {
                        $v: 'default',
                        id: 4,
                        extras: []
                    }
                ])
        )

    })

    describe('Graph Fields - Ops ', () => {

        it('[pick] should pick property from single object', async () => {

            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    extra_id: $.int
                }))
                .graph($ => ({
                    extra: $.one('extra', {
                        id: {'.':'extra_id'}
                    } as any)
                }))
                .view('default', $ => ({
                    ...$.inject.root,
                    extra: $.graph('extra', undefined).pick('extra')
                })),
            [
                extraBucket,
                colorBucket
            ]).toBuildOne({
                id: Mock.Int,
                extra_id: 1
            }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    extra_id: 1,
                    extra: 'red'
                })

        })

        it('[pick] should pick property from list of objects', async () => {

            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    extra_id: $.int
                }))
                .graph($ => ({
                    extra: $.many('extra', {
                        test_id: {'.':'extra_id'}
                    } as any)
                }))
                .view('default', $ => ({
                    ...$.inject.root,
                    extra: $.graph('extra', undefined).pick(0)
                })),
            [
                extraBucket,
                colorBucket
            ]).toBuildOne({
                id: Mock.Int,
                extra_id: 1
            }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    extra_id: 1,
                    extra: { id: 1, test_id: 1, extra: 'red', data: [1,2] }
                })

        })

        it('[map|pick] should pick property from each object of the list', async () => {

            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    extra_id: $.int
                }))
                .graph($ => ({
                    extra: $.many('extra', {
                        test_id: {'.':'extra_id'}
                    } as any)
                }))
                .view('default', $ => ({
                    ...$.inject.root,
                    extra: $.graph('extra', undefined).map($ => $.pick('extra'))
                })),
            [
                extraBucket,
                colorBucket
            ]).toBuildOne({
                id: Mock.Int,
                extra_id: 1
            }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    extra_id: 1,
                    extra: [
                        'red',
                        'green',
                    ]
                })

        })

        it('[obj] should expand non-list field as single object', async () => {

            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    extra_id: $.int
                }))
                .graph($ => ({
                    extra: $.one('extra', {
                        id: {'.':'extra_id'}
                    } as any)
                }))
                .view('default', $ => ({
                    ...$.inject.root,
                    extra: $.graph('extra', undefined).obj($ => ({
                        root: $.root,
                        current: $.current,
                        value: $.value,
                    }))
                })),
            [
                extraBucket,
                colorBucket
            ]).toBuildOne({
                id: Mock.Int,
                extra_id: 1
            }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    extra_id: 1,
                    extra: {
                        root: { id: Mock.Int, extra_id: 1 },
                        current: { id: 1, test_id: 1, extra: 'red', data: [1,2] },
                        value: { id: 1, test_id: 1, extra: 'red', data: [1,2] },
                    }
                })

        })

        it('[obj] should expand list field without spread as single object', async () => {

            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    extra_id: $.int
                }))
                .graph($ => ({
                    extra: $.many('extra', {
                        test_id: {'.':'extra_id'}
                    } as any)
                }))
                .view('default', $ => ({
                    ...$.inject.root,
                    extra: $.graph('extra', undefined).obj($ => ({
                        root: $.root,
                        current: $.current,
                        value: $.value,
                    }))
                })),
            [
                extraBucket,
                colorBucket
            ]).toBuildOne({
                id: Mock.Int,
                extra_id: 1
            }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    extra_id: 1,
                    extra: {
                        root: { id: Mock.Int, extra_id: 1 },
                        current: { id: Mock.Int, extra_id: 1 },
                        value: [
                            { id: 1, test_id: 1, extra: 'red', data: [1,2] },
                            { id: 2, test_id: 1, extra: 'green', data: [3,4] },
                        ]
                    }
                })
        })

        it('[map|obj] should expand list field with spread as a list of objects', async () => {

            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    extra_id: $.int
                }))
                .graph($ => ({
                    extra: $.many('extra', {
                        test_id: {'.':'extra_id'}
                    } as any)
                }))
                .view('default', $ => ({
                    ...$.inject.root,
                    extra: $.graph('extra', undefined).map($ => $.obj($ => ({
                        root: $.root,
                        current: $.current,
                        value: $.value,
                    })))
                })),
            [
                extraBucket,
                colorBucket
            ]).toBuildOne({
                id: Mock.Int,
                extra_id: 1
            }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    extra_id: 1,
                    extra: [
                        {
                            root: { id: Mock.Int, extra_id: 1 },
                            current: { id: 1, test_id: 1, extra: 'red', data: [1,2] },
                            value: { id: 1, test_id: 1, extra: 'red', data: [1,2] }
                        },
                        {
                            root: { id: Mock.Int, extra_id: 1 },
                            current: { id: 2, test_id: 1, extra: 'green', data: [3,4] },
                            value: { id: 2, test_id: 1, extra: 'green', data: [3,4] },
                        }
                    ]
                })
        })

        it('[map|obj] should inject root on each item', async () => {

            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    extra_id: $.int
                }))
                .graph($ => ({
                    extra: $.many('extra', {
                        test_id: {'.':'extra_id'}
                    } as any)
                }))
                .view('default', $ => ({
                    ...$.inject.root,
                    extra: $.graph('extra', undefined).map($ => $.obj($ => ({
                        ...$.inject.root
                    })))
                })),
            [
                extraBucket,
                colorBucket
            ]).toBuildOne({
                id: Mock.Int,
                extra_id: 1
            }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    extra_id: 1,
                    extra: [
                        { id: Mock.Int, extra_id: 1 },
                        { id: Mock.Int, extra_id: 1 }
                    ]
                })
        })

        it('[map|obj] should inject current on each item', async () => {

            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    extra_id: $.int
                }))
                .graph($ => ({
                    extra: $.many('extra', {
                        test_id: {'.':'extra_id'}
                    } as any)
                }))
                .view('default', $ => ({
                    ...$.inject.root,
                    extra: $.graph('extra', undefined).map($ => $.obj($ => ({
                        ...$.inject.current
                    })))
                })),
            [
                extraBucket,
                colorBucket
            ]).toBuildOne({
                id: Mock.Int,
                extra_id: 1
            }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    extra_id: 1,
                    extra: [
                        { id: 1, test_id: 1, extra: 'red', data: [1,2] },
                        { id: 2, test_id: 1, extra: 'green', data: [3,4] }
                    ]
                })
        })

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
                ...$.inject.root,
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
                ...$.inject.root,
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
                        color: { $v: 'default', id: 1, name: 'red' }
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
