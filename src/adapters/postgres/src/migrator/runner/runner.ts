import * as fs from 'fs';
import * as path from 'path';
import postgres from 'postgres';
import { colored } from '~/engine/util/string';
import { Log } from '~/engine/util/log';
import { NesoiDatetime } from '~/engine/data/datetime';
import { AnyDaemon, Daemon } from '~/engine/daemon';
import { Trx } from '~/engine/transaction/trx';
import { MigrationRunnerStatus } from './status';
import { MigrationFile, MigrationRoutine, MigrationRow } from '..';
import UI from '~/engine/cli/ui';
import { $Migration } from '../generator/migration';

export class MigrationRunner {

    public static MIGRATION_TABLE_NAME = '__nesoi_migrations';
    
    // Scan (to generate status)

    private static async scanFiles(daemon: AnyDaemon, migrations_dir: string) {

        const modules = Daemon.getModules(daemon);
        
        // Read migration files of each module
        const files: Omit<MigrationFile, 'routine'>[] = [];
        for (const module of modules) {
            const modulepath = path.join('modules', module.name, migrations_dir);
            
            if (!fs.existsSync(modulepath)) continue;
            fs.readdirSync(modulepath, { withFileTypes: true })
                .forEach(node => {
                    const nodePath = path.resolve(modulepath, node.name);
                    if (nodePath.endsWith('.d.ts')) {
                        return;
                    }
                    files.push({
                        module: module.name,
                        name: node.name,
                        path: nodePath
                    });
                });
        }

        // Extract migration routine of each file

        const migrationFiles: MigrationFile[] = [];
        for (const file of files) {
            const { default: routine } = await import(file.path);
            if (routine instanceof MigrationRoutine) {
                const name = file.name.replace(/'.[t|j]s'/,'');
                migrationFiles.push({
                    ...file,
                    name,
                    routine
                });
            }
            else {
                Log.warn('migrator' as any, 'scan', `File at ${file.path} doesn't appear to be a migration. Skipping it.`);
            }
        }
        return migrationFiles
    }
    
    private static async scanRows(
        sql: postgres.Sql<any>
    ) {
        const db = await sql<MigrationRow[]>`
            SELECT * FROM ${sql(MigrationRunner.MIGRATION_TABLE_NAME)}
            ORDER BY id
        `;
        return db;
    }

    public static async status(
        daemon: AnyDaemon,
        sql: postgres.Sql<any>,
        migrations_dir: string
    ) {
        const migrationFiles = await MigrationRunner.scanFiles(daemon, migrations_dir);
        const migrationRows = await MigrationRunner.scanRows(sql);
        return new MigrationRunnerStatus(migrationFiles, migrationRows);
    }

    // Public Up / Down

    public static async up(
        daemon: AnyDaemon,
        sql: postgres.Sql<any>,
        mode: 'one' | 'batch' = 'one',
        dirpath: string = 'migrations'
    ) {
        let status = await MigrationRunner.status(daemon, sql, dirpath);
        console.log(status.describe());

        const pending = status.items.filter(item => item.state === 'pending');
        if (!pending.length) {
            Log.info('migrator' as any, 'up', 'No migrations to run.');
            return;
        }

        const n = (mode === 'one' ? 1 : pending.length).toString();
        const confirm = await UI.yesOrNo(`Run ${colored(n, 'green')} migration(s) ${colored('▲ UP', 'lightgreen')}?`);
        if (!confirm) {
            return;
        }
        
        await sql.begin(async sql => {
            if (mode === 'one') {
                const migration = pending[0];
                await this.migrateUp(daemon, sql, migration, status.batch + 1);
            }
            else {
                for (const migration of pending) {
                    await this.migrateUp(daemon, sql, migration, status.batch + 1);
                }
            }
        })

        status = await MigrationRunner.status(daemon, sql, dirpath);
        console.log(status.describe());
    }

    public static async down(
        daemon: AnyDaemon,
        sql: postgres.Sql<any>,
        mode: 'one' | 'batch' = 'one',
        dirpath: string = 'migrations'
    ) {
        let status = await MigrationRunner.status(daemon, sql, dirpath);
        console.log(status.describe());

        const lastBatch = status.items.filter(item => item.batch === status.batch);
        if (!lastBatch.length) {
            Log.info('migrator' as any, 'down', 'No migrations to rollback.');
            return;
        }

        const n = mode === 'one' ? 'one' : 'last batch of';
        const confirm = await UI.yesOrNo(`Rollback ${colored(n, 'green')} migration(s) ${colored('▼ DOWN', 'red')}?`);
        if (!confirm) {
            return;
        }
        
        await sql.begin(async sql => {
            if (mode === 'one') {
                const migration = lastBatch.at(-1)!;
                await this.migrateDown(daemon, sql, migration);
            }
            else {
                for (const migration of lastBatch) {
                    await this.migrateDown(daemon, sql, migration);
                }
            }
        })

        status = await MigrationRunner.status(daemon, sql, dirpath);
        console.log(status.describe());
    }

    public static fromSchema = {

        up: async (
            daemon: AnyDaemon,
            sql: postgres.Sql<any>,
            migration: $Migration,
            dirpath: string = 'migrations'
        ) => {
            let status = await MigrationRunner.status(daemon, sql, dirpath);
            console.log(status.describe());
    
            const routine = new MigrationRoutine({
                description: migration.description,
                up: async($: { sql: postgres.Sql<any> }) => {
                    for (const sql of migration.sqlUp()) {
                        await $.sql.unsafe(sql);
                    }
                },
                down: async($: { sql: postgres.Sql<any> }) => {
                    for (const sql of migration.sqlDown()) {
                        await $.sql.unsafe(sql);
                    }
                }
            })
    
            const mig: MigrationRunnerStatus['items'][number] = {
                ...migration,
                state: 'pending',
                hash: routine.hash,
                routine
            }
            await sql.begin(async sql => {
                await this.migrateUp(daemon, sql, mig, status.batch + 1);
            })
    
            status = await MigrationRunner.status(daemon, sql, dirpath);
            console.log(status.describe());
        }

    }

    // Implementation Up/Down

    private static async migrateUp(
        daemon: AnyDaemon,
        sql: postgres.Sql<any>,
        migration: MigrationRunnerStatus['items'][number],
        batch: number
    ) {
        Log.info('migrator' as any, 'up', `Running migration ${colored('▲ UP', 'lightgreen')} ${colored(migration.name, 'lightblue')}`);
        const status = await daemon.trx(migration.module)
            .run(async trx => {
                Trx.set(trx, 'sql', sql);
                await migration.routine!.up({
                    sql,
                    trx
                });
            });
        if (status.state !== 'ok') {
            throw new Error('Migration failed. Rolling back all batch changes.');
        }
        const row = {
            module: migration.module,
            name: migration.name,
            description: migration.routine!.description,
            batch,
            timestamp: NesoiDatetime.now(),
            hash: migration.hash || null
        } as Record<string, any>
        if (migration.description) {
            row.description = migration.description;
        }
        await sql`
            INSERT INTO ${sql(MigrationRunner.MIGRATION_TABLE_NAME)}
            ${ sql(row) }
        `
    }

    private static async migrateDown(
        daemon: AnyDaemon,
        sql: postgres.Sql<any>,
        migration: MigrationRunnerStatus['items'][number]
    ) {
        const name = colored(migration.name, 'lightblue');
        Log.info('migrator' as any, 'up', `Running migration ${colored('▼ DOWN', 'yellow')} ${name}`);

        if (migration.state === 'lost') {
            const del = await UI.yesOrNo(`The migration ${name} is ${colored('lost', 'red')}, skip and delete it? ${colored('Warning: this might cause inconsistencies', 'red')}.`);
            if (!del) {
                throw new Error(`Migration ${migration.name} was lost, unable to migrate down.`);
            }
        }
        else {
            const status = await daemon.trx(migration.module)
                .run(async trx => {
                    Trx.set(trx, 'sql', sql);
                    await migration.routine!.down({
                        sql,
                        trx
                    });
                });
            if (status.state !== 'ok') {
                throw new Error('Migration failed. Rolling back all batch changes.');
            }
        }

        await sql`
            DELETE FROM ${sql(MigrationRunner.MIGRATION_TABLE_NAME)}
            WHERE id = ${ migration.id! }
        `
    }

}