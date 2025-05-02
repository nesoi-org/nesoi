import postgres from 'postgres'
import { Log } from '~/engine/util/log';
import { $Bucket, $Space } from '~/elements';
import { MigrationRunner } from '../runner/runner';
import { AnyDaemon, Daemon } from '~/engine/daemon';
import { PostgresBucketAdapter } from '../../postgres.bucket_adapter';
import { colored } from '~/engine/util/string';
import { MigrationRunnerStatus } from '../runner/status';
import { $Migration } from './migration';
import { MigrationGenerator } from './generator';

export type MigratorConfig = {
    dirpath?: string
    postgres?: postgres.Options<any>
}

export class MigrationProvider<
    S extends $Space
> {
    public status!: MigrationRunnerStatus
    
    private constructor(
        protected daemon: AnyDaemon,
        private sql: postgres.Sql<any>,
        public dirpath = './migrations'
    ) {}

    static async create(
        daemon: AnyDaemon,
        sql: postgres.Sql<any>
    ) {
        const provider = new MigrationProvider(daemon, sql);

        const oldTable = await provider.sql`
            SELECT * FROM pg_catalog.pg_tables WHERE tablename = ${ MigrationRunner.MIGRATION_TABLE_NAME };
        `;

        if (!oldTable.length) {
            await provider.sql`CREATE TABLE ${provider.sql(MigrationRunner.MIGRATION_TABLE_NAME)} (
                id SERIAL PRIMARY KEY,
                module VARCHAR NOT NULL,
                name VARCHAR NOT NULL,
                description VARCHAR,
                batch INT4 NOT NULL,
                timestamp TIMESTAMP NOT NULL,
                hash VARCHAR
            )`;
        }

        provider.status = await MigrationRunner.status(daemon, provider.sql, provider.dirpath);
        return provider;
    }   

    async generate() {
        const modules = Daemon.getModules(this.daemon);

        const migrations: $Migration[] = [];
        
        for (const module of modules) {
            const buckets = Daemon.getModule(this.daemon, module.name).buckets;
            
            for (const bucket in buckets) {
                const schema: $Bucket = buckets[bucket].schema;

                // Avoid external buckets
                if (schema.module !== module.name) continue;
                
                // Avoid non-postgres buckets
                const adapter = buckets[bucket].adapter as PostgresBucketAdapter<any, any>;
                if (!(adapter instanceof PostgresBucketAdapter)) continue;

                const migration = await this.generateForBucket(module.name, bucket, adapter.tableName);
                if (migration) {
                    migrations.push(migration);
                }
            }
        }

        return migrations;
    }

    public async generateForBucket<
        ModuleName extends keyof S['modules']
    >(
        module: ModuleName,
        bucket: keyof S['modules'][ModuleName]['buckets'],
        tableName: string,
    ) {
        const generator = new MigrationGenerator(this.daemon, this.sql, module as string, bucket as string, tableName);
        const migration = await generator.generate();
        const tag = colored(`${module as string}::bucket:${bucket as string}`, 'lightcyan');
        if (!migration) {
            Log.info('migrator' as any, 'bucket', `No migrations for ${tag}.`)
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

}