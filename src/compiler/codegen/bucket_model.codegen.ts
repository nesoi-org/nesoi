/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import type { BucketModel } from '~/elements/entities/bucket/model/bucket_model';
import { CodegenInject } from './codegen';

type FieldFn = {
    field: $BucketModelField
    depth: number,
    cast: string
    clone: string
    children?: Record<string, FieldFn>
}

// Step 1:
// Make a tree of functions for casting or cloning a given field

function makeIsEmptyCondition(field: $BucketModelField) {
    switch (field.type) {
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

function makeFnTree(
    field: $BucketModelField,
    depth = -1
) {
    const fn: FieldFn = {
        field,
        depth,
        cast: '',
        clone: ''
    };

    // Init

    const is_primitive = !field.children;
        
    // Errors

    const error = (kind: 'required'|'type'|'data'|'union', extra?: string) => {
        let e;
        switch (kind) {
        case 'required': e = 'op.err.required($modelpath, op.id)';
            break;
        case 'type': e = `op.err.type($source, $modelpath, '${extra}', op.id)`;
            break;
        case 'data': e = `op.err.data($source, $modelpath, '${extra}', op.id)`;
            break;
        }
        return `throw ${e};`
    }

    // Required
    const is_empty = makeIsEmptyCondition(field);
    if (field.required) {
        fn.cast += `if (${is_empty}) ${error('required')}\n`;
    }
    else {
        fn.cast += ` if (${is_empty}) $target = undefined;\n`;
        fn.cast += ' else {\n';
    }

    // Field specific

    if (is_primitive) {
        fn.clone = '$target = $source;\n';
    }

    switch (field.type) {
    
    // primitive

    case 'boolean':
        fn.cast += `if (typeof $source !== 'boolean') ${error('type', 'boolean', )}\n`;
        break;
    case 'date':
        fn.cast += 'if ($source instanceof _inc.NesoiDate) {\n';
        fn.cast += '  $target = op.cast == 1 ? $source : $source.toISO();\n';
        fn.cast += '}\n';
        fn.cast += 'else if (typeof $source === \'string\') {\n';
        fn.cast += '  const date = _inc.NesoiDate.silent.fromISO($source);\n';
        fn.cast += `  if (!date) ${error('data', 'is not a valid ISO date')}\n`;
        fn.cast += '  $target = op.cast == 1 ? date : $source;\n';
        fn.cast += '}\n';
        fn.cast += `else ${error('type', 'date')}\n`;
        break;
    case 'datetime':
        fn.cast += 'if ($source instanceof _inc.NesoiDatetime) {\n';
        fn.cast += '  $target = op.cast == 1 ? $source : $source.toISO();\n';
        fn.cast += '}\n';
        fn.cast += 'else if (typeof $source === \'string\') {\n';
        fn.cast += '  const datetime = _inc.NesoiDatetime.silent.fromISO($source);\n';
        fn.cast += `  if (!datetime) ${error('data', 'is not a valid ISO datetime')};\n`;
        fn.cast += '  $target = op.cast == 1 ? datetime : $source;\n';
        fn.cast += '}\n';
        fn.cast += `else ${error('type', 'datetime')}\n`;
        break;
    case 'duration':
        fn.cast += 'if ($source instanceof _inc.NesoiDuration) {\n';
        fn.cast += '  $target = op.cast == 1 ? $source : $source.toString();\n';
        fn.cast += '}\n';
        fn.cast += 'else if (typeof $source === \'string\') {\n';
        fn.cast += '  const duration = _inc.NesoiDuration.silent.fromString($source);\n';
        fn.cast += `  if (!duration) ${error('data', 'is not a valid ISO duration')}\n`;
        fn.cast += '  $target = op.cast == 1 ? duration : $source;\n';
        fn.cast += '}\n';
        fn.cast += `else ${error('type', 'duration')}\n`;
        break;
    case 'decimal':
        fn.cast += 'if ($source instanceof _inc.NesoiDecimal) {\n';
        fn.cast += '  $target = op.cast == 1 ? $source : $source.toString();\n';
        fn.cast += '}\n';
        fn.cast += 'else if (typeof $source === \'string\') {\n';
        fn.cast += '  const decimal = _inc.NesoiDecimal.silent.fromString($source);\n';
        fn.cast += `  if (!decimal) ${error('data', 'is not a valid ISO decimal')}\n`;
        fn.cast += '  $target = op.cast == 1 ? decimal : $source;\n';
        fn.cast += '}\n';
        fn.cast += `else ${error('type', 'decimal')}\n`;
        break;
    case 'enum': {
        const options = Object.keys(field.meta!.enum!.options)
            .map(opt => `'${opt}'`);
        fn.cast += `if (typeof $source !== 'string') ${error('type', 'string')}\n`;
        fn.cast += `if (![${options}].includes($source)) ${error('data', `is not a valid enum option. Options: ${Object.keys(field.meta!.enum!.options)}`)}\n`;
        break;
    }
    case 'file':
        fn.cast += `if (typeof $source !== 'object') ${error('type', 'file')}\n`;
        fn.clone = '$target = NesoiFile.from($source, {});\n';
        break;
    case 'float':
        fn.cast += `if (typeof $source !== 'number') ${error('type', 'number')}\n`;
        break;
    case 'int':
        fn.cast += `if (typeof $source !== 'number') ${error('type', 'number')}\n`;
        fn.cast += `if (parseInt($source) != $source) ${error('data', 'should be integer')}\n`;
        break;
    case 'literal':
        fn.cast += `if (typeof $source !== 'string') ${error('type', 'string')}\n`;
        fn.cast += `if ($source !== '${field.meta!.literal!.template}') ${error('data', `should be \\'${field.meta!.literal!.template}\\'`)}\n`;
        break;
    case 'regex':
        fn.cast += `if (typeof $source !== 'string') ${error('type', 'string')}\n`;
        fn.cast += `if (!$source.match(/${field.meta!.regex!.template}/)) ${error('data', `should match the regex /${field.meta!.regex!.template}/`)}\n`;
        break;
    case 'string':
        fn.cast += `if (typeof $source !== 'string') ${error('type', 'string')}\n`;
        break;
    case 'unknown':
        break;

        // complex

    case 'list':
        fn.cast += `if (typeof $source !== 'object' || !Array.isArray($source)) ${error('type', 'list')}\n`;
        fn.children = {};
        fn.children['#'] = makeFnTree(field.children!['#'], depth+1);
        break;
        
    case 'dict':
        fn.cast += `if (typeof $source !== 'object') ${error('type', 'dict')}\n`;
        fn.children = {};
        fn.children['#'] = makeFnTree(field.children!['#'], depth+1);
        break;

    case 'obj':
        fn.cast += `if (typeof $source !== 'object') ${error('type', 'object')}\n`;
        fn.children = {}
        for (const key in field.children!) {
            const child = field.children[key];
            fn.children[key] = makeFnTree(child, depth+1);
        }
        break;

    case 'union':
        fn.children = {}
        for (const key in field.children!) {
            const child = field.children[key];
            fn.children[key] = makeFnTree(child, depth);
        }
        break;
    }

    if (is_primitive && !['date', 'datetime', 'duration', 'decimal'].includes(field.type)) {
        fn.cast += '' + fn.clone;
    }

    // Required
    if (!field.required) {
        fn.cast += ' }\n';
    }
    
    return fn;
}

// Step 2:
// Build a copy function from the tree

function buildModelpath(modelpath: string, key: string, key_is_param = false) {
    const prefix = modelpath ? (modelpath+'.') : modelpath;
    const _modelpath = key_is_param
        ? `${prefix}\${${key}}`
        : `${prefix}${key}`;

    let str;
    if (_modelpath.includes('$')) {
        str = `\`${_modelpath}\``
    }
    else {
        str = `'${_modelpath}'`;
    }

    return {
        chain: _modelpath,
        str
    }
}

function buildCopyFn(
    kind: 'cast'|'clone',
    _fn: FieldFn,
    target?: string,
    source = 'val',
    modelpath = '',
    get?: {
        obj_prefix: (_fn: FieldFn) => string
        list_prefix: (_fn: FieldFn, source: string) => string
        dict_prefix: (_fn: FieldFn, source: string) => string
        obj_field_prefix: (_fn: FieldFn) => string
    }
) {
    const d = _fn.depth < 0 ? '' : _fn.depth.toString();
    
    let fn = '';

    // setup
    switch (_fn.field.type) {
    case 'obj':
        if (target) fn += `${target} = {};\n`;
        else fn += `let out${d} = {};\n`;
        if (get) fn += `${get.obj_prefix(_fn)}\n`;
        break;
    case 'list':
        if (get) fn += `${get.list_prefix(_fn, source)}\n`;
        fn += '{\n'
        if (get) {
            fn += `  let i${d}, n${d};\n`;
            fn += `  if (spread) { i${d} = 0; n${d} = ${source}.length; }\n`;
            fn += `  else { i${d} = idx; n${d} = idx+1; }\n`;
        }
        else {
            fn += `  let i${d} = 0, n${d} = ${source}.length;\n`;
        }
        if (target) fn += `  ${target} = Array(n${d}-i${d});\n`;
        else fn += `  let out${d} = Array(n${d}-i${d});\n`;
        break;
    case 'dict':
        if (get) fn += `${get.dict_prefix(_fn, source)}\n`;
        fn += '{\n'
        if (get) {
            fn += `  let k${d}, i${d}, n${d};\n`;
            fn += '  if (spread) {\n'
            fn += `    k${d} = Object.keys(${source});\n`;
            fn += `    i${d} = 0; n${d} = k${d}.length;\n`;
            fn += '  }\n';
            fn += `  else { k${d} = [op.path[${_fn.depth+1}]]; i${d} = 0; n${d} = 1; }\n`;
        }
        else {
            fn += `  let k${d} = Object.keys(${source});\n`;
            fn += `  let i${d} = 0, n${d} = k${d}.length;\n`;
        }
        if (target) fn += `  ${target} = {};\n`;
        else fn += `  let out${d} = {};\n`;
        break;
    }
    target ??= `out${d}`;

    // children
    if (_fn.children) {
        if (_fn.field.type == 'obj') {
            for (const key in _fn.children) {
                const _modelpath = buildModelpath(modelpath,key);
                const child = _fn.children![key];
                if (kind === 'cast') {
                    fn += `\n// ${child.field.path}\n`;
                }
                if (get) fn += `${get.obj_field_prefix(child)} {\n`;
                let children_fn = '';
                if (child[kind]) {
                    children_fn += child[kind]
                        .replaceAll('$target', `${target}.${key}`)
                        .replaceAll('$source', `${source}.${key}`)
                        .replaceAll('$modelpath', _modelpath.str);
                }
                if (child.children) {
                    children_fn += buildCopyFn(kind, child, `${target}.${key}`, `${source}.${key}`, _modelpath.chain, get);
                }
                if (get) fn += '  ' + children_fn.replaceAll('\n', '\n  ').slice(0,-2) + '}\n';
                else fn += children_fn;
            }
            if (get) fn += `if (!spread) ${target} = ${target}[op.path[${_fn.depth+1}]]\n`;
        }
        else if (_fn.field.type == 'list' || _fn.field.type == 'dict') {
            const child = _fn.children!['#'];
            let _target, _source, _modelpath;
            if (_fn.field.type == 'list') {
                _target = `${target}[i${d}]`;
                _source = `${source}[i${d}]`;
                _modelpath = buildModelpath(modelpath,`i${d}`,true);
            }
            else {
                _target = `${target}[k${d}[i${d}]]`;
                _source = `${source}[k${d}[i${d}]]`;
                _modelpath = buildModelpath(modelpath,`k${d}[i${d}]`,true);
            }

            fn += `  while (i${d} < n${d}) {\n`

            let children_fn = '';
            if (child[kind]) {
                children_fn += '    ' + child[kind]
                    .replaceAll('$target', _target)
                    .replaceAll('$source', _source)
                    .replaceAll('$modelpath', _modelpath.str)
                    .replaceAll('\n','\n    ').slice(0,-2);
            }
            if (child.children) {
                children_fn += '    ' + buildCopyFn(kind, child, _target, _source, _modelpath.chain, get)
                    .replaceAll('\n','\n    ').slice(0,-2);
            }
            fn += children_fn;
            fn += `  i${d}++;\n`
            fn += '  }\n'
            fn += '}\n'

            if (get) fn += `if (!spread) ${target} = ${target}[idx]\n`;
        }
        if (_fn.field.type == 'union') {
            const inner_set = new Set<string>();
            for (const key in _fn.children) {
                const child = _fn.children![key];
                const _modelpath = buildModelpath(modelpath,'');
                let inner_fn = '';
                if (child[kind]) {
                    inner_fn += child[kind]
                        .replaceAll('$target', target)
                        .replaceAll('$source', source)
                        .replaceAll('$modelpath', _modelpath.str);
                }
                if (child.children) {
                    inner_fn += buildCopyFn(kind, child, target, source, _modelpath.chain);
                }
                inner_set.add(inner_fn);
            }
            const inner = [...inner_set]
            if (inner.length == 1) {
                fn += inner[0];
            }
            else {
                fn += `\nconst e${d} = [];\n`;
                for (let i = 0; i < inner.length; i++) {
                    if (i != 0) {
                        fn += `if (e${d}.length == ${i}) { `;
                    }
                    fn += 'try {\n'
                    fn += '  ' + inner[i]
                        .replaceAll('\n','\n  ').slice(0,-2);
                    fn += '}\n'
                    fn += `catch (e) { e${d}.push(e); }`
                    if (i != 0) fn += ' }'
                    fn += '\n'
                }
                fn += `if (e${d}.length == ${inner.length}) throw op.err.union(${source}, \`${modelpath}\`, e${d}, op.id)\n`;
            }

            if (get) fn += `if (!spread) ${target} = ${source}[k${d}[0]]\n`;
        }
    }
    
    if (_fn.depth == -1) {
        fn += '\n';
        fn += 'return out;\n';
    }
    return fn;
}

// Step 3:
// Build a get function from the tree

function buildGetFn(
    _fn: FieldFn,
    d = 0,
    source = 'val',
    target?: string
) {
    let fn = '';
    const is_primitive = !_fn.field.children;

    fn += ''
    fn += buildCopyFn('clone', _fn, undefined, undefined, undefined, {
        obj_prefix: _fn =>
            `const spread = !op.path[${_fn.depth+1}] || op.path[${_fn.depth+1}] === '*';`,
        list_prefix: _fn =>
            `let idx = op.path[${_fn.depth+1}];\n`
            + 'const spread = !idx || idx === \'*\';\n'
            + 'if (!spread) {\n'
            + '  idx = parseInt(idx);\n'
            + `  if (idx < 0) idx += ${source}.${_fn.field.name}.length;\n`
            + '  else if (!(idx >= 0)) return undefined;\n'
            + `  if (idx >= ${source}.${_fn.field.name}.length) return undefined;\n`
            + '}'
        ,
        dict_prefix: _fn =>
            `let idx = op.path[${_fn.depth+1}];\n`
            + 'const spread = !idx || idx === \'*\';'
            + 'if (!spread) {\n'
            + `  if (!(idx in ${source}.${_fn.field.name})) return undefined;\n`
            + '}'
        ,
        obj_field_prefix: _fn =>
            `if (spread || op.path[${_fn.depth}] === '${_fn.field.name}')`,
    });

    return fn;    
}

// function buildGetFn(
//     _fn: FieldFn,
//     d = 0,
//     source = 'val',
//     target?: string
// ) {
//     let fn = '';
//     const is_primitive = !_fn.field.children;
//     const _return = target
//         ? `${target} =`
//         : 'return';
//     if (is_primitive) {
//         fn += `if (op.path.length > ${d}) ${_return} undefined;\n`;
//         if (!target || _fn.field.children) {
//             fn += 'else { ' + _fn.clone
//                 .replaceAll('$target =', _return)
//                 .replaceAll('$source', source)
//                 .replaceAll('\n','\n  ').slice(0,-3);
//             fn += ' }\n';
//         }
//     }
//     else {
//         const _continue = `i${d-1}++; continue;`;
//         const is_empty = makeIsEmptyCondition(_fn.field)
//             .replaceAll('$source', source);
//         fn += `if (${is_empty}) { ${_return} undefined;`;
//         if (target)
//             fn += ` ${_continue}`;
//         fn += ' }\n';

//         fn += `if (op.path.length == ${d}) { `;
//         if (target) fn += `${_continue} }\n`;
//         else fn += `${_return} ${source}; }\n`;

//         fn += `const key${d} = op.path[${d}];\n`;
//         switch (_fn.field.type) {
//         case 'obj': {
//             let k = 0;
//             for (const key in _fn.children) {
//                 const child = _fn.children[key];
//                 fn += `${k > 0 ? 'else ' : ''}if (key${d} === '${key}') {\n`;
//                 fn += '  ' + buildGetFn(child, d+1, `${source}.${key}`, target)
//                     .replaceAll('\n','\n  ').slice(0,-2);
//                 fn += '}\n';
//                 k++;
//             }
//             fn += `else ${_return} undefined;\n`;
//             break;
//         }
//         case 'list': {
//             const child = _fn.children!['#'];
//             fn += `let v${d};\n`;
//             fn += `if (key${d} === '*') v${d} = ${source};\n`;
//             fn += 'else {\n';
//             fn += `  let idx${d} = parseInt(key${d});\n`;
//             fn += `  if (idx${d} >= 0 || idx${d} < 0) { // !NaN\n`;
//             fn += `    if (idx${d} < 0) idx${d} += ${source}.length;\n`;
//             fn += `    v${d} = [${source}[idx${d}]];\n`;
//             fn += '  }\n';
//             fn += `  else ${_return} undefined;\n`;
//             fn += '}\n';
//             fn += `let i${d} = 0, n${d} = v${d}.length;\n`;
//             fn += `while (i${d} < n${d}) {\n`;
//             fn += '  ' + buildGetFn(child, d+1, `v${d}[i${d}]`, `v${d}[i${d}]`)
//                 .replaceAll('\n','\n  ').slice(0,-2);
//             fn += `  i${d}++;\n`;
//             fn += '}\n';
//             fn += `if (key${d} === '*') ${_return} v${d};\n`;
//             fn += `else ${_return} v${d}[0];\n`;
//             break;
//         }
//         case 'dict': {
//             const child = _fn.children!['#'];
//             fn += `let v${d};\n`;
//             fn += `if (key${d} === '*') v${d} = ${source};\n`;
//             fn += 'else {\n';
//             fn += `  let idx${d} = parseInt(key${d});\n`;
//             fn += `  if (idx${d} >= 0 || idx${d} < 0) { // !NaN\n`;
//             fn += `    if (idx${d} < 0) idx${d} += ${source}.length;\n`;
//             fn += `    v${d} = [${source}[idx${d}]];\n`;
//             fn += '  }\n';
//             fn += `  else ${_return} undefined;\n`;
//             fn += '}\n';
//             fn += `let k${d} = Object.keys(v${d});\n`;
//             fn += `let i${d} = 0, n${d} = k${d}.length;\n`;
//             fn += `while (i${d} < n${d}) {\n`;
//             fn += '  ' + buildGetFn(child, d+1, `v${d}[k${d}[i${d}]]`, `v${d}[k${d}[i${d}]]`)
//                 .replaceAll('\n','\n  ').slice(0,-2);
//             fn += `  i${d}++;\n`;
//             fn += '}\n';
//             fn += `if (key${d} === '*') ${_return} v${d};\n`;
//             fn += `else ${_return} v${d}[0];\n`;
//             break;
//         }
//         }
//     }

//     return fn;    
// }

// Step 4:
// Expose a method to be used by the BucketModel

export function _makeFn(
    kind: 'cast' | 'clone',
    schema: $BucketModel,
) {
    const tree = makeFnTree({
        required: true,
        type: 'obj',
        path: '',
        children: schema.fields
    } as unknown as $BucketModelField);
    
    const fn_str = buildCopyFn(kind, tree);
    // console.log(fn_str);

    const fn = new Function('_inc', 'op', 'val', fn_str)
        .bind({ children: schema.fields });
    Object.defineProperty(fn, 'name', { value: 'copy' });

    return fn;
}

export function makeCastFn(
    schema: $BucketModel,
): BucketModel<any, any>['cast'] {
    const fn = _makeFn('cast', schema);
    function __fn (this: BucketModel<any, any>, obj: any, cast?: 1|2) {
        return fn(CodegenInject, {
            err: (this as any)._e,
            cast: cast ?? 1,
            id: obj.id
        }, obj);
    }
    return __fn;
}

export function makeCloneFn(
    schema: $BucketModel,
): BucketModel<any, any>['clone'] {
    const fn = _makeFn('clone', schema);
    function __fn (this: BucketModel<any, any>, obj: any) {
        return fn(CodegenInject, {
            err: (this as any)._e,
            id: obj.id
        }, obj);
    }
    return __fn;
}

export function makeGetFn(schema: $BucketModel): BucketModel<any, any>['get2'] {
    const tree = makeFnTree({
        required: true,
        type: 'obj',
        path: '',
        children: schema.fields
    } as unknown as $BucketModelField);
    
    const fn_str = buildGetFn(tree);
    // console.log(fn_str);

    const fn = new Function('_inc', 'op', 'val', fn_str)
        .bind({ children: schema.fields });
    Object.defineProperty(fn, 'name', { value: 'copy' });

    function __fn (this: BucketModel<any, any>, obj: Record<string, any>, path: string[], options?: {
        cast?: 0|1|2
    }) {
        return fn(CodegenInject, {
            err: (this as any)._e,
            id: obj.id,
            path,
            cast: options?.cast
        }, obj);
    }
    return __fn;
}