import type { BucketModel } from '~/elements/entities/bucket/model/bucket_model';
import { NesoiDate } from '~/engine/data/date';
import { NesoiDatetime } from '~/engine/data/datetime';
import { NesoiDecimal } from '~/engine/data/decimal';
import { NesoiDuration } from '~/engine/data/duration';

const NesoiIncludes = {
    NesoiDate: NesoiDate,
    NesoiDatetime: NesoiDatetime,
    NesoiDuration: NesoiDuration,
    NesoiDecimal: NesoiDecimal
};

/* Parse: parse a JSON object into a Nesoi object for a given bucket */

function makeParseFieldFn(
    field: $BucketModelField,
    _obj: string,
    _copy: string,
    modelpath: string,
    pad = '',
    depth = 0,
    union_depth = 0
) {
    const modelpath_str = `\`${modelpath}\``;
    let fn = '\n';

    const error = (kind: 'required'|'type'|'data'|'union', extra?: string) => {
        let e;
        switch (kind) {
        case 'required': e = `this._e.required(${modelpath_str}, obj.id)`;
            break;
        case 'type': e = `this._e.type(${_obj}, ${modelpath_str}, '${extra}', obj.id)`;
            break;
        case 'data': e = `this._e.data(${_obj}, ${modelpath_str}, '${extra}', obj.id)`;
            break;
        case 'union': e = `this._e.data(${_obj}, ${modelpath_str}, errors${union_depth}, obj.id)`;
            break;
        }
        if (union_depth) {
            return `{ errors${union_depth-1}.push(${e}); continue; }`
        }
        return `throw ${e};`
    }

    if (!union_depth) {
        if (field.required) {
            fn += `${pad}if (${_obj} == null) ${error('required')}\n`;
        }
        else {
            fn += `${pad}if (${_obj} != null) {\n`;
            pad += '  ';
        }
    }

    switch (field.type) {
    case 'boolean':
        fn += `${pad}if (typeof ${_obj} !== 'boolean') ${error('type', 'boolean', )}\n`;
        fn += `${pad}${_copy} = ${_obj};\n`;
        break;
    case 'date':
        fn += `${pad}if (${_obj} instanceof _i.NesoiDate) {\n`;
        fn += `${pad}  ${_copy} = ${_obj};\n`;
        fn += `${pad}}\n`;
        fn += `${pad}else if (typeof ${_obj} === 'string') {\n`;
        fn += `${pad}  ${_copy} = _i.NesoiDate.silent.fromISO(${_obj});\n`;
        fn += `${pad}  if (!${_copy}) ${error('data', 'is not a valid ISO date')};\n`;
        fn += `${pad}}\n`;
        fn += `${pad}else ${error('type', 'date')}\n`;
        break;
    case 'datetime':
        fn += `${pad}if (${_obj} instanceof _i.NesoiDatetime) {\n`;
        fn += `${pad}  ${_copy} = ${_obj};\n`;
        fn += `${pad}}\n`;
        fn += `${pad}else if (typeof ${_obj} === 'string') {\n`;
        fn += `${pad}  ${_copy} = _i.NesoiDatetime.silent.fromISO(${_obj});\n`;
        fn += `${pad}  if (!${_copy}) ${error('data', 'is not a valid ISO datetime')};\n`;
        fn += `${pad}}\n`;
        fn += `${pad}else ${error('type', 'datetime')}\n`;
        break;
    case 'duration':
        fn += `${pad}if (${_obj} instanceof _i.NesoiDuration) {\n`;
        fn += `${pad}  ${_copy} = ${_obj};\n`;
        fn += `${pad}}\n`;
        fn += `${pad}else if (typeof ${_obj} === 'string') {\n`;
        fn += `${pad}  ${_copy} = _i.NesoiDuration.silent.fromString(${_obj});\n`;
        fn += `${pad}  if (!${_copy}) ${error('data', 'is not a valid ISO duration')};\n`;
        fn += `${pad}}\n`;
        fn += `${pad}else ${error('type', 'duration')}\n`;
        break;
    case 'decimal':
        fn += `${pad}if (${_obj} instanceof _i.NesoiDecimal) {\n`;
        fn += `${pad}  ${_copy} = ${_obj};\n`;
        fn += `${pad}}\n`;
        fn += `${pad}else if (typeof ${_obj} === 'string') {\n`;
        fn += `${pad}  ${_copy} = _i.NesoiDecimal.silent.fromString(${_obj});\n`;
        fn += `${pad}  if (!${_copy}) ${error('data', 'is not a valid ISO decimal')};\n`;
        fn += `${pad}}\n`;
        fn += `${pad}else ${error('type', 'decimal')}\n`;
        break;
    case 'enum': {
        const options = Object.keys(field.meta!.enum!.options)
            .map(opt => `'${opt}'`);
        fn += `${pad}if (typeof ${_obj} !== 'string') ${error('type', 'string')}\n`;
        fn += `${pad}if (![${options}].includes(${_obj})) ${error('data', `is not a valid enum option. Options: ${Object.keys(field.meta!.enum!.options)}`)}\n`;
        fn += `${pad}${_copy} = ${_obj};\n`;
        break;
    }
    case 'file':
        fn += `${pad}if (typeof ${_obj} !== 'object') ${error('type', 'file')}\n`;
        fn += `${pad}${_copy} = NesoiFile.from(${_obj}, {});\n`;
        break;
    case 'float':
        fn += `${pad}if (typeof ${_obj} !== 'number') ${error('type', 'number')}\n`;
        fn += `${pad}${_copy} = ${_obj};\n`;
        break;
    case 'int':
        fn += `${pad}if (typeof ${_obj} !== 'number') ${error('type', 'number')}\n`;
        fn += `${pad}if (!Number.isInteger(${_obj})) ${error('data', 'is not integer')}\n`;
        fn += `${pad}${_copy} = ${_obj};\n`;
        break;
    case 'literal':
        fn += `${pad}if (typeof ${_obj} !== 'string') ${error('type', 'string')}\n`;
        fn += `${pad}if (${_obj} !== '${field.meta!.literal!.template}') ${error('data', `should be \\'${field.meta!.literal!.template}\\'`)}\n`;
        fn += `${pad}${_copy} = ${_obj};\n`;
        break;
    case 'regex':
        fn += `${pad}if (typeof ${_obj} !== 'string') ${error('type', 'string')}\n`;
        fn += `${pad}if (!${_obj}.match(/${field.meta!.regex!.template}/)) ${error('data', `does not match the regex /${field.meta!.regex!.template}/`)}\n`;
        fn += `${pad}${_copy} = ${_obj};\n`;
        break;
    case 'string':
        fn += `${pad}if (typeof ${_obj} !== 'string') ${error('type', 'string')}\n`;
        fn += `${pad}${_copy} = ${_obj};\n`;
        break;
    case 'unknown':
        fn += `${pad}${_copy} = ${_obj};\n`;
        break;
    case 'list':
        fn += `${pad}if (typeof ${_obj} !== 'object' || !Array.isArray(${_obj})) ${error('type', 'array')}\n`;
        fn += `${pad}${_copy} = Array(${_obj}.length);\n`;
        fn += `${pad}{\n`;
        fn += `${pad}  const child${depth} = ${_copy};\n`;
        fn += `${pad}  let i${depth} = 0, n = ${_obj}.length;\n`;
        fn += `${pad}  while (i${depth} < n) {\n`;
        fn += `${pad}    const item${depth} = ${_obj}[i${depth}];\n`;
        fn += makeParseFieldFn(field.children!['#'], `item${depth}`, `child${depth}[i${depth}]`, `${modelpath}.\${i${depth}}`, pad+'    ', depth+1, union_depth);
        fn += `${pad}    i${depth}++;\n`;
        fn += `${pad}  }\n`;
        fn += `${pad}}\n`;
        break;
    case 'dict':
        fn += `${pad}if (typeof ${_obj} !== 'object') ${error('type', 'object')}\n`;
        fn += `${pad}${_copy} = {};\n`;
        fn += `${pad}{\n`;
        fn += `${pad}  const child${depth} = ${_copy};\n`;
        fn += `${pad}  const keys = Object.keys(${_obj});\n`;
        fn += `${pad}  let i${depth} = 0, n = keys.length;\n`;
        fn += `${pad}  while (i${depth} < n) {\n`;
        fn += `${pad}    const k = keys[i${depth}];\n`;
        fn += `${pad}    const item${depth} = ${_obj}[k];\n`;
        fn += makeParseFieldFn(field.children!['#'], `item${depth}`, `child${depth}[k]`, `${modelpath}.\${k}`, pad+'    ', depth+1, union_depth);
        fn += `${pad}    i${depth}++;\n`;
        fn += `${pad}  }\n`;
        fn += `${pad}}\n`;
        break;
    case 'obj':
        fn += `${pad}if (typeof ${_obj} !== 'object') ${error('type', 'object')}\n`;
        fn += `${pad}{\n`;
        fn += `${pad}  ${_copy} = {};\n`;
        for (const key in field.children!) {
            const child = field.children[key];
            fn += makeParseFieldFn(child, `${_obj}.${child.name}`, `${_copy}.${child.name}`, `${modelpath}.${child.name}`, pad+'  ', depth+1, union_depth);
        }
        fn += `${pad}}\n`;
        break;
    case 'union':
        fn += `${pad}{\n`;
        fn += `${pad}  let errors${union_depth} = [];\n`;
        fn += `${pad}  for (let u = 0; u < ${Object.keys(field.children!).length}; u++) {\n`;
        for (const key in field.children!) {
            const child = field.children[key];
            fn += `${pad}    if (u == ${key}) {\n`;
            fn += makeParseFieldFn(child, _obj, _copy, modelpath, pad+'      ', depth, union_depth+1);
            fn += `${pad}      errors${union_depth} = []; break;\n`;
            fn += `${pad}    }\n`;
        }
        fn += `${pad}  }\n`;
        fn += `${pad}  if (errors${union_depth}.length) ${error('union')}\n`;
        fn += `${pad}}\n`;
        break;
    }

    if (!union_depth) {
        if (!field.required) {
            fn += `${pad.slice(0,-2)}}\n`;
        }
    }
    return fn;
}

export function makeParseFn(schema: $BucketModel): BucketModel<any, any>['parse'] {
    let fn = 'const copy = {};\n';
    for (const key in schema.fields) {
        const field = schema.fields[key];
        fn += makeParseFieldFn(field, `obj.${field.name}`, `copy.${field.name}`, field.name);
    }
    fn += 'return copy;\n';
    // console.log(fn)

    const _fn = new Function('_i', 'obj', fn);
    function __fn (this: BucketModel<any, any>, obj: any) {
        return _fn.bind(this)(NesoiIncludes, obj)
    }
    return __fn;
}

/* Freezes a Nesoi object */

function makeFreezeFieldFn(field: $BucketModelField, _obj: string, pad = '', is_union_option = false) {
    let fn = '';
    
    if (!is_union_option)
        fn += `${pad}Object.freeze(${_obj});\n`;
    
    const _0 = field.required
        ? `${pad}{\n`
        : `${pad}if (${_obj}) {\n`;
    const _1 = `${pad}}\n`;
    pad += '  ';

    switch (field.type) {
    case 'list':
        if (field.children!['#'].children) {
            fn += _0;
            fn += `${pad}let i = 0, n = ${_obj}.length;\n`;
            fn += `${pad}while (i < n) {\n`;
            fn += `${pad}  const item = ${_obj}[i];\n`;
            fn += makeFreezeFieldFn(field.children!['#'], 'item', pad+'  ');
            fn += `${pad}  i++;\n`;
            fn += `${pad}}\n`;
            fn += _1;
        }
        break;
    case 'dict':
        if (field.children!['#'].children) {
            fn += _0;
            fn += `${pad}const keys = Object.keys(${_obj});\n`;
            fn += `${pad}let i = 0, n = keys.length;\n`;
            fn += `${pad}while (i < n) {\n`;
            fn += `${pad}  const item = ${_obj}[keys[i]];\n`;
            fn += makeFreezeFieldFn(field.children!['#'], 'item', pad+'  ');
            fn += `${pad}  i++;\n`;
            fn += `${pad}}\n`;
            fn += _1;
        }
        break;
    case 'obj':
        if (Object.values(field.children!).some(c => c.children)) {
            fn += _0;
            for (const key in field.children) {
                const child = field.children[key];
                if (!child.children) continue;
                fn += makeFreezeFieldFn(child, `${_obj}.${child.name}`, pad+'  ');
            }
            fn += _1;
        }
        break;
    case 'union': {
        let union_fn = '';
        for (const key in field.children!) {
            const child = field.children[key];
            if (!child.children) continue;
            const child_fn = makeFreezeFieldFn(child, _obj, pad+'  ', true);
            if (child_fn.length) {
                union_fn += `${pad}try {\n`;
                union_fn += child_fn;
                union_fn += `${pad}} catch {};\n`;
            }
        }
        if (union_fn.length) {
            fn += _0;
            fn += union_fn;
            fn += _1;
        }
        break;
    }
    }
    return fn;
}

export function makeFreezeFn(schema: $Bucket): BucketModel<any, any>['freeze'] {
    let fn = 'Object.freeze(obj);\n';
    for (const key in schema.model.fields) {
        const field = schema.model.fields[key];
        if (!field.children) continue;
        fn += makeFreezeFieldFn(field, `obj.${field.name}`);
    }
    
    return new Function('obj', fn) as any;
}

/* Gets a property from a Nesoi object */

function makeModelpathIterator(
    schema: $BucketModelFields,
    path: string[],
    i0 = 0,
    _obj = 'v',
    _target?: string,
    depth = 0,
    arg = 0,
    pad = '  '
): any {
    let field = { children: schema } as $BucketModelField;
    let _path = _obj;
    for (let i = i0; i < path.length; i++) {
        const p = path[i];
        if (!field.children) throw new Error(`Invalid modelpath '${path.join('.')}, field '${field.name}' has no children'`);
        if (p == '*') {
            // Spread List
            if (field.type === 'list') {
                const child = field.children!['#'];
                if (child.children) {
                    const iterator = makeModelpathIterator(child.children, path, i+1, `${_path}[i${depth}]`, `arr${depth}[i${depth}]`, depth+1, arg, pad+'  ');
                    return [true, ''+
                        `${pad}let i${depth} = 0, n = ${_path}?.length ?? 0;\n` +
                        `${pad}const arr${depth} = Array(n);\n` +
                        `${pad}while (i${depth} < n) {\n` +
                        (iterator[0]
                            ? `${iterator[1]}\n`
                            : `${pad}  arr${depth}[i${depth}] = ${iterator[1]}\n`) +
                        `${pad}  i${depth}++;\n` +
                        `${pad}}\n`+
                        ( _target
                            ? `${pad}${_target} = arr${depth};`
                            : `${pad}return arr${depth};\n`)]
                }
            }
            // Spread Dict
            if (field.type === 'dict') {
                const child = field.children!['#'];
                if (child.children) {
                    const iterator = makeModelpathIterator(child.children, path, i+1, `${_path}[keys${depth}[i${depth}]]`, `dict${depth}[keys${depth}[i${depth}]]`, depth+1, arg, pad+'  ');
                    return [true, ''+
                        `${pad}const keys${depth} = Object.keys(${_path} ?? {});\n` +
                        `${pad}let i${depth} = 0, n = keys${depth}.length ?? 0;\n` +
                        `${pad}const dict${depth} = {};\n` +
                        `${pad}while (i${depth} < n) {\n` +
                        (iterator[0]
                            ? `${iterator[1]}\n`
                            : `${pad}  dict${depth}[keys${depth}[i${depth}]] = ${iterator[1]}\n`) +
                        `${pad}  i${depth}++;\n` +
                        `${pad}}\n`+
                        ( _target
                            ? `${pad}${_target} = dict${depth};`
                            : `${pad}return dict${depth};\n`)]
                }
            }
            else throw new Error('Cannot spread!');
        }
        else if (p == '$') {
            if (field.type === 'list'
                || field.type === 'dict') {
                _path += `?.[args[${arg}]]`
            }
            else
                throw new Error(`Invalid modelpath '${path.join('.')}', field '${field.name}' doesn't support parametric access`);
            
            field = field.children['#'];
        }
        else {
            if (!(p in field.children)) throw new Error(`Invalid modelpath '${path.join('.')}', '${p}' not found on field '${field.name}'`);
            // Direct path
            field = field.children[p];
            _path += `?.${p}`
        }
    }
    return [false, _path];
}

function makeModelpathFn(schema: $Bucket, path: string) {
    const [has_return, fn] = makeModelpathIterator(schema.model.fields, path.split('.'))
    // console.log(fn)
    return new Function('v', 'args', (has_return ? '' : 'return ') + fn);
}

function makeFieldModelpathFns(schema: $Bucket, fields: $BucketModelFields = schema.model.fields, path = '') {
    const fns = {} as any;
    for (const name in fields) {
        const field = fields[name];
        fns[path+name] = makeModelpathFn(schema, path+name);
        if (field.children) {
            if (field.type === 'obj') {
                Object.assign(fns, makeFieldModelpathFns(schema, field.children, path+name+'.'))
            }
            else if (field.type === 'list' || field.type === 'dict') {
                fns[path+name+'.*'] = fns[path+name];
                fns[path+name+'.$'] = makeModelpathFn(schema, path+name+'.$');
                if (field.children['#']!.children) {
                    Object.assign(fns, makeModelpathFn(schema, path+name+'.'))
                }
            }
        }
    }
    return fns;
}

export function makeModelpathFns(schema: $Bucket) {
    return makeFieldModelpathFns(schema);
}