import type { Tag } from '~/engine/dependency'
import { NameHelpers } from '~/engine/util/name_helpers'

export type TypeNode = {
    kind: 'unknown'
} | {
    kind: 'primitive'
    subkind: 'null'|'undefined'|'string'|'number'|'boolean'
} | {
    kind: 'literal'
    literal: string
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
    kind: 'bucket'
    tag: Tag
    view?: string
}

export type ObjTypeNode = Extract<TypeNode, { kind: 'obj' }>



export const t = {
    unknown: () => ({ kind: 'unknown'}) as TypeNode,
    
    null: () => ({ kind: 'primitive', subkind: 'null' }) as TypeNode,
    undefined: () => ({ kind: 'primitive', subkind: 'undefined' }) as TypeNode,
    string: () => ({ kind: 'primitive', subkind: 'string' }) as TypeNode,
    number: () => ({ kind: 'primitive', subkind: 'number' }) as TypeNode,
    boolean: () => ({ kind: 'primitive', subkind: 'boolean' }) as TypeNode,
    
    literal: (literal: string) => ({ kind: 'literal', literal }) as TypeNode,
    
    list: (item: TypeNode) => ({ kind: 'list', item }) as TypeNode,
    dict: (item: TypeNode) => ({ kind: 'dict', item }) as TypeNode,
    obj: (children: Record<string, TypeNode>) => ({ kind: 'obj', children }) as ObjTypeNode,
    union: (options: TypeNode[]) => ({ kind: 'union', options }) as TypeNode,

    date: () => ({ kind: 'nesoi', subkind: 'NesoiDate' }) as TypeNode,
    datetime: () => ({ kind: 'nesoi', subkind: 'NesoiDatetime' }) as TypeNode,
    duration: () => ({ kind: 'nesoi', subkind: 'NesoiDuration' }) as TypeNode,
    decimal: () => ({ kind: 'nesoi', subkind: 'NesoiDecimal' }) as TypeNode,
    file: () => ({ kind: 'nesoi', subkind: 'NesoiFile' }) as TypeNode,

    bucket: (tag: Tag, view?: string) => ({ kind: 'bucket', tag, view }) as TypeNode,
}

export class TypeDumper {

    public static dump(forModule: string, type: TypeNode, serialized?: boolean, pad = ''): string {
        switch (type.kind) {
        case 'unknown':
            return 'unknown'
        case 'primitive':
            return type.subkind
        case 'literal':
            return type.literal.startsWith('`')
                ? type.literal
                : `'${type.literal}'`
        case 'list':
        {
            const item = this.dump(forModule, type.item, serialized, pad);
            return item + '[]'
        }
        case 'dict':
            return '{ [x: string]: ' + this.dump(forModule, type.item, serialized, pad+'  ') + ' }'
        case 'obj':
        {
            let str = '{\n';
            for (const key in type.children) {
                str += `${pad}  ${key}: ${this.dump(forModule, type.children[key], serialized, pad+'  ')}\n`
            }
            str += pad+'}'
            return str;
        }
        case 'union':
            return '(' + type.options.map(opt => this.dump(forModule, opt, serialized, pad)).join('|') + ')';
        case 'nesoi':
            return serialized ? 'string' : type.subkind
        case 'bucket':
            if (type.tag.module !== forModule) {
                const module = NameHelpers.nameLowToHigh(type.tag.module);
                const view = type.view
                    ? `['views']['${type.view}']['#data']`
                    : '[\'#data\']'
                return `${module}Module['buckets']['${type.tag.name}']${view}`;
            }
            else {
                if (type.view)
                    return `${NameHelpers.nameLowToHigh(type.tag.name)}Bucket['views']['${type.view}']['#data']`
                else
                    return `${NameHelpers.nameLowToHigh(type.tag.name)}`
            }
        }
    }

}