// /* Gets a property from a Nesoi object */

// function makeModelpathIterator(
//     schema: $BucketModelFields,
//     path: string[],
//     i0 = 0,
//     _obj = 'v',
//     _target?: string,
//     depth = 0,
//     arg = 0,
//     pad = '  '
// ): any {
//     let field = { children: schema } as $BucketModelField;
//     let _path = _obj;
//     for (let i = i0; i < path.length; i++) {
//         const p = path[i];
//         if (!field.children) throw new Error(`Invalid modelpath '${path.join('.')}, field '${field.name}' has no children'`);
//         if (p == '*') {
//             // Spread List
//             if (field.type === 'list') {
//                 const child = field.children!['#'];
//                 if (child.children) {
//                     const iterator = makeModelpathIterator(child.children, path, i+1, `${_path}[i${depth}]`, `arr${depth}[i${depth}]`, depth+1, arg, pad+'  ');
//                     return [true, ''+
//                         `${pad}let i${depth} = 0, n = ${_path}?.length ?? 0;\n` +
//                         `${pad}const arr${depth} = Array(n);\n` +
//                         `${pad}while (i${depth} < n) {\n` +
//                         (iterator[0]
//                             ? `${iterator[1]}\n`
//                             : `${pad}  arr${depth}[i${depth}] = ${iterator[1]}\n`) +
//                         `${pad}  i${depth}++;\n` +
//                         `${pad}}\n`+
//                         ( _target
//                             ? `${pad}${_target} = arr${depth};`
//                             : `${pad}return arr${depth};\n`)]
//                 }
//             }
//             // Spread Dict
//             if (field.type === 'dict') {
//                 const child = field.children!['#'];
//                 if (child.children) {
//                     const iterator = makeModelpathIterator(child.children, path, i+1, `${_path}[keys${depth}[i${depth}]]`, `dict${depth}[keys${depth}[i${depth}]]`, depth+1, arg, pad+'  ');
//                     return [true, ''+
//                         `${pad}const keys${depth} = Object.keys(${_path} ?? {});\n` +
//                         `${pad}let i${depth} = 0, n = keys${depth}.length ?? 0;\n` +
//                         `${pad}const dict${depth} = {};\n` +
//                         `${pad}while (i${depth} < n) {\n` +
//                         (iterator[0]
//                             ? `${iterator[1]}\n`
//                             : `${pad}  dict${depth}[keys${depth}[i${depth}]] = ${iterator[1]}\n`) +
//                         `${pad}  i${depth}++;\n` +
//                         `${pad}}\n`+
//                         ( _target
//                             ? `${pad}${_target} = dict${depth};`
//                             : `${pad}return dict${depth};\n`)]
//                 }
//             }
//             else throw new Error('Cannot spread!');
//         }
//         else if (p == '$') {
//             if (field.type === 'list'
//                 || field.type === 'dict') {
//                 _path += `?.[args[${arg}]]`
//             }
//             else
//                 throw new Error(`Invalid modelpath '${path.join('.')}', field '${field.name}' doesn't support parametric access`);
            
//             field = field.children['#'];
//         }
//         else {
//             if (!(p in field.children)) throw new Error(`Invalid modelpath '${path.join('.')}', '${p}' not found on field '${field.name}'`);
//             // Direct path
//             field = field.children[p];
//             _path += `?.${p}`
//         }
//     }
//     return [false, _path];
// }

// export function makeModelpathFn(schema: $BucketModel, path: string) {
//     const [has_return, fn] = makeModelpathIterator(schema.fields, path.split('.'))
//     // console.log(fn)
//     return new Function('v', 'args', (has_return ? '' : 'return ') + fn);
// }

// function makeFieldModelpathFns(schema: $BucketModel, fields: $BucketModelFields = schema.fields, path = '') {
//     const fns = {} as any;
//     for (const name in fields) {
//         const field = fields[name];
//         fns[path+name] = makeModelpathFn(schema, path+name);
//         if (field.children) {
//             if (field.type === 'obj') {
//                 Object.assign(fns, makeFieldModelpathFns(schema, field.children, path+name+'.'))
//             }
//             else if (field.type === 'list' || field.type === 'dict') {
//                 fns[path+name+'.*'] = fns[path+name];
//                 fns[path+name+'.$'] = makeModelpathFn(schema, path+name+'.$');
//                 if (field.children['#']!.children) {
//                     Object.assign(fns, makeModelpathFn(schema, path+name+'.'))
//                 }
//             }
//         }
//     }
//     return fns;
// }

// export function makeModelpathFns(schema: $BucketModel) {
//     return makeFieldModelpathFns(schema);
// }