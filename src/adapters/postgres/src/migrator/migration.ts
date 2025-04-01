import { $Bucket, $Space } from '~/elements'
import postgres from 'postgres'
import { $BucketModelField } from '~/elements/entities/bucket/model/bucket_model.schema';
import { colored } from '~/engine/util/string';
import * as path from 'path';
import * as fs from 'fs';
import { createHash } from 'crypto';
import { NesoiDatetime } from '~/engine/data/datetime';
import { AnyDaemon, Daemon } from '~/engine/daemon';
import { TableColumn } from './database';
import { BucketAdapterConfig } from '~/elements/entities/bucket/adapters/bucket_adapter';

export type MigrationFieldOperation = {
    create: {
        type: string
        nullable?: boolean
        pk?: boolean
        fk?: string
    }
} | {
    alter: {
        name?: string
        type?: string
        nullable?: boolean
        fk?: string
    }
}| {
    drop: {
        cascade?: boolean
    }
};

export class MigrationField {

    constructor(
        public oldColumn: string | undefined,
        public newColumn: string,
        public operation: MigrationFieldOperation,
    ) {}

    public describe() {
        const col_str = colored(this.newColumn, 'lightblue');
        if ('create' in this.operation) {
            const type_str = colored(this.operation.create!.type, 'purple');
            return `Create column ${col_str} as ${type_str}`
        }
        else if ('alter' in this.operation) {
            const op = this.operation.alter!;
            const name_str = op.name ? colored(op.name, 'lightcyan') : undefined;
            const type_str = op.type ? colored(op.type, 'purple') : undefined;
            const null_str = op.nullable ? colored('NOT NULL', 'purple') : undefined;
            const props = 
                (type_str ? `Alter column ${col_str} type to ${type_str};` : '') +
                (null_str ? `Alter column ${col_str} nullable to ${null_str};` : '')
            if (name_str) {
                return `Rename column ${col_str} to ${name_str}.${props}`
            }
            return props;
        }
        else {
            return colored('Unknown', 'lightred');
        }
    }

    public sql() {
        if ('create' in this.operation) {
            return `"${this.newColumn}" ${this.operation.create.type}`
        }
    }
}

export class Migration {
    
    public name;
    private fields: MigrationField[];
    private needsReview: boolean;

    constructor(
        public module: string,
        private type: 'create'|'alter',
        private tableName: string,
        private options: Record<string, MigrationField[]>
    ) {
        this.name = `${NesoiDatetime.now().epoch}_${this.tableName}`;
        this.needsReview = Object.values(options).some(opts => opts.length > 1);
        this.fields = Object.values(options).map(opts => opts[0]);
    }

    public describe() {
        let str = '';
        str += '┌\n';
        str += `│ ${colored('module: ' + this.module, 'darkgray')}\n`;
        str += `│ ${colored(this.name, 'lightcyan')}\n`;
        str += `│ ${this.needsReview
            ? colored('⚠ More than one option for some fields. Requires review.', 'red')
            : colored('✓ Only one option for each field.', 'lightgreen')}\n`;
        str += '└\n\n';
        if (this.type === 'create') {
            str += `◆ Create table ${colored(this.tableName, 'lightblue')}\n`
        }
        else if (this.type === 'alter') {
            str += `◆ Alter table '${this.tableName}'\n`
        }
        this.fields.forEach(field => {
            str += `└ ${field.describe()}\n`;
        })
        str += '\n';
        str += `${colored('▲ UP', 'lightgreen')}:\n`;
        str += this.sqlUp();
        str += '\n';
        str += `${colored('▼ DOWN', 'yellow')}:\n`;
        str += this.sqlDown();
        return str;
    }

    public sqlUp() {
        if (this.type === 'create') {
            return  `CREATE TABLE ${this.tableName} (\n` +
                this.fields.map(field => '\t'+field.sql()).join(',\n')
                + '\n)'
        }
        return ''
    }

    public sqlDown() {
        if (this.type === 'create') {
            return  `DROP TABLE ${this.tableName}`
        }
        return ''
    }

    public save(dirpath: string = './migrations') {
        const filedir = path.join('modules', this.module, dirpath);
        fs.mkdirSync(filedir, {recursive: true});

        const filepath = path.join(filedir, this.name+'.ts');
        const { encoded, hash } = this.encode();
        let str = '';
        str += 'import { Migrator } from \'nesoi/lib/adapters/postgres/src/migrator\';\n'
        str += '\n';
        str += '/**\n';
        str += ` * ${this.name}\n`;
        str += ` * $hash[${hash}]\n`;
        str += ' *\n';
        str += ` * $type[${this.type}]\n`;
        str += ` * $table[${this.tableName}]\n`;
        str += ` * $fields[${encoded}]\n`;
        str += ' */\n';
        str += '\n';
        str += 'export default Migrator.migration({\n'
        str += '\t'+this.fnUp().replace(/\n/g,'\n\t')+',\n';
        str += '\t'+this.fnDown().replace(/\n/g,'\n\t')+'\n';
        str += '})'
        fs.writeFileSync(filepath, str);
    }

    public hash() {
        const { hash } = this.encode();
        return hash;
    }

    /**
     * Generates an encoded version of the migration, which is
     * stored as a comment on the migration file. This can be
     * used to recreate the `Migration` object in memory if needed.
     * > **Attention** This encoded version is NOT used to run the migration.
     * > The SQL is used to run the migration. This can be used
     * > for analysis/display purposes only.
     * > There's no guarantee that this will match the SQL if
     * > the migration file is manually altered. 
     * @returns 
     */
    private encode() {
        const v0 = () => {
            const f_str = this.fields.map(field => {
                const [op_key, op] = Object.entries(field.operation)[0];
                const op_str = `[${op_key};${op.type || ''};${op.nullable?1:0};${op.pk?1:0};${op.fk||''};${op.cascade||''}]`
                return `${field.oldColumn || ''}:${field.newColumn}:${op_str}`
            }).join('\n')
            const encoded = btoa(f_str);
            const hash = createHash('md5').update(encoded).digest('hex');
            return {
                encoded,
                hash: 'v0.' + hash
            }
        }
        return v0();
    }

    private decode() {
        // TODO
    }

    private fnUp() {
        let str = '';
        str += 'up: async (daemon, sql) => {\n';
        str += '\tawait sql`\n';
        str += '\t\t'+this.sqlUp().replace(/\n/g,'\n\t\t')+'\n';
        str += '\t`\n';
        str += '}';
        return str;
    }

    private fnDown() {
        let str = '';
        str += 'down: async (daemon, sql) => {\n';
        str += '\tawait sql`\n';
        str += '\t\t'+this.sqlDown().replace(/\n/g,'\n\t\t')+'\n';
        str += '\t`\n';
        str += '}';
        return str;
    }
}

export class BucketMigrator<
    S extends $Space,
    D extends AnyDaemon,
    ModuleName extends NoInfer<keyof S['modules']>
> {
    
    protected schema: $Bucket;
    protected config?: BucketAdapterConfig;

    constructor(
        private daemon: D,
        private sql: postgres.Sql<any>,
        private module: ModuleName,
        private bucket: NoInfer<keyof S['modules'][ModuleName]['buckets']>,
        private tableName: string
    ) {
        const daemonBucket = Daemon.getModule(daemon, module)
            .buckets[bucket];
        this.schema = daemonBucket.schema;
        this.config = daemonBucket.adapter.config;
    }

    public async generate() {
        const current = await this.getCurrentSchema();
        const options = this.generateFieldOptions(current);
        if (!Object.keys(options).length) {
            return
        }
        const type = current ? 'alter' : 'create';
        return new Migration(this.module as string, type, this.tableName, options);
    }

    private async getCurrentSchema(): Promise<TableColumn[] | undefined> {
        const columns = await this.sql`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = ${this.tableName}`;
        if (!columns.length) {
            return
        }
        return columns.map(col => ({
            ...col,
            nullable: col.is_nullable === 'YES',
            field_exists: false
        }) as TableColumn);
    }

    private generateFieldOptions(current?: TableColumn[]) {
        
        let mappedCurrent: Record<string, TableColumn> | undefined;
        if (current) {
            mappedCurrent = {};
            current.forEach(col => {
                mappedCurrent![col.column_name] = col;
            })
            Object.keys(this.schema.model.fields)
                .forEach(name => {
                    if (mappedCurrent![name]) {
                        mappedCurrent![name].field_exists = true;
                    }
                })
        }

        const fields: Record<string, MigrationField[]> = {};
        Object.entries(this.schema.model.fields)
            .forEach(([name, field]) => {
                const options = this.generateField(name, field, mappedCurrent)  
                if (options.length) {
                    fields[name] = options;
                }
            })

        // Add meta fields when creating table
        if (!current) {
            const created_by = this.config?.meta.created_by || 'created_by';
            fields[created_by] = [
                new MigrationField(undefined, created_by, {
                    create: { type: 'character(64)', nullable: true }
                })
            ]
            const created_at = this.config?.meta.created_at || 'created_at';
            fields[created_at] = [
                new MigrationField(undefined, created_at, {
                    create: { type: 'timestamp without time zone' }
                })
            ]
            const updated_by = this.config?.meta.updated_by || 'updated_by';
            fields[updated_by] = [
                new MigrationField(undefined, updated_by, {
                    create: { type: 'character(64)', nullable: true }
                })
            ]
            const updated_at = this.config?.meta.updated_at || 'updated_at';
            fields[updated_at] = [
                new MigrationField(undefined, updated_at, {
                    create: { type: 'timestamp without time zone' }
                })
            ]
        }

        return fields;
    }

    private generateField(name: string, $: $BucketModelField, columns?: Record<string, TableColumn>) {
        
        const type = this.fieldType($);
        const pk = $.name === 'id';
        const nullable = !$.required

        // Table doesn't exist yet, only option is to create the field
        if (!columns) {
            return [new MigrationField(undefined, $.name, {
                create: { type, pk, nullable }
            })]
        }
        // Table exists, evaluate options
        else {
            // Field exists, alter only what changed
            const column = columns[$.name];
            if (column) {
                if ($.name === 'id') {
                    // Id can't be modified for now.
                    return []
                }
                // TODO: check details such as
                // - changes in decimal precision
                // - changes in maxLength
                // - changes in fk (!!!)
                const _type = type.startsWith(column.data_type) ? undefined : column.data_type;
                const _nullable = column.nullable !== nullable ? column.nullable : undefined;
                if (_type !== undefined || _nullable !== undefined) {
                    return [new MigrationField(undefined, $.name, {
                        alter: { type: _type, nullable: _nullable }
                    })]
                }
                return [];
            }
            // If field doesn't exists in columns, it might:
            //  - be a new field
            //  - be a field of the same type being renamed
            else {
                const options: MigrationField[] = [];

                options.push(new MigrationField(undefined, $.name, {
                    create: { type, pk, nullable }
                }))
                
                const deletedColumnsOfSameType = Object.values(columns)
                    .filter(col => !col.field_exists)
                    .filter(col => type.startsWith(col.data_type));
                if (deletedColumnsOfSameType.length) {
                    // TODO: check details such as
                    // - changes in decimal precision
                    // - changes in maxLength
                    // - changes in fk (!!!)
                    deletedColumnsOfSameType.forEach(col => {
                        const _type = type.startsWith(col.data_type) ? undefined : col.data_type;
                        const _nullable = col.nullable !== nullable ? col.nullable : undefined;
                        if (_type !== undefined || _nullable !== undefined) {
                            options.push(new MigrationField(undefined, $.name, {
                                alter: { name: col.column_name, type: _type, nullable: _nullable }
                            }))
                        }
                    })
                }

                return options;
            }
        }
    }

    private fieldType($: $BucketModelField) {
        if ($.name === 'id') {
            if ($.type === 'string') {
                return 'character(64) PRIMARY KEY'
            }
            return 'serial4 PRIMARY KEY'
        }
        let type = {
            'boolean': () => 'boolean',
            'date': () => 'date',
            'datetime': () => 'timestamp without time zone',
            'decimal': () => 'numeric(18,9)', // TODO: read from schema (not stored yet)
            'dict': () => 'jsonb',
            'enum': () => 'character(64)', // TODO: read from schema maxLength
            'file': () => { throw new Error('A file field shouldn\'t be stored on SQL') },
            'float': () => 'double precision',
            'int': () => 'integer',
            'obj': () => 'jsonb',
            'string': () => 'character varying', // TODO: char() if maxLength
            'unknown': () => { throw new Error('An unknown field shouldn\'t be stored on SQL') },
        }[$.type]();

        if ($.array) {
            type += '[]'
        }

        if ($.required) {
            type += ' NOT NULL'
        }
        return type;
    }

}
