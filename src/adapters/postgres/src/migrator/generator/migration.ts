import { colored } from '~/engine/util/string';
import * as path from 'path';
import * as fs from 'fs';
import { NesoiDatetime } from '~/engine/data/datetime';
import { createHash } from 'crypto';

export type $MigrationFieldOperation = {
    create: {
        type: string
        nullable?: boolean
        pk?: boolean
    }
} | {
    rename: {
        name: string
    }
} | {
    alter_type: {
        from: string,
        to: string,
        using: {
            up: string,
            down: string
        }
    }
} | {
    alter_null: {
        from: boolean,
        to: boolean
    }
} | {
    drop: {
        type: string
        nullable: boolean
        default?: string
    }
} | {
    create_fk: {
        table: string
        field: string
    }
} | {
    drop_fk: {
        table: string
        field: string
    }
};

export class $MigrationField {

    constructor(
        public column: string,
        public operation: $MigrationFieldOperation,
    ) {}

    public describe() {
        const col_str = colored(this.column, 'lightblue');
        if ('create' in this.operation) {
            const type_str = colored(this.operation.create!.type, 'purple');
            return `Create column ${col_str} as ${type_str}`
        }
        else if ('rename' in this.operation) {
            const op = this.operation.rename!;
            const name_str = op.name ? colored(op.name, 'lightcyan') : undefined;
            return `Rename column ${col_str} to ${name_str}`
        }
        else if ('alter_type' in this.operation) {
            const op = this.operation.alter_type!;
            const from_str = op.from ? colored(op.from, 'purple') : undefined;
            const to_str = op.to ? colored(op.to, 'purple') : undefined;
            return `Alter column ${col_str} type from ${from_str} to ${to_str};`
        }
        else if ('alter_null' in this.operation) {
            const op = this.operation.alter_null!;
            const from_str = colored(op.from ? 'NULL' : 'NOT NULL', 'purple');
            const to_str = colored(op.to ? 'NULL': 'NOT NULL', 'purple');
            return `Alter column ${col_str} from ${from_str} to ${to_str};`
        }
        else if ('drop' in this.operation) {
            return `Drop column ${col_str}`
        }
        else if ('create_fk' in this.operation) {
            const op = this.operation.create_fk!;
            const table_str = colored(op.table, 'lightcyan');
            const field_str = colored(op.field, 'purple');
            return `Create foreign key from ${col_str} to ${table_str}.${field_str}`
        }
        else if ('drop_fk' in this.operation) {
            const op = this.operation.drop_fk!;
            const table_str = colored(op.table, 'lightcyan');
            const field_str = colored(op.field, 'purple');
            return `Drop foreign key from ${col_str} to ${table_str}.${field_str}`
        }
        else {
            return colored(`Unknown: ${this.operation}`, 'lightred');
        }
    }

    public sqlUp(table_op: 'create' | 'alter') {
        if ('create' in this.operation) {
            const notNull = this.operation.create.nullable ? '' : ' NOT NULL';
            if (table_op === 'create') {
                return `"${this.column}" ${this.operation.create.type} ${notNull}`
            }
            else {
                return `ADD "${this.column}" ${this.operation.create.type} ${notNull}`
            }
        }
        else if ('rename' in this.operation) {
            return `RENAME COLUMN "${this.column}" TO "${this.operation.rename.name}"`
        }
        else if ('alter_type' in this.operation) {
            return `ALTER COLUMN "${this.column}" TYPE ${this.operation.alter_type.to} USING ${this.operation.alter_type.using.up}`
        }
        else if ('alter_null' in this.operation) {
            return `ALTER COLUMN "${this.column}" ${this.operation.alter_null.to ? 'DROP' : 'SET'} NOT NULL`
        }
        else if ('drop' in this.operation) {
            return `DROP COLUMN "${this.column}"`
        }
        return ''
    }

    public sqlDown() {
        if ('create' in this.operation) {
            return `DROP COLUMN "${this.column}"`
        }
        else if ('rename' in this.operation) {
            return `RENAME COLUMN "${this.operation.rename.name}" TO "${this.column}"`
        }
        else if ('alter_type' in this.operation) {
            return `ALTER COLUMN "${this.column}" TYPE ${this.operation.alter_type.from} USING ${this.operation.alter_type.using.down}`
        }
        else if ('alter_null' in this.operation) {
            return `ALTER COLUMN "${this.column}" ${this.operation.alter_null.from ? 'DROP' : 'SET'} NOT NULL`
        }
        else if ('drop' in this.operation) {
            const notNull = this.operation.drop.nullable ? '' : ' NOT NULL';
            const defaul = this.operation.drop.default;
            return `ADD COLUMN "${this.column}" ${this.operation.drop.type}${notNull}${defaul ? (' DEFAULT ' + defaul) : ''}`
        }
        return ''
    }
}

export class $Migration {
    
    public name;
    
    constructor(
        public module: string,
        private type: 'create'|'alter'|'custom',
        private tableName: string,
        private fields: $MigrationField[],
        public description?: string
    ) {
        this.name = `${NesoiDatetime.now().epoch}_${this.tableName}`;
    }

    public describe() {
        let str = '';
        str += '┌\n';
        str += `│ ${colored('module: ' + this.module, 'darkgray')}\n`;
        str += `│ ${colored(this.name, 'lightcyan')}\n`;
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
        str += this.sqlUp().join('\n');
        str += '\n';
        str += `${colored('▼ DOWN', 'yellow')}:\n`;
        str += this.sqlDown().join('\n');
        return str;
    }

    public sqlUp() {
        if (this.type === 'create') {
            return  [`CREATE TABLE ${this.tableName} (\n` +
                this.fields.map(field => '\t'+field.sqlUp('create')).join(',\n')
                + '\n)']
        }
        else if (this.type === 'alter') {
            return this.fields.map(field =>
                `ALTER TABLE ${this.tableName} ` + field.sqlUp('alter')
            )
        }
        return []
    }

    public sqlDown() {
        if (this.type === 'create') {
            return [`DROP TABLE ${this.tableName}`]
        }
        else if (this.type === 'alter') {
            return this.fields.map(field =>
                `ALTER TABLE ${this.tableName} ` + field.sqlDown()
            )
        }
        return []
    }

    public save(dirpath: string = './migrations') {
        const filedir = path.join('modules', this.module, dirpath);
        fs.mkdirSync(filedir, {recursive: true});

        const filepath = path.join(filedir, this.name+'.ts');
        let str = '';
        str += 'import { migration } from \'nesoi/lib/adapters/postgres/src/migrator\';\n'
        str += '\n';
        str += '/**\n';
        str += ` * $migration[${this.name}]\n`;
        str += ' *\n';
        str += ` * $type[${this.type}]\n`;
        if (this.type !== 'custom') {
            str += ` * $table[${this.tableName}]\n`;
            str += ' *\n';
            str += ' * Migration auto-generated by @nesoi/postgres. Don\'t modify it manually.\n';
        }
        str += ' */\n';
        str += '\n';
        str += 'export default migration({\n'
        if (this.type !== 'custom')
            str += `\thash: '${this.hash()}',\n`;
        str += `\tdescription: '${this.description || ''}',\n`;
        str += '\tup: '+this.fnUp().replace(/\n/g,'\n\t')+',\n';
        str += '\tdown: '+this.fnDown().replace(/\n/g,'\n\t')+'\n';
        str += '})'
        fs.writeFileSync(filepath, str);

        return filepath;
    }

    private fnUp() {
        let str = '';
        str += 'async ({ sql }) => {\n';
        this.sqlUp().forEach(sql => {
            str += '\tawait sql`\n';
            str += '\t\t'+sql.replace(/\n/g,'\n\t\t')+'\n';
            str += '\t`\n';
        })
        str += '}';
        return str;
    }

    private fnDown() {
        let str = '';
        str += 'async ({ sql }) => {\n';
        this.sqlDown().forEach(sql => {
            str += '\tawait sql`\n';
            str += '\t\t'+sql.replace(/\n/g,'\n\t\t')+'\n';
            str += '\t`\n';
        })
        str += '}';
        return str;
    }

    public hash() {
        const hash = createHash('md5')
        const up = this.fnUp().replace(/\s*/g,'');
        hash.update(up);
        const down = this.fnDown().replace(/\s*/g,'');
        hash.update(down);
        return hash.digest('hex');
    }

    public static empty(module: string, name: string) {
        return new $Migration(module,'custom',name,[]);
    }
}
