import { BucketBuilder } from '~/elements/entities/bucket/bucket.builder';
import { Log } from '~/engine/util/log';
import { InlineApp } from '~/engine/app/inline.app';
import { AnyDaemon } from '~/engine/daemon';
import { NesoiDecimal } from '~/engine/data/decimal';
import { NesoiDate } from '~/engine/data/date';
import { NesoiDatetime } from '~/engine/data/datetime';
import { AnyMemoryBucketAdapter, MemoryBucketAdapter } from '~/elements/entities/bucket/adapters/memory.bucket_adapter';

Log.level = 'warn';

let daemon: AnyDaemon;
let dateAdapter: AnyMemoryBucketAdapter;
let datetimeAdapter: AnyMemoryBucketAdapter;
let decimalAdapter: AnyMemoryBucketAdapter;
let durationAdapter: AnyMemoryBucketAdapter;

async function setup() {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (daemon) {
        return daemon;
    }
    
    // Build buckets used for test

    const dateBucket = new BucketBuilder('MODULE', 'date')
        .model($ => ({
            id: $.int,
            value: $.date,
            deep: $.obj({
                value: $.date,
                deeper: $.list($.obj({
                    value: $.date,
                }))
            })
        }));

    const datetimeBucket = new BucketBuilder('MODULE', 'datetime')
        .model($ => ({
            id: $.int,
            value: $.datetime,
            deep: $.obj({
                value: $.datetime,
                deeper: $.list($.obj({
                    value: $.datetime,
                }))
            })
        }));

    const decimalBucket = new BucketBuilder('MODULE', 'decimal')
        .model($ => ({
            id: $.int,
            value: $.decimal(),
            deep: $.obj({
                value: $.decimal(),
                deeper: $.list($.obj({
                    value: $.decimal(),
                }))
            })
        }));

    const durationBucket = new BucketBuilder('MODULE', 'duration')
        .model($ => ({
            id: $.int,
            value: $.duration,
            deep: $.obj({
                value: $.duration,
                deeper: $.list($.obj({
                    value: $.duration,
                }))
            })
        }));
    
    // Build test app
    const app = new InlineApp('RUNTIME', [
        dateBucket,
        datetimeBucket,
        decimalBucket,
        durationBucket,
    ])
        .config.module('MODULE', {
            buckets: {
                'date': {
                    adapter: ($, {pg}) => {
                        dateAdapter = new MemoryBucketAdapter($)
                        return dateAdapter;
                    }
                },
                'datetime': {
                    adapter: ($, {pg}) => {
                        datetimeAdapter = new MemoryBucketAdapter($)
                        return datetimeAdapter;
                    }
                },
                'decimal': {
                    adapter: ($, {pg}) => {
                        decimalAdapter = new MemoryBucketAdapter($)
                        return decimalAdapter;
                    }
                },
                'duration': {
                    adapter: ($, {pg}) => {
                        durationAdapter = new MemoryBucketAdapter($)
                        return durationAdapter;
                    }
                },
            }
        });
        
    // Run test daemon
    daemon = await app.daemon();
    return daemon;
}

/* Generic Test */

describe('Serialization', () => {

    beforeAll(async () => {
        await setup();
    }, 30000);
    afterAll(async () => {
        await daemon.destroy();
    }, 30000);

    it('should store/read date properly', async () => {
        let created: any;
        let read: any;
        await daemon.trx('MODULE').run(async trx => {
            created = await trx.bucket('date').create({
                value: NesoiDate.fromISO('2025-01-02'),
                deep: {
                    value: NesoiDate.fromISO('2025-03-04'),
                    deeper: [
                        {
                            value: NesoiDate.fromISO('2025-05-06')
                        }
                    ]
                }
            });
            read = await trx.bucket('date').readOne(created.id);
        });

        const rows = Object.values(dateAdapter.data);

        expect(rows[0].value).toBeInstanceOf(NesoiDate);
        expect(rows[0].deep.value).toBeInstanceOf(NesoiDate);
        expect(rows[0].deep.deeper[0].value).toBeInstanceOf(NesoiDate);
        
        expect(created.value).toBeInstanceOf(NesoiDate);
        expect(created.deep.value).toBeInstanceOf(NesoiDate);
        expect(created.deep.deeper[0].value).toBeInstanceOf(NesoiDate);
        
        expect(read.value).toBeInstanceOf(NesoiDate);
        expect(read.deep.value).toBeInstanceOf(NesoiDate);
        expect(read.deep.deeper[0].value).toBeInstanceOf(NesoiDate);

        // then
        expect(rows.length).toEqual(1);
    });

    it('should store/read datetime properly', async () => {
        let created: any;
        let read: any;
        await daemon.trx('MODULE').run(async trx => {
            created = await trx.bucket('datetime').create({
                value: NesoiDatetime.fromISO('2025-01-02T00:01:02Z'),
                deep: {
                    value: NesoiDatetime.fromISO('2025-03-04T03:04:05Z'),
                    deeper: [
                        {
                            value: NesoiDatetime.fromISO('2025-05-06T06:07:08Z')
                        }
                    ]
                }
            });
            read = await trx.bucket('datetime').readOne(created.id);
        });

        const rows = Object.values(datetimeAdapter.data);

        expect(rows[0].value).toBeInstanceOf(NesoiDatetime);
        expect(rows[0].deep.value).toBeInstanceOf(NesoiDatetime);
        expect(rows[0].deep.deeper[0].value).toBeInstanceOf(NesoiDatetime);
        
        expect(created.value).toBeInstanceOf(NesoiDatetime);
        expect(created.deep.value).toBeInstanceOf(NesoiDatetime);
        expect(created.deep.deeper[0].value).toBeInstanceOf(NesoiDatetime);
        
        expect(read.value).toBeInstanceOf(NesoiDatetime);
        expect(read.deep.value).toBeInstanceOf(NesoiDatetime);
        expect(read.deep.deeper[0].value).toBeInstanceOf(NesoiDatetime);

        // then
        expect(rows.length).toEqual(1);
    });
    
    it('should store/read decimal properly', async () => {
        let created: any;
        let read: any;
        await daemon.trx('MODULE').run(async trx => {
            created = await trx.bucket('decimal').create({
                value: new NesoiDecimal('123.456'),
                deep: {
                    value: new NesoiDecimal('789.012'),
                    deeper: [
                        {
                            value: new NesoiDecimal('345.678')
                        }
                    ]
                }
            });
            read = await trx.bucket('decimal').readOne(created.id);
        });

        const rows = Object.values(decimalAdapter.data);

        expect(rows[0].value).toBeInstanceOf(NesoiDecimal);
        expect(rows[0].deep.value).toBeInstanceOf(NesoiDecimal);
        expect(rows[0].deep.deeper[0].value).toBeInstanceOf(NesoiDecimal);
        
        expect(created.value).toBeInstanceOf(NesoiDecimal);
        expect(created.deep.value).toBeInstanceOf(NesoiDecimal);
        expect(created.deep.deeper[0].value).toBeInstanceOf(NesoiDecimal);
        
        expect(read.value).toBeInstanceOf(NesoiDecimal);
        expect(read.deep.value).toBeInstanceOf(NesoiDecimal);
        expect(read.deep.deeper[0].value).toBeInstanceOf(NesoiDecimal);

        // then
        expect(rows.length).toEqual(1);
    });   
    
});