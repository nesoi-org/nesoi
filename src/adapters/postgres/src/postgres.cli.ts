import { CLIAdapter, CLICommand } from '~/engine/cli/cli_adapter';
import { Database } from './migrator/database';
import { PostgresService } from './postgres.service';
import { MigrationProvider } from './migrator/generator/provider';
import UI from '~/engine/cli/ui';
import { AnyDaemon, Daemon } from '~/engine/daemon';
import { PostgresBucketAdapter } from './postgres.bucket_adapter';
import { CSV } from './migrator/csv';
import { MigrationRunner } from './migrator/runner/runner';
import { $Migration } from './migrator/generator/migration';
import { CLI } from '~/engine/cli/cli';

export class cmd_check extends CLICommand {
    constructor(
        public service: PostgresService
    ) {
        super(
            'any',
            'check',
            'check',
            'Check if the connection to PostgreSQL is working properly'
        )
    }
    async run(daemon: AnyDaemon) {
        const res = await Database.checkConnection(this.service.sql);
        if (res == true)
            UI.result('ok', 'Connection to PostgreSQL working.')
        else
            UI.result('error', 'Connection to PostgreSQL not working.', res)
        await MigrationProvider.create(daemon, this.service.sql)
    }
}

export class cmd_tables extends CLICommand {
    constructor(
        public service: PostgresService
    ) {
        super(
            'any',
            'tables',
            'tables',
            'List the tables present on the database'
        )
    }
    async run() {
        const res = await Database.listTables(this.service.sql);
        UI.list(res);
    }
}

export class cmd_create_db extends CLICommand {
    constructor(
        public service: PostgresService
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
        const config = this.service.config?.connection;
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
        await MigrationProvider.create(daemon, this.service.sql)
    }
}

export class cmd_status extends CLICommand {
    constructor(
        public service: PostgresService
    ) {
        super(
            'any',
            'status',
            'status',
            'Show the status of migrations on the current database'
        )
    }
    async run(daemon: AnyDaemon) {
        const migrator = await MigrationProvider.create(daemon, this.service.sql)
        console.log(migrator.status.describe());
    }
}

export class cmd_make_empty_migration extends CLICommand {
    constructor(
        public cli: CLI,
        public service: PostgresService
    ) {
        super(
            'any',
            'make empty migration',
            'make empty migration( NAME)',
            'Generate an empty migration to be filled by the user',
            /(\w*)/,
            ['name']
        )
    }
    async run(daemon: AnyDaemon, $: { name?: string }) {
        const module = await UI.select('Pick a module to create the migration into:', Daemon.getModules(daemon).map(m => m.name));
        const name = $.name || await UI.question('Migration name');
        const migration = $Migration.empty(module.value, name);
        const filepath = migration.save();
        this.cli.openEditor(filepath);
    }
}

export class cmd_make_migrations extends CLICommand {
    constructor(
        public service: PostgresService
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
        console.clear();
        // TODO: restrict by tag

        const migrator = await MigrationProvider.create(daemon, this.service.sql)
        const migrations = await migrator.generate();
        
        for (const migration of migrations) {
            migration.save();
        }
        
        await MigrationRunner.up(daemon, this.service.sql, 'batch');
    }
}

export class cmd_migrate_up extends CLICommand {
    constructor(
        public service: PostgresService
    ) {
        super(
            'any',
            'migrate up',
            'migrate up',
            'Run ALL the pending migrations up (batch)'
        )
    }
    async run(daemon: AnyDaemon) {
        console.clear();
        await MigrationRunner.up(daemon, this.service.sql, 'batch');        
    }
}

export class cmd_migrate_one_up extends CLICommand {
    constructor(
        public service: PostgresService
    ) {
        super(
            'any',
            'migrate one up',
            'migrate one up',
            'Run ONE pending migration up'
        )
    }
    async run(daemon: AnyDaemon) {
        console.clear();
        await MigrationRunner.up(daemon, this.service.sql, 'one');        
    }
}

export class cmd_migrate_down extends CLICommand {
    constructor(
        public service: PostgresService
    ) {
        super(
            'any',
            'migrate down',
            'migrate down',
            'Rollback the last batch of migrations'
        )
    }
    async run(daemon: AnyDaemon) {
        console.clear();
        await MigrationRunner.down(daemon, this.service.sql, 'batch');        
    }
}

export class cmd_migrate_one_down extends CLICommand {
    constructor(
        public service: PostgresService
    ) {
        super(
            'any',
            'migrate one down',
            'migrate one down',
            'Rollback the last migration'
        )
    }
    async run(daemon: AnyDaemon) {
        console.clear();
        await MigrationRunner.down(daemon, this.service.sql, 'one');        
    }
}

export class cmd_query extends CLICommand {
    constructor(
        public service: PostgresService
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
        const res = await this.service.sql.unsafe(query);
        console.log(res);
    }
}

export class cmd_import_csv extends CLICommand {
    constructor(
        public service: PostgresService
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
        await CSV.import(this.service.sql, bucket.value.tableName, input.path);
    }
}

export class PostgresCLI extends CLIAdapter {

    constructor(
        public cli: CLI,
        public service: PostgresService,
    ) {
        super(cli);

        this.commands = {
            'check': new cmd_check(service),
            'tables': new cmd_tables(service),
            'create db': new cmd_create_db(service),
            'status': new cmd_status(service),
            'make migrations': new cmd_make_migrations(service),
            'make empty migration': new cmd_make_empty_migration(cli, service),
            'migrate up': new cmd_migrate_up(service),
            'migrate one up': new cmd_migrate_one_up(service),
            'migrate down': new cmd_migrate_down(service),
            'migrate one down': new cmd_migrate_one_down(service),
            'query': new cmd_query(service),
            'import csv': new cmd_import_csv(service),
        }
    }
}
