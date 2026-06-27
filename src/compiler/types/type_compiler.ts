import type { ModuleTree } from '~/engine/tree'
import { NameHelpers } from '~/engine/util/name_helpers'
import { BucketTypeCompiler } from './bucket.type_compiler'
import { MessageTypeCompiler } from './message.type_compiler'


export type TypeNode = {
    kind: 'never'
} | {
    kind: 'unknown'
} | {
    kind: 'primitive'
    subkind: 'null'|'undefined'|'string'|'number'|'boolean'
} | {
    kind: 'literal'
    literal: string
} | {
    kind: 'ref'
    ref: string
    namespace?: TypeNamespace
} | {
    kind: 'list'
    item: TypeNode
} | {
    kind: 'dict'
    item: TypeNode
} | {
    kind: 'obj'
    children: Record<string, TypeNode>
} | {
    kind: 'union'
    options: TypeNode[]
} | {
    kind: 'nesoi'
    subkind: 'NesoiDatetime' | 'NesoiDate' | 'NesoiDuration' | 'NesoiDecimal' | 'NesoiFile'
} | {
    kind: 'tag'
} | {
    kind: 'user'
    provider: string
} | {
    kind: 'bucket'
    tag: Tag
    view?: string
} | {
    kind: 'message'
    tag: Tag
    state: 'raw'|'parsed'
} | {
    kind: 'schema'
    tag: Tag
}

export type ObjTypeNode = Extract<TypeNode, { kind: 'obj' }>

export const t = {
    never: () => ({ kind: 'never'}) as Extract<TypeNode, {kind: 'never'}>,
    unknown: () => ({ kind: 'unknown'}) as TypeNode,
    
    null: () => ({ kind: 'primitive', subkind: 'null' }) as TypeNode,
    undefined: () => ({ kind: 'primitive', subkind: 'undefined' }) as TypeNode,
    string: () => ({ kind: 'primitive', subkind: 'string' }) as TypeNode,
    number: () => ({ kind: 'primitive', subkind: 'number' }) as TypeNode,
    boolean: () => ({ kind: 'primitive', subkind: 'boolean' }) as TypeNode,
    
    literal: (literal: string) => ({ kind: 'literal', literal }) as TypeNode,
    ref: (ref_or_namespace: string|TypeNamespace, ref?: string) => ({
        kind: 'ref',
        ref: typeof ref_or_namespace === 'string' ? ref_or_namespace : ref,
        namespace: typeof ref_or_namespace === 'string' ? undefined : ref_or_namespace
    }) as TypeNode,
    
    list: (item: TypeNode) => ({ kind: 'list', item }) as TypeNode,
    dict: (item: TypeNode) => ({ kind: 'dict', item }) as TypeNode,
    obj: (children: Record<string, TypeNode>) => ({ kind: 'obj', children }) as ObjTypeNode,
    union: (options: TypeNode[]): Extract<TypeNode, {kind: 'union'|'never'}> => {
        options = options.filter(opt => opt.kind !== 'never');
        if (!options.length) return t.never();
        return { kind: 'union', options }
    },
    date: () => ({ kind: 'nesoi', subkind: 'NesoiDate' }) as TypeNode,
    datetime: () => ({ kind: 'nesoi', subkind: 'NesoiDatetime' }) as TypeNode,
    duration: () => ({ kind: 'nesoi', subkind: 'NesoiDuration' }) as TypeNode,
    decimal: () => ({ kind: 'nesoi', subkind: 'NesoiDecimal' }) as TypeNode,
    file: () => ({ kind: 'nesoi', subkind: 'NesoiFile' }) as TypeNode,

    tag: () => ({ kind: 'tag' }) as TypeNode,
    message: (tag: Tag, state: 'raw'|'parsed') => ({ kind: 'message', tag, state }) as TypeNode,
    bucket: (tag: Tag, view?: string) => ({ kind: 'bucket', tag, view }) as TypeNode,
    user: (provider: string) => ({ kind: 'user', provider }) as TypeNode,
    
    schema: (tag: Tag) => ({ kind: 'schema', tag }) as TypeNode,

    dynamic: (value: any): TypeNode => {
        switch (typeof value) {
        case 'string':
        case 'symbol':
            return t.string()
        case 'number':
        case 'bigint':
            return t.number()
        case 'boolean':
            return value ? t.ref('true') : t.ref('false')
        case 'undefined':
            return t.undefined()
        case 'object':
            return t.obj(Object.fromEntries(
                Object.entries(value).map(([key, val]) => [key, t.dynamic(val)])
            ))
        case 'function':
            return t.unknown()
        }
    }
}

export class TypeInterface {

    public kind = 'interface';
    public extend: string[] = [];
    public type: ObjTypeNode = t.obj({});

    constructor(
        public name: string,
    ) {}

    extends(...extend: string[]) {
        this.extend = extend;
        return this;
    }

    set(type: Record<string, TypeNode>) {
        this.type = t.obj(type);
        return this;
    }

    dump(space: string, module: string, d = 0): string {
        const pad = '  '.repeat(d);
        let str = `${pad}interface ${this.name}${this.extend.length ? (' extends ' + this.extend.join(', ')) : ''} `;
        str += TypeDumper.dump(space, module, this.type, undefined, pad);
        return str;
    }
}

export class TypeNamespace {

    public items: (TypeInterface | TypeNamespace)[] = []

    constructor(
        public name: string
    ) {}

    public add(...item: (TypeInterface | TypeNamespace)[]) {
        this.items.push(...item);
        return this;
    }

    dump(space: string, module: string, d = 0): string {
        const pad = '  '.repeat(d);
        let str = `${pad}namespace ${this.name} {\n`;
        for (const item of this.items) {
            str += item.dump(space, module, d+1) + '\n';
        }
        str += `${pad}}`;
        return str;
    }
}

export class TypeCompiler {

    public bucket: BucketTypeCompiler;
    public message: MessageTypeCompiler;
    
    constructor(
        private tree: ModuleTree
    ) {
        this.bucket = new BucketTypeCompiler(this);
        this.message = new MessageTypeCompiler(this);
    }

    run() {
        return this.tree.traverse('compile types', async node => {          
            if (node.builder.$b === 'bucket') {
                await this.bucket.compile(node.tag, node.schema as $Bucket);
            }
            else if (node.builder.$b === 'message') {
                await this.message.compile(node.tag, node.schema as $Message);
            }
        })
    }

}

export class TypeChecker {

    public static get_key(type: TypeNode, key: string|number): TypeNode|undefined {
        if (type.kind === 'obj') return type.children[key];
        if (type.kind === 'list') return typeof key === 'number' ? type.item : undefined;
        if (type.kind === 'dict') return type.item;
        if (type.kind === 'union') return this._union_get(type, opt => this.get_key(opt, key));
        return undefined;
    }

    public static get_iter_value(type: TypeNode): TypeNode|undefined {
        if (type.kind === 'obj') return t.union(Object.values(type.children));
        if (type.kind === 'list') return type.item;
        if (type.kind === 'dict') return type.item;
        if (type.kind === 'union') return this._union_get(type, opt => this.get_iter_value(opt));
        return undefined;
    }

    public static is_list(type: TypeNode): boolean {
        if (type.kind === 'obj') return false;
        if (type.kind === 'list') return true;
        if (type.kind === 'dict') return false;
        if (type.kind === 'union') return this._union_is(type, opt => this.is_list(opt));
        return false;
    }

    public static is_dict(type: TypeNode): boolean {
        if (type.kind === 'obj') return false;
        if (type.kind === 'list') return true;
        if (type.kind === 'dict') return true;
        if (type.kind === 'union') return this._union_is(type, opt => this.is_dict(opt));
        return false;
    }

    public static is_string_like(type: TypeNode): boolean {
        if (type.kind === 'primitive') return true;
        if (type.kind === 'literal') return true;
        if (type.kind === 'union') return this._union_is(type, opt => this.is_string_like(opt));
        return false;
    }

    // Unions are currently treated as TypeScript intersections, for the BucketViewCode
    // If this changes in the future, make sure to check the behavior there.

    public static _union_get(type: Extract<TypeNode, {kind:'union'}>, fn: (t: TypeNode) => TypeNode|undefined) {
        const options: TypeNode[] = [];
        for (const opt of type.options) {
            const opt_type = fn(opt)
            if (!opt_type) return undefined;
            options.push(opt_type);
        }
        return t.union(options);
    }

    public static _union_is(type: Extract<TypeNode, {kind:'union'}>, fn: (t: TypeNode) => boolean) {
        for (const opt of type.options) {
            const opt_type = fn(opt)
            if (!opt_type) return false;
        }
        return true;
    }
}

export class TypeDumper {

    public static dump(space: string, forModule: string, type: TypeNode, serialized?: boolean, pad = ''): string {
        switch (type.kind) {
        case 'never':
            return 'never'
        case 'unknown':
            return 'unknown'
        case 'primitive':
            return type.subkind
        case 'literal':
            return type.literal.startsWith('`')
                ? type.literal
                : `'${type.literal}'`
        case 'ref':
            if (type.namespace) return `${type.namespace.name}.${type.ref}`
            return type.ref
        case 'list':
        {
            const item = this.dump(space, forModule, type.item, serialized, pad);
            return item + '[]'
        }
        case 'dict':
            return '{ [x: string]: ' + this.dump(space, forModule, type.item, serialized, pad+'  ') + ' }'
        case 'obj':
        {
            let str = '{\n';
            for (const key in type.children) {
                const child = type.children[key]
                const opt = child.kind === 'union'
                    ? child.options.some(opt => opt.kind === 'primitive' && opt.subkind === 'undefined')
                    : false;
                str += `${pad}  '${key}'${opt ? '?' : ''}: ${this.dump(space, forModule, type.children[key], serialized, pad+'  ')}\n`
            }
            str += pad+'}'
            return str;
        }
        case 'union':
            return '(' + type.options.map(opt => this.dump(space, forModule, opt, serialized, pad)).join(' | ') + ')';
        case 'nesoi':
            return serialized ? 'string' : type.subkind
        case 'tag':
            return 'Tag';
        case 'user':
            return `${space}['users']['${type.provider}']`;
        case 'bucket':
        {
            const name = NameHelpers.nameLowToHigh(type.tag.name);
            if (type.tag.module !== forModule) {
                const module = NameHelpers.nameLowToHigh(type.tag.module);
                const model = type.view ? `${name}__${type.view}` : name;
                return `${space}.${module}.${model}`;
            }
            else {
                if (type.view)
                    return `${name}__${type.view}`
                else
                    return `${name}`
            }
        }
        case 'message':
            if (type.tag.module !== forModule) {
                const module = NameHelpers.nameLowToHigh(type.tag.module);
                return `${module}Module['messages']['${type.tag.name}']['#${type.state}']`;
            }
            else {
                return `${NameHelpers.nameLowToHigh(type.tag.name)}Message['#${type.state}']`
            }
        case 'schema':
            return NameHelpers.tagType(space, type.tag, forModule);
        }
    }

}