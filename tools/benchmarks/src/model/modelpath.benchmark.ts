/* eslint-disable no-prototype-builtins */
import { Tree } from '~/engine/data/tree';
import { NesoiBenchmarkSuite } from '../../lib/suite';

/* CharTree */

function make_chartree(fields: {
    [name: string]: {
        children?: {
            [name: string]: {}
        }
    }
}) {
    const map = {} as any;
    for (const key in fields) {
        map[key] = {
            [0]: key
        };
        
        if (fields[key].children) {
            map[key]['.'] = make_chartree(fields[key].children);
        }
    }
    return map;
}

function get_chartree(map: any, obj: Record<string, any>, path: string) {
    const p = path.split('.');
    const n = p.length;
    let i = 0;
    let m = map as any;
    let v = obj as any;
    let match = false;
    while(i < n) {
        match = false;
        m = m[p[i]];
        if (!m) return;
        if (0 in m) {
            v = v[m[0]];
            match = true;
        }
        if ('.' in m) {
            m = m['.'];
            i++;
        }
        else break;
    }
    return match ? v : undefined;
}

const schema = {
    name: {},
    height: {},
    coords: {
        children: {
            x: {},
            y: {},
        }
    },
    deep: {
        children: {
            deeper: {
                children: {
                    profound: {}
                }
            }
        }
    },
    list: {
        type: 'list',
        children: {
            '#': {
                children: {
                    a: {},
                    b: {},
                }
            }
        }
    },
    list0: {
        type: 'list',
        children: {
            '#': {
                children: {
                    list1: {
                        type: 'list',
                        children: {
                            '#': {
                                children: {
                                    x: {},
                                    y: {},
                                }
                            }
                        }
                    },
                }
            }
        }
    },
    dict: {
        type: 'dict',
        children: {
            '#': {
                children: {
                    a: {},
                    b: {},
                }
            }
        }
    },
};
const obj = {
    name: 'Oi',
    height: 12,
    coords: {
        x: 1,
        y: 2
    },
    deep: {
        deeper: {
            profound: 0
        }
    },
    list: [
        {a:1,b:2},
        {a:3,b:4},
    ],
    list0: [
        { list1: [{x: 1, y: 2}, {x: 3, y: 4}] },
        { list1: [{x: 5, y: 6}, {x: 7, y: 8}] }
    ],
    dict: {
        x: {a:1,b:2},
        y: {a:3,b:4},
    },
};

// const map = make_chartree(schema)
// console.log(map);
// console.log(get_chartree(map, obj, 'name'));
// console.log(get_chartree(map, obj, 'nam'));
// console.log(get_chartree(map, obj, 'height'));
// console.log(get_chartree(map, obj, 'heght'));
// console.log(get_chartree(map, obj, 'coords'));
// console.log(get_chartree(map, obj, 'coords.'));
// console.log(get_chartree(map, obj, 'coords.x'));


function make_obj_fn(schema: any, _obj: string = 'obj', depth = 0, pad = '') {
    let fn = '';
    // fn += `${pad}switch (k) {\n`;    
    fn += `${pad}${_obj}[[`;
    const keys = Object.keys(schema);
    for (let i = 0; i < keys.length; i++) {
        // fn += `${pad}  if (k == ${i}) `;
        // if (schema[keys[i]].children) {
        //     // fn += make_obj_fn(schema[keys[i]].children, `${_obj}.${keys[i]}`, depth+1, pad+'  ');
        //     fn += `${pad}return ${_obj}.${keys[i]};\n`;
        // }
        // else {
        if (i < 4)
            // fn += `${pad}return ${_obj}.${keys[i]};\n`;
            fn += `'${pad}${keys[i]}',`;
        // }
        // else fn += '{};\n';
    }
    // fn += `${pad}}\n`;
    fn += `${pad}][k[${depth}]]]`;
    return fn;
}

function make_fn(schema: any) {
    let fn = '';
    fn += `v = ${make_obj_fn(schema)};\n`;
    fn += 'if (!v) return;';


    fn += 'return v;';
    return new Function('obj','k',fn);
}

const fn = make_fn(schema);
console.log(fn.toString());

console.log(fn(obj, [0]))
console.log(fn(obj, [1]))
console.log(fn(obj, [2]))
console.log(fn(obj, [3]))

console.log(' --fn2-- ')


function make_obj_fn2(schema: any) {
    const fns = [];
    for (const key in schema) {
        fns.push(new Function('v', `return v.${key}`));
    }
    return fns;
}

const fn2 = make_obj_fn2(schema);

console.log(fn2[0](obj))
console.log(fn2[1](obj))
console.log(fn2[2](obj))
console.log(fn2[3](obj))

console.log(' --compile-- ')

function _compile_modelpath(schema: any, path: string[], i0 = 0, _obj = 'v', _target?: string, depth = 0, pad = '  '): any {
    let field = { children: schema } as any;
    let _path = _obj;
    for (let i = i0; i < path.length; i++) {
        const p = path[i];
        if (!field) throw new Error('Invalid modelpath!');
        if (p == '*') {
            // Spread List
            if (field.type === 'list') {
                const child = field.children['#'];
                const iterator = _compile_modelpath(child.children, path, i+1, `${_path}[i${depth}]`, `arr${depth}[i${depth}]`, depth+1, pad+'  ');
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
            // Spread Dict
            if (field.type === 'dict') {
                const child = field.children['#'];
                const iterator = _compile_modelpath(child.children, path, i+1, `${_path}[keys${depth}[i${depth}]]`, `dict${depth}[keys${depth}[i${depth}]]`, depth+1, pad+'  ');
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
            else throw new Error('Cannot spread!');
        }
        else {
            if (!(p in field.children)) throw new Error('Invalid modelpath!');
            
            // Direct path
            field = field.children[p];
            _path += `?.${p}`
        }
    }
    return [false, _path];
}

function compile_modelpath(schema: any, path: string) {
    const [has_return, fn] = _compile_modelpath(schema, path.split('.'))
    console.log({fn})
    return new Function('v', (has_return ? '' : 'return ') + fn);
}

const cpaths = [
    compile_modelpath(schema, 'name'),
    compile_modelpath(schema, 'height'),
    // compile_modelpath(schema, 'coords'),
    // compile_modelpath(schema, 'coords.x'),
    // compile_modelpath(schema, 'deep.deeper.profound'),
    compile_modelpath(schema, 'list'),
    compile_modelpath(schema, 'list.*'),
    compile_modelpath(schema, 'list.*.a'),
    compile_modelpath(schema, 'list0.*.list1.*.x'),
    compile_modelpath(schema, 'dict'),
    compile_modelpath(schema, 'dict.*'),
];

console.log(cpaths[0].toString())
console.log(cpaths[1].toString())
console.log(cpaths[2].toString())
console.log(cpaths[3].toString())
console.log(cpaths[4].toString())
console.log(cpaths[5].toString())
console.log(cpaths[6].toString())
console.log(cpaths[7].toString())
console.log(cpaths[0](obj))
console.log(cpaths[1](obj))
console.log(cpaths[2](obj))
console.log(cpaths[3](obj))
console.log(cpaths[4](obj))
console.log(cpaths[5](obj))
console.log(cpaths[6](obj))
console.log(cpaths[7](obj))

export default new NesoiBenchmarkSuite('option', {
    n: [0],
    data: n => ({ })
})
    .add_('[ direct ]', () => {
        let a = 0;
        if (obj['name'] != null) { a++; }
        if (obj['height'] != null) { a++; }
        // if (obj['coords'] != null) { a++; }
        // if (obj['coords']['x'] != null) { a++; }
        // if (obj['deep']['deeper']['profound'] != null) { a++; }
        if (obj['list'] != null) { a++; }
        {
            let i = 0;
            const n = obj['list'].length;
            const arr = Array(n);
            while (i < n) {
                arr[i] = obj['list'][i];
                i++;
            }
            if (arr != null) { a++; }
        }
        {
            let i = 0;
            const n = obj['list'].length;
            const arr = Array(n);
            while (i < n) {
                arr[i] = obj['list'][i].a;
                i++;
            }
            if (arr != null) { a++; }
        }
        {
            let i0 = 0;
            const n = obj['list0'].length;
            const arr0 = Array(n);
            while (i0 < n) {
                let i1 = 0;
                const n = obj['list0'][i0]['list1'].length;
                const arr1 = Array(n);
                while (i1 < n) {
                    arr1[i1] = obj['list0'][i0]['list1'][i1].x
                    i1++;
                }
                arr0[i0] = arr1;
                i0++;
            }
            if (arr0 != null) { a++; }
        }
        if (obj['dict'] != null) { a++; }
        {
            const keys0 = Object.keys(obj['dict'] ?? {});
            let i0 = 0;
            const n = keys0.length ?? 0;
            const dict0 = {} as any;
            while (i0 < n) {
                dict0[keys0[i0]] = obj['dict'][keys0[i0] as never]
                i0++;
            }
            if (dict0 != null) { a++; }
        }
    })
    .add_('[ direct functional ]', () => {
        let a = 0;
        if (obj['name'] != null) { a++; }
        if (obj['height'] != null) { a++; }
        // if (obj['coords'] != null) { a++; }
        // if (obj['coords']['x'] != null) { a++; }
        // if (obj['deep']['deeper']['profound'] != null) { a++; }
        if (obj['list'] != null) { a++; }
        if (obj['list'].map(v => v) != null) { a++; }
        if (obj['list'].map(v => v.a) != null) { a++; }
        if (obj['list0'].map(v => v.list1.map(v => v.x)) != null) { a++; }
        if (obj['dict'] != null) { a++; }
        if (Object.fromEntries(
            Object.entries(obj['dict']).map(e => [e[0], e[1]])
        ) != null) { a++; }
    })
    // .add_('[ fn ]', () => {
    //     let a = 0;
    //     if (fn(obj, [0]) != null) { a++; }
    //     if (fn(obj, [1]) != null) { a++; }
    //     if (fn(obj, [2]) != null) { a++; }
    // })
    // .add_('[ fn2 ]', () => {
    //     let a = 0;
    //     if (fn2[0](obj) != null) { a++; }
    //     if (fn2[1](obj) != null) { a++; }
    //     if (fn2[2](obj) != null) { a++; }
    // })
    .add_('[ cpaths ]', () => {
        let a = 0;
        if (cpaths[0](obj) != null) { a++; }
        if (cpaths[1](obj) != null) { a++; }
        if (cpaths[2](obj) != null) { a++; }
        if (cpaths[3](obj) != null) { a++; }
        if (cpaths[4](obj) != null) { a++; }
        if (cpaths[5](obj) != null) { a++; }
        if (cpaths[6](obj) != null) { a++; }
        if (cpaths[7](obj) != null) { a++; }
    })
    .add_('[ tree ]', () => {
        let a = 0;
        if (Tree.get(obj, 'name') != null) { a++; }
        if (Tree.get(obj, 'height') != null) { a++; }
        // if (Tree.get(obj, 'coords') != null) { a++; }
        // if (Tree.get(obj, 'coords.x') != null) { a++; }
        // if (Tree.get(obj, 'deep.deeper.profound') != null) { a++; }
        if (Tree.get(obj, 'list') != null) { a++; }
        if (Tree.get(obj, 'list.*') != null) { a++; }
        if (Tree.get(obj, 'list.*.a') != null) { a++; }
        if (Tree.get(obj, 'list0.*.list1.*.x') != null) { a++; }
        if (Tree.get(obj, 'dict') != null) { a++; }
        if (Tree.get(obj, 'dict.*') != null) { a++; }
    })