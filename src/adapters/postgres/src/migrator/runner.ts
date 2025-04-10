import * as fs from 'fs';
import * as path from 'path';
import postgres from 'postgres';
import { Migrator } from './migrator';
import { createHash } from 'crypto';
import { colored } from '~/engine/util/string';
import { Log } from '~/engine/util/log';
import { Migration } from './migration';
import { NesoiDatetime } from '~/engine/data/datetime';
import { AnyDaemon, Daemon } from '~/engine/daemon';
import { AnyTrxNode } from '~/engine/transaction/trx_node';
import { Trx } from '~/engine/transaction/trx';

type MigrationFn = ($: { sql: postgres.Sql<any>, trx: AnyTrxNode }) => Promise<void>

export type MigrationRow = {
    id: number,
    module: string,
    name: string,
    description?: string,
    batch: number,
    timestamp: string,
    hash: string,
    filehash: string
}

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
        module: string,
        name: string,
        description?: string,
        batch?: number,
        timestamp?: string
        hash: string
        filehash?: string
        method?: MigrationMethod
    }[]

    public batch: number;

    constructor(
        fileMigrations: { module: string, name: string, hash: string, path: string, method: MigrationMethod }[],
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
                    old.method = migration.method
                }
            }
            else {
                this.items.push({
                    id: undefined,
                    module: migration.module,
                    name: migration.name,
                    description: migration.method.description,
                    batch: undefined,
                    hash: migration.hash,
                    filehash,
                    state: 'pending',
                    method: migration.method
                })
            }
        })

        const lastBatch = Math.max(...this.items.map(item => item.batch || 0), 0);
        this.batch = lastBatch;
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
            const module = colored(item.module, 'lightcyan');
            str += `└ ${item.id || '*'}\t${state}\t${module} ${item.name} @ ${item.batch || '...'}\n`;
        })
        return str;
    }
}
export class MigrationRunner {
    
    private migrations: MigrationMethod[] = [];

    private constructor(
        public dirpath: string = './migrations'
    ) {}

    public static async scanFiles(daemon: AnyDaemon, dirpath: string) {
        const modules = Daemon.getModules(daemon);
        const files: { module: string, name: string, path: string }[] = [];
        for (const module of modules) {
            const modulepath = path.join('modules', module.name, dirpath);
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
                    
        const migrations: { module: string, name: string, path: string, hash: string, method: MigrationMethod }[] = [];
        for (const file of files) {
            const contents = fs.readFileSync(file.path).toString();
            const hash = contents.match(/\$hash\[(.*)\]/)?.[1];
            if (!hash) {
                Log.error('migrator' as any, 'prepare', `Unable to read hash of migration at ${file.path}`);
                continue;
            }

            const { default: method } = await import(file.path);
            if (method instanceof MigrationMethod) {
                const name = file.name.replace('.ts','').replace('.js','');
                migrations.push({ module: file.module, name, path: file.path, hash, method });
            }
        }
        return migrations
    }
    
    public static async scanDb(
        sql: postgres.Sql<any>
    ) {
        const db = await sql<MigrationRow[]>`
            SELECT * FROM ${sql(Migrator.MIGRATION_TABLE_NAME)}
            ORDER BY id
        `;
        return db;
    }

    public static async status(
        daemon: AnyDaemon,
        sql: postgres.Sql<any>,
        dirpath: string
    ) {
        const fileMigrations = await MigrationRunner.scanFiles(daemon, dirpath);
        const dbMigrations = await MigrationRunner.scanDb(sql);
        return new MigrationStatus(fileMigrations, dbMigrations);
    }

    public static async up(
        daemon: AnyDaemon,
        sql: postgres.Sql<any>,
        mode: 'one' | 'batch' = 'one',
        dirpath: string = './migrations'
    ) {
        let status = await MigrationRunner.status(daemon, sql, dirpath);
        console.log(status.describe());

        const pending = status.items.filter(item => item.state === 'pending');
        if (!pending.length) {
            Log.info('migrator' as any, 'up', 'No migrations to run.');
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
        dirpath: string = './migrations'
    ) {
        let status = await MigrationRunner.status(daemon, sql, dirpath);
        console.log(status.describe());

        const lastBatch = status.items.filter(item => item.batch === status.batch);
        if (!lastBatch.length) {
            Log.info('migrator' as any, 'down', 'No migrations to rollback.');
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

    public static async injectUp(
        daemon: AnyDaemon,
        sql: postgres.Sql<any>,
        migration: Migration,
        dirpath: string = './migrations'
    ) {
        let status = await MigrationRunner.status(daemon, sql, dirpath);
        console.log(status.describe());

        const mig: MigrationStatus['items'][number] = {
            ...migration,
            state: 'pending',
            hash: migration.hash(),
            filehash: '',
            method: {
                up: async($: { sql: postgres.Sql<any> }) => {
                    await $.sql.unsafe(migration.sqlUp())
                },
                down: async($: { sql: postgres.Sql<any> }) => {
                    await $.sql.unsafe(migration.sqlDown())
                }
            }
        }
        await sql.begin(async sql => {
            await this.migrateUp(daemon, sql, mig, status.batch + 1);
        })

        status = await MigrationRunner.status(daemon, sql, dirpath);
        console.log(status.describe());
    }

    private static async migrateUp(
        daemon: AnyDaemon,
        sql: postgres.Sql<any>,
        migration: MigrationStatus['items'][number],
        batch: number
    ) {
        Log.info('migrator' as any, 'up', `Running migration ${colored('▲ UP', 'lightgreen')} ${colored(migration.name, 'lightblue')}`);
        const status = await daemon.trx(migration.module)
            .run(async trx => {
                Trx.set(trx, 'sql', sql);
                await migration.method!.up({
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
            batch,
            timestamp: NesoiDatetime.now(),
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

    private static async migrateDown(
        daemon: AnyDaemon,
        sql: postgres.Sql<any>,
        migration: MigrationStatus['items'][number]
    ) {
        Log.info('migrator' as any, 'up', `Running migration ${colored('▼ DOWN', 'yellow')} ${colored(migration.name, 'lightblue')}`);
        const status = await daemon.trx(migration.module)
            .run(async trx => {
                Trx.set(trx, 'sql', sql);
                await migration.method!.down({
                    sql,
                    trx
                });
            });
        if (status.state !== 'ok') {
            throw new Error('Migration failed. Rolling back all batch changes.');
        }
        await sql`
            DELETE FROM ${sql(Migrator.MIGRATION_TABLE_NAME)}
            WHERE id = ${ migration.id! }
        `
    }

}