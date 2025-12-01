import { expectBucket } from 'nesoi/tools/joaquin/bucket';
import { Mock } from './mock';
import { NesoiDatetime } from '~/engine/data/datetime';
import { NesoiDate } from '~/engine/data/date';
import { NesoiDuration } from '~/engine/data/duration';
import { NesoiDecimal } from '~/engine/data/decimal';

describe('Bucket View - Serialize', () => {

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

    const durations = [
        NesoiDuration.fromString('1 hour'),
        NesoiDuration.fromString('2 hours'),
        NesoiDuration.fromString('3 hours'),
        NesoiDuration.fromString('4 hours'),
        NesoiDuration.fromString('5 hours'),
        NesoiDuration.fromString('6 hours'),
        NesoiDuration.fromString('7 hours'),
    ]
    const strdurs = durations.map(d => d.toString())

    const decimals = [
        new NesoiDecimal('12.34'),
        new NesoiDecimal('56.78'),
        new NesoiDecimal('90.12'),
        new NesoiDecimal('34.56'),
        new NesoiDecimal('78.90'),
        new NesoiDecimal('12.34'),
        new NesoiDecimal('56.78'),
    ]
    const strdecs = decimals.map(d => d.toString())

    describe('datetime', () => {
   
        it('[datetime] should not serialize on query', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    timestamp: $.datetime
                }))
            )
                .withObj({
                    id: Mock.Int,
                    timestamp: datetimes[0]
                })
                .toQueryOne(Mock.Int, undefined, { serialize: false })
                .as({
                    id: Mock.Int,
                    timestamp: datetimes[0],
                    created_at: expect.any(NesoiDatetime),
                    updated_at: expect.any(NesoiDatetime)
                })
        )
    
        it('[datetime] should serialize on query', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    timestamp: $.datetime
                }))
            )
                .withObj({
                    id: Mock.Int,
                    timestamp: datetimes[0]
                })
                .toQueryOne(Mock.Int, undefined, { serialize: true })
                .as({
                    id: Mock.Int,
                    timestamp: isos[0],
                    created_at: expect.any(String),
                    updated_at: expect.any(String)
                })
        )
    
        it('[datetime] should serialize deep on query', () => 
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
            )
                .withObj({
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
                })
                .toQueryOne(Mock.Int, undefined, { serialize: true })
                .as({
                    id: Mock.Int,
                    list: [isos[0], isos[1]],
                    dict: { x: isos[1], y: isos[2] },
                    obj: { a: isos[3] },
                    list_list: [[isos[3], isos[4]], [isos[5], isos[0]]],
                    list_dict: [{ x: isos[1], y: isos[2] }, { w: isos[3], z: isos[4] }],
                    list_obj: [{ a: isos[5] }, { a: isos[0] }],
                    dict_list: { x: [isos[1], isos[2]], y: [isos[3], isos[4]] },
                    dict_dict: { x: { i: isos[5], j: isos[0] }, y: { k: isos[1], l: isos[2] } },
                    dict_obj: { x: { a: isos[3] }, y: { a: isos[4] } },
                    obj_list: { a: [isos[5], isos[0]] },
                    obj_dict: { a: { i: isos[1], j: isos[2] } },
                    obj_obj: { a: { b: isos[3] } },
                    created_at: expect.any(String),
                    updated_at: expect.any(String)
                })
        )

        it('[datetime] should not serialize on view', () => 
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
                { serialize: false })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    timestamp: datetimes[0]
                })
        )
    
        it('[datetime] should serialize on view', () => 
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

        it('[datetime] should serialize deep on view', () => 
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

        it('[datetime] should serialize inside union', async () => {
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

            await expectUnionBucket.toBuildOne({
                id: Mock.Int,
                union: datetimes[0]
            },
            'default', { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    union: isos[0]
                })

            await expectUnionBucket.toBuildOne({
                id: Mock.Int,
                union: [datetimes[0], datetimes[1]]
            },
            'default', { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    union: [isos[0], isos[1]]
                })

            await expectUnionBucket.toBuildOne({
                id: Mock.Int,
                union: { x: datetimes[0], y: datetimes[1] }
            },
            'default', { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    union: { x: isos[0], y: isos[1] }
                })

            await expectUnionBucket.toBuildOne({
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
    })

    describe('date', () => {
    
        it('[date] should not serialize on query', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    timestamp: $.date
                }))
            )
                .withObj({
                    id: Mock.Int,
                    timestamp: dates[0]
                })
                .toQueryOne(Mock.Int, undefined, { serialize: false })
                .as({
                    id: Mock.Int,
                    timestamp: dates[0],
                    created_at: expect.any(NesoiDatetime),
                    updated_at: expect.any(NesoiDatetime)
                })
        )
    
        it('[date] should serialize on query', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    timestamp: $.date
                }))
            )
                .withObj({
                    id: Mock.Int,
                    timestamp: dates[0]
                })
                .toQueryOne(Mock.Int, undefined, { serialize: true })
                .as({
                    id: Mock.Int,
                    timestamp: isodates[0],
                    created_at: expect.any(String),
                    updated_at: expect.any(String)
                })
        )
    
        it('[date] should serialize deep on query', () => 
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
            )
                .withObj({
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
                })
                .toQueryOne(Mock.Int, undefined, { serialize: true })
                .as({
                    id: Mock.Int,
                    list: [isodates[0], isodates[1]],
                    dict: { x: isodates[1], y: isodates[2] },
                    obj: { a: isodates[3] },
                    list_list: [[isodates[3], isodates[4]], [isodates[5], isodates[0]]],
                    list_dict: [{ x: isodates[1], y: isodates[2] }, { w: isodates[3], z: isodates[4] }],
                    list_obj: [{ a: isodates[5] }, { a: isodates[0] }],
                    dict_list: { x: [isodates[1], isodates[2]], y: [isodates[3], isodates[4]] },
                    dict_dict: { x: { i: isodates[5], j: isodates[0] }, y: { k: isodates[1], l: isodates[2] } },
                    dict_obj: { x: { a: isodates[3] }, y: { a: isodates[4] } },
                    obj_list: { a: [isodates[5], isodates[0]] },
                    obj_dict: { a: { i: isodates[1], j: isodates[2] } },
                    obj_obj: { a: { b: isodates[3] } },
                    created_at: expect.any(String),
                    updated_at: expect.any(String)
                })
        )

        it('[date] should not serialize on view', () => 
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
                { serialize: false })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    timestamp: dates[0]
                })
        )
    
        it('[date] should serialize on view', () => 
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

        it('[date] should serialize deep on view', () => 
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

        it('[date] should serialize inside union', async () => {
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

            await expectUnionBucket.toBuildOne({
                id: Mock.Int,
                union: dates[0]
            },
            'default', { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    union: isodates[0]
                })

            await expectUnionBucket.toBuildOne({
                id: Mock.Int,
                union: [dates[0], dates[1]]
            },
            'default', { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    union: [isodates[0], isodates[1]]
                })

            await expectUnionBucket.toBuildOne({
                id: Mock.Int,
                union: { x: dates[0], y: dates[1] }
            },
            'default', { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    union: { x: isodates[0], y: isodates[1] }
                })

            await expectUnionBucket.toBuildOne({
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
    })

    describe('duration', () => {

    
        it('[duration] should not serialize on query', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    timestamp: $.duration
                }))
            )
                .withObj({
                    id: Mock.Int,
                    timestamp: durations[0]
                })
                .toQueryOne(Mock.Int, undefined, { serialize: false })
                .as({
                    id: Mock.Int,
                    timestamp: durations[0],
                    created_at: expect.any(NesoiDatetime),
                    updated_at: expect.any(NesoiDatetime)
                })
        )
    
        it('[duration] should serialize on query', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    timestamp: $.duration
                }))
            )
                .withObj({
                    id: Mock.Int,
                    timestamp: durations[0]
                })
                .toQueryOne(Mock.Int, undefined, { serialize: true })
                .as({
                    id: Mock.Int,
                    timestamp: strdurs[0],
                    created_at: expect.any(String),
                    updated_at: expect.any(String)
                })
        )
    
        it('[duration] should serialize deep on query', () => 
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
            )
                .withObj({
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
                })
                .toQueryOne(Mock.Int, undefined, { serialize: true })
                .as({
                    id: Mock.Int,
                    list: [strdurs[0], strdurs[1]],
                    dict: { x: strdurs[1], y: strdurs[2] },
                    obj: { a: strdurs[3] },
                    list_list: [[strdurs[3], strdurs[4]], [strdurs[5], strdurs[0]]],
                    list_dict: [{ x: strdurs[1], y: strdurs[2] }, { w: strdurs[3], z: strdurs[4] }],
                    list_obj: [{ a: strdurs[5] }, { a: strdurs[0] }],
                    dict_list: { x: [strdurs[1], strdurs[2]], y: [strdurs[3], strdurs[4]] },
                    dict_dict: { x: { i: strdurs[5], j: strdurs[0] }, y: { k: strdurs[1], l: strdurs[2] } },
                    dict_obj: { x: { a: strdurs[3] }, y: { a: strdurs[4] } },
                    obj_list: { a: [strdurs[5], strdurs[0]] },
                    obj_dict: { a: { i: strdurs[1], j: strdurs[2] } },
                    obj_obj: { a: { b: strdurs[3] } },
                    created_at: expect.any(String),
                    updated_at: expect.any(String)
                })
        )

        it('[duration] should not serialize on view', () => 
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
                { serialize: false })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    timestamp: durations[0]
                })
        )
    
        it('[duration] should serialize on view', () => 
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
                    timestamp: strdurs[0]
                })
        )

        it('[duration] should serialize deep on view', () => 
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
                    list: [strdurs[0], strdurs[1]],
                    list_all: [strdurs[0], strdurs[1]],
                    dict: { x: strdurs[1], y: strdurs[2] },
                    dict_all: [strdurs[1], strdurs[2]],
                    obj: { a: strdurs[3] },
                    obj_all: [strdurs[3]],

                    list_list: [[strdurs[3], strdurs[4]], [strdurs[5], strdurs[0]]],
                    list_list_all: [[strdurs[3], strdurs[4]], [strdurs[5], strdurs[0]]],
                    list_list_all_all: [strdurs[3], strdurs[4], strdurs[5], strdurs[0]],
                    list_dict: [{ x: strdurs[1], y: strdurs[2] }, { w: strdurs[3], z: strdurs[4] }],
                    list_dict_all: [{ x: strdurs[1], y: strdurs[2] }, { w: strdurs[3], z: strdurs[4] }],
                    list_dict_all_all: [ strdurs[1], strdurs[2], strdurs[3], strdurs[4] ],
                    list_obj: [{ a: strdurs[5] }, { a: strdurs[0] }],
                    list_obj_all: [{ a: strdurs[5] }, { a: strdurs[0] }],
                    list_obj_all_all: [ strdurs[5], strdurs[0] ],

                    dict_list: { x: [strdurs[1], strdurs[2]], y: [strdurs[3], strdurs[4]] },
                    dict_list_all: [ [strdurs[1], strdurs[2]], [strdurs[3], strdurs[4]] ],
                    dict_list_all_all: [strdurs[1], strdurs[2], strdurs[3], strdurs[4]],
                    dict_dict: { x: { i: strdurs[5], j: strdurs[0] }, y: { k: strdurs[1], l: strdurs[2] } },
                    dict_dict_all: [{ i: strdurs[5], j: strdurs[0] }, { k: strdurs[1], l: strdurs[2] }],
                    dict_dict_all_all: [strdurs[5], strdurs[0], strdurs[1], strdurs[2] ],
                    dict_obj: { x: { a: strdurs[3] }, y: { a: strdurs[4] } },
                    dict_obj_all: [ { a: strdurs[3] }, { a: strdurs[4] } ],
                    dict_obj_all_all: [ strdurs[3], strdurs[4] ],

                    obj_list: { a: [strdurs[5], strdurs[0]] },
                    obj_list_all: [ [strdurs[5], strdurs[0]] ],
                    obj_list_all_all: [strdurs[5], strdurs[0]],
                    obj_dict: { a: { i: strdurs[1], j: strdurs[2] } },
                    obj_dict_all: [{ i: strdurs[1], j: strdurs[2] } ],
                    obj_dict_all_all: [ strdurs[1],  strdurs[2] ],
                    obj_obj: { a: { b: strdurs[3] } },
                    obj_obj_all: [{ b: strdurs[3] }],
                    obj_obj_all_all: [ strdurs[3] ],
                })
        )

        it('[duration] should serialize inside union', async () => {
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

            await expectUnionBucket.toBuildOne({
                id: Mock.Int,
                union: durations[0]
            },
            'default', { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    union: strdurs[0]
                })

            await expectUnionBucket.toBuildOne({
                id: Mock.Int,
                union: [durations[0], durations[1]]
            },
            'default', { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    union: [strdurs[0], strdurs[1]]
                })

            await expectUnionBucket.toBuildOne({
                id: Mock.Int,
                union: { x: durations[0], y: durations[1] }
            },
            'default', { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    union: { x: strdurs[0], y: strdurs[1] }
                })

            await expectUnionBucket.toBuildOne({
                id: Mock.Int,
                union: { a: durations[0] }
            },
            'default', { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    union: { a: strdurs[0] }
                })
        })
    })
   
    describe('decimal', () => {
    
        it('[decimal] should not serialize on query', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    timestamp: $.decimal()
                }))
            )
                .withObj({
                    id: Mock.Int,
                    timestamp: decimals[0]
                })
                .toQueryOne(Mock.Int, undefined, { serialize: false })
                .as({
                    id: Mock.Int,
                    timestamp: decimals[0],
                    created_at: expect.any(NesoiDatetime),
                    updated_at: expect.any(NesoiDatetime)
                })
        )
    
        it('[decimal] should serialize on query', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    timestamp: $.decimal()
                }))
            )
                .withObj({
                    id: Mock.Int,
                    timestamp: decimals[0]
                })
                .toQueryOne(Mock.Int, undefined, { serialize: true })
                .as({
                    id: Mock.Int,
                    timestamp: strdecs[0],
                    created_at: expect.any(String),
                    updated_at: expect.any(String)
                })
        )
    
        it('[decimal] should serialize deep on query', () => 
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
            )
                .withObj({
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
                })
                .toQueryOne(Mock.Int, undefined, { serialize: true })
                .as({
                    id: Mock.Int,
                    list: [strdecs[0], strdecs[1]],
                    dict: { x: strdecs[1], y: strdecs[2] },
                    obj: { a: strdecs[3] },
                    list_list: [[strdecs[3], strdecs[4]], [strdecs[5], strdecs[0]]],
                    list_dict: [{ x: strdecs[1], y: strdecs[2] }, { w: strdecs[3], z: strdecs[4] }],
                    list_obj: [{ a: strdecs[5] }, { a: strdecs[0] }],
                    dict_list: { x: [strdecs[1], strdecs[2]], y: [strdecs[3], strdecs[4]] },
                    dict_dict: { x: { i: strdecs[5], j: strdecs[0] }, y: { k: strdecs[1], l: strdecs[2] } },
                    dict_obj: { x: { a: strdecs[3] }, y: { a: strdecs[4] } },
                    obj_list: { a: [strdecs[5], strdecs[0]] },
                    obj_dict: { a: { i: strdecs[1], j: strdecs[2] } },
                    obj_obj: { a: { b: strdecs[3] } },
                    created_at: expect.any(String),
                    updated_at: expect.any(String)
                })
        )

        it('[decimal] should not serialize on view', () => 
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
                { serialize: false })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    timestamp: decimals[0]
                })
        )
    
        it('[decimal] should serialize on view', () => 
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
                    timestamp: strdecs[0]
                })
        )

        it('[decimal] should serialize deep on view', () => 
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
                    list: [strdecs[0], strdecs[1]],
                    list_all: [strdecs[0], strdecs[1]],
                    dict: { x: strdecs[1], y: strdecs[2] },
                    dict_all: [strdecs[1], strdecs[2]],
                    obj: { a: strdecs[3] },
                    obj_all: [strdecs[3]],

                    list_list: [[strdecs[3], strdecs[4]], [strdecs[5], strdecs[0]]],
                    list_list_all: [[strdecs[3], strdecs[4]], [strdecs[5], strdecs[0]]],
                    list_list_all_all: [strdecs[3], strdecs[4], strdecs[5], strdecs[0]],
                    list_dict: [{ x: strdecs[1], y: strdecs[2] }, { w: strdecs[3], z: strdecs[4] }],
                    list_dict_all: [{ x: strdecs[1], y: strdecs[2] }, { w: strdecs[3], z: strdecs[4] }],
                    list_dict_all_all: [ strdecs[1], strdecs[2], strdecs[3], strdecs[4] ],
                    list_obj: [{ a: strdecs[5] }, { a: strdecs[0] }],
                    list_obj_all: [{ a: strdecs[5] }, { a: strdecs[0] }],
                    list_obj_all_all: [ strdecs[5], strdecs[0] ],

                    dict_list: { x: [strdecs[1], strdecs[2]], y: [strdecs[3], strdecs[4]] },
                    dict_list_all: [ [strdecs[1], strdecs[2]], [strdecs[3], strdecs[4]] ],
                    dict_list_all_all: [strdecs[1], strdecs[2], strdecs[3], strdecs[4]],
                    dict_dict: { x: { i: strdecs[5], j: strdecs[0] }, y: { k: strdecs[1], l: strdecs[2] } },
                    dict_dict_all: [{ i: strdecs[5], j: strdecs[0] }, { k: strdecs[1], l: strdecs[2] }],
                    dict_dict_all_all: [strdecs[5], strdecs[0], strdecs[1], strdecs[2] ],
                    dict_obj: { x: { a: strdecs[3] }, y: { a: strdecs[4] } },
                    dict_obj_all: [ { a: strdecs[3] }, { a: strdecs[4] } ],
                    dict_obj_all_all: [ strdecs[3], strdecs[4] ],

                    obj_list: { a: [strdecs[5], strdecs[0]] },
                    obj_list_all: [ [strdecs[5], strdecs[0]] ],
                    obj_list_all_all: [strdecs[5], strdecs[0]],
                    obj_dict: { a: { i: strdecs[1], j: strdecs[2] } },
                    obj_dict_all: [{ i: strdecs[1], j: strdecs[2] } ],
                    obj_dict_all_all: [ strdecs[1],  strdecs[2] ],
                    obj_obj: { a: { b: strdecs[3] } },
                    obj_obj_all: [{ b: strdecs[3] }],
                    obj_obj_all_all: [ strdecs[3] ],
                })
        )

        it('[decimal] should serialize inside union', async () => {
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

            await expectUnionBucket.toBuildOne({
                id: Mock.Int,
                union: decimals[0]
            },
            'default', { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    union: strdecs[0]
                })

            await expectUnionBucket.toBuildOne({
                id: Mock.Int,
                union: [decimals[0], decimals[1]]
            },
            'default', { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    union: [strdecs[0], strdecs[1]]
                })

            await expectUnionBucket.toBuildOne({
                id: Mock.Int,
                union: { x: decimals[0], y: decimals[1] }
            },
            'default', { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    union: { x: strdecs[0], y: strdecs[1] }
                })

            await expectUnionBucket.toBuildOne({
                id: Mock.Int,
                union: { a: decimals[0] }
            },
            'default', { serialize: true })
                .as({
                    $v: 'default',
                    id: Mock.Int,
                    union: { a: strdecs[0] }
                })
        })
    })

    describe ('inject', () => {
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
                    decimal: strdecs[0],
                })
        )
    
        it('should serialize fields when injecting current', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    date: $.date,
                    datetime: $.datetime,
                    decimal: $.decimal(),
                }))
                .view('default', $ => ({
                    ...$.inject.current
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
                    decimal: strdecs[0],
                })
        )

        it('should serialize fields when injecting value', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    date: $.date,
                    datetime: $.datetime,
                    decimal: $.decimal(),
                }))
                .view('default', $ => ({
                    ...$.inject.value
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
                    decimal: strdecs[0],
                })
        )
    })
})