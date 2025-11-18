import { Log } from '~/engine/util/log'
import { expectBucket } from 'nesoi/tools/joaquin/bucket';
import { Mock } from './mock';
import { NesoiError } from '~/engine/data/error';

Log.level = 'off';

describe('Bucket Model', () => {

    describe('Copy', () => {

        it('should copy simple object', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    name: $.string,
                    height: $.float
                }))
            )
                .toCopyOne({
                    id: Mock.Int,
                    name: Mock.String,
                    height: Mock.Float
                }, 'save')
                .as({
                    id: Mock.Int,
                    name: Mock.String,
                    height: Mock.Float
                })
        )
        
        it('should copy object with list', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    data: $.list($.int)
                }))
            )
                .toCopyOne({
                    id: Mock.Int,
                    data: [1,2,3]
                }, 'save')
                .as({
                    id: Mock.Int,
                    data: [1,2,3]
                })
        )
        
        it('should fail to copy object with invalid list', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    data: $.list($.int)
                }))
            )
                .toCopyOne({
                    id: Mock.Int,
                    data: ['a',2,3]
                }, 'save')
                .butFail(NesoiError.Message.InvalidFieldType)
        )

        it('should copy object with dict', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    data: $.dict($.int)
                }))
            )
                .toCopyOne({
                    id: Mock.Int,
                    data: { a: 1, b: 2, c: 3 }
                }, 'save')
                .as({
                    id: Mock.Int,
                    data: { a: 1, b: 2, c: 3 }
                })
        )

        it('should fail to copy object with invalid dict', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    data: $.dict($.int)
                }))
            )
                .toCopyOne({
                    id: Mock.Int,
                    data: { a: 'a', b: 2, c: 3 }
                }, 'save')
                .butFail(NesoiError.Message.InvalidFieldType)
        )

        it('should copy object with union', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    union: $.union(
                        $.obj({ a: $.int, b: $.string }),
                        $.obj({ a: $.int, c: $.string }),
                    )
                }))
            )
                .toCopyOne({
                    id: Mock.Int,
                    union: {
                        a: 1,
                        c: 'c'
                    }
                }, 'save')
                .as({
                    id: Mock.Int,
                    union: {
                        a: 1,
                        c: 'c'
                    }
                })
        )

        it('should copy object with union (2)', () => 
            expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    union: $.union(
                        $.obj({ a: $.int, b: $.string, c: $.string }),
                        $.obj({ a: $.int, c: $.string }),
                    )
                }))
            )
                .toCopyOne({
                    id: Mock.Int,
                    union: {
                        a: 1,
                        c: 'c'
                    }
                }, 'save')
                .as({
                    id: Mock.Int,
                    union: {
                        a: 1,
                        c: 'c'
                    }
                })
        )
    })

})
