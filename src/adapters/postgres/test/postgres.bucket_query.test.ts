
// import { Mock } from 'nesoi/tools/papagaio/mock';
// import { BucketBuilder } from '~/elements/entities/bucket/bucket.builder';
// import { Log } from '~/engine/util/log'
// import { LibraryRuntime } from '~/engine/runtimes/library.runtime';
// import { AnyDaemon } from '~/engine/runtimes/runtime';
// import { PostgresBucketAdapter, PostgresBucketAdapterConfig } from '../src/postgres.bucket_adapter';
// import { Migrator } from 'nesoi/tools/migrator';
// import { MigrationRunner } from 'nesoi/tools/migrator/runner';

// Log.level = 'info';

// // TODO: read this from env
// const PostgresConfig: PostgresBucketAdapterConfig = {
//     updatedAtField: 'updated_at',
//     postgres: {
//         host: 'localhost',
//         port: 5432,
//         user: 'postgres',
//         pass: 'postgres',
//         db: 'NESOI_TEST',
//     }
// }

// let daemon: AnyDaemon;
// async function setup() {
//     if (daemon) {
//         return daemon;
//     }
    
//     // Build buckets used for test

//     const tagBucket = new BucketBuilder('MODULE', 'tag')
//         .model($ => ({
//             id: $.string,
//             scope: $.string
//         }));

//     const colorBucket = new BucketBuilder('MODULE', 'color')
//         .model($ => ({
//             id: $.int,
//             r: $.float,
//             g: $.float,
//             b: $.float,
//             tag: $.string,
//             scope: $.string
//         }));

//     const shapeBucket = new BucketBuilder('MODULE', 'shape')
//         .model($ => ({
//             id: $.int,
//             name: $.string,
//             size: $.float,
//             color_id: $.int,
//             tag: $.string,
//             scope: $.string
//         }));

//     // Build test runtime
//     const runtime = new LibraryRuntime('RUNTIME', [
//         tagBucket,
//         colorBucket,
//         shapeBucket
//     ])
//         .config.buckets({
//             'MODULE': {
//                 'tag': {
//                     adapter: $ => new PostgresBucketAdapter($, 'tags', PostgresConfig)
//                 },
//                 'color': {
//                     adapter: $ => new PostgresBucketAdapter($, 'colors', PostgresConfig)
//                 },
//                 'shape': {
//                     adapter: $ => new PostgresBucketAdapter($, 'shapes', PostgresConfig)
//                 },
//             }
//         })
    
//     // Run test daemon
//     daemon = await runtime.daemon();

//     // Prepare database using daemon
//     // TODO: encapsulate this

//     // await Migrator.createDatabase('NESOI_TEST', PostgresConfig, { if_exists: 'delete' });

//     const migrator = await Migrator.prepare(daemon, PostgresConfig);

//     {
//         const migration = await migrator.bucket('MODULE', 'tag', 'tags')
//         if (migration) {
//             migration.name = '0_tag';
//             await MigrationRunner.oneUp(daemon, migration, PostgresConfig);
//         }
//     }
//     {
//         const migration = await migrator.bucket('MODULE', 'color', 'colors')
//         if (migration) {
//             migration.name = '0_color';
//             await MigrationRunner.oneUp(daemon, migration, PostgresConfig);
//         }
//     }
//     {
//         const migration = await migrator.bucket('MODULE', 'shape', 'shapes')
//         if (migration) {
//             migration.name = '0_shape';
//             await MigrationRunner.oneUp(daemon, migration, PostgresConfig);
//         }
//     }


//     // migration?.save();
//     // await MigrationRunner.up(daemon, 'one', PostgresConfig);
        
//     return daemon;
// }

// const mock = new Mock();
// beforeAll(async () => {
//     await setup();
// }, 30000)

// describe('Postgres Bucket Query', () => {

//     describe('CRUD', () => {
//         it('create should return unmodified object', async() => {
//             await daemon.trx('MODULE').run(async trx => {
                
//                 const Tag = trx.bucket('tag');
//                 const TagMock = mock.bucket('MODULE', 'tag');
                
//                 const Color = trx.bucket('color');
//                 const ColorMock = mock.bucket('MODULE', 'color');
                
//                 const Shape = trx.bucket('shape');
//                 const ShapeMock = mock.bucket('MODULE', 'shape');

//                 const tags: any[] = [];
//                 for (let i=0; i<100; i++) {
//                     const obj = TagMock.obj().raw(daemon) as any;
//                     (obj as any).scope = 'scope';
//                     tags.push(await Tag.put(obj))
//                 }
//                 for (let i=0; i<100; i++) {
//                     const obj = ColorMock.obj().raw(daemon);
//                     (obj as any).tag = tags[i].id;
//                     (obj as any).scope = 'scope';
//                     await Color.create(obj);
//                 }
//                 for (let i=0; i<100; i++) {
//                     const obj = ShapeMock.obj().raw(daemon);
//                     (obj as any).tag = tags[i].id;
//                     (obj as any).scope = 'scope';
//                     await Shape.create(obj);
//                 }
    
//             })
//         })
    
//     })


// })