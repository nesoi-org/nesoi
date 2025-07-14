import { NesoiError } from '~/engine/data/error'
import { expectJob } from '../../tools/joaquin/job'
import { Log } from '~/engine/util/log'

Log.level = 'off';

describe('Job', () => {

    describe('Builder', () => {

        it('should fail to build without method', async() => {
            await expectJob($ => $)
                .onRaw({} as any)
                .toReject($ => NesoiError.Builder.Job.NoMethod)
        })
    })

    describe('Raw Message: Error Handling', () => {

        it('should fail to run for message without \'$\'', async() => {
            await expectJob($ => $
                .method(() => {})
            )
                .onRaw({} as any)
                .toReject($ => NesoiError.Message.NoType)
        })

        it('should fail to run for message with invalid \'$\'', async() => {
            await expectJob($ => $
                .method(() => {})
            )
                .onRaw({
                    $: true
                } as any)
                .toReject($ => NesoiError.Message.InvalidType)
        })

        it('should fail to run for unsupported message', async() => {
            await expectJob($ => $
                .method(() => {})
            )
                .onRaw({
                    $: 'test'
                })
                .toReject($ => NesoiError.Block.MessageNotSupported)
        })

        it('should run with inline message', async() => {
            await expectJob($ => $
                .message('', $ => ({
                    value: $.float
                }))
                .input('@')
                .method(() => {
                    return 'test_ok'
                })
            )
                .onRaw({
                    $: 'test',
                    value: 3.14
                })
                .toResolve(() => 'test_ok')
        })

    })

    describe('Extra', () => {

        it('js primitives', async() => {
            await expectJob($ => $
                .message('', $ => ({
                    value: $.float
                }))
                .input('@')
                .extra($ => ({
                    int: 1,
                    float: 1.234,
                }))
                .extra($ => ({
                    string: 'TEST',
                    bool: true
                }))
                .method($ => {
                    return $.extra
                })
            )
                .onRaw({
                    $: 'test',
                    value: 3.14
                })
                .toResolve($ => ({
                    int: 1,
                    float: 1.234,
                    string: 'TEST',
                    bool: true
                }))
        })

        it('js objects', async() => {
            await expectJob($ => $
                .message('', $ => ({
                    value: $.float
                }))
                .input('@')
                .extra($ => ({
                    obj: {
                        a: 'TEST',
                        b: 1,
                        c: false,
                        d: {
                            e: true
                        }
                    }
                }))
                .extra($ => ({
                    list: [1, 2, 3, 4]
                }))
                .method($ => {
                    return $.extra
                })
            )
                .onRaw({
                    $: 'test',
                    value: 3.14
                })
                .toResolve($ => ({
                    obj: {
                        a: 'TEST',
                        b: 1,
                        c: false,
                        d: {
                            e: true
                        }
                    },
                    list: [1, 2, 3, 4]
                }))
        })

        it('js expressions', async() => {
            await expectJob($ => $
                .message('', $ => ({
                    value: $.float
                }))
                .input('@')
                .extra($ => ({
                    sum: 1 + 2 + 3 + 4
                }))
                .extra($ => ({
                    double: $.msg.value * 2
                }))
                .method($ => {
                    return $.extra
                })
            )
                .onRaw({
                    $: 'test',
                    value: 3.14
                })
                .toResolve($ => ({
                    sum: 10,
                    double: 6.28
                }))
        })

    })
})
