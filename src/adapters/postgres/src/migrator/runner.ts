import { AnyDaemon , Daemon } from '~/engine/apps/app';
import * as fs from 'fs';
import * as path from 'path';
import postgres from 'postgres';
import { MigrationRow, Migrator, MigratorConfig } from './migrator';
import { createHash } from 'crypto';
import { colored } from '~/engine/util/string';
import { Log } from '~/engine/util/log';
import { Migration } from './migration';
import { NesoiDatetime } from '~/engine/data/datetime';

type MigrationFn = (daemon: Daemon<any, any>, sql: postgres.Sql<any>) => Promise<void>

export class MigrationMethod {
    public description?: string
    public up: MigrationFn
    public down: MigrationFn

    constructor($: {
        description?: string,
        up: MigrationFn,
        down: MigrationFn
    }) {
        this.description = $.description;
        this.up = $.up;
        this.down = $.down;
    }
}

export class MigrationStatus {

    public items: {
        state: 'done' | 'pending' | 'lost'
        id?: number,
        name: string,
        description?: string,
        batch?: number,
        timestamp?: string
        hash: string
        filehash?: string
        method?: MigrationMethod
    }[]

    public nextBatch: number;

    constructor(
        fileMigrations: { name: string, path: string, method: MigrationMethod }[],
        dbMigrations: MigrationRow[]
    ) {
        this.items = dbMigrations.map(migration => ({
            ...migration,
            state: 'lost'
        }))
        fileMigrations.forEach(migration => {
            const file = fs.readFileSync(migration.path).toString();
            const filehash = createHash('md5').update(file).digest('hex');

            const old = this.items.find(item => item.name === migration.name);
            if (old) {
                if (old.filehash === filehash) {
                    old.state = 'done';
                }
            }
            else {
                this.items.push({
                    id: undefined,
                    name: migration.name,
                    description: migration.method.description,
                    batch: undefined,
                    hash:
                    filehash,
                    state: 'pending',
                    method: migration.method
                })
            }
        })

        const lastBatch = Math.max(...this.items.map(item => item.batch || 0), 0);
        this.nextBatch = lastBatch + 1;
    }

    public describe() {
        let str = '';
        str += `◆ ${colored('Migration Status', 'lightblue')}\n`
        this.items.forEach(item => {
            const state = {
                'done': () => colored('done', 'green'),
                'pending': () => colored('pending', 'yellow'),
                'lost': () => colored('lost', 'brown'),
            }[item.state]();
            str += `└ ${item.id || '*'}\t${state}\t${item.name} @ ${item.batch || '...'}\n`;
        })
        return str;
    }
}
export class MigrationRunner {
    
    private migrations: MigrationMethod[] = [];

    private constructor(
        public dirpath: string = './migrations'
    ) {}

    public static async scanFiles(dirpath?: string) {
        dirpath ||= Migrator.dirpath;

        const files: { name: string, path: string }[] = [];
        fs.readdirSync(dirpath, { withFileTypes: true })
            .forEach(node => {
                const nodePath = path.resolve(dirpath, node.name);
                if (!nodePath.endsWith('.ts')) {
                    return;
                }
                files.push({
                    name: node.name,
                    path: nodePath
                });
            });
                    
        const migrations: { name: string, path: string, hash: string, method: MigrationMethod }[] = [];
        for (const file of files) {
            const contents = fs.readFileSync(file.path).toString();
            const hash = contents.match(/\$hash\[(.*)\]/)?.[1];
            if (!hash) {
                Log.error('migrator' as any, 'prepare', `Unable to read hash of migration at ${file.path}`);
                continue;
            }

            const { default: method } = await import(file.path);
            if (method instanceof MigrationMethod) {
                migrations.push({ ...file, hash, method });
            }
        }
        return migrations
    }
    
    public static async scanDb(
        sql: postgres.Sql<any>
    ) {
        const db = await sql<MigrationRow[]>`
            SELECT * FROM ${sql(Migrator.MIGRATION_TABLE_NAME)}
        `;
        return db;
    }

    public static async status(
        sql: postgres.Sql<any>,
        dirpath?: string
    ) {
        const fileMigrations = await MigrationRunner.scanFiles(dirpath);
        const dbMigrations = await MigrationRunner.scanDb(sql);
        return new MigrationStatus(fileMigrations, dbMigrations);
    }

    public static async up(
        daemon: AnyDaemon,
        mode: 'one' | 'batch' = 'one',
        config?: MigratorConfig
    ) {
        const sql = postgres(config?.postgres);
        let status = await MigrationRunner.status(sql, config?.dirpath);
        console.log(status.describe());

        const pending = status.items.filter(item => item.state === 'pending');
        if (!pending.length) {
            Log.info('migrator' as any, 'up', 'No migrations to run.');
            return;
        }
        
        if (mode === 'one') {
            const migration = pending[0];
            await this.migrateUp(daemon, sql, migration, status.nextBatch);
        }
        else {
            for (const migration of pending) {
                await this.migrateUp(daemon, sql, migration, status.nextBatch);
            }
        }

        status = await MigrationRunner.status(sql, config?.dirpath);
        console.log(status.describe());
    }

    public static async oneUp(
        daemon: AnyDaemon,
        migration: Migration,
        config?: MigratorConfig
    ) {
        const sql = postgres(config?.postgres);
        let status = await MigrationRunner.status(sql, config?.dirpath);
        console.log(status.describe());

        const mig: MigrationStatus['items'][number] = {
            ...migration,
            state: 'pending',
            hash: migration.hash(),
            filehash: '',
            method: {
                up: async(_, sql: postgres.Sql<any>) => {
                    await sql.unsafe(migration.sqlUp())
                },
                down: async(_, sql: postgres.Sql<any>) => {
                    await sql.unsafe(migration.sqlDown())
                }
            }
        }
        await this.migrateUp(daemon, sql, mig, status.nextBatch);

        status = await MigrationRunner.status(sql, config?.dirpath);
        console.log(status.describe());
    }

    private static async migrateUp(daemon: AnyDaemon, sql: postgres.Sql<any>, migration: MigrationStatus['items'][number], batch: number) {
        Log.info('migrator' as any, 'up', `Running migration ${colored('▲ UP', 'lightgreen')} ${colored(migration.name, 'lightblue')}`);
        await migration.method!.up(daemon, sql);
        const row = {
            name: migration.name,
            batch,
            timestamp: NesoiDatetime.isoNow(),
            hash: migration.hash,
            filehash: migration.filehash
        } as Record<string, any>
        if (migration.description) {
            row.description = migration.description;
        }
        await sql`
            INSERT INTO ${sql(Migrator.MIGRATION_TABLE_NAME)}
            ${ sql(row) }
        `
    }

}