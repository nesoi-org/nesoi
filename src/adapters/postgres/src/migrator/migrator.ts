import { AnyDaemon } from '~/engine/runtimes/runtime';
import postgres from 'postgres'
import { Log } from '~/engine/util/log';
import { BucketMigrator } from './migration';
import { $Space } from '~/elements';
import { MigrationMethod, MigrationRunner, MigrationStatus } from './runner';

export type MigratorConfig = {
    dirpath?: string
    postgres?: postgres.Options<any>
}

export type MigrationRow = {
    id: number,
    name: string,
    description?: string,
    batch: number,
    timestamp: string,
    hash: string,
    filehash: string
}

export class Migrator<
    S extends $Space
> {
    public static MIGRATION_TABLE_NAME = '__nesoi_migrations';
    public static dirpath = './migrations';

    private sql: postgres.Sql<any>
    private status!: MigrationStatus

    private constructor(
        protected daemon: AnyDaemon,
        protected config?: MigratorConfig,
    ) {
        this.sql = postgres(this.config?.postgres);
    }

    static async prepare(
        daemon: AnyDaemon,
        config?: MigratorConfig,
    ) {
        const migrator = new Migrator(daemon, config);

        const oldTable = await migrator.sql`
            SELECT * FROM pg_catalog.pg_tables WHERE tablename = ${ Migrator.MIGRATION_TABLE_NAME };
        `;

        if (!oldTable.length) {
            await migrator.sql`CREATE TABLE ${migrator.sql(Migrator.MIGRATION_TABLE_NAME)} (
                id SERIAL PRIMARY KEY,
                name VARCHAR NOT NULL,
                description VARCHAR,
                batch INT4 NOT NULL,
                timestamp TIMESTAMP NOT NULL,
                hash VARCHAR NOT NULL,
                filehash VARCHAR NOT NULL
            )`;
        }


        migrator.status = await MigrationRunner.status(migrator.sql, migrator.config?.dirpath);
        return migrator;
    }   

    async bucket<
        ModuleName extends keyof S['modules']
    >(
        module: ModuleName,
        bucket: keyof S['modules'][ModuleName]['buckets'],
        tableName: string,
    ) {
        const migrator = new BucketMigrator(this.daemon, this.sql, module as string, bucket as string, tableName);
        const migration = await migrator.generate();
        if (!migration) {
            Log.info('migrator' as any, 'bucket', 'No changes detected on the bucket.')
            return undefined;
        }
        console.log(migration.describe());
        const hash = migration.hash();
        const alreadyExists = this.status.items.find(item => item.hash === hash);
        if (alreadyExists && alreadyExists?.state === 'pending') {
            Log.warn('migrator' as any, 'bucket', 'A similar migration was found pending, ignoring this one.')
            return undefined;
        }
        return migration;
    }

    static migration<S extends $Space>(...$: ConstructorParameters<typeof MigrationMethod>) {
        return new MigrationMethod(...$);
    }

    static async createDatabase(name: string, config?: MigratorConfig, $?: {
        if_exists: 'fail' | 'keep' | 'delete'
    }) {
        const sql = postgres(Object.assign({}, config?.postgres, {
            db: 'postgres'
        }));

        const dbs = await sql`SELECT datname FROM pg_database`;
        const alreadyExists = dbs.some(db => db.datname === name)

        if (alreadyExists) {
            if (!$ || $.if_exists === 'fail') {
                throw new Error(`Database ${name} already exists`);
            }
            if ($.if_exists === 'keep') {
                return
            }
            if ($.if_exists === 'delete') {
                Log.warn('migrator' as any, 'create_db', `Database '${name}' is being dropped due to a if_exists:'delete' flag.`)
                await sql`DROP DATABASE ${sql(name)}`
            }
        }
        
        Log.info('migrator' as any, 'create_db', `Creating database '${name}'`)
        await sql`CREATE DATABASE ${sql(name)}`;
    }

}