import { Log } from '~/engine/util/log'
import { expectBucket } from 'nesoi/tools/joaquin/bucket';
import { Mock } from './mock';
import { NesoiError } from '~/engine/data/error';

Log.level = 'off';

describe('Bucket Model', () => {

    describe('Get (basics)', () => {

        it('should get root property', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    name: $.string
                }))
            )
                .toGetFromOne({
                    id: Mock.Int,
                    name: Mock.String
                }, 'name')
                .toEqual(Mock.String)
        )

        // it('should fail to get root property on corrupted data', () => 
        //     expectBucket($ => $
        //         .model($ => ({
        //             id: $.int,
        //             name: $.string
        //         }))
        //     )
        //         .toGetFromOne({
        //             id: Mock.Int,
        //             name: Mock.Int
        //         }, 'name')
        //         .butFail(NesoiError.Bucket.Model.CorruptedData)
        // )

        it('should get nested property of object', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    name: $.string,
                    values: $.obj({
                        a: $.string,
                        b: $.int,
                        c: $.float
                    })
                }))
            )
                .toGetFromOne({
                    id: Mock.Int,
                    name: Mock.String,
                    values: {
                        a: Mock.String,
                        b: Mock.Int,
                        c: Mock.Float
                    }
                }, 'values.b')
                .toEqual(Mock.Int)
        )

        // it('should fail to get root property of object on corrupted data', () => 
        //     expectBucket($ => $
        //         .model($ => ({
        //             id: $.int,
        //             name: $.string,
        //             values: $.obj({
        //                 a: $.string,
        //                 b: $.int,
        //                 c: $.float
        //             })
        //         }))
        //     )
        //         .toGetFromOne({
        //             id: Mock.Int,
        //             name: Mock.String,
        //             values: {
        //                 a: Mock.String,
        //                 b: Mock.Bool,
        //                 c: Mock.Float
        //             }
        //         }, 'values.b')
        //         .butFail(NesoiError.Bucket.Model.CorruptedData)
        // )

        it.only('should get nested property of dict', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    name: $.string,
                    values: $.dict($.boolean)
                }))
            )
                .toGetFromOne({
                    id: Mock.Int,
                    name: Mock.String,
                    values: {
                        a: true,
                        b: false
                    }
                }, 'values.$', ['b'])
                .toEqual(false)
        )

        it('should get missing nested property of dict as undefined', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    name: $.string,
                    values: $.dict($.boolean)
                }))
            )
                .toGetFromOne({
                    id: Mock.Int,
                    name: Mock.String,
                    values: {
                        a: true,
                        b: false
                    }
                }, 'values.c')
                .toEqual(undefined)
        )

        it('should fail to get nested property of dict on corrupted data', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    name: $.string,
                    values: $.dict($.boolean)
                }))
            )
                .toGetFromOne({
                    id: Mock.Int,
                    name: Mock.String,
                    values: {
                        a: Mock.Float,
                        b: false
                    }
                }, 'values.a')
                .butFail(NesoiError.Bucket.Model.CorruptedData)
        )

        it('should get nested property of list', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    name: $.string,
                    values: $.list($.boolean)
                }))
            )
                .toGetFromOne({
                    id: Mock.Int,
                    name: Mock.String,
                    values: [true, false]
                }, 'values.1')
                .toEqual(false)
        )

        it('should get missing nested property of list as undefined', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    name: $.string,
                    values: $.list($.boolean)
                }))
            )
                .toGetFromOne({
                    id: Mock.Int,
                    name: Mock.String,
                    values: [true, false]
                }, 'values.2')
                .toEqual(undefined)
        )

        it('should fail to get nested property of list on corrupted data', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    name: $.string,
                    values: $.list($.boolean)
                }))
            )
                .toGetFromOne({
                    id: Mock.Int,
                    name: Mock.String,
                    values: [Mock.Float, false]
                }, 'values.0')
                .butFail(NesoiError.Bucket.Model.CorruptedData)
        )

        it('should get union property (option 1)', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    value: $.union($.string, $.boolean)
                }))
            )
                .toGetFromOne({
                    id: Mock.Int,
                    value: Mock.String
                }, 'value')
                .toEqual(Mock.String)
        )

        it('should get union property (option 2)', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    value: $.union($.string, $.boolean)
                }))
            )
                .toGetFromOne({
                    id: Mock.Int,
                    value: Mock.Bool
                }, 'value')
                .toEqual(Mock.Bool)
        )

        it('should fail to get union property on corrupted data', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    value: $.union($.string, $.boolean)
                }))
            )
                .toGetFromOne({
                    id: Mock.Int,
                    value: Mock.Float
                }, 'value')
                .butFail(NesoiError.Bucket.Model.CorruptedData)
        )

        it('should get deeply nested property', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    name: $.string,
                    values: $.dict(
                        $.list(
                            $.obj({
                                x: $.int,
                                y: $.int
                            })
                        )
                    )
                }))
            )
                .toGetFromOne({
                    id: Mock.Int,
                    name: Mock.String,
                    values: {
                        a: [{x: 1, y: 2}, {x: 3, y: 4}],
                        b: [{x: 5, y: 6}, {x: 7, y: 8}],
                    }
                }, 'values.b.1.y')
                .toEqual(8)
        )
    })

    // describe.skip('Get (as json)', () => {

    //     it('should get root date property as string', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.date
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: Mock.Date
    //             }, 'values', 'json')
    //             .toEqual(Mock.Date.iso)
    //     )

    //     it('should get root datetime property as string', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.datetime
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: Mock.Datetime
    //             }, 'values', 'json')
    //             .toEqual(Mock.Datetime.iso)
    //     )

    //     it('should get root duration property as string', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.duration
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: Mock.Duration
    //             }, 'values', 'json')
    //             .toEqual(Mock.Duration.toString())
    //     )

    //     it('should get root decimal property as string', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.decimal()
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: Mock.Decimal
    //             }, 'values', 'json')
    //             .toEqual(Mock.Decimal.toString())
    //     )

    //     it('should get date property nested in object as string', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.obj({
    //                     a: $.date
    //                 })
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: {
    //                     a: Mock.Date
    //                 }
    //             }, 'values.a', 'json')
    //             .toEqual(Mock.Date.iso)
    //     )

    //     it('should get datetime property nested in object as string', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.obj({
    //                     a: $.datetime
    //                 })
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: {
    //                     a: Mock.Datetime
    //                 }
    //             }, 'values.a', 'json')
    //             .toEqual(Mock.Datetime.iso)
    //     )

    //     it('should get duration property nested in object as string', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.obj({
    //                     a: $.duration
    //                 })
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: {
    //                     a: Mock.Duration
    //                 }
    //             }, 'values.a', 'json')
    //             .toEqual(Mock.Duration.toString())
    //     )

    //     it('should get decimal property nested in object as string', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.obj({
    //                     a: $.decimal()
    //                 })
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: {
    //                     a: Mock.Decimal
    //                 }
    //             }, 'values.a', 'json')
    //             .toEqual(Mock.Decimal.toString())
    //     )

    //     it('should get date property nested in dict as string', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.dict($.date)
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: {
    //                     a: Mock.Date
    //                 }
    //             }, 'values.a', 'json')
    //             .toEqual(Mock.Date.iso)
    //     )

    //     it('should get datetime property nested in dict as string', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.dict($.datetime)
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: {
    //                     a: Mock.Datetime
    //                 }
    //             }, 'values.a', 'json')
    //             .toEqual(Mock.Datetime.iso)
    //     )

    //     it('should get duration property nested in dict as string', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.dict($.duration)
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: {
    //                     a: Mock.Duration
    //                 }
    //             }, 'values.a', 'json')
    //             .toEqual(Mock.Duration.toString())
    //     )

    //     it('should get decimal property nested in dict as string', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.dict($.decimal())
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: {
    //                     a: Mock.Decimal
    //                 }
    //             }, 'values.a', 'json')
    //             .toEqual(Mock.Decimal.toString())
    //     )

    //     it('should get date property nested in list as string', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.list($.date)
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: [Mock.Date, Mock.Date]
    //             }, 'values.1', 'json')
    //             .toEqual(Mock.Date.iso)
    //     )

    //     it('should get datetime property nested in list as string', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.list($.datetime)
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: [Mock.Datetime, Mock.Datetime]
    //             }, 'values.1', 'json')
    //             .toEqual(Mock.Datetime.iso)
    //     )

    //     it('should get duration property nested in list as string', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.list($.duration)
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: [Mock.Duration, Mock.Duration]
    //             }, 'values.1', 'json')
    //             .toEqual(Mock.Duration.toString())
    //     )

    //     it('should get decimal property nested in list as string', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.list($.decimal())
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: [Mock.Decimal, Mock.Decimal]
    //             }, 'values.1', 'json')
    //             .toEqual(Mock.Decimal.toString())
    //     )

    // })

    // describe.skip('Get (spread)', () => {

    //     it('obj', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.obj({
    //                     a: $.int,
    //                     b: $.string
    //                 })
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: {
    //                     a: 0,
    //                     b: 'text'
    //                 }
    //             }, 'values')
    //             .toEqual({ a: 0, b: 'text' })
    //     )

    //     it('obj.*', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.obj({
    //                     a: $.int,
    //                     b: $.string
    //                 })
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: {
    //                     a: 0,
    //                     b: 'text'
    //                 }
    //             }, 'values.*')
    //             .toEqual({ a: 0, b: 'text' })
    //     )
        
    //     it('obj.*.obj', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.obj({
    //                     a: $.obj({
    //                         p: $.int,
    //                         i: $.int,
    //                     }),
    //                     b: $.obj({
    //                         p: $.int,
    //                         j: $.int,
    //                     })
    //                 })
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: {
    //                     a: { p: 0, i: 1 },
    //                     b: { p: 2, j: 3 },
    //                 }
    //             }, 'values.*.p')
    //             .toEqual({ a: 0, b: 2 })
    //     )

    //     it('obj.*.!obj = error', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.obj({
    //                     a: $.obj({
    //                         p: $.int,
    //                         i: $.int,
    //                     }),
    //                     b: $.obj({
    //                         p: $.int,
    //                         j: $.int,
    //                     })
    //                 })
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: {
    //                     a: { p: 0, i: 1 },
    //                     b: { p: 2, j: 3 },
    //                 }
    //             }, 'values.*.i')
    //             .butFail(NesoiError.Bucket.Model.InvalidModelpath)
    //     )

    //     it('obj.*.dict', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.obj({
    //                     a: $.dict($.int),
    //                     b: $.dict($.int)
    //                 })
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: {
    //                     a: { x: 0, y: 1 },
    //                     b: { x: 2, y: 3 },
    //                 }
    //             }, 'values.*.x')
    //             .toEqual({ a: 0, b: 2 })
    //     )

    //     it('obj.*.!dict = undefined', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.obj({
    //                     a: $.dict($.int),
    //                     b: $.dict($.int)
    //                 })
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: {
    //                     a: { x: 0, y: 1 },
    //                     b: { x: 2, y: 3 },
    //                 }
    //             }, 'values.*.z')
    //             .toEqual({ a: undefined, b: undefined })
    //     )

    //     it('obj.*.list', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.obj({
    //                     a: $.list($.int),
    //                     b: $.list($.int)
    //                 })
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: {
    //                     a: [0, 1],
    //                     b: [2, 3]
    //                 }
    //             }, 'values.*.0')
    //             .toEqual({ a: 0, b: 2 })
    //     )

    //     it('obj.*.!list = undefined', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.obj({
    //                     a: $.list($.int),
    //                     b: $.list($.int)
    //                 })
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: {
    //                     a: [0, 1],
    //                     b: [2, 3]
    //                 }
    //             }, 'values.*.2')
    //             .toEqual({ a: undefined, b: undefined })
    //     )

    //     it('dict', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.dict($.int)
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: {
    //                     x: 0,
    //                     y: 1,
    //                     z: 2
    //                 }
    //             }, 'values')
    //             .toEqual({ x: 0, y: 1, z: 2 })
    //     )

    //     it('dict.*', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.dict($.int)
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: {
    //                     x: 0,
    //                     y: 1,
    //                     z: 2
    //                 }
    //             }, 'values.*')
    //             .toEqual({ x: 0, y: 1, z: 2 })
    //     )
        
    //     it('dict.*.obj', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.dict($.obj({
    //                     a: $.int,
    //                     b: $.int,
    //                 }))
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: {
    //                     x: { a: 0, b: 1 },
    //                     y: { a: 2, b: 3 },
    //                 }
    //             }, 'values.*.a')
    //             .toEqual({ x: 0, y: 2 })
    //     )

    //     it('dict.*.!obj = error', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.dict($.obj({
    //                     a: $.int,
    //                     b: $.int,
    //                 }))
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: {
    //                     x: { a: 0, b: 1 },
    //                     y: { a: 2, b: 3 },
    //                 }
    //             }, 'values.*.c')
    //             .butFail(NesoiError.Bucket.Model.InvalidModelpath)
    //     )

    //     it('dict.*.dict', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.dict($.dict($.int))
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: {
    //                     x: { xx: 0, yy: 1 },
    //                     y: { xx: 2, yy: 3 },
    //                 }
    //             }, 'values.*.xx')
    //             .toEqual({ x: 0, y: 2 })
    //     )

    //     it('dict.*.!dict = undefined', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.dict($.dict($.int))
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: {
    //                     x: { xx: 0, yy: 1 },
    //                     y: { xx: 2, yy: 3 },
    //                 }
    //             }, 'values.*.zz')
    //             .toEqual({ x: undefined, y: undefined })
    //     )

    //     it('dict.*.list', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.dict($.list($.int))
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: {
    //                     x: [0, 1],
    //                     y: [2, 3]
    //                 }
    //             }, 'values.*.0')
    //             .toEqual({ x: 0, y: 2 })
    //     )

    //     it('dict.*.!list = undefined', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.dict($.list($.int))
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: {
    //                     x: [0, 1],
    //                     y: [2, 3]
    //                 }
    //             }, 'values.*.3')
    //             .toEqual({ x: undefined, y: undefined })
    //     )

    //     it('list', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.list($.int)
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: [1,2,3]
    //             }, 'values')
    //             .toEqual([1,2,3])
    //     )

    //     it('list.*', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.list($.int)
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: [1,2,3]
    //             }, 'values.*')
    //             .toEqual([1,2,3])
    //     )

    //     it('list.*.obj', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.list($.obj({
    //                     a: $.int,
    //                     b: $.int,
    //                 }))
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: [
    //                     { a: 0, b: 1 },
    //                     { a: 2, b: 3 },
    //                 ]
    //             }, 'values.*.a')
    //             .toEqual([0,2])
    //     )

    //     it('list.*.!obj = error', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.list($.obj({
    //                     a: $.int,
    //                     b: $.int,
    //                 }))
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: [
    //                     { a: 0, b: 1 },
    //                     { a: 2, b: 3 },
    //                 ]
    //             }, 'values.*.c')
    //             .butFail(NesoiError.Bucket.Model.InvalidModelpath)
    //     )

    //     it('list.*.dict', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.list($.dict($.int))
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: [
    //                     { x: 0, y: 1 },
    //                     { x: 2, y: 3 },
    //                 ]
    //             }, 'values.*.x')
    //             .toEqual([0,2])
    //     )

    //     it('list.*.!dict = undefined', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.list($.dict($.int))
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: [
    //                     { x: 0, y: 1 },
    //                     { x: 2, y: 3 },
    //                 ]
    //             }, 'values.*.z')
    //             .toEqual([undefined, undefined])
    //     )

    //     it('list.*.list', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.list($.list($.int))
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: [
    //                     [0, 1],
    //                     [2, 3]
    //                 ]
    //             }, 'values.*.0')
    //             .toEqual([0,2])
    //     )

    //     it('list.*.!list = undefined', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.list($.list($.int))
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: [
    //                     [0, 1],
    //                     [2, 3]
    //                 ]
    //             }, 'values.*.2')
    //             .toEqual([undefined, undefined])
    //     )

    // })

    // describe.skip('Get (deep + spread)', () => {

    //     const expectBucket2 = expectBucket($ => $
    //         .model($ => ({
    //             id: $.int,
    //             values: $.obj({
    //                 a: $.dict($.list($.int)),
    //                 b: $.dict($.list($.int)),
    //             })
    //         }))
    //     )
    //     const model2 = {
    //         id: Mock.Int,
    //         values: {
    //             a: { x: [0,1], y: [2,3] },
    //             b: { x: [4,5], y: [6,7] }
    //         }
    //     }

    //     it('key.*.*', () => 
    //         expectBucket2
    //             .toGetFromOne(model2, 'values.*.*')
    //             .toEqual({
    //                 a: { x: [0,1], y: [2,3] },
    //                 b: { x: [4,5], y: [6,7] }
    //             })
    //     )

    //     it('key.*.*.key', () => 
    //         expectBucket2
    //             .toGetFromOne(model2, 'values.*.*.0')
    //             .toEqual({
    //                 a: { x: 0, y: 2 },
    //                 b: { x: 4, y: 6 },
    //             })
    //     )

    //     it('key.*.key.*', () => 
    //         expectBucket2
    //             .toGetFromOne(model2, 'values.*.x.*')
    //             .toEqual({
    //                 a: [0,1],
    //                 b: [4,5]
    //             })
    //     )

    //     it('key.*.key.key', () => 
    //         expectBucket2
    //             .toGetFromOne(model2, 'values.*.x.1')
    //             .toEqual({
    //                 a: 1,
    //                 b: 5
    //             })
    //     )

    //     it('key.key.*.*', () => 
    //         expectBucket2
    //             .toGetFromOne(model2, 'values.a.*.*')
    //             .toEqual({ x: [0,1], y: [2,3] })
    //     )

    //     it('key.key.*.key', () => 
    //         expectBucket2
    //             .toGetFromOne(model2, 'values.a.*.0')
    //             .toEqual({ x: 0, y: 2 })
    //     )


    //     it('key.key.key.*', () => 
    //         expectBucket2
    //             .toGetFromOne(model2, 'values.a.x.*')
    //             .toEqual([0,1])
    //     )

    //     it('key.key.key.0', () => 
    //         expectBucket2
    //             .toGetFromOne(model2, 'values.a.x.0')
    //             .toEqual(0)
    //     )

    //     const expectBucket3 = expectBucket($ => $
    //         .model($ => ({
    //             id: $.int,
    //             values: $.obj({
    //                 a: $.dict($.list($.obj({
    //                     aa: $.int,
    //                     bb: $.int
    //                 }))),
    //                 b: $.dict($.list($.obj({
    //                     aa: $.int,
    //                     bb: $.int
    //                 }))),
    //             })
    //         }))
    //     )

    //     const model3 = {
    //         id: Mock.Int,
    //         values: {
    //             a: { x: [{aa:0, bb:1}, {aa:2, bb:3}], y: [{aa:4, bb:5}, {aa:6, bb:7}] },
    //             b: { x: [{aa:8, bb:9}, {aa:10, bb:11}], y: [{aa:12, bb:13}, {aa:14, bb:15}] }
    //         }
    //     }

    //     it('key.*.*.*', () => 
    //         expectBucket3
    //             .toGetFromOne(model3, 'values.*.*.*')
    //             .toEqual({
    //                 a: { x: [{aa:0, bb:1}, {aa:2, bb:3}], y: [{aa:4, bb:5}, {aa:6, bb:7}] },
    //                 b: { x: [{aa:8, bb:9}, {aa:10, bb:11}], y: [{aa:12, bb:13}, {aa:14, bb:15}] }
    //             })
    //     )

    //     it('key.*.*.*.key', () => 
    //         expectBucket3
    //             .toGetFromOne(model3, 'values.*.*.*.aa')
    //             .toEqual({
    //                 a: { x: [0, 2], y: [4, 6] },
    //                 b: { x: [8, 10], y: [12, 14] }
    //             })
    //     )

    //     it('key.*.*.key.*', () => 
    //         expectBucket3
    //             .toGetFromOne(model3, 'values.*.*.0.*')
    //             .toEqual({
    //                 a: { x: {aa:0, bb:1}, y: {aa:4, bb:5} },
    //                 b: { x: {aa:8, bb:9}, y: {aa:12, bb:13} }
    //             })
    //     )

    //     it('key.*.*.key.key', () => 
    //         expectBucket3
    //             .toGetFromOne(model3, 'values.*.*.0.aa')
    //             .toEqual({
    //                 a: { x: 0, y: 4 },
    //                 b: { x: 8, y: 12 }
    //             })
    //     )

    //     it('key.*.key.*.*', () => 
    //         expectBucket3
    //             .toGetFromOne(model3, 'values.*.x.*.*')
    //             .toEqual({
    //                 a: [{aa:0, bb:1}, {aa:2, bb:3}],
    //                 b: [{aa:8, bb:9}, {aa:10, bb:11}]
    //             })
    //     )

    //     it('key.*.key.*.key', () => 
    //         expectBucket3
    //             .toGetFromOne(model3, 'values.*.x.*.aa')
    //             .toEqual({
    //                 a: [0, 2],
    //                 b: [8, 10]
    //             })
    //     )

    //     it('key.*.key.key.*', () => 
    //         expectBucket3
    //             .toGetFromOne(model3, 'values.*.x.0.*')
    //             .toEqual({
    //                 a: {aa:0, bb:1},
    //                 b: {aa:8, bb:9},
    //             })
    //     )

    //     it('key.*.key.key.key', () => 
    //         expectBucket3
    //             .toGetFromOne(model3, 'values.*.x.0.aa')
    //             .toEqual({
    //                 a: 0,
    //                 b: 8,
    //             })
    //     )

    //     it('key.key.*.*.*', () => 
    //         expectBucket3
    //             .toGetFromOne(model3, 'values.a.*.*.*')
    //             .toEqual({
    //                 x: [{aa:0, bb:1}, {aa:2, bb:3}],
    //                 y: [{aa:4, bb:5}, {aa:6, bb:7}]
    //             })
    //     )

    //     it('key.key.*.*.key', () => 
    //         expectBucket3
    //             .toGetFromOne(model3, 'values.a.*.*.aa')
    //             .toEqual({
    //                 x: [0, 2],
    //                 y: [4, 6]
    //             })
    //     )

    //     it('key.key.*.key.*', () => 
    //         expectBucket3
    //             .toGetFromOne(model3, 'values.a.*.0.*')
    //             .toEqual({
    //                 x: {aa:0, bb:1},
    //                 y: {aa:4, bb:5},
    //             })
    //     )

    //     it('key.key.*.key.key', () => 
    //         expectBucket3
    //             .toGetFromOne(model3, 'values.a.*.0.aa')
    //             .toEqual({
    //                 x: 0,
    //                 y: 4,
    //             })
    //     )

    //     it('key.key.key.*.*', () => 
    //         expectBucket3
    //             .toGetFromOne(model3, 'values.a.x.*.*')
    //             .toEqual([{aa:0, bb:1}, {aa:2, bb:3}])
    //     )

    //     it('key.key.key.*.key', () => 
    //         expectBucket3
    //             .toGetFromOne(model3, 'values.a.x.*.aa')
    //             .toEqual([0, 2])
    //     )

    //     it('key.key.key.key.*', () => 
    //         expectBucket3
    //             .toGetFromOne(model3, 'values.a.x.0.*')
    //             .toEqual({aa:0, bb:1})
    //     )

    //     it('key.key.key.key.key', () => 
    //         expectBucket3
    //             .toGetFromOne(model3, 'values.a.x.0.aa')
    //             .toEqual(0)
    //     )
    // })


    // describe.skip('Get (as json)', () => {

    //     it('should get spread date property as string', () => 
    //         expectBucket($ => $
    //             .model($ => ({
    //                 id: $.int,
    //                 values: $.date
    //             }))
    //         )
    //             .toGetFromOne({
    //                 id: Mock.Int,
    //                 values: Mock.Date
    //             }, 'values', 'json')
    //             .toEqual(Mock.Date.iso)
    //     )


    // })

    describe('Parse', () => {

        it('should parse object with primitives', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    f_boolean: $.boolean,
                    f_date: $.date,
                    f_datetime: $.datetime,
                    f_duration: $.duration,
                    f_decimal: $.decimal(),
                    f_enum: $.enum(['a','b','c']),
                    // f_file: $.file(),
                    f_float: $.float,
                    f_int: $.int,
                    f_literal: $.literal('abc'),
                    f_regex: $.regex(/abc/),
                    f_string: $.string,
                    f_unknown: $.any
                }))
            )
                .toParseOne({
                    id: Mock.Int,
                    f_boolean: Mock.Bool,
                    f_date: Mock.Date.toISO(),
                    f_datetime: Mock.Datetime.toISO(),
                    f_duration: Mock.Duration.toString(),
                    f_decimal: Mock.Decimal.toString(),
                    f_enum: 'a',
                    // f_file: Mock.File.Png,
                    f_float: Mock.Float,
                    f_int: Mock.Int,
                    f_literal: 'abc',
                    f_regex: '!abc!',
                    f_string: Mock.String,
                    f_unknown: 'anything'
                })
                .toEqual({
                    id: Mock.Int,
                    f_boolean: Mock.Bool,
                    f_date: Mock.Date,
                    f_datetime: Mock.Datetime,
                    f_duration: Mock.Duration,
                    f_decimal: Mock.Decimal,
                    f_enum: 'a',
                    // f_file: NesoiFile.from(Mock.File.Png),
                    f_float: Mock.Float,
                    f_int: Mock.Int,
                    f_literal: 'abc',
                    f_regex: '!abc!',
                    f_string: Mock.String,
                    f_unknown: 'anything'
                })
        )

        it('should parse object with optional fields', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    name: $.string,
                    height: $.float.optional
                }))
            )
                .toParseOne({
                    id: Mock.Int,
                    name: Mock.String,
                })
                .toEqual({
                    id: Mock.Int,
                    name: Mock.String
                })
        )
        
        it('should parse object with obj', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    coord: $.obj({
                        x: $.int,
                        y: $.int,
                    })
                }))
            )
                .toParseOne({
                    id: Mock.Int,
                    coord: { x: 1, y: 2 }
                })
                .toEqual({
                    id: Mock.Int,
                    coord: { x: 1, y: 2 }
                })
        )
        
        it('should parse object with list', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    data: $.list($.int)
                }))
            )
                .toParseOne({
                    id: Mock.Int,
                    data: [1,2,3]
                })
                .toEqual({
                    id: Mock.Int,
                    data: [1,2,3]
                })
        )
        
        it('should fail to copy object with corrupted list', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    data: $.list($.int)
                }))
            )
                .toParseOne({
                    id: Mock.Int,
                    data: ['a',2,3]
                })
                .butFail(NesoiError.Bucket.Model.CorruptedData)
        )

        it('should parse object with list of obj', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    coords: $.list($.obj({
                        x: $.int,
                        y: $.int,
                    }))
                }))
            )
                .toParseOne({
                    id: Mock.Int,
                    coords: [
                        {x: 1, y: 2},
                        {x: 3, y: 4},
                    ]
                })
                .toEqual({
                    id: Mock.Int,
                    coords: [
                        {x: 1, y: 2},
                        {x: 3, y: 4},
                    ]
                })
        )


        it('should parse object with list of dict of obj', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    coords: $.list($.dict($.obj({
                        x: $.int,
                        y: $.int,
                    })))
                }))
            )
                .toParseOne({
                    id: Mock.Int,
                    coords: [
                        { 'a': {x: 1, y: 2}, 'b': {x: 3, y: 4}, },
                        { 'c': {x: 5, y: 6}, 'd': {x: 7, y: 8}, },
                    ]
                })
                .toEqual({
                    id: Mock.Int,
                    coords: [
                        { 'a': {x: 1, y: 2}, 'b': {x: 3, y: 4}, },
                        { 'c': {x: 5, y: 6}, 'd': {x: 7, y: 8}, },
                    ]
                })
        )

        it('should parse object with dict', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    data: $.dict($.int)
                }))
            )
                .toParseOne({
                    id: Mock.Int,
                    data: { a: 1, b: 2, c: 3 }
                })
                .toEqual({
                    id: Mock.Int,
                    data: { a: 1, b: 2, c: 3 }
                })
        )

        it('should fail to copy object with corrupted dict', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    data: $.dict($.int)
                }))
            )
                .toParseOne({
                    id: Mock.Int,
                    data: { a: 'a', b: 2, c: 3 }
                })
                .butFail(NesoiError.Bucket.Model.CorruptedData)
        )

        it('should parse object with dict of obj', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    coords: $.dict($.obj({
                        x: $.int,
                        y: $.int,
                    }))
                }))
            )
                .toParseOne({
                    id: Mock.Int,
                    coords: {
                        'a': {x: 1, y: 2},
                        'b': {x: 3, y: 4},
                    }
                })
                .toEqual({
                    id: Mock.Int,
                    coords: {
                        'a': {x: 1, y: 2},
                        'b': {x: 3, y: 4},
                    }
                })
        )

        it('should parse object with dict of list of obj', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    coords: $.dict($.list($.obj({
                        x: $.int,
                        y: $.int,
                    })))
                }))
            )
                .toParseOne({
                    id: Mock.Int,
                    coords: {
                        'a': [{x: 1, y: 2}, {x: 3, y: 4}],
                        'b': [{x: 5, y: 6}, {x: 7, y: 8}]
                    }
                })
                .toEqual({
                    id: Mock.Int,
                    coords: {
                        'a': [{x: 1, y: 2}, {x: 3, y: 4}],
                        'b': [{x: 5, y: 6}, {x: 7, y: 8}]
                    }
                })
        )

        it('should parse object with union', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    union: $.union(
                        $.obj({ a: $.int, b: $.string }),
                        $.obj({ a: $.int, c: $.string }),
                    )
                }))
            )
                .toParseOne({
                    id: Mock.Int,
                    union: {
                        a: 1,
                        c: 'c'
                    }
                })
                .toEqual({
                    id: Mock.Int,
                    union: {
                        a: 1,
                        c: 'c'
                    }
                })
        )

        it('should parse object with union (2)', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    union: $.union(
                        $.obj({ a: $.int, b: $.string, c: $.string }),
                        $.obj({ a: $.int, c: $.string }),
                    )
                }))
            )
                .toParseOne({
                    id: Mock.Int,
                    union: {
                        a: 1,
                        c: 'c'
                    }
                })
                .toEqual({
                    id: Mock.Int,
                    union: {
                        a: 1,
                        c: 'c'
                    }
                })
        )
    })

    describe('Freeze', () => {

        it('should freeze simple object', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    name: $.string,
                    height: $.float
                }))
            )
                .toFreezeOne({
                    id: Mock.Int,
                    name: Mock.String,
                    height: Mock.Float
                })
                .then(output => {
                    expect(() => {
                        output.name = 'test'
                    }).toThrow(TypeError);
                    expect(() => {
                        output.height = 0
                    }).toThrow(TypeError);
                })
        )

        it('should freeze object with list of primitives', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    data: $.list($.int)
                }))
            )
                .toFreezeOne({
                    id: Mock.Int,
                    data: [1,2,3]
                })
                .then(output => {
                    expect(() => {
                        output.data[0] = 0
                    }).toThrow(TypeError);
                    expect(() => {
                        output.data[1] = 0
                    }).toThrow(TypeError);
                })
        )

        it('should freeze object with list of objects', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    data: $.list($.obj({
                        a: $.int,
                        b: $.int
                    }))
                }))
            )
                .toFreezeOne({
                    id: Mock.Int,
                    data: [{a:1,b:2},{a:3,b:4}]
                })
                .then(output => {
                    expect(() => {
                        output.data[0].a = 0
                    }).toThrow(TypeError);
                    expect(() => {
                        output.data[1].b = 0
                    }).toThrow(TypeError);
                })
        )

        it('should freeze object with dict of primitives', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    data: $.dict($.int)
                }))
            )
                .toFreezeOne({
                    id: Mock.Int,
                    data: { x: 1, y: 2, z: 3 }
                })
                .then(output => {
                    expect(() => {
                        output.data['x'] = 0
                    }).toThrow(TypeError);
                    expect(() => {
                        output.data['y'] = 0
                    }).toThrow(TypeError);
                })
        )

        it('should freeze object with dict of objects', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    data: $.dict($.obj({
                        a: $.int,
                        b: $.int
                    }))
                }))
            )
                .toFreezeOne({
                    id: Mock.Int,
                    data: {
                        x: {a:1,b:2},
                        y: {a:3,b:4}
                    }
                })
                .then(output => {
                    expect(() => {
                        output.data['x'].a = 0
                    }).toThrow(TypeError);
                    expect(() => {
                        output.data['y'].b = 0
                    }).toThrow(TypeError);
                })
        )

        it('should freeze object with object of primitives', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    data: $.obj({
                        a: $.int,
                        b: $.int
                    })
                }))
            )
                .toFreezeOne({
                    id: Mock.Int,
                    data: { a: 1, b: 2 }
                })
                .then(output => {
                    expect(() => {
                        output.data.a = 0
                    }).toThrow(TypeError);
                    expect(() => {
                        output.data.b = 0
                    }).toThrow(TypeError);
                })
        )

        it('should freeze object with object of objects', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    data: $.obj({
                        x: $.obj({
                            a: $.int,
                            b: $.int
                        }),
                        y: $.obj({
                            c: $.int,
                            d: $.int
                        }),
                    })
                }))
            )
                .toFreezeOne({
                    id: Mock.Int,
                    data: {
                        x: {a:1,b:2},
                        y: {c:3,d:4}
                    }
                })
                .then(output => {
                    expect(() => {
                        output.data['x'].a = 0
                    }).toThrow(TypeError);
                    expect(() => {
                        output.data['y'].d = 0
                    }).toThrow(TypeError);
                })
        )

        it('should freeze object with union of primitives', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    data: $.union(
                        $.int,
                        $.string
                    )
                }))
            )
                .toFreezeOne({
                    id: Mock.Int,
                    data: 1
                })
                .then(output => {
                    expect(() => {
                        output.data = 0
                    }).toThrow(TypeError);
                })
        )

        const primitive_union_bucket = expectBucket($ => $
            .model($ => ({
                id: $.int,
                data: $.union(
                    $.int,
                    $.list($.int),
                    $.dict($.int),
                    $.obj({ x: $.int }),
                )
            }))
        );
        it('should freeze object with complex union (int)', () => 
            primitive_union_bucket
                .toFreezeOne({
                    id: Mock.Int,
                    data: 1
                })
                .then(output => {
                    expect(() => {
                        output.data = 0
                    }).toThrow(TypeError);
                })
        )

        it('should freeze object with complex union (list of int)', () => 
            primitive_union_bucket
                .toFreezeOne({
                    id: Mock.Int,
                    data: [1,2,3]
                })
                .then(output => {
                    expect(() => {
                        output.data[0] = 0
                    }).toThrow(TypeError);
                })
        )

        it('should freeze object with complex union (dict of int)', () => 
            primitive_union_bucket
                .toFreezeOne({
                    id: Mock.Int,
                    data: {x: 1, y: 2}
                })
                .then(output => {
                    expect(() => {
                        output.data['x'] = 0
                    }).toThrow(TypeError);
                })
        )

        it('should freeze object with complex union (obj of int)', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    data: $.union(
                        $.int,
                        $.list($.int),
                        $.dict($.int),
                        $.obj({ x: $.int }),
                    )
                }))
            )
                .toFreezeOne({
                    id: Mock.Int,
                    data: { x: 1 }
                })
                .then(output => {
                    expect(() => {
                        output.data.x = 0
                    }).toThrow(TypeError);
                })
        )

        const complex_union_bucket = expectBucket($ => $
            .model($ => ({
                id: $.int,
                data: $.union(
                    $.int,
                    $.list($.obj({ x: $.int, y: $.int })),
                    $.dict($.obj({ x: $.int, y: $.int })),
                    $.obj({
                        a: $.obj({ x: $.int, y: $.int }),
                        b: $.obj({ x: $.int, y: $.int })
                    }),
                )
            }))
        );

        it('should freeze object with complex union (list of obj)', () => 
            complex_union_bucket
                .toFreezeOne({
                    id: Mock.Int,
                    data: [{x:1,y:2},{x:3,y:4}]
                })
                .then(output => {
                    expect(() => {
                        output.data[0]['x'] = 0
                    }).toThrow(TypeError);
                    expect(() => {
                        output.data[1]['y'] = 0
                    }).toThrow(TypeError);
                })
        )

        it('should freeze object with complex union (dict of obj)', () => 
            complex_union_bucket
                .toFreezeOne({
                    id: Mock.Int,
                    data: {
                        'i': {x:1,y:2},
                        'j': {x:3,y:4}
                    }
                })
                .then(output => {
                    expect(() => {
                        output.data['i']['x'] = 0
                    }).toThrow(TypeError);
                    expect(() => {
                        output.data['j']['y'] = 0
                    }).toThrow(TypeError);
                })
        )

        it('should freeze object with complex union (obj of obj)', () => 
            complex_union_bucket
                .toFreezeOne({
                    id: Mock.Int,
                    data: {
                        a: {x:1,y:2},
                        b: {x:3,y:4}
                    }
                })
                .then(output => {
                    expect(() => {
                        output.data.a['x'] = 0
                    }).toThrow(TypeError);
                    expect(() => {
                        output.data.b['y'] = 0
                    }).toThrow(TypeError);
                })
        )
    })

})
