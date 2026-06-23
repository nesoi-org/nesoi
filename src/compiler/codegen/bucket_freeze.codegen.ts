import type { BucketModel } from '~/elements/entities/bucket/model/bucket_model';

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

export function makeFreezeFn(schema: $BucketModel): BucketModel<any, any>['freeze'] {
    let fn = 'Object.freeze(obj);\n';
    for (const key in schema.fields) {
        const field = schema.fields[key];
        if (!field.children) continue;
        fn += makeFreezeFieldFn(field, `obj.${field.name}`);
    }
    
    return new Function('obj', fn) as any;
}