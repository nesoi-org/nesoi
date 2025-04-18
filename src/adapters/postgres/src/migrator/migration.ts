import { colored } from '~/engine/util/string';
import * as path from 'path';
import * as fs from 'fs';
import { createHash } from 'crypto';
import { NesoiDatetime } from '~/engine/data/datetime';

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
        str += 'up: async ({ sql }) => {\n';
        str += '\tawait sql`\n';
        str += '\t\t'+this.sqlUp().replace(/\n/g,'\n\t\t')+'\n';
        str += '\t`\n';
        str += '}';
        return str;
    }

    private fnDown() {
        let str = '';
        str += 'down: async ({ sql }) => {\n';
        str += '\tawait sql`\n';
        str += '\t\t'+this.sqlDown().replace(/\n/g,'\n\t\t')+'\n';
        str += '\t`\n';
        str += '}';
        return str;
    }
}
