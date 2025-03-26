
import { Mock } from 'nesoi/tools/joaquin/mock';
import { BucketBuilder } from '~/elements/entities/bucket/bucket.builder';
import { Log } from '~/engine/util/log'
import { InlineApp } from '~/engine/apps/inline.app';
import { AnyDaemon } from '~/engine/apps/app';
import { PostgresProvider, PostgresBucketAdapter, PostgresBucketAdapterConfig } from '../src/postgres.bucket_adapter';
import { Migrator } from '~/adapters/postgres/src/migrator';
import { MigrationRunner } from '~/adapters/postgres/src/migrator/runner';

Log.level = 'warn';

// TODO: read this from env
const PostgresConfig: PostgresBucketAdapterConfig = {
    updatedAtField: 'updated_at',
    postgres: {
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        pass: 'postgres',
        db: 'NESOI_TEST',
    }
}

let daemon: AnyDaemon;
async function setup() {
    if (daemon) {
        return daemon;
    }
    
    // Build bucket used for test
    const bucket = new BucketBuilder('MODULE', 'BUCKET')
        .model($ => ({
            id: $.int,
            p_boolean: $.boolean,
            p_date: $.date,
            p_datetime: $.datetime,
            p_decimal: $.decimal(),
            p_enum: $.enum(['a','b','c']),
            p_int: $.int,
            p_float: $.float,
            p_string: $.string,
            p_obj: $.obj({
                a: $.int,
                b: $.string
            }),
            p_dict: $.dict($.boolean)
        }));

    // Build test app
    const app = new InlineApp('RUNTIME', [
        bucket
    ])
        .provider(
            PostgresProvider.make('pg', PostgresConfig)
        )
        .config.buckets({
            'MODULE': {
                'BUCKET': {
                    adapter: ($, {pg}) => new PostgresBucketAdapter($, pg, 'nesoi_test_table')
                }
            }
        })
        .config.trx({
            'MODULE': {
                trx: {
                    wrap: PostgresProvider.wrap('pg')
                }
            }
        })
    
    // Run test daemon
    daemon = await app.daemon();

    // Prepare database using daemon
    // TODO: encapsulate this

    // await Migrator.createDatabase('NESOI_TEST', PostgresConfig, { if_exists: 'delete' });

    const migrator = await Migrator.prepare(daemon, PostgresConfig);
    const migration = await migrator.bucket('MODULE', 'BUCKET', 'nesoi_test_table')
    if (migration) {
        migration.name = 'postgres.bucket_adapter.test';
        await MigrationRunner.oneUp(daemon, migration, PostgresConfig);
    }
    // migration?.save();
    // await MigrationRunner.up(daemon, 'one', PostgresConfig);
        
    return daemon;
}

const mock = new Mock();
beforeAll(async () => {
    await setup();
}, 30000)

describe('Postgres Bucket Adapter', () => {

    // it ('!', () => {
    //     expect(1+1).toEqual(2);
    // })

    describe('CRUD', () => {
        it('create should return unmodified object', async() => {
            await daemon.trx('MODULE').run(async trx => {
                // given
                const BUCKET = trx.bucket('BUCKET');
                const input = mock.bucket('MODULE', 'BUCKET')
                    .obj({ id: undefined }).raw(daemon);
                
                // when
                const { id, ...obj } = await BUCKET.create(input as any);
    
                // then
                expect(id).toBeTruthy();
                expect(obj).toEqual(input);
    
            })
        })
    
        it('read should return unmodified object after create', async() => {
            await daemon.trx('MODULE').run(async trx => {
                // given
                const BUCKET = trx.bucket('BUCKET');
                const input = mock.bucket('MODULE', 'BUCKET')
                    .obj({ id: undefined }).raw(daemon);
                
                // when
                const created = await BUCKET.create(input as any);
                const { id, ...obj } = await BUCKET.readOneOrFail(created.id);
    
                // then
                expect(id).toBeTruthy();
                expect(obj).toEqual(input);
            })
        })
    
        it('update should modify object after insert', async() => {
            await daemon.trx('MODULE').run(async trx => {
                // given
                const BUCKET = trx.bucket('BUCKET');
                const input1 = mock.bucket('MODULE', 'BUCKET')
                    .obj({ id: undefined }).raw(daemon);
                const input2 = mock.bucket('MODULE', 'BUCKET')
                    .obj({ id: undefined }).raw(daemon);
                
                // when
                const { id: id_create, ...created } = await BUCKET.create(input1 as any);
                const { id: id_update, ...updated } = await BUCKET.put({
                    ...input2,
                    id: id_create
                } as any);
    
                // then
                expect(id_create).toBeTruthy();
                expect(id_update).toEqual(id_create);
                expect(created).toEqual(input1);
                expect(updated).toEqual(input2);
            })
        })
    
        it('delete should remove object from database', async() => {
            await daemon.trx('MODULE').run(async trx => {
                // given
                const BUCKET = trx.bucket('BUCKET');
                const input = mock.bucket('MODULE', 'BUCKET')
                    .obj({ id: undefined }).raw(daemon);
                
                // when
                const created = await BUCKET.create(input as any);            
                const read = await BUCKET.readOneOrFail(created.id);            
                await BUCKET.deleteOrFail(read.id);
                const read2 = await BUCKET.readOne(read.id);            
    
                // then
                expect(read2).toBeUndefined();
            })
        })
    })

    describe('Query', () => {

        it('query first by existing id should return object', async() => {
            let queried;
            await daemon.trx('MODULE').run(async trx => {
                // given
                const BUCKET = trx.bucket('BUCKET');
                const input = mock.bucket('MODULE', 'BUCKET')
                    .obj({ id: undefined }).raw(daemon);
                
                // when
                const created = await BUCKET.create(input as any);
                queried = await BUCKET.query({
                    'id': created.id
                }).all();
    
                // then
                expect(queried.length).toEqual(1);
                expect(queried[0].id).toEqual(created.id);
            })
        })

    })

})