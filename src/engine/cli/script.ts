import { colored } from '../util/string';

/**
 * @category Engine
 * @subcategory CLI
 */
export default function script<
    Def extends ScriptDef,
    T = ReturnType<Def> extends ScriptBuilder<infer X> ? X : never
>(name: string, def: Def) {
    const builder = def(new ScriptBuilder(name));
    const schema = ScriptBuilder.build(builder);
    return new Script<{
        [K in keyof T]: T[K]
    }>(schema);
}

//

class Script<T> {

    public args: T = {} as any;

    constructor(
        private schema: $Script<any>
    ) {
        
    }

    init() {
        if (process.argv.includes('-h') || process.argv.includes('--help')) {
            this.log_help();
            process.exit();
        }
        this.parse();
        return this.args;
    }

    log_help() {
        this.log_header();
        this.log_syntax();
        
        const pos_args = this.schema.args.filter(arg => arg.type === 'pos');
        if (pos_args.length) {
            console.log('Positional Arguments:\n');
            for (const arg of pos_args) {
    
                let str = ' ';
                str += colored(arg.name, 'brown');
                str += '\n  ';
                if (arg.values[0].amount === '1?') {
                    str += colored('(optional) ', 'blue');
                }
                else if (arg.values[0].amount === '0+') {
                    str += colored('(zero or more) ', 'blue');
                }
                else if (arg.values[0].amount === '1+') {
                    str += colored('(one or more) ', 'blue');
                }
                str += colored(arg.description ?? '', 'blue');
                str += '\n';
                if (arg.values[0].type === 'enum') {
                    for (const opt in arg.values[0].meta.enum!.options) {
                        const option = arg.values[0].meta.enum!.options[opt];
                        str += '  - ' + colored(opt,'lightblue') + ' ' + colored(option.description ? (': ' + option.description) : '', 'blue');
                        str += '\n';
                    }
                }
                console.log(str);
            }
        }

        this.log_flags();
    }

    log_header() {
        console.log();
        console.log(colored(this.schema.name, 'lightpurple'));
        if (this.schema.description) {
            console.log(colored(this.schema.description, 'purple'));
        }
        console.log();
    }

    log_syntax() {
        const syntax = this.schema.args.map(arg => {

            const values: string[] = [];
            for (const val of arg.values) {
                switch (val.amount) {
                case '1': values.push(val.name); break;
                case '1?': values.push(val.name+'?'); break;
                case '0+': values.push(val.name+'0..'+val.name+'+'); break;
                case '1+': values.push(val.name+'1..'+val.name+'+'); break;
                }
            }

            let p = arg.name;
            if (arg.type === 'pos') {
                p = `{${values[0]}}`
            }
            else if (arg.type === 'key') {
                p = `[${p}${values.length ? (' ' + values.join(' ')) : ''}]`;
            }
            return p;
        }).join(' ');
        console.log(`Syntax:\n\n${colored(this.schema.name + ' ' + syntax, 'brown')}`)
        console.log();
    }

    log_flags() {
        const key_args = this.schema.args.filter(arg => arg.type === 'key');
        console.log('Keyword Arguments:\n');
        console.log(` ${colored('-h --help', 'cyan')}?\n  ${colored('Show this help info', 'blue')}\n`)
        for (const arg of key_args) {
            const values: string[] = [];
            for (const val of arg.values) {
                switch (val.amount) {
                case '1': values.push(val.name); break;
                case '1?': values.push(val.name+'?'); break;
                case '0+': values.push(val.name+'0..'+val.name+'+'); break;
                case '1+': values.push(val.name+'1..'+val.name+'+'); break;
                }
            }

            let str = ' ';
            if (arg.short) {
                str += colored(arg.short+' '+arg.name, 'brown');
            }
            else {
                str += colored(arg.name, 'brown');
            }
            for (const value of values) {
                str += ' ' + colored(value, 'green');
            }
            str += '\n  ';
            str += colored(arg.description ?? '', 'blue');
            str += '\n  ';
            for (let i = 0; i < values.length; i++) {
                str += colored(values[i], 'green')
                if (arg.values[i].amount === '1?') {
                    str += colored(': (optional)', 'cyan');
                }
                else if (arg.values[i].amount === '0+') {
                    str += colored(': (zero or more)', 'cyan');
                }
                else if (arg.values[i].amount === '1+') {
                    str += colored(': (one or more)', 'cyan');
                }
                if (arg.values[i].description) {
                    str += colored(` ${arg.values[i].description}`, 'cyan');
                }
                str += '\n  ';
            }
            console.log(str);
        }
        console.log();
    }

    error(error: string, type: 'syntax'|'flag') {
        this.log_header();
        if (type === 'syntax') {
            this.log_syntax();
        }
        else {
            this.log_flags();
        }
        console.log(colored('---\n'+error+'\n---', 'red'));
        console.log();
        process.exit();
    }

    parse() {
        const argv = process.argv;
        let i = 2;
        // Positional
        for (const arg of this.schema.args) {
            if (arg.type !== 'pos') break;
            const { i: j, value } = this.parse_argv(arg, arg.values[0], i);
            (this.args as any)[arg.name] = value;
            i = j;
        }
        
        // Keyword
        let arg;
        while (i < argv.length) {
            if (!argv[i].startsWith('-')) {
                this.error(`Error: Unexpected argument(s) at the end '${argv.slice(i).join(' ')}'`, 'syntax');
            }
            arg = this.schema.args.find(arg => arg.name === argv[i] || arg.short === argv[i]);
            if (!arg) {
                this.error(`Error: Unknown keyword argument '${argv[i]}'`, 'flag');
                break;
            }
            const name = arg.name.replace(/-+(.*)/,'$1');
            if (arg.values.length) {
                (this.args as any)[name] = {}
                i++;
                for (const val of arg.values) {
                    const { i:j, value } = this.parse_argv(arg, val, i);
                    i = j;
                    (this.args as any)[name][val.name] = value;
                }
            }
            else {
                (this.args as any)[name] = true;
                i++;
            }
        }
        // for (const arg of this.schema.args) {
        //     if (arg.type !== 'key') continue;
        //     if (i >= argv.length) break;
        // }
    }

    private parse_argv(arg: $ScriptArg, value: $ScriptValue, i: number) {
        const argv = process.argv;
        const values: string[] = [];
        // Single
        if (value.amount === '1' || value.amount === '1?') {
            if (argv[i] && !argv[i].startsWith('-')) {
                values.push(argv[i]);
                i++;
            }
        }
        // Many
        else {
            while (i < argv.length) {
                if (argv[i].startsWith('-')) break;
                values.push(argv[i]);
                i++;
            }
        }
        if (values.length === 0 && (value.amount === '1' || value.amount === '1+')) {
            this.error(`Error: Missing required ${arg.type === 'pos' ? 'positional argument' : ('value from arg \''+arg.name+'\' named')} '${value.name}'`, 'syntax');
        }
        const validated = values.map(val => this.validate(value, val));
        // Single
        if (value.amount === '1' || value.amount === '1?') {
            return { value: validated[0], i }
        }
        else {
            return { value: validated, i }
        }
    }

    private validate(schema: $ScriptValue, value: any) {
        switch(schema.type) {
        case 'string':
            return value as string;
            break;
        case 'boolean':
            if (value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes') return true;
            return false;
            break;
        case 'enum':
            if (!(value in schema.meta.enum!.options)) {
                this.error(`Error: Value '${schema.name}=${value}' doesn't match any of the options: ${Object.keys(schema.meta.enum!.options).join(', ')}`, 'syntax');
            }
            return value as string;
            break;
        }
    }

}

/* Schemas */

type $Script<T> = {
    name: string
    description?: string
    args: $ScriptArg[]
}

type $ScriptArg = {
    name: string
    short?: string
    description?: string
    type: 'pos'|'key'
    values: $ScriptValue[]
}

type $ScriptValue = {
    name: string
    description?: string
    type: 'string'|'boolean'|'enum'
    amount: '1'|'1?'|'0+'|'1+'
    meta: {
        enum?: {
            options: {
                [x: string]: {
                    name: string
                    description?: string
                }
            }
        }
    }
}

/* Builders and Factories */

type ArgName<T> = T extends `--${infer X}` ? X
    : T extends `-${infer X}` ? X
    : T

type ArgValue<T> = T extends Record<string, any> ? {
    [K in keyof T]: T[K]
} : T

class ScriptBuilder<T> {
    private schema: Partial<$Script<any>> = {
        args: []
    };

    constructor(name: string) {
        this.schema.name = name;
    }

    public d(description: string) {
        this.schema.description = description;
        return this;
    }

    public arg<
        Name extends string,
        Def extends ScriptArgDef<Name extends `-${string}` ? 'key' : 'pos'>
    >(
        name: Name,
        short: Name extends `-${string}` ? `-${string}` : never,
        def: Def
    ): ScriptBuilder<T & {
        [K in Name as ArgName<K>]: ReturnType<Def> extends ScriptArgBuilder<infer X> ? ArgValue<X> : any
    }>;
    public arg<
        Name extends string,
        Def extends ScriptArgDef<Name extends `-${string}` ? 'key' : 'pos'>
    >(
        name: Name,
        def: Def
    ): ScriptBuilder<T & {
        [K in Name as ArgName<K>]: ReturnType<Def> extends ScriptArgBuilder<infer X> ? ArgValue<X> : any
    }>;
    public arg(
        name: string,
        arg1?: string | ScriptArgDef<any>,
        arg2?: ScriptArgDef<any>
    ) {
        const def = arg2 || arg1 as ScriptArgDef<any>;
        const short = typeof arg1 === 'string' ? arg1 : undefined;

        let schema;
        if (name.startsWith('-')) {
            const builder = new ScriptKeyArgBuilder(name, short);
            def(builder);
            schema = ScriptKeyArgBuilder.build(builder);
        }
        else {
            const builder = new ScriptPosArgBuilder(name);
            def(builder);
            schema = ScriptPosArgBuilder.build(builder);
        }

        this.schema.args?.push(schema);
        return this;
    }

    static build<T>(builder: ScriptBuilder<T>) {
        const args = builder.schema.args!;

        for (let i = 1; i < args.length; i++) {
            if (args[i].type !== 'pos') break;
            const lastArg = args[i-1];
            if (lastArg.values[0].amount === '0+' || lastArg.values[0].amount === '1+') {
                throw new Error('Only a single 0+/1+ positional argument is allowed, as the last one.')
            }
        }

        builder.schema.args = [
            ...args.filter(arg => arg.type === 'pos' && arg.values[0].amount === '1'),
            ...args.filter(arg => arg.type === 'pos' && arg.values[0].amount !== '1'),
            ...args.filter(arg => arg.type === 'key')
        ]

        return builder.schema as $Script<{
            [K in keyof T]: T[K]
        }>;
    }
}

class ScriptPosArgBuilder<T = string> {
    private schema: Partial<$ScriptArg> = {};

    constructor(
        name: string
    ) {
        this.schema.name = name;
        this.schema.type = 'pos';
        this.schema.values = [{
            name,
            type: 'string',
            amount: '1',
            meta: {}
        }]
    }
    public d(description: string) {
        this.schema.description = description;
        return this;
    }
    public value<Def extends ScriptValueDef>(def: Def): ScriptPosArgBuilder<
        ReturnType<Def> extends ScriptValueBuilder<infer X> ? X : never
    > {
        const builder = new ScriptValueBuilder(this.schema.name!);
        def(builder);
        const value = ((builder as any).build as ScriptValueBuilder['build'])();
        this.schema.values = [value];
        return this;
    }

    static build(builder: ScriptPosArgBuilder) {
        return builder.schema as $ScriptArg
    }
}

class ScriptKeyArgBuilder<T = boolean | undefined> {
    private schema: Partial<$ScriptArg> = {};
    constructor(
        name: string,
        short?: string
    ) {
        this.schema.name = name;
        this.schema.short = short;
        this.schema.type = 'key';
        this.schema.values = []
    }
    public d(description: string) {
        this.schema.description = description;
        return this;
    }
    public value<
        N extends string,
        Def extends ScriptValueDef
    >(name: N, def: Def): ScriptKeyArgBuilder<
        T extends boolean
            ? { [k in N]: ReturnType<Def> extends ScriptValueBuilder<infer X> ? X : never } | undefined
            : T & { [k in N]: ReturnType<Def> extends ScriptValueBuilder<infer X> ? X : never } | undefined
    > {
        const lastValue = this.schema.values!.at(-1);
        if (lastValue?.amount === '0+' || lastValue?.amount === '1+') {
            throw new Error('Only a single 0+/1+ value is allowed, as the last one.')
        }

        const builder = new ScriptValueBuilder(name);
        def(builder);
        const value = ((builder as any).build as ScriptValueBuilder<any>['build'])();
        this.schema.values!.push(value);
        return this;
    }
    static build(builder: ScriptKeyArgBuilder) {
        builder.schema.values = [
            ...builder.schema.values!.filter(value => value.amount === '1'),
            ...builder.schema.values!.filter(value => value.amount !== '1'),
        ]
        return builder.schema as $ScriptArg
    }
}

class ScriptValueBuilder<T = string> {

    private schema: $ScriptValue;
    
    constructor(name: string) {
        this.schema = {
            name,
            type: 'string',
            amount: '1',
            meta: {}
        }
    }

    public d(description: string) {
        this.schema.description = description;
        return this;
    }

    public get optional(): ScriptValueBuilder<T | undefined> {
        if (this.schema.amount === '1') {
            this.schema.amount = '1?';
        }
        return this;
    }

    public get zero_or_more(): ScriptValueBuilder<T[]> {
        this.schema.amount = '0+';
        return this;
    }

    public get one_or_more(): ScriptValueBuilder<T[]> {
        this.schema.amount = '1+';
        return this;
    }

    public get boolean() {
        this.schema = {
            ...this.schema,
            type: 'boolean',
            meta: {}
        }
        return this as ScriptValueBuilder<boolean>;
    }

    public enum<E extends string>(options: E[] | Record<E, string>): ScriptValueBuilder<undefined extends T ? E | undefined : E> {
        const opts: NonNullable<$ScriptValue['meta']['enum']>['options'] = {};
        if (Array.isArray(options)) {
            for (const opt of options) {
                opts[opt] = { name: opt }
            }
        }
        else {
            for (const name in options) {
                opts[name] = { name, description: options[name] }
            }
        }
        this.schema = {
            ...this.schema,
            type: 'enum',
            meta: {
                enum: {
                    options: opts
                }
            }
        }
        return this as never;
    }
    
    private build() { return this.schema as $ScriptValue }
}

type ScriptArgBuilder<T> = ScriptPosArgBuilder<T> | ScriptKeyArgBuilder<T>

/* Defs */

type ScriptDef = (builder: ScriptBuilder<{}>) => ScriptBuilder<any>
type ScriptValueDef = (builder: ScriptValueBuilder<string>) => ScriptValueBuilder<any>
type ScriptArgDef<Type extends 'key'|'pos'> =
    (factory: Type extends 'pos'
    ? ScriptPosArgBuilder
    : ScriptKeyArgBuilder
) => ScriptArgBuilder<any>
