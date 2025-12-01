import type { AnyModule } from '~/engine/module';
import type { AnyDaemon} from '~/engine/daemon';

import { BucketBuilder } from '~/elements/entities/bucket/bucket.builder';
import { Log } from '~/engine/util/log'
import { InlineApp } from '~/engine/app/inline.app';
import { MemoryBucketAdapter } from '~/elements';
import { Daemon } from '~/engine/daemon';
import { TrxNode } from '~/engine/transaction/trx_node';

Log.level = 'off';

let daemon: AnyDaemon;
let _module: AnyModule;

async function setup() {
    if (daemon) {
        return daemon;
    }
    
    // Build buckets used for test

    const tagBucket = new BucketBuilder('MODULE', 'tag')
        .model($ => ({
            id: $.string,
            scope: $.string
        }));

    const colorBucket = new BucketBuilder('MODULE', 'color')
        .model($ => ({
            id: $.int,
            name: $.string,
            r: $.float,
            g: $.float,
            b: $.float,
            tag: $.string,
            scope: $.string.optional,
        }))
        .graph($ => ({
            tag: $.one('tag', {
                'id': { '.':'tag' }
            } as any),
        }))
        .view('default', $ => ({
            ...$.inject.root,
            tag: $.graph('tag')
        }))

    const shapeBucket = new BucketBuilder('MODULE', 'shape')
        .model($ => ({
            id: $.int,
            name: $.string,
            size: $.float,
            color_id: $.int,
            tag: $.string,
            scope: $.string.optional,
            props: $.dict($.int)
        }))
        .graph($ => ({
            color: $.one('color', {
                'id': { '.':'color_id' }
            } as any),
            tag: $.one('tag', {
                'id': { '.':'tag' }
            } as any),
        }))
        .view('default', $ => ({
            ...$.inject.root,
            color: $.graph('color'),
            tag: $.graph('tag'),
        }))
        .view('deep', $ => ({
            ...$.inject.root,
            color: $.graph('color', 'default' as any)
        }))

    const fruitBucket = new BucketBuilder('MODULE', 'fruit')
        .model($ => ({
            id: $.int,
            tag: $.string,
            color_id: $.int,
            shape_id: $.int
        }))
        .graph($ => ({
            tag: $.one('tag', {
                'id': { '.':'tag' }
            } as any),
            color: $.one('color', {
                'id': { '.':'color_id' }
            } as any),
            shape: $.one('shape', {
                'id': { '.':'shape_id' }
            } as any),
            shape_color: $.one('color', {
                'id': {
                    '@shape.color_id': {
                        'id in': { '.': 'shape_id' }
                    }
                }
            } as any)
        }))
        .view('test', $ => ({
            shape_color: $.graph('shape_color'),
        }))

    // Build test app
    const app = new InlineApp('RUNTIME', [
        tagBucket,
        colorBucket,
        shapeBucket,
        fruitBucket
    ])
        .config.module('MODULE', {
            buckets: {
                'tag': {
                    adapter: $ => new MemoryBucketAdapter<any, any>($)
                },
                'color': {
                    adapter: $ => new MemoryBucketAdapter<any, any>($)
                },
                'shape': {
                    adapter: $ => new MemoryBucketAdapter<any, any>($)
                },
                'fruit': {
                    adapter: $ => new MemoryBucketAdapter<any, any>($)
                },
            }
        })
    
    // Run test daemon
    daemon = await app.daemon();
    _module = Daemon.getModule(daemon, 'MODULE');

    // Populate database using daemon
    const res = await daemon.trx('MODULE').run(async trx => {
        await trx.bucket('tag').put({
            id: 'Tag 1',
            scope: 'Scope 1',
            '#composition': {}
        });
        await trx.bucket('tag').put({
            id: 'Tag 2',
            scope: 'Scope 1',
            '#composition': {}
        });
        await trx.bucket('tag').put({
            id: 'Tag 3',
            scope: 'Scope 2',
            '#composition': {}
        });

        await trx.bucket('color').put({
            id: 1,
            name: 'Red',
            r: 1, g: 0, b: 0,
            tag: 'Tag 1',
            scope: 'Scope 1',
            '#composition': {}
        });
        await trx.bucket('color').put({
            id: 2,
            name: 'Green',
            r: 0, g: 1, b: 0,
            tag: 'Tag 2',
            scope: 'Scope 2',
            '#composition': {}
        });
        await trx.bucket('color').put({
            id: 3,
            name: 'Blue',
            r: 0, g: 0, b: 1,
            tag: 'Tag 3',
            '#composition': {}
        });

        await trx.bucket('shape').put({
            id: 1,
            name: 'Shape 1',
            size: 11,
            color_id: 1,
            tag: 'Tag 1',
            scope: 'Scope 1',
            props: { a: 1, b: 3, c: 0 },
            '#composition': {}
        });
        await trx.bucket('shape').put({
            id: 2,
            name: 'Shape 2',
            size: 22,
            color_id: 2,
            tag: 'Tag 2',
            scope: 'Scope 2',
            props: { a: 2, b: 2, c: 0 },
            '#composition': {}
        });
        await trx.bucket('shape').put({
            id: 3,
            name: 'Shape 3',
            size: 33,
            color_id: 3,
            tag: 'Tag 3',
            props: { a: 3, b: 1, c: 1 },
            '#composition': {}
        });

        await trx.bucket('fruit').put({
            id: 1,
            tag: 'Tag 1',
            shape_id: 1,
            color_id: 1,
            '#composition': {}           
        });

        await trx.bucket('fruit').put({
            id: 2,
            tag: 'Tag 2',
            shape_id: 2,
            color_id: 2,
            '#composition': {}           
        });

        await trx.bucket('fruit').put({
            id: 3,
            tag: 'Tag 3',
            shape_id: 3,
            color_id: 3,
            '#composition': {}           
        });
    });

    if (res.error) throw res.error;

    return daemon;
}

async function testTrx(fn: Parameters<ReturnType<typeof daemon['trx']>['run']>[0]) {
    const trx = await daemon.trx('MODULE').run(fn);
    if (trx.state !== 'ok') {
        throw trx.error;
    }
}

beforeAll(async () => {
    await setup();
}, 30000)

describe('Bucket Graph', () => {

    describe('Read Many Links', () => {

        it('should make 2 calls for N objects (1 link, simple query)', async () => {
            await testTrx(async trx => {
                const module = TrxNode.getModule(trx);

                const shapeSpy = jest.spyOn(module.buckets['shape'].adapter.nql, 'run');
                const colorSpy = jest.spyOn(module.buckets['color'].adapter.nql, 'run');

                const shapeIds = [1,2,3];
                
                const colors = await trx.bucket('shape')
                    .readManyLinks(shapeIds, 'color') as any[]
                
                expect(colors).toHaveLength(3);
                
                expect(shapeSpy).toHaveBeenCalledTimes(1);
                expect(colorSpy).toHaveBeenCalledTimes(1);

            });
        })

        it('should make 3 calls for N objects (2 links, simple query)', async () => {
            await daemon.trx('MODULE').run(async trx => {
                const module = TrxNode.getModule(trx);

                const shapeSpy = jest.spyOn(module.buckets['shape'].adapter.nql, 'run');
                const colorSpy = jest.spyOn(module.buckets['color'].adapter.nql, 'run');
                const tagSpy = jest.spyOn(module.buckets['tag'].adapter.nql, 'run');

                const objs = await trx.bucket('shape').viewAll('default')
                
                expect(shapeSpy).toHaveBeenCalledTimes(1);
                expect(colorSpy).toHaveBeenCalledTimes(1);
                expect(tagSpy).toHaveBeenCalledTimes(1);

                expect(objs).toHaveLength(3);
            });
        })

        it('should make 3 calls for N objects (1 link + 1 link, simple query)', async () => {
            await daemon.trx('MODULE').run(async trx => {
                const module = TrxNode.getModule(trx);

                const shapeSpy = jest.spyOn(module.buckets['shape'].adapter.nql, 'run');
                const colorSpy = jest.spyOn(module.buckets['color'].adapter.nql, 'run');
                const tagSpy = jest.spyOn(module.buckets['tag'].adapter.nql, 'run');

                const objs = await trx.bucket('shape').viewAll('deep')
                
                expect(shapeSpy).toHaveBeenCalledTimes(1);
                expect(colorSpy).toHaveBeenCalledTimes(1);
                expect(tagSpy).toHaveBeenCalledTimes(1);

                expect(objs).toHaveLength(3);
            });
        })

        it('should make 3 calls for N objects (1 link, subquery)', async () => {
            await daemon.trx('MODULE').run(async trx => {
                const module = TrxNode.getModule(trx);

                const shapeSpy = jest.spyOn(module.buckets['shape'].adapter.nql, 'run');
                const colorSpy = jest.spyOn(module.buckets['color'].adapter.nql, 'run');
                const fruitSpy = jest.spyOn(module.buckets['fruit'].adapter.nql, 'run');

                const objs = await trx.bucket('fruit').viewAll('test')
                
                expect(shapeSpy).toHaveBeenCalledTimes(1);
                expect(colorSpy).toHaveBeenCalledTimes(1);
                expect(fruitSpy).toHaveBeenCalledTimes(1);
                
                expect(objs).toHaveLength(3);
                // for (const obj of objs) {
                //     expect(obj.shape_color.id).toEqual(1)
                // }
            });
        })

    })

})