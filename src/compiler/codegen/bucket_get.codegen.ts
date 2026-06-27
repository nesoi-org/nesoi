import { NesoiError } from '~/engine/data/error';
import { BucketModelCode } from './bucket.codegen';
import type { CodeBlock, Code} from './codegen';
import { c } from './codegen';
import type { TypeNode } from '../types/type_compiler';
import { t } from '../types/type_compiler';

export class BucketModel__get {
    
    public code: BucketModelCode

    constructor(
        schema: $BucketModel
    ) {
        this.code = new BucketModelCode({
            required: true,
            type: 'obj',
            path: '',
            children: schema.fields
        } as any as $BucketModelField);
    }

    protected compile_type(field: $BucketModelField): TypeNode {
        switch (field.type) {
        case 'string': return t.string()
        case 'boolean': return t.boolean()
        case 'date': return t.date()
        case 'datetime': return t.datetime()
        case 'duration': return t.duration()
        case 'decimal': return t.decimal()
        case 'enum':  return t.union(Object.keys(field.meta!.enum!.options).map(opt => t.literal(opt)));
        case 'file':  return t.file()
        case 'float': return t.number();
        case 'int': return t.number();
        case 'unknown': return t.unknown();
        case 'literal': return t.literal(field.meta!.literal!.template);
        case 'regex': return t.literal(field.meta!.regex!.template);
        }
        return t.unknown();
    }

    public compile(
        path: string[],
        target: string = 'output',
        source: string = 'input',
        d = 0,
        code = this.code
    ): {
        block: CodeBlock
        type: TypeNode
     } {
        switch (code.schema.type) {
        // Complex
        case 'obj': {
            const p = path[d];
            const tail = !p;
            const spread = p === '*';
            if (tail || spread) {
                const type = t.obj({});
                return {
                    block: code.compile_obj('clone', target, source, undefined, d,
                        (code, key) => {
                            const child = this.compile( path, `${target}.${key}`, `${source}.${key}`, d+1, code);
                            type.children[key] = child.type;
                            return child.block;
                        }
                    ),
                    type
                }
            }
            else {
                if (!(p in code.children!)) {
                    throw NesoiError.Builder.Bucket.UnknownModelField(path.join('.'));
                }
                return this.compile(path, target, `${source}.${p}`, d+1, code.children![p]);
            }
        }
        case 'list': {
            let p = path[d];
            const tail = !p;
            const spread = p === '*';
            
            if (tail || spread) {
                let type!: TypeNode;
                return {
                    block: code.compile_list('clone', target, source, undefined, d,
                        (code, index) => {
                            const child = this.compile(path, `${target}[${index}]`, `${source}[${index}]`, d+1, code);
                            type = child.type;
                            return child.block;
                        }
                    ),
                    type: t.list(type)
                }
            }
            else {
                const idx = parseInt(p);
                if (Number.isNaN(idx)) throw NesoiError.Builder.Bucket.UnknownModelField(path.join('.'));
                if (idx < 0) p = `${source}.length${idx}`;
                else p = `${idx}`;

                return this.compile(path, target, `${source}[${p}]`, d+1, code.children!['#'])
            }
        }
        case 'dict': {
            const p = path[d];
            const tail = !p;
            const spread = p === '*';
            
            if (tail || spread) {
                let type!: TypeNode;
                return {
                    block: code.compile_dict('clone', target, source, undefined, d,
                        (code, index) => {
                            const child = this.compile(path, `${target}[${index}]`, `${source}[${index}]`, d+1, code);
                            type = child.type;
                            return child.block;
                        }
                    ),
                    type: t.dict(type)
                }
            }
            else {
                return this.compile(path, target, `${source}['${p}']`, d+1, code.children!['#']);
            }
        }
        case 'union': {
            const set = new Set<string>();
            const types: TypeNode[] = [];
            for (const key in code.children!) {
                const child = this.compile(path, target, source, d, code.children![key]);
                set.add(c.to_str(child.block));
                types.push(child.type);
            }

            const block: Code[] = [];
            if (set.size == 1) {
                block.push(c.line([...set][0]));
            }
            else {
                for (const union_fn of set) {
                    block.push(c.try(c.line(union_fn)));
                }
            }
            return {
                block: c.block(block),
                type: t.union(types)
            }
        }
        // Primitives + Nesoi
        default:
            return {
                block: c.block([
                    c.line(
                        c.to_str(code.clone_fn)
                            .replaceAll('$target', target)
                            .replaceAll('$source', source)
                    )
                ]),
                type: this.compile_type(code.schema)
            }
        }
    }
}