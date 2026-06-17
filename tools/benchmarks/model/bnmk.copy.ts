/* eslint-disable no-var */
/* eslint-disable no-prototype-builtins */
import Benchmark from 'benchmark';
import objs from './objs';

/*
    Simple recursive copy
*/

function copy_simple(
    obj: any
) {
    if (Array.isArray(obj)) {
        const copy = Array(obj.length);
        for (let i = 0; i < obj.length; i++) {
            const val = obj[i];
            if (typeof val !== 'object') {
                copy[i] = obj[i];
            }
            else {
                copy[i] = copy_simple(obj[i]);
            }
        }
        return copy
    }
    const copy: Record<string, any> = {};
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const val = obj[key];
        if (typeof val !== 'object') {
            copy[key] = val;
        }
        else {
            copy[key] = copy_simple(val);
        }
    }
    return copy;
}

/*
    Simple recursive copy, functional
*/

function _copy_array(
    val: any
) {
    const copy = Array(val.length);
    let i = val.length-1;
    while(i-- > 0) {
        copy[i] = copy_any(val[i]);
    }
    return copy;
}

function _copy_obj(
    val: any
) {
    const copy: Record<string, any> = {};
    const keys = Object.keys(val);
    let i = keys.length-1;
    while(i-- > 0) {
        copy[keys[i]] = copy_any(val[keys[i]]);
    }
    return copy;
}

function copy_any(
    val: any
) {
    if (val == null) return; 
    if (typeof val !== 'object') return val;
    if (Array.isArray(val)) return _copy_array(val);
    return _copy_obj(val);
}

/*
    Simple recursive copy, functional++
*/

function _copy_array2(
    val: any[]
) {
    const m = Array(val.length);
    val.forEach((dp,i)=>m[i]=dp);
    return m;
}

function _copy_obj2(
    val: any
) {
    const m: Record<string, any> = {};
    Object.keys(val).forEach(key=>m[key]=val[key]);
    return m;
}

function copy_any2(
    val: any
) {
    return (val == null || typeof val !== 'object')
        ? undefined
        : Array.isArray(val)
            ? _copy_array2(val)
            : _copy_obj2(val);
}

/*
    Dynamically generated from model, with assign
*/

function copy_meta_simple(obj: any) {
    const copy = {} as any;
    Object.assign(copy, obj);
    return copy;
}

function copy_meta_complex(obj: any) {
    const copy = {} as any;
    Object.assign(copy, obj);
    Object.assign(copy.obj, obj.obj);
    Object.assign(copy.obj.c, obj.obj.c);
    Object.assign(copy.obj.d, obj.obj.d);
    Object.assign(copy.dict, obj.dict);
    Object.assign(copy.list, obj.list);
    return copy;
}
function copy_meta_very_complex(obj: any) {
    const copy = {} as any;
    Object.assign(copy, obj);
    Object.assign(copy.obj, obj.obj);
    Object.assign(copy.obj.c, obj.obj.c);
    Object.assign(copy.obj.d, obj.obj.d);
    Object.assign(copy.dict, obj.dict);
    Object.assign(copy.list, obj.list);
    {
        copy.dict_obj = {};
        const keys = Object.keys(obj.dict_obj);
        for (let i = 0; i < keys.length; i++) {
            copy.dict_obj[keys[i]] = Object.assign({}, obj.dict_obj[keys[i]]);
        }
    }
    {
        copy.list_obj = Array(obj.list_obj.length);
        for (let i = 0; i < obj.list_obj.length; i++) {
            copy.list_obj[i] = Object.assign([], obj.list_obj[i]);
        }
    }
    return copy;
}

function __copy_meta(name: string) {
    if (name === 'very_simple') return () => use[0] = copy_meta_simple(objs[0][1]);
    if (name === 'simple') return () => use[0] = copy_meta_simple(objs[1][1]);
    if (name === 'complex') return () => use[0] = copy_meta_complex(objs[2][1]);
    if (name === 'very_complex') return () => use[0] = copy_meta_very_complex(objs[3][1]);
} 

/*
    Dynamically generated from model, with property assignment
*/

function copy_meta2_very_simple(obj: any) {
    return {
        id: obj.id,
        boolean: obj.boolean,
        enum: obj.enum,
        int: obj.int,
        float: obj.float,
        string: obj.string,
        literal: obj.literal
    } as any;
}

function copy_meta2_simple(obj: any) {
    return {
        id: obj.id,
        boolean: obj.boolean,
        date: obj.date,
        datetime: obj.datetime,
        duration: obj.duration,
        decimal: obj.decimal,
        enum: obj.enum,
        int: obj.int,
        float: obj.float,
        string: obj.string,
        literal: obj.literal
    } as any;
}

function copy_meta2_complex(obj: any) {
    return {
        id: obj.id,
        boolean: obj.boolean,
        date: obj.date,
        datetime: obj.datetime,
        duration: obj.duration,
        decimal: obj.decimal,
        enum: obj.enum,
        int: obj.int,
        float: obj.float,
        string: obj.string,
        literal: obj.literal,
        obj: {
            a: obj.obj.a,
            b: obj.obj.b,
            c: { ...obj.obj.c },
            d: [ ...obj.obj.d ],
        },
        dict: { ...obj.dict },
        list: [ ...obj.list ]
    } as any;
}
function copy_meta2_very_complex(obj: any) {
    const dict_obj: any = {};
    {
        const keys = Object.keys(obj.dict_obj);
        for (let i = 0; i < keys.length; i++) {
            dict_obj[keys[i]] = { ...obj.dict_obj[keys[i]] };
        }
    }
    const list_obj = Array(obj.list_obj.length);
    {
        for (let i = 0; i < obj.list_obj.length; i++) {
            list_obj[i] = { ...obj.list_obj[i] };
        }
    }
    return {
        id: obj.id,
        boolean: obj.boolean,
        date: obj.date,
        datetime: obj.datetime,
        duration: obj.duration,
        decimal: obj.decimal,
        enum: obj.enum,
        int: obj.int,
        float: obj.float,
        string: obj.string,
        literal: obj.literal,
        obj: {
            a: obj.obj.a,
            b: obj.obj.b,
            c: { ...obj.obj.c },
            d: [ ...obj.obj.d ],
        },
        dict: { ...obj.dict },
        list: { ...obj.list },
        dict_obj,
        list_obj
    } as any;
}

function __copy_meta2(name: string) {
    if (name === 'very_simple') return () => use[0] = copy_meta2_very_simple(objs[0][1]);
    if (name === 'simple') return () => use[0] = copy_meta2_simple(objs[1][1]);
    if (name === 'complex') return () => use[0] = copy_meta2_complex(objs[2][1]);
    if (name === 'very_complex') return () => use[0] = copy_meta2_very_complex(objs[3][1]);
} 

// 

var use: any[] = [];

for (const [name, obj] of objs) {
    console.log('# '+name);
    const suite = new Benchmark.Suite;
    suite
        .add('ref        ', () => {
            use[0] = obj;
        })
        .add('copy_simple', () => {
            use[0] = copy_simple(obj)
        })
        .add('copy_any   ', () => {
            use[0] = copy_any(obj)
        })
        .add('copy_any2  ', () => {
            use[0] = copy_any2(obj)
        })
        .add('copy_meta  ', __copy_meta(name)!)
        .add('copy_meta2 ', __copy_meta2(name)!)
        .on('cycle', (event: any) => {
            console.log(String(event.target));
        })
        .run();
}

