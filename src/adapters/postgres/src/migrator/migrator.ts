import postgres from 'postgres'
import { Log } from '~/engine/util/log';
import { BucketMigrator, Migration } from './migration';
import { $Space } from '~/elements';
import { MigrationMethod, MigrationRunner, MigrationStatus } from './runner';
import { AnyDaemon, Daemon } from '~/engine/daemon';
import { Bucket } from '~/elements/entities/bucket/bucket';
import { PostgresBucketAdapter } from '../postgres.bucket_adapter';
import { colored } from '~/engine/util/string';

export type MigratorConfig = {
    dirpath?: string
    postgres?: postgres.Options<any>
}

export class Migrator<
    S extends $Space
> {
    public static MIGRATION_TABLE_NAME = '__nesoi_migrations';

    public status!: MigrationStatus
    
    private constructor(
        protected daemon: AnyDaemon,
        private sql: postgres.Sql<any>,
        public dirpath = './migrations'
    ) {}

    static async prepare(
        daemon: AnyDaemon,
        sql: postgres.Sql<any>
    ) {
        const migrator = new Migrator(daemon, sql);

        const oldTable = await migrator.sql`
            SELECT * FROM pg_catalog.pg_tables WHERE tablename = ${ Migrator.MIGRATION_TABLE_NAME };
        `;

        if (!oldTable.length) {
            await migrator.sql`CREATE TABLE ${migrator.sql(Migrator.MIGRATION_TABLE_NAME)} (
                id SERIAL PRIMARY KEY,
                module VARCHAR NOT NULL,
                name VARCHAR NOT NULL,
                description VARCHAR,
                batch INT4 NOT NULL,
                timestamp TIMESTAMP NOT NULL,
                hash VARCHAR NOT NULL,
                filehash VARCHAR NOT NULL
            )`;
        }


        migrator.status = await MigrationRunner.status(daemon, migrator.sql, migrator.dirpath);
        return migrator;
    }   

    async generate() {
        const modules = Daemon.getModules(this.daemon);

        const migrations: Migration[] = [];
        for (const module of modules) {
            const buckets = Daemon.getModule(this.daemon, module.name).buckets;
            
            for (const bucket in buckets) {
                const adapter = Bucket.getAdapter(buckets[bucket]) as PostgresBucketAdapter<any, any>;
                if (!adapter?.tableName) continue;

                const migration = await this.generateForBucket(module.name, bucket, adapter.tableName);
                if (migration) {
                    migrations.push(migration);
                }
            }
        }

        return migrations;
    }

    async generateForBucket<
        ModuleName extends keyof S['modules']
    >(
        module: ModuleName,
        bucket: keyof S['modules'][ModuleName]['buckets'],
        tableName: string,
    ) {
        const migrator = new BucketMigrator(this.daemon, this.sql, module as string, bucket as string, tableName);
        const migration = await migrator.generate();
        const tag = colored(`${module as string}::bucket:${bucket as string}`, 'lightcyan');
        if (!migration) {
            Log.info('migrator' as any, 'bucket', `No changes detected on ${tag}.`)
            return undefined;
        }
        const hash = migration.hash();
        const alreadyExists = this.status.items.find(item => item.hash === hash);
        if (alreadyExists && alreadyExists?.state === 'pending') {
            Log.warn('migrator' as any, 'bucket', `A similar migration for ${tag} was found pending, ignoring this one.`)
            return undefined;
        }
        return migration;
    }

    static migration<S extends $Space>(...$: ConstructorParameters<typeof MigrationMethod>) {
        return new MigrationMethod(...$);
    }

}