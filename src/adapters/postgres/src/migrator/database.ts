import postgres from 'postgres'
import { Log } from '~/engine/util/log';


export type TableColumn = {
    column_name: string,
    data_type: string,
    nullable: boolean
    field_exists: boolean
}


export class Database {
    
    static connect(
        config?: postgres.Options<any>
    ) {
        return postgres(config);
    }

    /**
     * Check if the connection to PostgreSQL is working, by performing
     * a SELECT on the pg_database table.
     * @param config 
     */
    static async checkConnection(sql: postgres.Sql<any>) {
        try {
            await sql`SELECT datname FROM pg_database`;
        }
        catch (e: any) {
            return e;
        }
        return true;
    }
    
    /**
     * List all tables of the database.
     * @param config 
     */
    static async listTables(sql: postgres.Sql<any>) {
        const columns = await sql`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema='public'
            AND table_type='BASE TABLE'
        `;

        return columns.map(col => col.table_name);
    }
    
    // /**
    //  * Read schema of a table.
    //  * @param config 
    //  */
    // private async getSchema(sql: postgres.Sql<any>, tableName: string): Promise<TableColumn[] | undefined> {
    //     const columns = await sql`
    //         SELECT column_name, data_type, is_nullable 
    //         FROM information_schema.columns 
    //         WHERE table_name = ${tableName}`;
    //     if (!columns.length) {
    //         return
    //     }
    //     return columns.map(col => ({
    //         ...col,
    //         nullable: col.is_nullable === 'YES',
    //         field_exists: false
    //     }) as TableColumn);
    // }

    /**
     * Connect to PostgreSQL and create a database.
     * 
     * The `if_exists` flag controls what happens if the database already exists
     * - fail: Throw an exception
     * - keep: Do nothing
     * - delete: **DROP DATABASE**
     */
    static async createDatabase(name: string, config?: postgres.Options<any>, $?: {
        default_db?: string,
        if_exists: 'fail' | 'keep' | 'delete'
    }) {
        const sql = postgres(Object.assign({}, config, {
            db: $?.default_db || 'postgres'
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