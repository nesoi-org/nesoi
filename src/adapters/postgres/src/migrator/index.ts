import postgres from 'postgres';
import { AnyTrxNode } from '~/engine/transaction/trx_node';

type MigrationFn = ($: { sql: postgres.Sql<any>, trx: AnyTrxNode }) => Promise<void>

/**
 * An entry on a bucket adapter describing one migration.
 */
export type MigrationRow = {
    id: number,
    module: string,
    name: string,
    description?: string,
    batch: number,
    timestamp: string,
    hash: string
}

/**
 * A file on disk describing one migration.
 */
export type MigrationFile = {
    module: string,
    name: string,
    path: string,
    routine: MigrationRoutine
}

/**
 * A migration routine, composed of up and down methods.
 */
export class MigrationRoutine {
    public hash?: string
    public description?: string
    public up: MigrationFn
    public down: MigrationFn

    constructor($: {
        hash?: string,
        description?: string,
        up: MigrationFn,
        down: MigrationFn
    }) {
        this.hash = $.hash;
        this.description = $.description;
        this.up = $.up;
        this.down = $.down;
    }
}

/**
 * Function used on migration files to declare a routine
 */
export function migration(...$: ConstructorParameters<typeof MigrationRoutine>) {
    return new MigrationRoutine(...$);
}