import type { Code, CodeBlock} from './codegen';
import { c, CodegenInject } from './codegen';
import { BucketModelCode } from './bucket.codegen';
import type { BucketModel } from '~/elements/entities/bucket/model/bucket_model';

export class BucketModel__freeze {
    
    private code: BucketModelCode;

    constructor(
        schema: $BucketModelField,
        depth = -1
    ) {
        this.code = new BucketModelCode(schema, depth);
    }

    public compile(
        target: string = 'copy',
        source: string = 'val',
        d = -1,
        code = this.code
    ): CodeBlock {
        switch (code.schema.type) {
        case 'obj':
            return c.block([
                c.line(`Object.freeze(${source})`),
                code.compile_obj('none', target, source, '', d, (child, key) => 
                    this.compile(`${target}.${key}`, `${source}.${key}`, d+1, child)
                )
            ])
        case 'list':
            return c.block([
                c.line(`Object.freeze(${source})`),
                code.compile_list('none', target, source, '', d, (child, idx) =>
                    this.compile(`${target}[${idx}]`, `${source}[${idx}]`, d+1, child)
                )
            ])
        case 'dict':
            return c.block([
                c.line(`Object.freeze(${source})`),
                code.compile_dict('none', target, source, '', d, (child, key) =>
                    this.compile(`${target}[${key}]`, `${source}[${key}]`, d+1, child)
                )
            ])
        case 'union': {
            const set = new Set<string>();
            for (const key in code.children!) {
                const child = code.children![key];
                set.add(c.to_str(this.compile(target, source, d, child)));
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
            return c.block(block);
        }
        default:
            return c.block([])
        }
    }

    public toString() {
        return c.to_str(this.compile());
    }

    public static make(
        model: $BucketModel
    ) {
        const model_code = new BucketModel__freeze({
            required: true,
            type: 'obj',
            path: '',
            children: model.fields
        } as unknown as $BucketModelField);
        
        const fn_str = model_code.toString();
        // console.log(fn_str)

        const fn = new Function('_inc', 'op', 'val', fn_str);
        Object.defineProperty(fn, 'name', { value: 'freeze' });

        function __fn (this: BucketModel<any, any>, obj: any) {
            return fn(CodegenInject, {
                err: (this as any)._e,
                id: obj.id
            }, obj);
        }

        return __fn;
    }
}