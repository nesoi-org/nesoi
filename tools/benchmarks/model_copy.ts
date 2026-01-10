import Benchmark from 'benchmark';
import { BucketBuilder } from '~/elements/entities/bucket/bucket.builder';
import type { BucketModel } from '~/elements/entities/bucket/model/bucket_model';
import { InlineApp } from '~/engine/app/inline.app';
import { NesoiDate } from '~/engine/data/date';
import { NesoiDatetime } from '~/engine/data/datetime';
import { NesoiDecimal } from '~/engine/data/decimal';
import { NesoiDuration } from '~/engine/data/duration';
import { TrxNode } from '~/engine/transaction/trx_node';

async function setup() {
    const builder = new BucketBuilder('test', 'test')
        .model($ => ({
            id: $.int,
            any: $.any,
            boolean: $.boolean,
            date: $.date,
            datetime: $.datetime,
            duration: $.duration,
            decimal: $.decimal(),
            enum: $.enum(['a','b','c']),
            int: $.int,
            float: $.float,
            string: $.string,
            literal: $.literal(/template/),
            obj: $.obj({
                a: $.int,
                b: $.string,
                c: $.dict($.boolean),
                d: $.list($.date),
            }),
            dict: $.dict($.datetime),
            list: $.list($.float),
            union: $.union(
                $.duration,
                $.dict($.int)
            )
        }))

    const app = new InlineApp('test', [ builder ])

    // app.config.module('test', {
    //     buckets: {
    //         'test': {
    //             adapter: (schema: any) => new MemoryBucketAdapter(schema, i.data)
    //         }
    //     }
    // })

    const response = await app.daemon().then(
        d => d.trx('test').run(trx => {
            const module = TrxNode.getModule(trx);
            return Promise.resolve(module.buckets['test'].model);
        })
    )
    return response.output as BucketModel<any, any>;
}

const obj = {
    id: 1,
    any: Symbol('any'),
    boolean: true,
    date: NesoiDate.now(),
    datetime: NesoiDatetime.now(),
    duration: NesoiDuration.fromString('15 mins'),
    decimal: new NesoiDecimal('12.34'),
    enum: 'a',
    int: 123,
    float: 12.34,
    string: 'text',
    literal: 'template',
    obj: {
        a: 124,
        b: 'text2',
        c: { x: true, y: false },
        d: [NesoiDate.now(), NesoiDate.now()],
    },
    dict: {
        x: NesoiDatetime.now(),
        y: NesoiDatetime.now(),
    },
    list: [23.45, 34.56],
    union: {
        x: 1,
        y: 2
    }
};

setup().then(model => {   
    // const copy_suite = new Benchmark.Suite;
    // copy_suite
    //     .add('old', () => {
    //         model.copy(obj, 'load')
    //     })
    //     .add('new', () => {
    //         model.copy2(obj);
    //     })
    
    //     .on('cycle', (event: any) => { console.log(String(event.target)); })
    //     .on('complete', () => { console.log('Fastest is ' + copy_suite.filter('fastest').map('name')); })
    //     .run({ 'async': false });

    console.log('get_old = ', model.copy(obj, 'load', false, 'obj.*'))
    console.log('get_new = ', model.get(obj, 'obj.*'))

    const get_suite = new Benchmark.Suite;
    get_suite
        .add('old', () => {
            model.copy(obj, 'load', false, 'obj')
        })
        .add('new', () => {
            model.get(obj, 'obj');
        })
    
        .on('cycle', (event: any) => { console.log(String(event.target)); })
        .on('complete', () => { console.log('Fastest is ' + get_suite.filter('fastest').map('name')); })
        .run({ 'async': false });
})