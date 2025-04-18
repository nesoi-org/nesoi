import { $Bucket, $Space } from '~/elements'
import postgres from 'postgres'
import { $BucketModelField } from '~/elements/entities/bucket/model/bucket_model.schema';
import { AnyDaemon, Daemon } from '~/engine/daemon';
import { TableColumn } from './database';
import { BucketAdapterConfig } from '~/elements/entities/bucket/adapters/bucket_adapter';
import { Migration, MigrationField } from './migration';

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
            'file': () => 'jsonb',
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
