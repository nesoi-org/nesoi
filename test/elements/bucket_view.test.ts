import { Log } from '~/engine/util/log'
import { expectBucket, givenBucket } from 'nesoi/tools/joaquin/bucket';
import { Mock } from './mock';
import { NesoiDatetime } from '~/engine/data/datetime';
import { NesoiDate } from '~/engine/data/date';
import { NesoiDecimal } from '~/engine/data/decimal';
import { NesoiDuration } from '~/engine/data/duration';

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

        it('should parse view with object model fields', () => 
            expectBucket($ => $
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

        it('should parse view with list model fields as dict', () =>
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    tags: $.list($.string)
                }))
                .view('default', $ => ({
                    tags_dict: $.model('tags.*').as_dict(),
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
                    tags: { a: Mock.String, b: Mock.String2 }
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    tags: { a: Mock.String, b: Mock.String2 },
                    tags_all: [ Mock.String, Mock.String2 ]
                })
        )

        it('should parse view with dict model fields as dict', () =>
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    tags: $.dict($.string)
                }))
                .view('default', $ => ({
                    tags_dict: $.model('tags.*').as_dict(),
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    tags: { a: Mock.String, b: Mock.String2 }
                }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    tags_dict: { a: Mock.String, b: Mock.String2 }
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

        it('should parse view with complex union fields (1)', () => {
            expectUnionBucket.toBuildOne({
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

        it('should parse view with complex union fields (2)', () =>
            expectUnionBucket
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

        it('should parse view with complex union fields (3)', () =>
            expectUnionBucket
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
                    tags_all: [
                        ['A1', 'A2'], ['B1', 'B2']
                    ],
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

        it('[map] should parse view with subview - no children, non-obj, empty output', () =>
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    list_a: $.list($.string),
                    list_b: $.list($.string),
                }))
                .view('default', $ => ({
                    list: $.model('list_a.*').map($ => ({}))
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

        it('[map] should parse view with subview - root, non-obj, empty output', () =>
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    list_a: $.list($.string),
                    list_b: $.list($.string),
                }))
                .view('default', $ => ({
                    list: $.model('list_a.*').map($ => ({
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
                    list: [{}, {}],
                })
        )

        it('[map] should parse view with subview - root, non-obj, ignore original', () =>
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    list_a: $.list($.string),
                    list_b: $.list($.string),
                }))
                .view('default', $ => ({
                    list: $.model('list_a.*').map($ => ({
                        ...$.inject.root,
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
                    list: [{ b: 'B1' }, { b: 'B2' }],
                })
        )

        it('[map] should parse view with subview - root, obj, original output', () =>
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
                    list: $.model('list_a.*').map($ => ({
                        ...$.inject.value
                    }))
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

        it('[map] should parse view with subview - root, non-obj, original output', () =>
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
                    list: $.model('list_a.*').map($ => ({
                        ...$.inject.value,
                        b: $.model('list_b.$0')
                    }))
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
                    games: $.model('games.*').map($ => ({
                        score: $.model('games.$0.score.*').map($ => ({
                            value: $.value,
                            player: $.model('players.$1'),
                            time: $.model('times.$0.$1')
                        })).dict()
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

    describe('Serialize Model Fields', () => {

        const datetimes = [
            NesoiDatetime.now(),
            NesoiDatetime.now().minus('1 hour'),
            NesoiDatetime.now().minus('2 hours'),
            NesoiDatetime.now().minus('3 hours'),
            NesoiDatetime.now().minus('4 hours'),
            NesoiDatetime.now().minus('5 hours'),
            NesoiDatetime.now().minus('6 hours'),
        ]
        const isos = datetimes.map(d => d.toISO())
    
        it('should serialize datetime', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    timestamp: $.datetime
                }))
                .view('default', $ => ({
                    timestamp: $.model('timestamp')
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    timestamp: datetimes[0]
                },
                'default',
                { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    timestamp: isos[0]
                })
        )

        it('should serialize deep datetime', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    list: $.list($.datetime),
                    dict: $.dict($.datetime),
                    obj: $.obj({
                        a: $.datetime
                    }),
                    list_list: $.list($.list($.datetime)),
                    list_dict: $.list($.dict($.datetime)),
                    list_obj: $.list($.obj({ a: $.datetime })),
                    dict_list: $.dict($.list($.datetime)),
                    dict_dict: $.dict($.dict($.datetime)),
                    dict_obj: $.dict($.obj({ a: $.datetime })),
                    obj_list: $.obj({
                        a: $.list($.datetime)
                    }),
                    obj_dict: $.obj({
                        a: $.dict($.datetime)
                    }),
                    obj_obj: $.obj({
                        a: $.obj({ b: $.datetime })
                    })
                }))
                .view('default', $ => ({
                    list: $.model('list'),
                    list_all: $.model('list.*'),
                    dict: $.model('dict'),
                    dict_all: $.model('dict.*'),
                    obj: $.model('obj'),
                    obj_all: $.model('obj.*'),
                    
                    list_list: $.model('list_list'),
                    list_list_all: $.model('list_list.*'),
                    list_list_all_all: $.model('list_list.*.*'),
                    list_dict: $.model('list_dict'),
                    list_dict_all: $.model('list_dict.*'),
                    list_dict_all_all: $.model('list_dict.*.*'),
                    list_obj: $.model('list_obj'),
                    list_obj_all: $.model('list_obj.*'),
                    list_obj_all_all: $.model('list_obj.*.*'),

                    dict_list: $.model('dict_list'),
                    dict_list_all: $.model('dict_list.*'),
                    dict_list_all_all: $.model('dict_list.*.*'),
                    dict_dict: $.model('dict_dict'),
                    dict_dict_all: $.model('dict_dict.*'),
                    dict_dict_all_all: $.model('dict_dict.*.*'),
                    dict_obj: $.model('dict_obj'),
                    dict_obj_all: $.model('dict_obj.*'),
                    dict_obj_all_all: $.model('dict_obj.*.*'),

                    obj_list: $.model('obj_list'),
                    obj_list_all: $.model('obj_list.*'),
                    obj_list_all_all: $.model('obj_list.a.*'),
                    obj_dict: $.model('obj_dict'),
                    obj_dict_all: $.model('obj_dict.*'),
                    obj_dict_all_all: $.model('obj_dict.a.*'),
                    obj_obj: $.model('obj_obj'),
                    obj_obj_all: $.model('obj_obj.*'),
                    obj_obj_all_all: $.model('obj_obj.a.*'),
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    list: [datetimes[0], datetimes[1]],
                    dict: { x: datetimes[1], y: datetimes[2] },
                    obj: { a: datetimes[3] },
                    list_list: [[datetimes[3], datetimes[4]], [datetimes[5], datetimes[0]]],
                    list_dict: [{ x: datetimes[1], y: datetimes[2] }, { w: datetimes[3], z: datetimes[4] }],
                    list_obj: [{ a: datetimes[5] }, { a: datetimes[0] }],
                    dict_list: { x: [datetimes[1], datetimes[2]], y: [datetimes[3], datetimes[4]] },
                    dict_dict: { x: { i: datetimes[5], j: datetimes[0] }, y: { k: datetimes[1], l: datetimes[2] } },
                    dict_obj: { x: { a: datetimes[3] }, y: { a: datetimes[4] } },
                    obj_list: { a: [datetimes[5], datetimes[0]] },
                    obj_dict: { a: { i: datetimes[1], j: datetimes[2] } },
                    obj_obj: { a: { b: datetimes[3] } },
                },
                'default',
                { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    list: [isos[0], isos[1]],
                    list_all: [isos[0], isos[1]],
                    dict: { x: isos[1], y: isos[2] },
                    dict_all: [isos[1], isos[2]],
                    obj: { a: isos[3] },
                    obj_all: [isos[3]],

                    list_list: [[isos[3], isos[4]], [isos[5], isos[0]]],
                    list_list_all: [[isos[3], isos[4]], [isos[5], isos[0]]],
                    list_list_all_all: [isos[3], isos[4], isos[5], isos[0]],
                    list_dict: [{ x: isos[1], y: isos[2] }, { w: isos[3], z: isos[4] }],
                    list_dict_all: [{ x: isos[1], y: isos[2] }, { w: isos[3], z: isos[4] }],
                    list_dict_all_all: [ isos[1], isos[2], isos[3], isos[4] ],
                    list_obj: [{ a: isos[5] }, { a: isos[0] }],
                    list_obj_all: [{ a: isos[5] }, { a: isos[0] }],
                    list_obj_all_all: [ isos[5], isos[0] ],

                    dict_list: { x: [isos[1], isos[2]], y: [isos[3], isos[4]] },
                    dict_list_all: [ [isos[1], isos[2]], [isos[3], isos[4]] ],
                    dict_list_all_all: [isos[1], isos[2], isos[3], isos[4]],
                    dict_dict: { x: { i: isos[5], j: isos[0] }, y: { k: isos[1], l: isos[2] } },
                    dict_dict_all: [{ i: isos[5], j: isos[0] }, { k: isos[1], l: isos[2] }],
                    dict_dict_all_all: [isos[5], isos[0], isos[1], isos[2] ],
                    dict_obj: { x: { a: isos[3] }, y: { a: isos[4] } },
                    dict_obj_all: [ { a: isos[3] }, { a: isos[4] } ],
                    dict_obj_all_all: [ isos[3], isos[4] ],

                    obj_list: { a: [isos[5], isos[0]] },
                    obj_list_all: [ [isos[5], isos[0]] ],
                    obj_list_all_all: [isos[5], isos[0]],
                    obj_dict: { a: { i: isos[1], j: isos[2] } },
                    obj_dict_all: [{ i: isos[1], j: isos[2] } ],
                    obj_dict_all_all: [ isos[1],  isos[2] ],
                    obj_obj: { a: { b: isos[3] } },
                    obj_obj_all: [{ b: isos[3] }],
                    obj_obj_all_all: [ isos[3] ],
                })
        )

        it('should serialize datetime inside union', () => {
            const expectUnionBucket = expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    union: $.union(
                        $.datetime,
                        $.list($.datetime),
                        $.obj({
                            a: $.datetime
                        }),
                        $.dict($.datetime),
                    )
                }))
                .view('default', $ => ({
                    union: $.model('union')
                }))
            )

            expectUnionBucket.toBuildOne({
                id: Mock.Int,
                union: datetimes[0]
            },
            'default', { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    union: isos[0]
                })

            expectUnionBucket.toBuildOne({
                id: Mock.Int,
                union: [datetimes[0], datetimes[1]]
            },
            'default', { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    union: [isos[0], isos[1]]
                })

            expectUnionBucket.toBuildOne({
                id: Mock.Int,
                union: { x: datetimes[0], y: datetimes[1] }
            },
            'default', { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    union: { x: isos[0], y: isos[1] }
                })

            expectUnionBucket.toBuildOne({
                id: Mock.Int,
                union: { a: datetimes[0] }
            },
            'default', { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    union: { a: isos[0] }
                })
        })

        const dates = [
            NesoiDate.now(),
            NesoiDate.now(),
            NesoiDate.now(),
            NesoiDate.now(),
            NesoiDate.now(),
            NesoiDate.now(),
            NesoiDate.now(),
        ]
        const isodates = dates.map(d => d.toISO())

        it('should serialize date', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    timestamp: $.date
                }))
                .view('default', $ => ({
                    timestamp: $.model('timestamp')
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    timestamp: dates[0]
                },
                'default',
                { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    timestamp: isodates[0]
                })
        )

        it('should serialize deep date', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    list: $.list($.date),
                    dict: $.dict($.date),
                    obj: $.obj({
                        a: $.date
                    }),
                    list_list: $.list($.list($.date)),
                    list_dict: $.list($.dict($.date)),
                    list_obj: $.list($.obj({ a: $.date })),
                    dict_list: $.dict($.list($.date)),
                    dict_dict: $.dict($.dict($.date)),
                    dict_obj: $.dict($.obj({ a: $.date })),
                    obj_list: $.obj({
                        a: $.list($.date)
                    }),
                    obj_dict: $.obj({
                        a: $.dict($.date)
                    }),
                    obj_obj: $.obj({
                        a: $.obj({ b: $.date })
                    })
                }))
                .view('default', $ => ({
                    list: $.model('list'),
                    list_all: $.model('list.*'),
                    dict: $.model('dict'),
                    dict_all: $.model('dict.*'),
                    obj: $.model('obj'),
                    obj_all: $.model('obj.*'),
                    
                    list_list: $.model('list_list'),
                    list_list_all: $.model('list_list.*'),
                    list_list_all_all: $.model('list_list.*.*'),
                    list_dict: $.model('list_dict'),
                    list_dict_all: $.model('list_dict.*'),
                    list_dict_all_all: $.model('list_dict.*.*'),
                    list_obj: $.model('list_obj'),
                    list_obj_all: $.model('list_obj.*'),
                    list_obj_all_all: $.model('list_obj.*.*'),

                    dict_list: $.model('dict_list'),
                    dict_list_all: $.model('dict_list.*'),
                    dict_list_all_all: $.model('dict_list.*.*'),
                    dict_dict: $.model('dict_dict'),
                    dict_dict_all: $.model('dict_dict.*'),
                    dict_dict_all_all: $.model('dict_dict.*.*'),
                    dict_obj: $.model('dict_obj'),
                    dict_obj_all: $.model('dict_obj.*'),
                    dict_obj_all_all: $.model('dict_obj.*.*'),

                    obj_list: $.model('obj_list'),
                    obj_list_all: $.model('obj_list.*'),
                    obj_list_all_all: $.model('obj_list.a.*'),
                    obj_dict: $.model('obj_dict'),
                    obj_dict_all: $.model('obj_dict.*'),
                    obj_dict_all_all: $.model('obj_dict.a.*'),
                    obj_obj: $.model('obj_obj'),
                    obj_obj_all: $.model('obj_obj.*'),
                    obj_obj_all_all: $.model('obj_obj.a.*'),
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    list: [dates[0], dates[1]],
                    dict: { x: dates[1], y: dates[2] },
                    obj: { a: dates[3] },
                    list_list: [[dates[3], dates[4]], [dates[5], dates[0]]],
                    list_dict: [{ x: dates[1], y: dates[2] }, { w: dates[3], z: dates[4] }],
                    list_obj: [{ a: dates[5] }, { a: dates[0] }],
                    dict_list: { x: [dates[1], dates[2]], y: [dates[3], dates[4]] },
                    dict_dict: { x: { i: dates[5], j: dates[0] }, y: { k: dates[1], l: dates[2] } },
                    dict_obj: { x: { a: dates[3] }, y: { a: dates[4] } },
                    obj_list: { a: [dates[5], dates[0]] },
                    obj_dict: { a: { i: dates[1], j: dates[2] } },
                    obj_obj: { a: { b: dates[3] } },
                },
                'default',
                { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    list: [isodates[0], isodates[1]],
                    list_all: [isodates[0], isodates[1]],
                    dict: { x: isodates[1], y: isodates[2] },
                    dict_all: [isodates[1], isodates[2]],
                    obj: { a: isodates[3] },
                    obj_all: [isodates[3]],

                    list_list: [[isodates[3], isodates[4]], [isodates[5], isodates[0]]],
                    list_list_all: [[isodates[3], isodates[4]], [isodates[5], isodates[0]]],
                    list_list_all_all: [isodates[3], isodates[4], isodates[5], isodates[0]],
                    list_dict: [{ x: isodates[1], y: isodates[2] }, { w: isodates[3], z: isodates[4] }],
                    list_dict_all: [{ x: isodates[1], y: isodates[2] }, { w: isodates[3], z: isodates[4] }],
                    list_dict_all_all: [ isodates[1], isodates[2], isodates[3], isodates[4] ],
                    list_obj: [{ a: isodates[5] }, { a: isodates[0] }],
                    list_obj_all: [{ a: isodates[5] }, { a: isodates[0] }],
                    list_obj_all_all: [ isodates[5], isodates[0] ],

                    dict_list: { x: [isodates[1], isodates[2]], y: [isodates[3], isodates[4]] },
                    dict_list_all: [ [isodates[1], isodates[2]], [isodates[3], isodates[4]] ],
                    dict_list_all_all: [isodates[1], isodates[2], isodates[3], isodates[4]],
                    dict_dict: { x: { i: isodates[5], j: isodates[0] }, y: { k: isodates[1], l: isodates[2] } },
                    dict_dict_all: [{ i: isodates[5], j: isodates[0] }, { k: isodates[1], l: isodates[2] }],
                    dict_dict_all_all: [isodates[5], isodates[0], isodates[1], isodates[2] ],
                    dict_obj: { x: { a: isodates[3] }, y: { a: isodates[4] } },
                    dict_obj_all: [ { a: isodates[3] }, { a: isodates[4] } ],
                    dict_obj_all_all: [ isodates[3], isodates[4] ],

                    obj_list: { a: [isodates[5], isodates[0]] },
                    obj_list_all: [ [isodates[5], isodates[0]] ],
                    obj_list_all_all: [isodates[5], isodates[0]],
                    obj_dict: { a: { i: isodates[1], j: isodates[2] } },
                    obj_dict_all: [{ i: isodates[1], j: isodates[2] } ],
                    obj_dict_all_all: [ isodates[1],  isodates[2] ],
                    obj_obj: { a: { b: isodates[3] } },
                    obj_obj_all: [{ b: isodates[3] }],
                    obj_obj_all_all: [ isodates[3] ],
                })
        )

        it('should serialize date inside union', () => {
            const expectUnionBucket = expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    union: $.union(
                        $.date,
                        $.list($.date),
                        $.obj({
                            a: $.date
                        }),
                        $.dict($.date),
                    )
                }))
                .view('default', $ => ({
                    union: $.model('union')
                }))
            )

            expectUnionBucket.toBuildOne({
                id: Mock.Int,
                union: dates[0]
            },
            'default', { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    union: isodates[0]
                })

            expectUnionBucket.toBuildOne({
                id: Mock.Int,
                union: [dates[0], dates[1]]
            },
            'default', { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    union: [isodates[0], isodates[1]]
                })

            expectUnionBucket.toBuildOne({
                id: Mock.Int,
                union: { x: dates[0], y: dates[1] }
            },
            'default', { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    union: { x: isodates[0], y: isodates[1] }
                })

            expectUnionBucket.toBuildOne({
                id: Mock.Int,
                union: { a: dates[0] }
            },
            'default', { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    union: { a: isodates[0] }
                })
        })

        const durations = [
            NesoiDuration.fromString('1 hour'),
            NesoiDuration.fromString('2 hours'),
            NesoiDuration.fromString('3 hours'),
            NesoiDuration.fromString('4 hours'),
            NesoiDuration.fromString('5 hours'),
            NesoiDuration.fromString('6 hours'),
            NesoiDuration.fromString('7 hours'),
        ]
        const strdur = durations.map(d => d.toString())

        it('should serialize duration', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    timestamp: $.duration
                }))
                .view('default', $ => ({
                    timestamp: $.model('timestamp')
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    timestamp: durations[0]
                },
                'default',
                { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    timestamp: strdur[0]
                })
        )

        it('should serialize deep duration', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    list: $.list($.duration),
                    dict: $.dict($.duration),
                    obj: $.obj({
                        a: $.duration
                    }),
                    list_list: $.list($.list($.duration)),
                    list_dict: $.list($.dict($.duration)),
                    list_obj: $.list($.obj({ a: $.duration })),
                    dict_list: $.dict($.list($.duration)),
                    dict_dict: $.dict($.dict($.duration)),
                    dict_obj: $.dict($.obj({ a: $.duration })),
                    obj_list: $.obj({
                        a: $.list($.duration)
                    }),
                    obj_dict: $.obj({
                        a: $.dict($.duration)
                    }),
                    obj_obj: $.obj({
                        a: $.obj({ b: $.duration })
                    })
                }))
                .view('default', $ => ({
                    list: $.model('list'),
                    list_all: $.model('list.*'),
                    dict: $.model('dict'),
                    dict_all: $.model('dict.*'),
                    obj: $.model('obj'),
                    obj_all: $.model('obj.*'),
                    
                    list_list: $.model('list_list'),
                    list_list_all: $.model('list_list.*'),
                    list_list_all_all: $.model('list_list.*.*'),
                    list_dict: $.model('list_dict'),
                    list_dict_all: $.model('list_dict.*'),
                    list_dict_all_all: $.model('list_dict.*.*'),
                    list_obj: $.model('list_obj'),
                    list_obj_all: $.model('list_obj.*'),
                    list_obj_all_all: $.model('list_obj.*.*'),

                    dict_list: $.model('dict_list'),
                    dict_list_all: $.model('dict_list.*'),
                    dict_list_all_all: $.model('dict_list.*.*'),
                    dict_dict: $.model('dict_dict'),
                    dict_dict_all: $.model('dict_dict.*'),
                    dict_dict_all_all: $.model('dict_dict.*.*'),
                    dict_obj: $.model('dict_obj'),
                    dict_obj_all: $.model('dict_obj.*'),
                    dict_obj_all_all: $.model('dict_obj.*.*'),

                    obj_list: $.model('obj_list'),
                    obj_list_all: $.model('obj_list.*'),
                    obj_list_all_all: $.model('obj_list.a.*'),
                    obj_dict: $.model('obj_dict'),
                    obj_dict_all: $.model('obj_dict.*'),
                    obj_dict_all_all: $.model('obj_dict.a.*'),
                    obj_obj: $.model('obj_obj'),
                    obj_obj_all: $.model('obj_obj.*'),
                    obj_obj_all_all: $.model('obj_obj.a.*'),
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    list: [durations[0], durations[1]],
                    dict: { x: durations[1], y: durations[2] },
                    obj: { a: durations[3] },
                    list_list: [[durations[3], durations[4]], [durations[5], durations[0]]],
                    list_dict: [{ x: durations[1], y: durations[2] }, { w: durations[3], z: durations[4] }],
                    list_obj: [{ a: durations[5] }, { a: durations[0] }],
                    dict_list: { x: [durations[1], durations[2]], y: [durations[3], durations[4]] },
                    dict_dict: { x: { i: durations[5], j: durations[0] }, y: { k: durations[1], l: durations[2] } },
                    dict_obj: { x: { a: durations[3] }, y: { a: durations[4] } },
                    obj_list: { a: [durations[5], durations[0]] },
                    obj_dict: { a: { i: durations[1], j: durations[2] } },
                    obj_obj: { a: { b: durations[3] } },
                },
                'default',
                { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    list: [strdur[0], strdur[1]],
                    list_all: [strdur[0], strdur[1]],
                    dict: { x: strdur[1], y: strdur[2] },
                    dict_all: [strdur[1], strdur[2]],
                    obj: { a: strdur[3] },
                    obj_all: [strdur[3]],

                    list_list: [[strdur[3], strdur[4]], [strdur[5], strdur[0]]],
                    list_list_all: [[strdur[3], strdur[4]], [strdur[5], strdur[0]]],
                    list_list_all_all: [strdur[3], strdur[4], strdur[5], strdur[0]],
                    list_dict: [{ x: strdur[1], y: strdur[2] }, { w: strdur[3], z: strdur[4] }],
                    list_dict_all: [{ x: strdur[1], y: strdur[2] }, { w: strdur[3], z: strdur[4] }],
                    list_dict_all_all: [ strdur[1], strdur[2], strdur[3], strdur[4] ],
                    list_obj: [{ a: strdur[5] }, { a: strdur[0] }],
                    list_obj_all: [{ a: strdur[5] }, { a: strdur[0] }],
                    list_obj_all_all: [ strdur[5], strdur[0] ],

                    dict_list: { x: [strdur[1], strdur[2]], y: [strdur[3], strdur[4]] },
                    dict_list_all: [ [strdur[1], strdur[2]], [strdur[3], strdur[4]] ],
                    dict_list_all_all: [strdur[1], strdur[2], strdur[3], strdur[4]],
                    dict_dict: { x: { i: strdur[5], j: strdur[0] }, y: { k: strdur[1], l: strdur[2] } },
                    dict_dict_all: [{ i: strdur[5], j: strdur[0] }, { k: strdur[1], l: strdur[2] }],
                    dict_dict_all_all: [strdur[5], strdur[0], strdur[1], strdur[2] ],
                    dict_obj: { x: { a: strdur[3] }, y: { a: strdur[4] } },
                    dict_obj_all: [ { a: strdur[3] }, { a: strdur[4] } ],
                    dict_obj_all_all: [ strdur[3], strdur[4] ],

                    obj_list: { a: [strdur[5], strdur[0]] },
                    obj_list_all: [ [strdur[5], strdur[0]] ],
                    obj_list_all_all: [strdur[5], strdur[0]],
                    obj_dict: { a: { i: strdur[1], j: strdur[2] } },
                    obj_dict_all: [{ i: strdur[1], j: strdur[2] } ],
                    obj_dict_all_all: [ strdur[1],  strdur[2] ],
                    obj_obj: { a: { b: strdur[3] } },
                    obj_obj_all: [{ b: strdur[3] }],
                    obj_obj_all_all: [ strdur[3] ],
                })
        )

        it('should serialize duration inside union', () => {
            const expectUnionBucket = expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    union: $.union(
                        $.duration,
                        $.list($.duration),
                        $.obj({
                            a: $.duration
                        }),
                        $.dict($.duration),
                    )
                }))
                .view('default', $ => ({
                    union: $.model('union')
                }))
            )

            expectUnionBucket.toBuildOne({
                id: Mock.Int,
                union: durations[0]
            },
            'default', { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    union: strdur[0]
                })

            expectUnionBucket.toBuildOne({
                id: Mock.Int,
                union: [durations[0], durations[1]]
            },
            'default', { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    union: [strdur[0], strdur[1]]
                })

            expectUnionBucket.toBuildOne({
                id: Mock.Int,
                union: { x: durations[0], y: durations[1] }
            },
            'default', { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    union: { x: strdur[0], y: strdur[1] }
                })

            expectUnionBucket.toBuildOne({
                id: Mock.Int,
                union: { a: durations[0] }
            },
            'default', { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    union: { a: strdur[0] }
                })
        })

        const decimals = [
            new NesoiDecimal('12.34'),
            new NesoiDecimal('56.78'),
            new NesoiDecimal('90.12'),
            new NesoiDecimal('34.56'),
            new NesoiDecimal('78.90'),
            new NesoiDecimal('12.34'),
            new NesoiDecimal('56.78'),
        ]
        const strdec = decimals.map(d => d.toString())

        it('should serialize decimal', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    timestamp: $.decimal()
                }))
                .view('default', $ => ({
                    timestamp: $.model('timestamp')
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    timestamp: decimals[0]
                },
                'default',
                { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    timestamp: strdec[0]
                })
        )

        it('should serialize deep decimal', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    list: $.list($.decimal()),
                    dict: $.dict($.decimal()),
                    obj: $.obj({
                        a: $.decimal()
                    }),
                    list_list: $.list($.list($.decimal())),
                    list_dict: $.list($.dict($.decimal())),
                    list_obj: $.list($.obj({ a: $.decimal() })),
                    dict_list: $.dict($.list($.decimal())),
                    dict_dict: $.dict($.dict($.decimal())),
                    dict_obj: $.dict($.obj({ a: $.decimal() })),
                    obj_list: $.obj({
                        a: $.list($.decimal())
                    }),
                    obj_dict: $.obj({
                        a: $.dict($.decimal())
                    }),
                    obj_obj: $.obj({
                        a: $.obj({ b: $.decimal() })
                    })
                }))
                .view('default', $ => ({
                    list: $.model('list'),
                    list_all: $.model('list.*'),
                    dict: $.model('dict'),
                    dict_all: $.model('dict.*'),
                    obj: $.model('obj'),
                    obj_all: $.model('obj.*'),
                    
                    list_list: $.model('list_list'),
                    list_list_all: $.model('list_list.*'),
                    list_list_all_all: $.model('list_list.*.*'),
                    list_dict: $.model('list_dict'),
                    list_dict_all: $.model('list_dict.*'),
                    list_dict_all_all: $.model('list_dict.*.*'),
                    list_obj: $.model('list_obj'),
                    list_obj_all: $.model('list_obj.*'),
                    list_obj_all_all: $.model('list_obj.*.*'),

                    dict_list: $.model('dict_list'),
                    dict_list_all: $.model('dict_list.*'),
                    dict_list_all_all: $.model('dict_list.*.*'),
                    dict_dict: $.model('dict_dict'),
                    dict_dict_all: $.model('dict_dict.*'),
                    dict_dict_all_all: $.model('dict_dict.*.*'),
                    dict_obj: $.model('dict_obj'),
                    dict_obj_all: $.model('dict_obj.*'),
                    dict_obj_all_all: $.model('dict_obj.*.*'),

                    obj_list: $.model('obj_list'),
                    obj_list_all: $.model('obj_list.*'),
                    obj_list_all_all: $.model('obj_list.a.*'),
                    obj_dict: $.model('obj_dict'),
                    obj_dict_all: $.model('obj_dict.*'),
                    obj_dict_all_all: $.model('obj_dict.a.*'),
                    obj_obj: $.model('obj_obj'),
                    obj_obj_all: $.model('obj_obj.*'),
                    obj_obj_all_all: $.model('obj_obj.a.*'),
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    list: [decimals[0], decimals[1]],
                    dict: { x: decimals[1], y: decimals[2] },
                    obj: { a: decimals[3] },
                    list_list: [[decimals[3], decimals[4]], [decimals[5], decimals[0]]],
                    list_dict: [{ x: decimals[1], y: decimals[2] }, { w: decimals[3], z: decimals[4] }],
                    list_obj: [{ a: decimals[5] }, { a: decimals[0] }],
                    dict_list: { x: [decimals[1], decimals[2]], y: [decimals[3], decimals[4]] },
                    dict_dict: { x: { i: decimals[5], j: decimals[0] }, y: { k: decimals[1], l: decimals[2] } },
                    dict_obj: { x: { a: decimals[3] }, y: { a: decimals[4] } },
                    obj_list: { a: [decimals[5], decimals[0]] },
                    obj_dict: { a: { i: decimals[1], j: decimals[2] } },
                    obj_obj: { a: { b: decimals[3] } },
                },
                'default',
                { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    list: [strdec[0], strdec[1]],
                    list_all: [strdec[0], strdec[1]],
                    dict: { x: strdec[1], y: strdec[2] },
                    dict_all: [strdec[1], strdec[2]],
                    obj: { a: strdec[3] },
                    obj_all: [strdec[3]],

                    list_list: [[strdec[3], strdec[4]], [strdec[5], strdec[0]]],
                    list_list_all: [[strdec[3], strdec[4]], [strdec[5], strdec[0]]],
                    list_list_all_all: [strdec[3], strdec[4], strdec[5], strdec[0]],
                    list_dict: [{ x: strdec[1], y: strdec[2] }, { w: strdec[3], z: strdec[4] }],
                    list_dict_all: [{ x: strdec[1], y: strdec[2] }, { w: strdec[3], z: strdec[4] }],
                    list_dict_all_all: [ strdec[1], strdec[2], strdec[3], strdec[4] ],
                    list_obj: [{ a: strdec[5] }, { a: strdec[0] }],
                    list_obj_all: [{ a: strdec[5] }, { a: strdec[0] }],
                    list_obj_all_all: [ strdec[5], strdec[0] ],

                    dict_list: { x: [strdec[1], strdec[2]], y: [strdec[3], strdec[4]] },
                    dict_list_all: [ [strdec[1], strdec[2]], [strdec[3], strdec[4]] ],
                    dict_list_all_all: [strdec[1], strdec[2], strdec[3], strdec[4]],
                    dict_dict: { x: { i: strdec[5], j: strdec[0] }, y: { k: strdec[1], l: strdec[2] } },
                    dict_dict_all: [{ i: strdec[5], j: strdec[0] }, { k: strdec[1], l: strdec[2] }],
                    dict_dict_all_all: [strdec[5], strdec[0], strdec[1], strdec[2] ],
                    dict_obj: { x: { a: strdec[3] }, y: { a: strdec[4] } },
                    dict_obj_all: [ { a: strdec[3] }, { a: strdec[4] } ],
                    dict_obj_all_all: [ strdec[3], strdec[4] ],

                    obj_list: { a: [strdec[5], strdec[0]] },
                    obj_list_all: [ [strdec[5], strdec[0]] ],
                    obj_list_all_all: [strdec[5], strdec[0]],
                    obj_dict: { a: { i: strdec[1], j: strdec[2] } },
                    obj_dict_all: [{ i: strdec[1], j: strdec[2] } ],
                    obj_dict_all_all: [ strdec[1],  strdec[2] ],
                    obj_obj: { a: { b: strdec[3] } },
                    obj_obj_all: [{ b: strdec[3] }],
                    obj_obj_all_all: [ strdec[3] ],
                })
        )

        it('should serialize decimal inside union', () => {
            const expectUnionBucket = expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    union: $.union(
                        $.decimal(),
                        $.list($.decimal()),
                        $.obj({
                            a: $.decimal()
                        }),
                        $.dict($.decimal()),
                    )
                }))
                .view('default', $ => ({
                    union: $.model('union')
                }))
            )

            expectUnionBucket.toBuildOne({
                id: Mock.Int,
                union: decimals[0]
            },
            'default', { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    union: strdec[0]
                })

            expectUnionBucket.toBuildOne({
                id: Mock.Int,
                union: [decimals[0], decimals[1]]
            },
            'default', { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    union: [strdec[0], strdec[1]]
                })

            expectUnionBucket.toBuildOne({
                id: Mock.Int,
                union: { x: decimals[0], y: decimals[1] }
            },
            'default', { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    union: { x: strdec[0], y: strdec[1] }
                })

            expectUnionBucket.toBuildOne({
                id: Mock.Int,
                union: { a: decimals[0] }
            },
            'default', { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    union: { a: strdec[0] }
                })
        })

        it('should serialize fields when injecting root', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    date: $.date,
                    datetime: $.datetime,
                    decimal: $.decimal(),
                }))
                .view('default', $ => ({
                    ...$.inject.root
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    date: dates[0],
                    datetime: datetimes[0],
                    decimal: decimals[0],
                },
                'default',
                { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    date: isodates[0],
                    datetime: isos[0],
                    decimal: strdec[0],
                })
        )

        it('should serialize fields when injecting parent', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    date: $.date,
                    datetime: $.datetime,
                    decimal: $.decimal(),
                }))
                .view('default', $ => ({
                    ...$.inject.parent
                }))
            )
                .toBuildOne({
                    id: Mock.Int,
                    date: dates[0],
                    datetime: datetimes[0],
                    decimal: decimals[0],
                },
                'default',
                { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    date: isodates[0],
                    datetime: isos[0],
                    decimal: strdec[0],
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

        it('should parse many views with repeated and missing graph fields', () =>
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

        it('should parse view with graph field and prop', async () => {

            const expectBucketOneExtraAndProp = expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    extra_id: $.int
                }))
                .graph($ => ({
                    extra: $.one('extra', {
                        id: {'.':'extra_id'}
                    })
                }))
                .view('default', $ => ({
                    ...$.inject.root,
                    extra: $.graph('extra', undefined).pick('extra' as any)
                })),
            [
                extraBucket,
                colorBucket
            ])

            await expectBucketOneExtraAndProp.toBuildOne({
                id: Mock.Int,
                extra_id: 1
            }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    extra_id: 1,
                    extra: 'red'
                })

            await expectBucketOneExtraAndProp.toBuildOne({
                id: Mock.Int,
                extra_id: 2
            }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    extra_id: 2,
                    extra: 'green'
                })
        })

        it('should parse view with graph field and subview', async () => {

            const expectBucketOneExtraAndSubmodel = expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    extra_id: $.int
                }))
                .graph($ => ({
                    extra: $.one('extra', {
                        id: {'.':'extra_id'}
                    })
                }))
                .view('default', $ => ({
                    root: $.root,
                    parent: $.parent,
                    value: $.value,
                    extra: $.graph('extra', undefined).map($ => ({
                        root: $.root,
                        parent: $.parent,
                        value: $.value,
                        name: $.model('extra' as any),
                        deep: $.model('data.*' as any).map($ => ({
                            root: $.root,
                            parent: $.parent,
                            value: $.value,
                        })),
                        color: $.graph('color').map($ => ({
                            root: $.root,
                            parent: $.parent,
                            value: $.value,
                            identifier: $.model('name' as never)
                        }))
                    }))
                })),
            [
                extraBucket,
                colorBucket
            ])

            await expectBucketOneExtraAndSubmodel.toBuildOne({
                id: Mock.Int,
                extra_id: 4
            }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    root: { id: Mock.Int, extra_id: 4 },
                    parent: { id: Mock.Int, extra_id: 4 },
                    value: { id: Mock.Int, extra_id: 4 },
                    extra: {
                        id: 4,
                        root: { id: Mock.Int, extra_id: 4 },
                        parent: { id: 4, test_id: 2, extra: 'red', data: [7,8] },
                        value: { id: 4, test_id: 2, extra: 'red', data: [7,8] },
                        name: 'red',
                        deep: [
                            {
                                root: { id: Mock.Int, extra_id: 4 },
                                parent: { id: 4, test_id: 2, extra: 'red', data: [7,8] },
                                value: 7,
                            },
                            {
                                root: { id: Mock.Int, extra_id: 4 },
                                parent: { id: 4, test_id: 2, extra: 'red', data: [7,8] },
                                value: 8,
                            },
                        ],
                        color: {
                            id: 1,
                            root: { id: Mock.Int, extra_id: 4 },
                            parent: { id: 1, name: 'red' },
                            value: { id: 1, name: 'red' },
                            identifier: 'red'
                        }
                    }
                })
        })

        it('should parse view with graph many field and prop', async () => {

            const expectBucketManyExtraAndProp = expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    name: $.enum(['red', 'green', 'blue'])
                }))
                .graph($ => ({
                    extra: $.many('extra', {
                        extra: {'.':'name'}
                    } as any)
                }))
                .view('default', $ => ({
                    ...$.inject.root,
                    extra: $.graph('extra', undefined).pick('id')
                })),
            [
                extraBucket,
                colorBucket
            ])

            await expectBucketManyExtraAndProp.toBuildOne({
                id: Mock.Int,
                name: 'red'
            }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    name: 'red',
                    extra: [1, 4]
                })

            await expectBucketManyExtraAndProp.toBuildOne({
                id: Mock.Int,
                name: 'green'
            }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    name: 'green',
                    extra: [2, 5]
                })
        })


        it('should parse view with graph many field and subview', async () => {

            const expectBucketManyExtraAndSubmodel = expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    name: $.string
                }))
                .graph($ => ({
                    extra: $.many('extra', {
                        extra: {'.':'name'}
                    } as any)
                }))
                .view('default', $ => ({
                    ...$.inject.root,
                    extra: $.graph('extra', undefined).map($ => ({
                        value: $.value,
                        name: $.model('extra' as any),
                        color: $.graph('color')
                    }))
                })),
            [
                extraBucket,
                colorBucket
            ])

            await expectBucketManyExtraAndSubmodel.toBuildOne({
                id: Mock.Int,
                name: 'red'
            }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    name: 'red',
                    extra: [
                        {
                            id: 1,
                            value: { id: 1, test_id: 1, extra: 'red', data: [1,2] },
                            name: 'red',
                            color: { id: 1, name: 'red' }
                        },
                        {
                            id: 4,
                            value: { id: 4, test_id: 2, extra: 'red', data: [7,8] },
                            name: 'red',
                            color: { id: 1, name: 'red' }
                        }
                    ]
                })

            await expectBucketManyExtraAndSubmodel.toBuildOne({
                id: Mock.Int,
                name: 'green'
            }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    name: 'green',
                    extra: [
                        {
                            id: 2,
                            value: { id: 2, test_id: 1, extra: 'green', data: [3,4] },
                            name: 'green',
                            color: { id: 2, name: 'green' }
                        },
                        {
                            id: 5,
                            value: { id: 5, test_id: 3, extra: 'green', data: [9,10] },
                            name: 'green',
                            color: { id: 2, name: 'green' }
                        }
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

    describe('Chains', () => {

        const colorBucket = givenBucket('color', $ => $
            .model($ => ({
                id: $.int,
                name: $.string
            }))
            .view('walter', $ => ({
                walter_name: $.computed($ => 'walter ' + $.root.name)
            }))
        ).withData({
            1: { id: 1, name: 'red' },
            2: { id: 2, name: 'green' },
            3: { id: 3, name: 'blue' },
        })

        it('should parse view with model + model chain', async () => {
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    a: $.list($.string),
                    b: $.int,
                }))
                .view('default', $ => ({
                    color: $.model('a').chain($ => $.model('b'))
                }))
            ).toBuildOne({
                id: Mock.Int,
                a: ['a', 'b'],
                b: 13,
            }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    color: 13
                })
        })

        it('should parse view with model.* + model chain', async () => {
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    a: $.list($.string),
                    b: $.list($.int),
                }))
                .view('default', $ => ({
                    color: $.model('a.*').chain($ => $.model('b.$0'))
                }))
            ).toBuildOne({
                id: Mock.Int,
                a: ['a', 'b'],
                b: [2, 3],
            }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    color: [2, 3]
                })
        })

        it('should parse view with model + computed chain', async () => {

            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    data: $.list($.string)
                }))
                .view('default', $ => ({
                    color: $.model('data').chain($ => $
                        .computed($ => ({
                            root: $.root,
                            parent: $.parent,
                            value: $.value,
                        }))
                    )
                }))
            ).toBuildOne({
                id: Mock.Int,
                data: ['something', 'else']
            }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    color: {
                        root: { id: Mock.Int, data: ['something', 'else'] },
                        parent: { id: Mock.Int, data: ['something', 'else'] },
                        value: ['something', 'else']
                    }
                })
        })

        it('should parse view with model.* + computed chain', async () => {

            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    data: $.list($.string)
                }))
                .view('default', $ => ({
                    color: $.model('data.*').chain($ => $
                        .computed($ => ({
                            root: $.root,
                            parent: $.parent,
                            value: $.value,
                        }))
                    )
                }))
            ).toBuildOne({
                id: Mock.Int,
                data: ['something', 'else']
            }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    color: [
                        {
                            root: { id: Mock.Int, data: ['something', 'else'] },
                            parent: { id: Mock.Int, data: ['something', 'else'] },
                            value: 'something'
                        },
                        {
                            root: { id: Mock.Int, data: ['something', 'else'] },
                            parent: { id: Mock.Int, data: ['something', 'else'] },
                            value: 'else'
                        }
                    ]
                })
        })

        it('should parse view with model + graph chain', async () => {

            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    data: $.list($.string),
                    color_id: $.int
                }))
                .graph($ => ({
                    color: $.one('color', {
                        id: {'.':'color_id'}
                    })
                }))
                .view('default', $ => ({
                    color: $.model('data').chain($ => $.graph('color'))
                })),
            [
                colorBucket
            ]
            ).toBuildOne({
                id: Mock.Int,
                data: ['something', 'else'],
                color_id: 2
            }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    color: {
                        id: 2, name: 'green'
                    }
                })
        })

        it('should parse view with model.* + graph chain', async () => {

            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    data: $.list($.int)
                }))
                .graph($ => ({
                    'color.$': $.one('color', {
                        id: {'$':'data.$0' as any}
                    })
                }))
                .view('default', $ => ({
                    color: $.model('data.*').chain($ => $.graph('color.$0'))
                })),
            [
                colorBucket
            ]
            ).toBuildOne({
                id: Mock.Int,
                data: [2, 3]
            }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    color: [
                        { id: 2, name: 'green' },
                        { id: 3, name: 'blue' }
                    ]
                })
        })

        it('should parse view with graph + computed chain', async () => {
            await expectBucket($ => $
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
                    color: $.graph('color').chain($ => $
                        .computed($ => ({
                            root: $.root,
                            parent: $.parent,
                            value: $.value,
                        }))
                    )
                })),
            [
                colorBucket
            ]).toBuildOne({
                id: Mock.Int,
                color_id: 1
            }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    color: {
                        root: { id: Mock.Int, color_id: 1 },
                        parent: { id: 1, name: 'red' },
                        value: { id: 1, name: 'red' }
                    }
                })

        })

        it('should parse view with graph + transform (computed chain)', async () => {
            await expectBucket($ => $
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
                    color: $.graph('color').transform($ => ({
                        root: $.root,
                        parent: $.parent,
                        value: $.value,
                    }))
                })),
            [
                colorBucket
            ]).toBuildOne({
                id: Mock.Int,
                color_id: 1
            }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    color: {
                        root: { id: Mock.Int, color_id: 1 },
                        parent: { id: 1, name: 'red' },
                        value: { id: 1, name: 'red' }
                    }
                })

        })

        it('should parse view with graph,view + transform (computed chain)', async () => {
            await expectBucket($ => $
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
                    color: $.graph('color', 'walter' as any).transform($ => ({
                        root: $.root,
                        parent: $.parent,
                        value: $.value,
                    }))
                })),
            [
                colorBucket
            ]).toBuildOne({
                id: Mock.Int,
                color_id: 1
            }, 'default')
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    color: {
                        root: { id: Mock.Int, color_id: 1 },
                        parent: { '$v': 'walter', id: 1, walter_name: 'walter red' },
                        value: { '$v': 'walter', id: 1, walter_name: 'walter red' }
                    }
                })

        })
    })

})
