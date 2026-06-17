/* eslint-disable no-var */
/* eslint-disable no-prototype-builtins */
import objs from './objs';
import { NesoiDate } from '~/engine/data/date';
import { NesoiDatetime } from '~/engine/data/datetime';
import { NesoiDuration } from '~/engine/data/duration';
import { NesoiDecimal } from '~/engine/data/decimal';
import { NesoiFile } from '~/engine/data/file';
import Benchmark from 'benchmark';

var use: any[] = [];

/*
    Simple recursive copy
*/

function json_simple(
    obj: any
) {
    if (obj instanceof NesoiDate) return obj.iso;
    if (obj instanceof NesoiDatetime) return obj.iso;
    if (obj instanceof NesoiDuration) return obj.toString();
    if (obj instanceof NesoiDecimal) return obj.toString();
    if (obj instanceof NesoiFile) return { ...obj };
    if (Array.isArray(obj)) {
        const copy = Array(obj.length);
        for (let i = 0; i < obj.length; i++) {
            const val = obj[i];
            if (typeof val !== 'object') {
                copy[i] = obj[i];
            }
            else {
                copy[i] = json_simple(obj[i]);
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
            copy[key] = json_simple(val);
        }
    }
    return copy;
}

/*
    Simple recursive copy, functional
*/

function _json_array(
    val: any
) {
    const copy = Array(val.length);
    let i = val.length-1;
    while(i-- > 0) {
        copy[i] = json_any(val[i]);
    }
    return copy;
}

function _json_obj(
    val: any
) {
    const copy: Record<string, any> = {};
    const keys = Object.keys(val);
    let i = keys.length-1;
    while(i-- > 0) {
        copy[keys[i]] = json_any(val[keys[i]]);
    }
    return copy;
}

function json_any(
    val: any
) {
    if (val == null) return; 
    if (typeof val !== 'object') return val;
    if (val instanceof NesoiDate) return val.iso;
    if (val instanceof NesoiDatetime) return val.iso;
    if (val instanceof NesoiDuration) return val.toString();
    if (val instanceof NesoiDecimal) return val.toString();
    if (val instanceof NesoiFile) return { ...val };
    if (Array.isArray(val)) return _json_array(val);
    return _json_obj(val);
}

/*
    Simple recursive copy, functional++
*/

function _json_array2(
    val: any[]
) {
    const m = Array(val.length);
    val.forEach((dp,i)=>m[i]=dp);
    return m;
}

function _json_obj2(
    val: any
) {
    const m: Record<string, any> = {};
    Object.keys(val).forEach(key=>m[key]=val[key]);
    return m;
}

function json_any2(
    val: any
) {
    return (val == null || typeof val !== 'object')
        ? undefined
        : val instanceof NesoiDate ? val.iso
            : val instanceof NesoiDatetime ? val.iso
                : val instanceof NesoiDuration ? val.toString()
                    : val instanceof NesoiDecimal ? val.toString()
                        : val instanceof NesoiFile ? { ...val }
                            : Array.isArray(val) ? _json_array2(val)
                                : _json_obj2(val);
}

/*
    Dynamically generated from model, with property assignment
*/

function json_meta2_very_simple(obj: any) {
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
function json_meta2_simple(obj: any) {
    return {
        id: obj.id,
        boolean: obj.boolean,
        date: obj.date.iso,
        // datetime: obj.datetime,
        // duration: obj.duration,
        // decimal: obj.decimal,
        enum: obj.enum,
        int: obj.int,
        float: obj.float,
        string: obj.string,
        literal: obj.literal
    } as any;
}
function json_meta2_complex(obj: any) {
    const obj_d = Array(obj.obj.d.length);
    {
        for (let i = 0; i < obj.obj.d.length; i++) {
            obj_d[i] = obj.obj.d[i].iso;
        }
    }
    const dict: any = {};
    {
        const keys = Object.keys(obj.dict);
        for (let i = 0; i < keys.length; i++) {
            dict[keys[i]] = obj.dict[keys[i]].iso;
        }
    }
    return {
        id: obj.id,
        boolean: obj.boolean,
        date: obj.date.iso,
        datetime: obj.datetime.iso,
        duration: obj.duration.toString(),
        decimal: obj.decimal.toString(),
        enum: obj.enum,
        int: obj.int,
        float: obj.float,
        string: obj.string,
        literal: obj.literal,
        obj: {
            a: obj.obj.a,
            b: obj.obj.b,
            c: { ...obj.obj.c },
            d: obj_d,
        },
        dict: dict,
        list: { ...obj.list }
    } as any;
}
function json_meta2_very_complex(obj: any) {
    const obj_d = Array(obj.obj.d.length);
    {
        for (let i = 0; i < obj.obj.d.length; i++) {
            obj_d[i] = obj.obj.d[i].iso;
        }
    }
    const dict: any = {};
    {
        const keys = Object.keys(obj.dict);
        for (let i = 0; i < keys.length; i++) {
            dict[keys[i]] = obj.dict[keys[i]].iso;
        }
    }
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
        date: obj.date.iso,
        datetime: obj.datetime.iso,
        duration: obj.duration.toString(),
        decimal: obj.decimal.toString(),
        enum: obj.enum,
        int: obj.int,
        float: obj.float,
        string: obj.string,
        literal: obj.literal,
        obj: {
            a: obj.obj.a,
            b: obj.obj.b,
            c: { ...obj.obj.c },
            d: obj_d,
        },
        dict: dict,
        list: { ...obj.list },
        dict_obj,
        list_obj
    } as any;
}
function __json_meta2(name: string) {
    if (name === 'very_simple') return () => use[0] = json_meta2_very_simple(objs[0][1]);
    if (name === 'simple') return () => use[0] = json_meta2_simple(objs[1][1]);
    if (name === 'complex') return () => use[0] = json_meta2_complex(objs[2][1]);
    if (name === 'very_complex') return () => use[0] = json_meta2_very_complex(objs[3][1]);
} 

for (const [name, obj] of objs) {
    console.log('# '+name);
    const suite = new Benchmark.Suite;
    suite
        .add('json_simple', () => {
            use[0] = json_simple(obj)
        })
        .add('json_any   ', () => {
            use[0] = json_any(obj)
        })
        .add('json_any2  ', () => {
            use[0] = json_any2(obj)
        })
        .add('stringify ', () => {
            use[0] = JSON.stringify(obj);
        })
        .add('json_meta2 ', __json_meta2(name)!)

        .on('cycle', (event: any) => {
            console.log(String(event.target));
        })
        .run();
}

