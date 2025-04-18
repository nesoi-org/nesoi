import { CLIAdapter, CLICommand } from '~/engine/cli/cli_adapter';
import { Database } from './migrator/database';
import { PostgresProvider } from './postgres.provider';
import UI from '~/engine/cli/ui';
import { Migrator } from './migrator';
import { AnyDaemon, Daemon } from '~/engine/daemon';
import { MigrationRunner } from './migrator/runner';
import { PostgresBucketAdapter } from './postgres.bucket_adapter';
import { CSV } from './migrator/csv';

export class cmd_check extends CLICommand {
    constructor(
        public provider: PostgresProvider
    ) {
        super(
            'any',
            'check',
            'check',
            'Check if the connection to PostgreSQL is working properly'
        )
    }
    async run(daemon: AnyDaemon) {
        const res = await Database.checkConnection(this.provider.sql);
        if (res == true)
            UI.result('ok', 'Connection to PostgreSQL working.')
        else
            UI.result('error', 'Connection to PostgreSQL not working.', res)
        await Migrator.prepare(daemon, this.provider.sql)
    }
}

export class cmd_tables extends CLICommand {
    constructor(
        public provider: PostgresProvider
    ) {
        super(
            'any',
            'tables',
            'tables',
            'List the tables present on the database'
        )
    }
    async run() {
        const res = await Database.listTables(this.provider.sql);
        UI.list(res);
    }
}

export class cmd_create_db extends CLICommand {
    constructor(
        public provider: PostgresProvider
    ) {
        super(
            'any',
            'create db',
            'create db( NAME)',
            'Create the database used by the application',
            /(\w*)/,
            ['name']
        )
    }
    async run(daemon: AnyDaemon, $: { name: string }) {
        let name = $.name;
        const config = this.provider.config?.connection;
        if (!name) {
            if (!config?.db) {
                UI.result('error', 'Database name not configured on PostgresConfig used', config);
                return;
            }
            name = config.db;
        }
        try {
            await Database.createDatabase(name, config);
            UI.result('ok', `Database ${name} created`);
        }
        catch (e) {
            UI.result('error', `Failed to create database ${name}`, e);
        }
        await Migrator.prepare(daemon, this.provider.sql)
    }
}

export class cmd_status extends CLICommand {
    constructor(
        public provider: PostgresProvider
    ) {
        super(
            'any',
            'status',
            'status',
            'Show the status of migrations on the current database'
        )
    }
    async run(daemon: AnyDaemon) {
        const migrator = await Migrator.prepare(daemon, this.provider.sql)
        console.log(migrator.status.describe());
    }
}

export class cmd_make_migrations extends CLICommand {
    constructor(
        public provider: PostgresProvider
    ) {
        super(
            'any',
            'make migrations',
            'make migrations( TAG)',
            'Generate migrations for the bucket(s) using PostgresBucketAdapter',
            /(\w*)/,
            ['tag']
        )
    }
    async run(daemon: AnyDaemon, $: { tag: string }) {

        // TODO: restrict by tag

        const migrator = await Migrator.prepare(daemon, this.provider.sql)
        const migrations = await migrator.generate();
        for (const migration of migrations) {
            console.log(migration.describe());
            migration.save();
        }
    }
}

export class cmd_migrate_up extends CLICommand {
    constructor(
        public provider: PostgresProvider
    ) {
        super(
            'any',
            'migrate up',
            'migrate up',
            'Run ALL the pending migrations up (batch)'
        )
    }
    async run(daemon: AnyDaemon) {
        await MigrationRunner.up(daemon, this.provider.sql, 'batch');        
    }
}

export class cmd_migrate_one_up extends CLICommand {
    constructor(
        public provider: PostgresProvider
    ) {
        super(
            'any',
            'migrate one up',
            'migrate one up',
            'Run ONE pending migration up'
        )
    }
    async run(daemon: AnyDaemon) {
        await MigrationRunner.up(daemon, this.provider.sql, 'one');        
    }
}

export class cmd_migrate_down extends CLICommand {
    constructor(
        public provider: PostgresProvider
    ) {
        super(
            'any',
            'migrate down',
            'migrate down',
            'Rollback the last batch of migrations'
        )
    }
    async run(daemon: AnyDaemon) {
        await MigrationRunner.down(daemon, this.provider.sql, 'batch');        
    }
}

export class cmd_migrate_one_down extends CLICommand {
    constructor(
        public provider: PostgresProvider
    ) {
        super(
            'any',
            'migrate one down',
            'migrate one down',
            'Rollback the last migration'
        )
    }
    async run(daemon: AnyDaemon) {
        await MigrationRunner.down(daemon, this.provider.sql, 'one');        
    }
}

export class cmd_query extends CLICommand {
    constructor(
        public provider: PostgresProvider
    ) {
        super(
            'any',
            'query',
            'query',
            'Run a SQL query on the database server'
        )
    }
    async run() {
        const query = await UI.question('SQL');
        const res = await this.provider.sql.unsafe(query);
        console.log(res);
    }
}

export class cmd_import_csv extends CLICommand {
    constructor(
        public provider: PostgresProvider
    ) {
        super(
            'any',
            'import csv',
            'import csv PATH',
            'Run a SQL query on the database server',
            /(.+)/,
            ['path']
        )
    }
    async run(daemon: AnyDaemon, input: Record<string, any>) {

        const buckets = Daemon.getModules(daemon)
            .map(module =>
                Object.values(module.buckets)
                    .filter(bucket => bucket.adapter instanceof PostgresBucketAdapter)
                    .map(bucket => ({
                        name: `${module.name}::${bucket.schema.name}`,
                        tableName: (bucket.adapter as PostgresBucketAdapter<any, any>).tableName
                    }))
            )
            .flat(1);

        const bucket = await UI.select('Bucket', buckets, b => b.name);
        await CSV.import(this.provider.sql, bucket.tableName, input.path);
    }
}

export class PostgresCLI extends CLIAdapter {

    constructor(
        public provider: PostgresProvider,
    ) {
        super();

        this.commands = {
            'check': new cmd_check(provider),
            'tables': new cmd_tables(provider),
            'create db': new cmd_create_db(provider),
            'status': new cmd_status(provider),
            'make migrations': new cmd_make_migrations(provider),
            'migrate up': new cmd_migrate_up(provider),
            'migrate one up': new cmd_migrate_one_up(provider),
            'migrate down': new cmd_migrate_down(provider),
            'migrate one down': new cmd_migrate_one_down(provider),
            'query': new cmd_query(provider),
            'import csv': new cmd_import_csv(provider),
        }
    }
}
