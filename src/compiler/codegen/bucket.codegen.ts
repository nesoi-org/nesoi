import type { Code, CodeLine, CodeBlock, CodeIf } from './codegen';
import { c } from './codegen'

export type FieldFn = {
    field: $BucketModelField
    depth: number,
    cast: string
    clone: string
    get: string
    children?: Record<string, FieldFn>
}

const PRIMITIVE_TYPES = ['boolean','enum','float','int','literal','regex','string','unknown']
const NESOI_TYPES = ['date','datetime','decimal','duration']
const COMPLEX_TYPES = ['obj','list','dict','union']

export class BucketModelCode {

    public schema: $BucketModelField
    public depth: number

    public if_is_empty: CodeIf;
    public cast_fn: Code;
    public clone_fn: Code;
    
    public children?: Record<string, BucketModelCode>

    constructor(
        schema: $BucketModelField,
        depth = -1
    ) {
        this.schema = schema;
        this.depth = depth;

        this.if_is_empty = c.if(this._isEmpty());

        // Complex Field
        if (schema.children) {
            this.clone_fn = c.line('');
            this.cast_fn = c.block([
                this._typecheck_complex()
            ]);
            this.children = this._children()
        }
        // Primitive field
        else {
            this.clone_fn = c.line('$target = $source;');
            this.cast_fn = c.block(
                PRIMITIVE_TYPES.includes(schema.type)
                    ? [
                        this._typecheck_primitive(),
                        this.clone_fn   
                    ]
                    : [
                        this._typecheck_nesoi(),
                    ]
            );
        }
    }

    public _error = (kind: 'required'|'type'|'data'|'union', extra?: string): CodeLine => {
        switch (kind) {
        case 'required': return c.line('throw op.err.required($modelpath, op.id)');
        case 'type': return c.line(`throw op.err.type($source, $modelpath, '${extra}', op.id)`);
        case 'data': return c.line(`throw op.err.data($source, $modelpath, '${extra}', op.id)`);
        case 'union': return c.line(`throw op.err.union($source, $modelpath, ${extra}, op.id)`);
        }
        return undefined as never
    }

    protected _isEmpty() {
        switch (this.schema.type) {
        case 'boolean':
        case 'float':
        case 'int':
        case 'unknown':
        case 'union':
            return '$source == null';
        case 'date':
        case 'datetime':
        case 'duration':
        case 'decimal':
        case 'enum':
        case 'string':
        case 'literal':
        case 'regex':
        case 'file':
        case 'obj':
        case 'list':
        case 'dict':
            return '!$source';
        }
    }

    protected _typecheck_primitive(): CodeBlock {
        switch (this.schema.type) {
        case 'boolean':
            return c.block([    
                c.if('typeof $source !== \'boolean\'', this._error('type', 'boolean'))
            ]);
        case 'enum': {
            const options = Object.keys(this.schema.meta!.enum!.options).map(opt => `'${opt}'`);
            return c.block([
                c.if('typeof $source !== \'string\'', this._error('type', 'string')),
                c.if(`![${options}].includes($source)`, this._error('data', `is not a valid enum option. Options: ${Object.keys(this.schema.meta!.enum!.options)}`))
            ])
        }
        case 'float':
            return c.block([    
                c.if('typeof $source !== \'number\'', this._error('type', 'number'))
            ]);
        case 'int':
            return c.block([
                c.if('typeof $source !== \'number\'', this._error('type', 'number')),
                c.if('parseInt($source) != $source', this._error('data', 'should be integer'))
            ])
        case 'literal':
            return c.block([
                c.if('typeof $source !== \'string\'', this._error('type', 'string')),
                c.if(`$source !== '${this.schema.meta!.literal!.template}'`, this._error('data', `should be \\'${this.schema.meta!.literal!.template}\\'`))
            ])
        case 'regex':
            return c.block([
                c.if('typeof $source !== \'string\'', this._error('type', 'string')),
                c.if(`!$source.match(/${this.schema.meta!.regex!.template}/)`, this._error('data', `should match the regex /${this.schema.meta!.regex!.template}/`))
            ])
        case 'string':
            return c.block([    
                c.if('typeof $source !== \'string\'', this._error('type', 'string'))
            ]);
        }
        return undefined as never
    }

    protected _typecheck_nesoi(): CodeIf {
        switch (this.schema.type) {
        case 'date':
            return c.if('$source instanceof _inc.NesoiDate',
                c.line('$target = $source;'),
                [
                    ['typeof $source === \'string\'', c.block([
                        c.line('const date = _inc.NesoiDate.silent.fromISO($source);'),
                        c.if('!date', this._error('data', 'is not a valid ISO date')),
                        c.line('$target = date;'),
                    ])]
                ],
                this._error('type', 'date')
            )
        case 'datetime':
            return c.if('$source instanceof _inc.NesoiDatetime',
                c.line('$target = $source;'),
                [
                    ['typeof $source === \'string\'', c.block([
                        c.line('const datetime = _inc.NesoiDatetime.silent.fromISO($source);'),
                        c.if('!datetime', this._error('data', 'is not a valid ISO datetime')),
                        c.line('$target = datetime;'),
                    ])]
                ],
                this._error('type', 'datetime')
            )
        case 'duration':
            return c.if('$source instanceof _inc.NesoiDuration',
                c.line('$target = $source;'),
                [
                    ['typeof $source === \'string\'', c.block([
                        c.line('const duration = _inc.NesoiDuration.silent.fromString($source);'),
                        c.if('!duration', this._error('data', 'is not a valid duration')),
                        c.line('$target = duration;'),
                    ])]
                ],
                this._error('type', 'duration')
            )
        case 'decimal':
            return c.if('$source instanceof _inc.NesoiDecimal',
                c.line('$target = $source;'),
                [
                    ['typeof $source === \'string\'', c.block([
                        c.line('const decimal = _inc.NesoiDecimal.silent.fromString($source);'),
                        c.if('!decimal', this._error('data', 'is not a valid decimal')),
                        c.line('$target = decimal;'),
                    ])]
                ],
                this._error('type', 'decimal')
            )
        case 'file':
            return c.if('typeof $source !== \'object\'', this._error('type', 'file'));
        }

        return undefined as never
    }

    protected _typecheck_complex(): CodeIf | CodeLine {
        switch (this.schema.type) {
        case 'list':
            return c.if('typeof $source !== \'object\' || !Array.isArray($source)', this._error('type', 'list'));
            
        case 'dict':
            return c.if('typeof $source !== \'object\'', this._error('type', 'dict'));

        case 'obj':
            return c.if('typeof $source !== \'object\'', this._error('type', 'object'));
        }
        return c.line('');
    }

    protected _children(): Record<string, BucketModelCode> {
        switch (this.schema.type) {
            
        case 'list':
        case 'dict':
            return {
                '#': new BucketModelCode(this.schema.children!['#'], this.depth+1)
            }
        case 'obj': {
            const children: Record<string, BucketModelCode> = {};
            for (const key in this.schema.children) {
                children[key] = new BucketModelCode(this.schema.children[key], this.depth+1);
            }
            return children;
        }
        case 'union': {
            const children: Record<string, BucketModelCode> = {};
            for (const key in this.schema.children) {
                children[key] = new BucketModelCode(this.schema.children[key], this.depth);
            }
            return children;
        }}

        return undefined as never
    }

    //

    protected compile_required_rule(
        kind: 'clone'|'cast',
        block: CodeBlock
    ) {
        if (kind === 'cast') {
            let code;
            if (this.schema.required) {
                code = c.block([
                    c.if(this.if_is_empty.cond, this._error('required')),
                    block
                ])
            }
            else {
                code = c.block([
                    c.if(this.if_is_empty.cond, undefined, undefined, block),
                ])
            }
            return code;
        }
        return block;
    }

    protected compile_complex_typecheck(
        kind: 'clone'|'cast',
        block: Code[],
        d: number
    ) {
        if (d >= 0) {
            if (kind === 'cast') {
                block.push(this.cast_fn)
            }
        }
    }

    public compile_obj(
        kind: 'clone'|'cast',
        target: string = 'copy',
        source: string = 'val',
        modelpath: string = '',
        d = 0,
        compile_item = this.compile_obj_item
    ): CodeBlock {
        const block: Code[] = [];
        this.compile_complex_typecheck(kind, block, d);
        if (d >= 0) block.push(c.line(`${target} = {};\n`));
        for (const key in this.children!) {
            const child = this.children![key];
            block.push(c.line(`/* ${child.schema.path} */\n`));
            block.push(
                compile_item(this.children![key], key, kind, target, source, modelpath, d)
            )
            block.push(c.line('\n'));
        }
        return c.block(block);
    }

    protected compile_obj_item(
        code: BucketModelCode,
        key: string,
        kind: 'clone'|'cast',
        target: string,
        source: string,
        modelpath: string = '',
        obj_d = 0
    ): Code {
        return code.compile(
            kind,
            `${target}.${key}`,
            `${source}.${key}`,
            `${modelpath}${modelpath.length ? '.' : ''}${key}`,
            obj_d+1
        )
    }

    public compile_list(
        kind: 'clone'|'cast',
        target: string = 'copy',
        source: string = 'val',
        modelpath: string = '',
        d = 0,
        compile_item = this.compile_list_item
    ): CodeBlock {
        const block: Code[] = [];
        this.compile_complex_typecheck(kind, block, d);

        block.push(c.line(`${target} = [];\n`));
        block.push(c.line(`const list${d} = ${source};`));

        const loop = c.for(d, '0', `list${d}.length`,
            compile_item(this.children!['#'], `i${d}`, kind, target, `list${d}`, modelpath, d)
        );
        block.push(loop);
        return c.block(block, { isolated: true });
    }

    protected compile_list_item(
        code: BucketModelCode,
        index: string,
        kind: 'clone'|'cast',
        target: string,
        source: string,
        modelpath: string = '',
        list_d = 0
    ): Code {
        return code.compile(
            kind,
            `${target}[${index}]`,
            `${source}[${index}]`,
            `${modelpath}${modelpath.length ? '.' : ''}\${${index}}`,
            list_d+1
        )
    }

    public compile_dict(
        kind: 'clone'|'cast',
        target: string = 'copy',
        source: string = 'val',
        modelpath: string = '',
        d = 0,
        compile_item = this.compile_dict_item
    ): CodeBlock {
        const block: Code[] = [];
        this.compile_complex_typecheck(kind, block, d);
        
        block.push(c.line(`${target} = {};\n`));
        block.push(c.line(`const dict${d} = ${source};`));
        block.push(c.line(`const k${d} = Object.keys(dict${d});\n`));
        const loop = c.for(d, '0', `k${d}.length`,
            compile_item(this.children!['#'], `k${d}[i${d}]`, kind, target, `dict${d}`, modelpath, d)
        );
        block.push(loop);
        return c.block(block, { isolated: true });
    }

    protected compile_dict_item(
        code: BucketModelCode,
        key: string,
        kind: 'clone'|'cast',
        target: string,
        source: string,
        modelpath: string = '',
        dict_d = 0
    ): Code {
        return code.compile(
            kind,
            `${target}[${key}]`,
            `${source}[${key}]`,
            `${modelpath}${modelpath.length ? '.' : ''}\${${key}}`,
            dict_d+1
        )
    }

    public compile_union(
        kind: 'clone'|'cast',
        target: string = 'copy',
        source: string = 'val',
        modelpath: string = '',
        d = 0,
        extra?: Record<string, any>
    ): CodeBlock {
        const block: Code[] = [];
        if (kind === 'clone') {
            const set = new Set<string>();
            for (const key in this.children!) {
                const child = this.children![key];
                set.add(c.to_str(child.compile(kind, target, source, modelpath, d)));
            }
            if (set.size == 1) {
                block.push(c.line([...set][0]));
            }
            else {
                for (const union_fn of set) {
                    block.push(c.try(c.line(union_fn)));
                }
            }
        }
        else {
            block.push(c.line('let errors = [];'));
            let _try;
            for (const key in this.children!) {
                const child = this.children![key];
                const child_fn = child.compile(kind, target, source, modelpath, d);
                const _try = c.try(
                    c.block([
                        child_fn,
                        c.line('errors = [];'),
                    ]),
                    c.line('errors.push(e);')
                );
                block.push(
                    key === '0'
                        ? _try
                        : c.if('errors.length', _try)
                );
            }
            block.push(
                c.if('errors.length', this._error('union', 'errors'))
            );
        }
        return c.block(block);
    }

    public compile(
        kind: 'clone'|'cast',
        target: string = 'copy',
        source: string = 'val',
        modelpath: string = '',
        d = 0
    ): Code {
        let block: CodeBlock;

        switch (this.schema.type) {
        case 'obj':
            block = this.compile_obj(kind, target, source, modelpath, d);
            break;
        case 'list':
            block = this.compile_list(kind, target, source, modelpath, d);
            break;
        case 'dict':
            block = this.compile_dict(kind, target, source, modelpath, d);
            break;
        case 'union':
            block = this.compile_union(kind, target, source, modelpath, d);
            break;
        default:
            block = c.block([
                this[(kind+'_fn') as 'clone_fn'|'cast_fn']
            ])
            break;
        }

        block = this.compile_required_rule(kind, block);
        
        return c.line(c.to_str(
            c.block([block], {isolated: true})
        )
            .replaceAll('$target', target)
            .replaceAll('$source', source)
            .replaceAll('$modelpath', modelpath.includes('$') ? `\`${modelpath}\`` : `'${modelpath}'`))
    }
}