import { $Bucket, $Space } from '~/elements'
import postgres from 'postgres'
import { $BucketModelField } from '~/elements/entities/bucket/model/bucket_model.schema';
import { AnyDaemon, Daemon } from '~/engine/daemon';
import { BucketAdapterConfig } from '~/elements/entities/bucket/adapters/bucket_adapter';
import { TableColumn } from '../database';
import { $Migration, $MigrationField } from './migration';
import { colored } from '~/engine/util/string';
import UI from '~/engine/cli/ui';
import { Log } from '~/engine/util/log';

class MigrationOption {
    public selected = false;
    public excluded_by: MigrationOption[] = [];
    constructor(
        public schema: $MigrationField
    ) {}
}

type MigrationStep = {
    options: MigrationOption[]
}

export class MigrationGenerator<
    S extends $Space,
    D extends AnyDaemon,
    ModuleName extends NoInfer<keyof S['modules']>
> {
    
    protected schema: $Bucket;
    protected config?: BucketAdapterConfig;

    constructor(
        daemon: D,
        private sql: postgres.Sql<any>,
        private module: ModuleName,
        bucketName: NoInfer<keyof S['modules'][ModuleName]['buckets']>,
        private tableName: string
    ) {
        const bucket = Daemon.getModule(daemon, module).buckets[bucketName];
        this.schema = bucket.schema;
        this.config = bucket.adapter.config;
    }

    public async generate() {
        const current = await this.getCurrentSchema();
        const drops = current ? this.generateDrops(current.columns) : {};
        const steps = this.generateSteps(current?.mapped, drops);
        steps.push(...Object.values(drops).map(d => ({
            options: [d]
        })));
        if (!steps.length) {
            return
        }
        const type = current ? 'alter' : 'create';

        const migration = await this.manualReview(type, steps);
        return migration
    }

    private async getCurrentSchema() {
        const rawColumns = await this.sql`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = ${this.tableName}`;
        if (!rawColumns.length) {
            return
        }
        
        const columns = rawColumns.map(col => ({
            ...col,
            nullable: col.is_nullable === 'YES',
            field_exists: false
        }) as TableColumn);

        // Map current columns by name, and flag if they already exist
        const mapped: Record<string, TableColumn> = {};
        columns.forEach(col => {
            mapped![col.column_name] = col;

            const created_by = this.config?.meta.created_by || 'created_by';
            const created_at = this.config?.meta.created_at || 'created_at';
            const updated_by = this.config?.meta.updated_by || 'updated_by';
            const updated_at = this.config?.meta.updated_at || 'updated_at';
            if (col.column_name === created_by
                || col.column_name === created_at
                || col.column_name === updated_by
                || col.column_name === updated_at)
            {
                mapped![col.column_name].field_exists = true;
            }
        })
        Object.keys(this.schema.model.fields)
            .forEach(name => {
                if (mapped![name]) {
                    mapped![name].field_exists = true;
                }
            })

        return { columns, mapped }
    }

    private generateDrops(columns: TableColumn[]) {
        const drops: Record<string, MigrationOption> = {};
        for (const col of columns) {
            if (col.field_exists) continue;
            drops[col.column_name] = new MigrationOption(new $MigrationField(col.column_name, {
                drop: {
                    type: col.data_type,
                    nullable: col.nullable
                }
            }))
        }
        return drops;
    }

    private generateSteps(current?: Record<string, TableColumn>, drops: Record<string, MigrationOption> = {}): MigrationStep[] {
        
        const steps: MigrationStep[] = [];

        // Generate migration step for each field
        Object.values(this.schema.model.fields)
            .forEach(field => {
                const fieldSteps = this.generateFieldSteps(field, current, drops)  
                if (fieldSteps.length) {
                    steps.push(...fieldSteps);
                }
            })        

        // Add meta fields when creating table
        if (!current) {
            const created_by = this.config?.meta.created_by || 'created_by';
            const created_at = this.config?.meta.created_at || 'created_at';
            const updated_by = this.config?.meta.updated_by || 'updated_by';
            const updated_at = this.config?.meta.updated_at || 'updated_at';
            steps.push({ options: [new MigrationOption(new $MigrationField(created_by, {
                create: { type: 'character(64)', nullable: true }
            }))]})
            steps.push({ options: [new MigrationOption(new $MigrationField(created_at, {
                create: { type: 'timestamp without time zone' }
            }))]})
            steps.push({ options: [new MigrationOption(new $MigrationField(updated_by, {
                create: { type: 'character(64)', nullable: true }
            }))]})
            steps.push({ options: [new MigrationOption(new $MigrationField(updated_at, {
                create: { type: 'timestamp without time zone' }
            }))]})
        }

        return steps;
    }

    private generateFieldSteps($: $BucketModelField, current?: Record<string, TableColumn>, drops: Record<string, MigrationOption> = {}): MigrationStep[] {
        
        const type = this.fieldType($);
        const pk = $.name === 'id';
        const nullable = !$.required

        // Table doesn't exist yet, only option is to create the field
        if (!current) {
            const options = [
                new MigrationOption(new $MigrationField($.name, {
                    create: { type, pk, nullable }
                }))
            ];
            return [{ options }]
        }
        // Table exists, evaluate options
        else {
            const col = current[$.name];
            // Field exists in columns, alter only what changed
            if (col) {
                if ($.name === 'id') {
                    // Id can't be modified for now.
                    return []
                }
                // TODO: check details such as
                // - changes in decimal precision
                // - changes in maxLength
                const typeChanged = !type.startsWith(col.data_type);
                const nullableChanged = col.nullable !== nullable;
                const steps: MigrationStep[] = [];
                if (typeChanged) {
                    const options = [
                        new MigrationOption(new $MigrationField($.name, {
                            alter_type: { from: col.data_type, to: type, using: {} as any }
                        }))
                    ];
                    steps.push({ options });
                }
                if (nullableChanged) {
                    const options = [
                        new MigrationOption(new $MigrationField($.name, {
                            alter_null: { from: col.nullable, to: nullable }
                        }))
                    ];
                    steps.push({ options });
                }
                return steps;
            }
            // Field doesn't exists in columns, it might:
            //  - 1: be a new field
            //  - 2: be a field of the same type being renamed
            else {
                const options: MigrationOption[] = [];

                // Option 1
                const createOption = new MigrationOption(new $MigrationField($.name, {
                    create: { type, pk, nullable }
                }));
                options.push(createOption)
                
                const deletedColumnsOfSameType = Object.values(current)
                    .filter(col => !col.field_exists)
                    .filter(col => type.startsWith(col.data_type));
                if (deletedColumnsOfSameType.length) {
                    // TODO: check details such as
                    // - changes in decimal precision
                    // - changes in maxLength
                    deletedColumnsOfSameType.forEach(col => {
                        // Option 2
                        const renameOption = new MigrationOption(new $MigrationField(col.column_name, {
                            rename: { name: $.name }
                        }))
                        options.push(renameOption);

                        // If this option is picked, the drop option for this column is no longer valid
                        drops[col.column_name].excluded_by.push(renameOption);
                    })
                }

                return [{ options }];
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
            'decimal': () => `numeric(${(($.meta!.decimal!.left || 9) + ($.meta!.decimal!.right || 9))},${$.meta!.decimal!.right || 9})`,
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

        return type;
    }

    private async manualReview(type: 'alter'|'create', steps: MigrationStep[]) {

        let header_shown = false;
        const header = () => {
            if (header_shown) return;
            let str = '';
            str += '┌\n';
            str += `│ module: ${colored((this.module as string), 'cyan')}\n`;
            str += `│ table: ${colored(this.tableName, 'lightcyan')}\n`;
            str += `│ ${colored('⚠ Requires manual review.', 'red')}\n`;
            str += '└\n\n';
            console.clear();
            console.log(str);
            header_shown = true;
        }

        const fields: $MigrationField[] = [];

        for (const step of steps) {
            const stepFields = step.options.filter(field => {
                if (field.excluded_by.length === 0) return true;
                return !field.excluded_by.some(field => field.selected);
            })

            let schema;
            if (stepFields.length === 0) {
                continue
            }
            else if (stepFields.length === 1) {
                schema = stepFields[0].schema;
            }
            else {
                header();

                const opt = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                const selected = await UI.select('Pick one of the options below:\n', stepFields.map((s,i) =>
                    `${colored(opt[i], 'lightcyan')} ${stepFields[i].schema.describe()}`
                ))
                console.log();

                stepFields[selected.i].selected = true;
                schema = stepFields[selected.i].schema;
            }

            if ('drop' in schema.operation && !schema.operation.drop.nullable) {
                header();
                const defaul = await UI.question(`Column '${schema.column}' is NOT NULL and is being deleted. What should be the default value on rollback?\n`)
                schema.operation.drop.default = defaul;
            }

            if ('alter_type' in schema.operation) {
                header();
                const from = colored(schema.operation.alter_type.from, 'lightcyan');
                const to = colored(schema.operation.alter_type.to, 'lightcyan');
                const up = colored('▲ UP', 'lightgreen')
                const down = colored('▼ DOWN', 'yellow')

                const defaultUp = `${schema.column}::${schema.operation.alter_type.to}`
                const defaultDown = `${schema.column}::${schema.operation.alter_type.from}`

                const usingUp = await UI.question(`Column '${schema.column}' is changing from ${from} to ${to}. Write a cast expression for the ${up} migration.\n`, defaultUp);
                const usingDown = await UI.question(`Column '${schema.column}' is changing from ${from} to ${to}. Write a cast expression for the ${down} migration.\n`, defaultDown);
                schema.operation.alter_type.using.up = usingUp;
                schema.operation.alter_type.using.down = usingDown;
            }

            fields.push(schema);
        }

        const migration = new $Migration(this.module as string, type, this.tableName, fields);

        console.clear();
        console.log(migration.describe());
        const proceed = await UI.yesOrNo('Is everything OK with the migration above?');
        if (!proceed) {
            Log.warn('migrator' as any, 'generator', 'Migration rejected by manual review.');
            return
        }

        return migration;
    }

}
