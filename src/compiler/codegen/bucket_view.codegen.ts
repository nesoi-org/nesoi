import type { CodeBlock} from './codegen';
import { c, CodegenInject } from './codegen';
import type { BucketModel } from '~/elements/entities/bucket/model/bucket_model';
import { BucketModel__get } from './bucket_get.codegen';
import { t, TypeChecker, TypeDumper, type TypeNode } from '../types/type_compiler';
import { NesoiError } from '~/engine/data/error';

type Step = {
    block: CodeBlock,
    type: TypeNode
}

export class BucketViewOpCode {

    public op: $BucketViewFieldOp

    public map?: BucketViewOpCode[]
    public subview?: BucketViewCode
    
    constructor(
        public view_code: BucketViewCode,
        public path: string[],
        public view: string,
        op: $BucketViewFieldOp,
    ) {
        this.op = op;

        switch (this.op.type) {
        case 'pick': break;
        case 'map':
            this.map = this.op.ops.map(op => new BucketViewOpCode(this.view_code, [...this.path, `#${this.op.type}`], this.view, op));
            break;
        case 'list': break
        case 'dict': break;
        case 'group': break;
        case 'transform': break;
        case 'subview': 
            this.subview = new BucketViewCode(this.view_code.bucket, [...this.path, `#${this.op.type}`], this.view, this.op.children)
            break;
        }
    }

    public compile(
        target: string,
        source: string,
        type: TypeNode
    ): Step {
        switch (this.op.type) {
        case 'pick':
            return this._pick(target, source, type);
        case 'map':
            return this._map(target, source, type);
        case 'list':
            return this._list(target, source, type);
        case 'dict':
            return this._dict(target, source, type);
        case 'group':
            return this._group(target, source, type);
        case 'transform': 
            return this._transform(target, source, type);
        case 'subview': break;
        }
        return {
            block: c.block([]),
            type: t.never()
        }
    }

    protected _pick(
        target: string,
        source: string,
        type: TypeNode
    ): Step {
        const op = this.op as Extract<$BucketViewFieldOp, { type: 'pick'}>;

        // Parse integer prop
        let key: string|number = op.prop;
        const idx = parseInt(op.prop);
        if (!Number.isNaN(idx)) key = idx;

        // Check if type supports key access
        const key_type = TypeChecker.get_key(type, key);
        if (!key_type) {
            throw NesoiError.Bucket.View.PickPropNotFound({ bucket: this.view_code.bucket.alias, view: this.view, path: op.prop, type: TypeDumper.dump('?',this.view_code.bucket.module,type)})
        }

        // Make key syntax
        if (typeof key === 'number') {
            if (key < 0) key = `?.[${source}.length${idx}]`;
            else key = `?.[${idx}]`;
        }
        else key = `?.${key}`;
        
        return {
            block: c.block([
                c.line(`${target} = ${source}${key}`)
            ]),
            type: key_type
        }
    }

    protected _list(
        target: string,
        source: string,
        type: TypeNode
    ): Step {
        // Check if type supports key access
        const iter_type = TypeChecker.get_iter_value(type);
        if (!iter_type) {
            throw NesoiError.Bucket.View.ToListNonObj({ bucket: this.view_code.bucket.alias, view: this.view, type: TypeDumper.dump('?',this.view_code.bucket.module,type)})
        }

        // Transform 
        const is_list = TypeChecker.is_list(type);

        let block;
        if (is_list) {
            // Value is already a list, ignore the operation
            return {
                block: c.block([]),
                type
            }
        }
        else {
            block = c.block([
                c.line(`const k = Object.keys(${source});`),
                c.line('const list = Array(k.length);'),
                c.for('', '0', 'k.length', c.block([
                    c.line(`list[i] = ${source}[k[i]]`)
                ])),
                c.line(`${target} = list;`)
            ], { isolated: true })
        }
        
        return {
            block,
            type: t.list(iter_type)
        }
    }

    protected _dict(
        target: string,
        source: string,
        type: TypeNode
    ): Step {
        const op = this.op as Extract<$BucketViewFieldOp, { type: 'dict'}>;

        // Check if type is list
        const is_list = TypeChecker.is_list(type);
        if (!is_list) {
            throw NesoiError.Bucket.View.ToDictNonArray({ bucket: this.view_code.bucket.alias, view: this.view, type: TypeDumper.dump('?',this.view_code.bucket.module,type)})
        }
        
        // Check if iter type 
        const iter_type = TypeChecker.get_iter_value(type)!;
        if (op.key) {
            const key_type = TypeChecker.get_key(iter_type, op.key);
            if (!key_type)
                throw NesoiError.Bucket.View.ToDictChildPropNotFound({ bucket: this.view_code.bucket.alias, view: this.view, type: TypeDumper.dump('?',this.view_code.bucket.module,type)})
        }

        const block = c.block([
            c.line(`const k = Object.keys(${source});`),
            c.line('const dict = {};'),
            c.for('', '0', 'k.length', c.block([
                c.line(`dict[k[i]] = ${source}[k[i]]`)
            ])),
            c.line(`${target} = dict;`)
        ], { isolated: true })
        
        return {
            block,
            type: t.dict(iter_type)
        }
    }

    protected _group(
        target: string,
        source: string,
        type: TypeNode
    ): Step {
        const op = this.op as Extract<$BucketViewFieldOp, { type: 'group'}>;

        // Check if type is list
        const is_list = TypeChecker.is_list(type);
        if (!is_list) {
            throw NesoiError.Bucket.View.GroupByNonArray({ bucket: this.view_code.bucket.alias, view: this.view, type: TypeDumper.dump('?',this.view_code.bucket.module,type)})
        }
        
        // Check if iter type contains key
        const iter_type = TypeChecker.get_iter_value(type)!;
        const key_type = TypeChecker.get_key(iter_type, op.key);
        if (!key_type)
            throw NesoiError.Bucket.View.GroupByChildPropNotFound({ bucket: this.view_code.bucket.alias, view: this.view, type: TypeDumper.dump('?',this.view_code.bucket.module,type)})
        
        // Check if key type is string-like
        const is_string_like = TypeChecker.is_string_like(key_type);
        if (!is_string_like)
            throw NesoiError.Bucket.View.GroupByChildPropNotString({ bucket: this.view_code.bucket.alias, view: this.view, type: TypeDumper.dump('?',this.view_code.bucket.module,type)})

        const block = c.block([
            c.line(`const k = Object.keys(${source});`),
            c.line('const dict = {};'),
            c.for('', '0', 'k.length', c.block([
                c.line(`const v = ${source}[k[i]];`),
                c.line(`dict[v.${op.key}] ??= []`),
                c.line(`dict[v.${op.key}].push(v)`)
            ])),
            c.line(`${target} = dict;`)
        ], { isolated: true })
        
        return {
            block,
            type: t.dict(iter_type)
        }
    }

    protected _transform(
        target: string,
        source: string,
        type: TypeNode
    ): Step {
        const op = this.op as Extract<$BucketViewFieldOp, { type: 'transform'}>;

        const path = this.path.join('');
        this.view_code.fns[path] = op.fn;

        const block = c.block([
            c.line(`${target} = op.fn['${path}']({`),
            c.line(`  value: ${source}`),
            c.line('});')
        ])
        
        return {
            block,
            type: t.never()
        }
    }

    protected _map(
        target: string,
        source: string,
        type: TypeNode
    ): Step {
        const op = this.op as Extract<$BucketViewFieldOp, { type: 'map'}>;
        
        // Check if type supports key access
        const iter_type = TypeChecker.get_iter_value(type);
        if (!iter_type) {
            throw NesoiError.Bucket.View.ToListNonObj({ bucket: this.view_code.bucket.alias, view: this.view, type: TypeDumper.dump('?',this.view_code.bucket.module,type)})
        }

        // Transform 
        const is_list = TypeChecker.is_list(type);

        const steps: Step[] = [];
        for (const op of this.map!) {
            if (is_list) steps.push(op.compile('map[i]', `${source}[i]`, iter_type));
            else steps.push(op.compile('map[k[i]]', `${source}[k[i]]`, iter_type));
        }

        let block;
        if (is_list) {
            block = c.block([
                c.line(`const map = Array(${source}.length);`),
                c.for('', '0', `${source}.length`, c.block(
                    steps.map(step => step.block)
                )),
                c.line(`${target} = map;`)
            ], { isolated: true })
        }
        else {
            block = c.block([
                c.line(`const k = Object.keys(${source});`),
                c.line('const map = {};'),
                c.for('', '0', 'k.length', c.block(
                    steps.map(step => step.block)
                )),
                c.line(`${target} = map;`)
            ], { isolated: true })
        }
        
        return {
            block,
            type: t.list(iter_type)
        }
    }
}

export class BucketViewFieldCode {

    public field: $BucketViewField
    public ops: BucketViewOpCode[]

    constructor(
        public view_code: BucketViewCode,
        public path: string[],
        public view: string,
        field: $BucketViewField,
    ) {
        this.field = field;

        this.ops = [];
        for (const op of this.field.ops) {
            this.ops.push(new BucketViewOpCode(this.view_code, [...this.path, `.${this.field.name}`], this.view, op));
        }
    }

    protected _model(): Step {
        const path = this.field.meta.model!.path.split('.');
        return new BucketModel__get(this.view_code.bucket.model)
            .compile(path, `view.${this.field.name}`, 'raw');
    }

    public compile(): Step {
        let step!: Step;
        switch (this.field.type) {
        case 'model':
            step = this._model();
            break;
        case 'computed': break;
        case 'query': break;
        case 'obj': break;
        case 'view': break;
        case 'drive': break;
        case 'inject': break;
        }

        for (const op of this.ops) {
            const child = op.compile(`view.${this.field.name}`, `view.${this.field.name}`, step.type);
            step = {
                block: c.block([
                    step.block,
                    child.block
                ]),
                type: child.type
            }
        }
        return step;
    }
}

export class BucketViewCode {

    public fields: Record<string, BucketViewFieldCode> = {}
    public fns: Record<string, $BucketViewFieldFn<any,any,any,any>> = {}
    
    constructor(
        public bucket: $Bucket,
        public path: string[],
        public name: string,
        fields: $BucketViewFields,
    ) {
        for (const key in fields) {
            this.fields[key] = new BucketViewFieldCode(this, path, this.name, fields[key]);
        }
    }

    public compile(): Step {
        const block = c.block([]);
        const type = t.obj({});
        for (const key in this.fields) {
            const child = this.fields[key].compile();
            block.children.push(child.block);
            type.children[key] = child.type;
        }
        // console.log(TypeDumper.dump('','',type));
        return {
            block,
            type
        };
    }

    public toString() {
        return c.to_str(c.block([
            c.line('const view = {\n'),
            c.line(`  $v: '${this.name}',\n`),
            c.line('  id: op.id,\n'),
            c.line('}\n'),
            this.compile().block,
            c.line('return view;'),
        ]))
    }

    public static make(
        bucket: $Bucket,
        view: $BucketView
    ) {
        const code = new BucketViewCode(bucket as any as $Bucket, [], view.name, view.fields);
        
        const fn_str = code.toString();
        // console.log(fn_str);

        const fn = new Function('_inc', 'op', 'raw', fn_str);
        Object.defineProperty(fn, 'name', { value: 'cast' });

        function __fn (this: BucketModel<any, any>, obj: any) {
            return fn(CodegenInject, {
                err: (this as any)._e,
                id: obj.id,
                fn: code.fns
            }, obj);
        }

        return __fn;
    }
}