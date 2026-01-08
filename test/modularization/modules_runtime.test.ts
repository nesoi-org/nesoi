import type { NesoiError } from '~/engine/data/error'

import { ExternalsBuilder } from '~/elements/edge/externals/externals.builder'
import { BucketBuilder } from '~/elements/entities/bucket/bucket.builder'
import { ConstantsBuilder } from '~/elements/entities/constants/constants.builder'
import { MessageBuilder } from '~/elements/entities/message/message.builder'
import { InlineApp } from '~/engine/app/inline.app'
import { NesoiDatetime } from '~/engine/data/datetime'
import { Log } from '~/engine/util/log'

describe('Modularization Runtime', () => {

    Log.level = 'off';

    describe('Message -> Enum : enum field', () => {
        it('error: unmet module', async () => {
            const app = new InlineApp('app', [
                new MessageBuilder('module1', 'message')
                    .template($ => ({
                        enum: $.enum('module2::ENUM_1')
                    }))
            ])
            
            let error: NesoiError.BaseError | undefined = undefined;
            try { await app.daemon() }
            catch (e: any) { error = e }
            expect(error?.name).toEqual('Builder.UnmetModuleDependency')
        })
    
        it('error: unmet', async () => {
            const app = new InlineApp('app', [
                new MessageBuilder('module1', 'message')
                    .template($ => ({
                        enum: $.enum('module1::ENUM_1')
                    }))
            ])
            
            let error: NesoiError.BaseError | undefined = undefined;
            try { await app.daemon() }
            catch (e: any) { error = e }
            expect(error?.name).toEqual('Builder.UnmetDependency')
        })
    
        it('error: unmet enum', async () => {
            const app = new InlineApp('app', [
                new MessageBuilder('module1', 'message')
                    .template($ => ({
                        enum: $.enum('module2::ENUM_2')
                    })),
                new ConstantsBuilder('module2')
                    .enum('ENUM_1', $ => ({
                        'a': $.opt('A'),
                        'b': $.opt('B'),
                    })),
            ])
            
            let error: NesoiError.BaseError | undefined = undefined;
            try { await app.daemon() }
            catch (e: any) { error = e }
            expect(error?.name).toEqual('Builder.UnmetDependencyEnum')
        })
    
        it('error: not imported', async () => {
            const app = new InlineApp('app', [
                new MessageBuilder('module1', 'message')
                    .template($ => ({
                        enum: $.enum('module2::ENUM_1')
                    })),
                new ConstantsBuilder('module2')
                    .enum('ENUM_1', $ => ({
                        'a': $.opt('A'),
                        'b': $.opt('B'),
                    })),
            ])
            
            let error: NesoiError.BaseError | undefined = undefined;
            try { await app.daemon() }
            catch (e: any) { error = e }
            expect(error?.name).toEqual('Builder.NotImportedDependency')
        })
    
        it('ok', async () => {
            const app = new InlineApp('app', [
                new MessageBuilder('module1', 'message')
                    .template($ => ({
                        enum: $.enum('module2::ENUM_1')
                    })),
                new ConstantsBuilder('module2')
                    .enum('ENUM_1', $ => ({
                        'a': $.opt('A'),
                        'b': $.opt('B'),
                    })),
                new ExternalsBuilder('module1')
                    .enum('module2::ENUM_1' as never)
            ])
            
            const daemon = await app.daemon();
            
            const res = await daemon.trx('module1').run(async trx => {
                const msg = await trx.message({
                    $: 'message',
                    enum: 'a'
                }) as any;
                expect(msg.enum).toEqual('a')
            })
            if (res.state !== 'ok') throw res.error;
            expect(res.state).toEqual('ok');
        })
    })

    describe('Message -> Bucket : id field', () => {
        it('error: unmet module', async () => {
            const app = new InlineApp('app', [
                new MessageBuilder('module1', 'message')
                    .template($ => ({
                        obj: $.id('module2::bucket')
                    }))
            ])
            
            let error: NesoiError.BaseError | undefined = undefined;
            try { await app.daemon() }
            catch (e: any) { error = e }
            expect(error?.name).toEqual('Builder.UnmetModuleDependency')
        })
    
        it('error: unmet', async () => {
            const app = new InlineApp('app', [
                new MessageBuilder('module1', 'message')
                    .template($ => ({
                        obj: $.id('module1::bucket')
                    }))
            ])
            
            let error: NesoiError.BaseError | undefined = undefined;
            try { await app.daemon() }
            catch (e: any) { error = e }
            expect(error?.name).toEqual('Builder.UnmetDependency')
        })
    
        it('error: not imported', async () => {
            const app = new InlineApp('app', [
                new MessageBuilder('module1', 'message')
                    .template($ => ({
                        obj: $.id('module2::bucket')
                    })),
                new BucketBuilder('module2', 'bucket')
                    .model($ => ({
                        id: $.int,
                        value: $.float
                    })),
            ])
            
            let error: NesoiError.BaseError | undefined = undefined;
            try { await app.daemon() }
            catch (e: any) { error = e }
            expect(error?.name).toEqual('Builder.NotImportedDependency')
        })
    
        it('ok', async () => {
            const app = new InlineApp('app', [
                new MessageBuilder('module1', 'message')
                    .template($ => ({
                        obj: $.id('module2::bucket')
                    })),
                new BucketBuilder('module2', 'bucket')
                    .model($ => ({
                        id: $.int,
                        value: $.float
                    })),
                new ExternalsBuilder('module1')
                    .bucket('module2::bucket' as never)
            ])
            
            const daemon = await app.daemon();
            
            await daemon.trx('module2').run(async trx => {
                trx.bucket('bucket').create({
                    value: 12.34
                })
            });
            const res = await daemon.trx('module1').run(async trx => {
                const msg = await trx.message({
                    $: 'message',
                    obj_id: 1
                }) as any;
                expect(msg).toEqual({
                    $: 'message',
                    __meta__: expect.anything(),
                    obj: {
                        id: 1,
                        value: 12.34,
                        created_at: expect.any(NesoiDatetime),
                        updated_at: expect.any(NesoiDatetime)
                    }
                })
            })
            if (res.state !== 'ok') throw res.error;
            expect(res.state).toEqual('ok');
        })
    })

    describe('Message -> Message : msg field', () => {
        it('error: unmet module', async () => {
            const app = new InlineApp('app', [
                new MessageBuilder('module1', 'message1')
                    .template($ => ({
                        msg: $.msg('module2::message2')
                    }))
            ])
            
            let error: NesoiError.BaseError | undefined = undefined;
            try { await app.daemon() }
            catch (e: any) { error = e }
            expect(error?.name).toEqual('Builder.UnmetModuleDependency')
        })
    
        it('error: unmet', async () => {
            const app = new InlineApp('app', [
                new MessageBuilder('module1', 'message1')
                    .template($ => ({
                        msg: $.msg('module1::message2')
                    }))
            ])
            
            let error: NesoiError.BaseError | undefined = undefined;
            try { await app.daemon() }
            catch (e: any) { error = e }
            expect(error?.name).toEqual('Builder.UnmetDependency')
        })
    
        it('error: not imported', async () => {
            const app = new InlineApp('app', [
                new MessageBuilder('module1', 'message1')
                    .template($ => ({
                        msg: $.msg('module2::message2')
                    })),
                new MessageBuilder('module2', 'message2')
                    .template($ => ({
                        value: $.string
                    })),
            ])
            
            let error: NesoiError.BaseError | undefined = undefined;
            try { await app.daemon() }
            catch (e: any) { error = e }
            expect(error?.name).toEqual('Builder.NotImportedDependency')
        })
    
        it('ok', async () => {
            const app = new InlineApp('app', [
                new MessageBuilder('module1', 'message1')
                    .template($ => ({
                        msg: $.msg('module2::message2')
                    })),
                new MessageBuilder('module2', 'message2')
                    .template($ => ({
                        value: $.string
                    })),
                new ExternalsBuilder('module1')
                    .message('module2::message2' as never)
            ])
            
            const daemon = await app.daemon();
            
            const res = await daemon.trx('module1').run(async trx => {
                const msg = await trx.message({
                    $: 'message1',
                    msg: {
                        value: 'Value'
                    }
                }) as any;
                expect(msg).toEqual({
                    $: 'message1',
                    __meta__: expect.anything(),
                    msg: {
                        value: 'Value'
                    }
                })
            })
            if (res.state !== 'ok') throw res.error;
            expect(res.state).toEqual('ok');
        })
    })

    describe('Message -> Message : extend field', () => {
        it('error: unmet module', async () => {
            const app = new InlineApp('app', [
                new MessageBuilder('module1', 'message1')
                    .template($ => $.extend('module2::message2', {
                        name: $.string
                    }))
            ])
            
            let error: NesoiError.BaseError | undefined = undefined;
            try { await app.daemon() }
            catch (e: any) { error = e }
            expect(error?.name).toEqual('Builder.UnmetModuleDependency')
        })
    
        it('error: unmet', async () => {
            const app = new InlineApp('app', [
                new MessageBuilder('module1', 'message1')
                    .template($ => $.extend('module1::message2', {
                        name: $.string
                    }))
            ])
            
            let error: NesoiError.BaseError | undefined = undefined;
            try { await app.daemon() }
            catch (e: any) { error = e }
            expect(error?.name).toEqual('Builder.UnmetDependency')
        })
    
        it('error: not imported', async () => {
            const app = new InlineApp('app', [
                new MessageBuilder('module1', 'message1')
                    .template($ => $.extend('module2::message2', {
                        name: $.string
                    })),
                new MessageBuilder('module2', 'message2')
                    .template($ => ({
                        value: $.string
                    })),
            ])
            
            let error: NesoiError.BaseError | undefined = undefined;
            try { await app.daemon() }
            catch (e: any) { error = e }
            expect(error?.name).toEqual('Builder.NotImportedDependency')
        })
    
        it('ok', async () => {
            const app = new InlineApp('app', [
                new MessageBuilder('module1', 'message1')
                    .template($ => $.extend('module2::message2', {
                        name: $.string
                    })),
                new MessageBuilder('module2', 'message2')
                    .template($ => ({
                        value: $.float
                    })),
                new ExternalsBuilder('module1')
                    .message('module2::message2' as never)
            ])
            
            const daemon = await app.daemon();
            
            const res = await daemon.trx('module1').run(async trx => {
                const msg = await trx.message({
                    $: 'message1',
                    name: 'Name',
                    value: 12.34
                }) as any;
                expect(msg).toEqual({
                    $: 'message1',
                    __meta__: expect.anything(),
                    name: 'Name',
                    value: 12.34
                })
            })
            if (res.state !== 'ok') throw res.error;
            expect(res.state).toEqual('ok');
        })
    })

    describe('Bucket -> Bucket : extend', () => {
        it('error: unmet module', async () => {
            const app = new InlineApp('app', [
                new BucketBuilder('module1', 'bucket1')
                    .extend('module2::bucket2' as never)
            ])
            
            let error: NesoiError.BaseError | undefined = undefined;
            try { await app.daemon() }
            catch (e: any) { error = e }
            expect(error?.name).toEqual('Builder.UnmetModuleDependency')
        })
    
        it('error: unmet', async () => {
            const app = new InlineApp('app', [
                new BucketBuilder('module1', 'bucket1')
                    .extend('module1::bucket2' as never)
            ])
            
            let error: NesoiError.BaseError | undefined = undefined;
            try { await app.daemon() }
            catch (e: any) { error = e }
            expect(error?.name).toEqual('Builder.UnmetDependency')
        })
    
        it('error: not imported', async () => {
            const app = new InlineApp('app', [
                new BucketBuilder('module1', 'bucket1')
                    .extend('module2::bucket2' as never),
                new BucketBuilder('module2', 'bucket2')
                    .model($ => ({
                        id: $.int,
                        value: $.float
                    }))
            ])
            
            let error: NesoiError.BaseError | undefined = undefined;
            try { await app.daemon() }
            catch (e: any) { error = e }
            expect(error?.name).toEqual('Builder.NotImportedDependency')
        })
    
        it('ok', async () => {
            const app = new InlineApp('app', [
                new BucketBuilder('module1', 'bucket1')
                    .extend('module2::bucket2' as never),
                new BucketBuilder('module2', 'bucket2')
                    .model($ => ({
                        id: $.int,
                        value: $.float
                    })),
                new ExternalsBuilder('module1')
                    .bucket('module2::bucket2' as never)
            ])
            
            const daemon = await app.daemon();
            
            const res = await daemon.trx('module1').run(async trx => {
                const obj1 = await trx.bucket('bucket1').create({
                    value: 12.34
                }) as any;
                expect(obj1.value).toEqual(12.34)
                
                const obj2 = await trx.bucket('bucket1').readOne(obj1.id) as any;
                expect(obj2.value).toEqual(12.34)
            })
            if (res.state !== 'ok') throw res.error;
            expect(res.state).toEqual('ok');
        })
    })

    describe('Bucket -> Bucket : graph', () => {
        it('error: unmet module', async () => {
            const app = new InlineApp('app', [
                new BucketBuilder('module1', 'bucket1')
                    .model($ => ({
                        id: $.int,
                        name: $.string
                    }))
                    .link('two', $ => $.one('module2::bucket2', {
                        id: {'.': 'id'}
                    }))
            ])
            
            let error: NesoiError.BaseError | undefined = undefined;
            try { await app.daemon() }
            catch (e: any) { error = e }
            expect(error?.name).toEqual('Builder.UnmetModuleDependency')
        })
    
        it('error: unmet', async () => {
            const app = new InlineApp('app', [
                new BucketBuilder('module1', 'bucket1')
                    .model($ => ({
                        id: $.int,
                        name: $.string
                    }))
                    .link('two', $ => $.one('module1::bucket2', {
                        id: {'.': 'id'}
                    }))
            ])
            
            let error: NesoiError.BaseError | undefined = undefined;
            try { await app.daemon() }
            catch (e: any) { error = e }
            expect(error?.name).toEqual('Builder.UnmetDependency')
        })
    
        it('error: not imported', async () => {
            const app = new InlineApp('app', [
                new BucketBuilder('module1', 'bucket1')
                    .model($ => ({
                        id: $.int,
                        name: $.string
                    }))
                    .link('two', $ => $.one('module2::bucket2', {
                        id: {'.': 'id'}
                    })),
                new BucketBuilder('module2', 'bucket2')
                    .model($ => ({
                        id: $.int,
                        value: $.float
                    }))
            ])
            
            let error: NesoiError.BaseError | undefined = undefined;
            try { await app.daemon() }
            catch (e: any) { error = e }
            expect(error?.name).toEqual('Builder.NotImportedDependency')
        })
    
        it('ok', async () => {
            const app = new InlineApp('app', [
                new BucketBuilder('module1', 'bucket1')
                    .model($ => ({
                        id: $.int,
                        name: $.string
                    }))
                    .link('two', $ => $.one('module2::bucket2', {
                        id: {'.': 'id'}
                    })),
                new BucketBuilder('module2', 'bucket2')
                    .model($ => ({
                        id: $.int,
                        value: $.float
                    })),
                new ExternalsBuilder('module1')
                    .bucket('module2::bucket2' as never)
            ])
            
            const daemon = await app.daemon();
            
            await daemon.trx('module2').run(async trx => {
                await trx.bucket('bucket2').create({
                    value: 12.34
                }) as any;
            });

            const res = await daemon.trx('module1').run(async trx => {
                await trx.bucket('bucket1').create({
                    name: 'oi',
                }) as any;
                
                const link = await trx.bucket('bucket1').readLink(1, 'two');
                expect(link).toEqual({
                    id: 1,
                    value: 12.34,
                    created_at: expect.any(NesoiDatetime),
                    updated_at: expect.any(NesoiDatetime)
                });
            })
            if (res.state !== 'ok') {
                console.error(res.error);
            }
            if (res.state !== 'ok') throw res.error;
            expect(res.state).toEqual('ok');
        })
    })

    describe('Bucket -> Value : crypto', () => {
        it('error: unmet module', async () => {
            const app = new InlineApp('app', [
                new BucketBuilder('module1', 'bucket')
                    .model($ => ({
                        id: $.int,
                        secret1: $.string.encrypt('module2::VALUE_1')
                    }))
            ])
            
            let error: NesoiError.BaseError | undefined = undefined;
            try { await app.daemon() }
            catch (e: any) { error = e }
            expect(error?.name).toEqual('Builder.UnmetModuleDependency')
        })
    
        it('error: unmet', async () => {
            const app = new InlineApp('app', [
                new BucketBuilder('module1', 'bucket')
                    .model($ => ({
                        id: $.int,
                        secret1: $.string.encrypt('module1::VALUE_1')
                    }))
            ])
            
            let error: NesoiError.BaseError | undefined = undefined;
            try { await app.daemon() }
            catch (e: any) { error = e }
            expect(error?.name).toEqual('Builder.UnmetDependency')
        })
    
        it('error: unmet value', async () => {
            const app = new InlineApp('app', [
                new BucketBuilder('module1', 'bucket')
                    .model($ => ({
                        id: $.int,
                        secret1: $.string.encrypt('module2::VALUE_2')
                    })),
                new ConstantsBuilder('module2')
                    .values($ => ({
                        'VALUE_1': $.static('< Static Value >')
                    })),
            ])
            
            let error: NesoiError.BaseError | undefined = undefined;
            try { await app.daemon() }
            catch (e: any) { error = e }
            expect(error?.name).toEqual('Builder.UnmetDependencyValue')
        })
    
        it('error: not imported', async () => {
            const app = new InlineApp('app', [
                new BucketBuilder('module1', 'bucket')
                    .model($ => ({
                        id: $.int,
                        secret1: $.string.encrypt('module2::VALUE_1')
                    })),
                new ConstantsBuilder('module2')
                    .values($ => ({
                        'VALUE_1': $.static('< Static Value >')
                    })),
            ])
            
            let error: NesoiError.BaseError | undefined = undefined;
            try { await app.daemon() }
            catch (e: any) { error = e }
            expect(error?.name).toEqual('Builder.NotImportedDependency')
        })
    
        it('ok', async () => {
            const app = new InlineApp('app', [
                new BucketBuilder('module1', 'bucket')
                    .model($ => ({
                        id: $.int,
                        secret1: $.string.encrypt('module2::VALUE_1'),
                        secret2: $.string.encrypt('module2::VALUE_2'),
                    })),
                new ConstantsBuilder('module2')
                    .values($ => ({
                        'VALUE_1': $.static('< Static Value >'),
                        'VALUE_2': $.app('__NESOI_TEST_ENV_VALUE')
                    })),
                new ExternalsBuilder('module1')
                    .value('module2::VALUE_1' as never)
                    .value('module2::VALUE_2' as never)
            ])
            
            process.env['__NESOI_TEST_ENV_VALUE'] = '<  App  Value  >';
            const daemon = await app.daemon();
            delete process.env['__NESOI_TEST_ENV_VALUE'];
    
            const res = await daemon.trx('module1').run(async trx => {
                const obj1 = await trx.bucket('bucket').create({
                    secret1: 'Secret 1',
                    secret2: 'Secret 2'
                }) as any;
                expect(obj1.secret1).not.toEqual('Secret 1')
                expect(obj1.secret2).not.toEqual('Secret 2')
                
                const obj2 = await trx.bucket('bucket').readOne(obj1.id) as any;
                expect(obj2.secret1).toEqual('Secret 1')
                expect(obj2.secret2).toEqual('Secret 2')
            })
            if (res.state !== 'ok') throw res.error;
            expect(res.state).toEqual('ok');
        })
    })

    describe('Bucket -> Enum : enum field', () => {
        it('error: unmet module', async () => {
            const app = new InlineApp('app', [
                new BucketBuilder('module1', 'bucket')
                    .model($ => ({
                        id: $.int,
                        secret1: $.enum('module2::ENUM_1')
                    }))
            ])
            
            let error: NesoiError.BaseError | undefined = undefined;
            try { await app.daemon() }
            catch (e: any) { error = e }
            expect(error?.name).toEqual('Builder.UnmetModuleDependency')
        })
    
        it('error: unmet', async () => {
            const app = new InlineApp('app', [
                new BucketBuilder('module1', 'bucket')
                    .model($ => ({
                        id: $.int,
                        secret1: $.enum('module1::ENUM_1')
                    }))
            ])
            
            let error: NesoiError.BaseError | undefined = undefined;
            try { await app.daemon() }
            catch (e: any) { error = e }
            expect(error?.name).toEqual('Builder.UnmetDependency')
        })
    
        it('error: unmet enum', async () => {
            const app = new InlineApp('app', [
                new BucketBuilder('module1', 'bucket')
                    .model($ => ({
                        id: $.int,
                        secret1: $.enum('module2::ENUM_2')
                    })),
                new ConstantsBuilder('module2')
                    .enum('ENUM_1', $ => ({
                        'a': $.opt('A'),
                        'b': $.opt('B'),
                    })),
            ])
            
            let error: NesoiError.BaseError | undefined = undefined;
            try { await app.daemon() }
            catch (e: any) { error = e }
            expect(error?.name).toEqual('Builder.UnmetDependencyEnum')
        })
    
        it('error: not imported', async () => {
            const app = new InlineApp('app', [
                new BucketBuilder('module1', 'bucket')
                    .model($ => ({
                        id: $.int,
                        secret1: $.enum('module2::ENUM_1')
                    })),
                new ConstantsBuilder('module2')
                    .enum('ENUM_1', $ => ({
                        'a': $.opt('A'),
                        'b': $.opt('B'),
                    })),
            ])
            
            let error: NesoiError.BaseError | undefined = undefined;
            try { await app.daemon() }
            catch (e: any) { error = e }
            expect(error?.name).toEqual('Builder.NotImportedDependency')
        })
    
        it('ok', async () => {
            const app = new InlineApp('app', [
                new BucketBuilder('module1', 'bucket')
                    .model($ => ({
                        id: $.int,
                        enum: $.enum('module2::ENUM_1'),
                    })),
                new ConstantsBuilder('module2')
                    .enum('ENUM_1', $ => ({
                        'a': $.opt('A'),
                        'b': $.opt('B'),
                    })),
                new ExternalsBuilder('module1')
                    .enum('module2::ENUM_1' as never)
            ])
            
            const daemon = await app.daemon();
            
            const res = await daemon.trx('module1').run(async trx => {
                const obj1 = await trx.bucket('bucket').create({
                    enum: 'a',
                }) as any;
                expect(obj1.enum).toEqual('a')
                
                const obj2 = await trx.bucket('bucket').readOne(obj1.id) as any;
                expect(obj2.enum).toEqual('a')
            })
            if (res.state !== 'ok') throw res.error;
            expect(res.state).toEqual('ok');
        })
    })
    

})