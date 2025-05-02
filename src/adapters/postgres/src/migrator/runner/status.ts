import { colored } from '~/engine/util/string';
import { MigrationFile, MigrationRoutine, MigrationRow } from '..';

export class MigrationRunnerStatus {

    public items: {
        state: 'done' | 'pending' | 'lost' | 'modified'
        id?: number,
        module: string,
        name: string,
        description?: string,
        batch?: number,
        timestamp?: string
        hash?: string
        routine?: MigrationRoutine
    }[]

    public batch: number;

    constructor(
        migrationFiles: MigrationFile[],
        migrationRows: MigrationRow[]
    ) {
        this.items = migrationRows.map(migration => ({
            ...migration,
            state: 'lost'
        }))

        migrationFiles.forEach(migration => {
            const hash = migration.routine.hash;

            const old = this.items.find(item => item.name === migration.name);
            if (old) {
                if (!old.hash || old.hash === hash) {
                    old.state = 'done';
                }
                else {
                    old.state = 'modified';
                }
                old.routine = migration.routine
            }
            else {
                this.items.push({
                    id: undefined,
                    module: migration.module,
                    name: migration.name,
                    description: migration.routine.description,
                    batch: undefined,
                    hash,
                    state: 'pending',
                    routine: migration.routine
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
                'lost': () => colored('lost', 'red'),
                'modified': () => colored('modified', 'brown'),
            }[item.state]();
            const module = colored(item.module, 'lightcyan');
            str += `└ ${item.id || '*'}\t${state}\t${module} ${item.name} @ ${item.batch || '...'}\n`;
        })
        return str;
    }
}