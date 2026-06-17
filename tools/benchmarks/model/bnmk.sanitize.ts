/* eslint-disable no-var */
/* eslint-disable no-prototype-builtins */
import { NesoiDate } from '~/engine/data/date';
import { NesoiDatetime } from '~/engine/data/datetime';
import { NesoiDuration } from '~/engine/data/duration';
import { NesoiDecimal } from '~/engine/data/decimal';
import { NesoiFile } from '~/engine/data/file';
import { complex_model, simple_model, very_complex_model, very_simple_model } from './models';
import { complex_obj, simple_obj, very_complex_obj, very_simple_obj } from './objs';
import Benchmark from 'benchmark';

const use: any[] = [];

/*
    Simple recursive freeze
*/

function sanitize_value(field: $BucketModelField, val: any) {
    if (val == null) {
        if (field.required) throw new Error('required');
        return field.defaultValue ? field.defaultValue : undefined;
    }
    switch (field.type) {
    case 'string':
        if (typeof val !== 'string') throw new Error('Not a string');
        return val;
    case 'boolean':
        if (typeof val !== 'boolean') throw new Error('Not a boolean');
        return val;
    case 'date':
        if (val instanceof NesoiDate) return val;
        if (typeof val !== 'string') throw new Error('Not a (date) string');
        return NesoiDate.fromISO(val);
    case 'datetime':
        if (val instanceof NesoiDatetime) return val;
        if (typeof val !== 'string') throw new Error('Not a (datetime) string');
        return NesoiDatetime.fromISO(val);
    case 'duration':
        if (val instanceof NesoiDuration) return val;
        if (typeof val !== 'string') throw new Error('Not a (duration) string');
        return NesoiDuration.fromString(val);
    case 'decimal':
        if (val instanceof NesoiDecimal) return val;
        if (typeof val !== 'string') throw new Error('Not a (decimal) string');
        return NesoiDecimal.fromString(val);
    case 'enum':
        if (typeof val !== 'string') throw new Error('Not a (enum) string');
        if (!(val in field.meta!.enum!.options)) throw new Error('Invalid enum option');
        return val;
    case 'file':
        if (val instanceof NesoiFile) return val;
        return NesoiFile.from(val as any, {});
    case 'float':
        if (typeof val !== 'number') throw new Error('Not a number');
        return val;
    case 'int':
        if (typeof val !== 'number') throw new Error('Not a number');
        if (!Number.isInteger(val)) throw new Error('Not an integer');
        return val;
    case 'obj':
        return sanitize_obj(field.children!, val);
    case 'dict':
        return sanitize_dict(field, val);
    case 'list':
        return sanitize_list(field, val);
    case 'union':
    case 'literal':
    case 'unknown':
        return val;
    }
}

function sanitize_obj(fields: $BucketModelFields, obj: any) {
    if (obj == null || typeof obj !== 'object') {
        throw new Error('Not an object');
    }
    const copy: any = {};
    const keys = Object.keys(fields);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        copy[key] = sanitize_value(fields[key], obj[key]);
    }
    return copy;
}
function sanitize_dict(field: $BucketModelField, dict: any) {
    if (dict == null || typeof dict !== 'object') {
        throw new Error('Not a dict');
    }
    const copy: any = {};
    const keys = Object.keys(dict);
    const item = field.children!['#'];
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        copy[key] = sanitize_value(dict[key], item);
    }
    return copy;
}
function sanitize_list(field: $BucketModelField, list: any) {
    if (list == null || !Array.isArray(list)) {
        throw new Error('Not a dict');
    }
    const copy = Array(list.length);
    const item = field.children!['#'];
    for (let i = 0; i < list.length; i++) {
        copy[i] = sanitize_value(list[i], item);
    }
    return copy;
}

// v2


function sanitize_string(val: any) {
    if (typeof val !== 'string') throw new Error('Not a string');
    return val;
}
function sanitize_boolean(val: any) {
    if (typeof val !== 'boolean') throw new Error('Not a boolean');
    return val;
}
function sanitize_date(val: any) {
    if (val instanceof NesoiDate) return val;
    if (typeof val !== 'string') throw new Error('Not a (date) string');
    return NesoiDate.fromISO(val);
}
function sanitize_datetime(val: any) {
    if (val instanceof NesoiDatetime) return val;
    if (typeof val !== 'string') throw new Error('Not a (datetime) string');
    return NesoiDatetime.fromISO(val);
}
function sanitize_duration(val: any) {
    if (val instanceof NesoiDuration) return val;
    if (typeof val !== 'string') throw new Error('Not a (duration) string');
    return NesoiDuration.fromString(val);
}
function sanitize_decimal(val: any) {
    if (val instanceof NesoiDecimal) return val;
    if (typeof val !== 'string') throw new Error('Not a (decimal) string');
    return NesoiDecimal.fromString(val);
}
function sanitize_enum(field: $BucketModelField, val: any) {
    if (typeof val !== 'string') throw new Error('Not a (enum) string');
    if (!(val in field.meta!.enum!.options)) throw new Error('Invalid enum option');
    return val;
}
function sanitize_file(val: any) {
    if (val instanceof NesoiFile) return val;
    return NesoiFile.from(val as any, {});
}
function sanitize_float(val: any) {
    if (typeof val !== 'number') throw new Error('Not a number');
    return val;
}
function sanitize_int(val: any) {
    if (typeof val !== 'number') throw new Error('Not a number');
    if (!Number.isInteger(val)) throw new Error('Not an integer');
    return val;
}

function sanitize_value2(field: $BucketModelField, val: any) {
    if (val == null) {
        if (field.required) throw new Error('required');
        return field.defaultValue ? field.defaultValue : undefined;
    }
    switch (field.type) {
    case 'string':
        sanitize_string(val); break;
    case 'boolean':
        sanitize_boolean(val); break;
    case 'date':
        sanitize_date(val); break;
    case 'datetime':
        sanitize_datetime(val); break;
    case 'duration':
        sanitize_duration(val); break;
    case 'decimal':
        sanitize_decimal(val); break;
    case 'enum':
        sanitize_enum(field, val); break;
    case 'file':
        sanitize_file(val); break;
    case 'float':
        sanitize_float(val); break;
    case 'int':
        sanitize_int(val); break;
    case 'obj':
        return sanitize_obj2(field.children!, val);
    case 'dict':
        return sanitize_dict2(field, val);
    case 'list':
        return sanitize_list2(field, val);
    case 'union':
    case 'literal':
    case 'unknown':
        return val;
    }
}

function sanitize_obj2(fields: $BucketModelFields, obj: any) {
    if (obj == null || typeof obj !== 'object') {
        throw new Error('Not an object');
    }
    const copy: any = {};
    const keys = Object.keys(fields);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        copy[key] = sanitize_value2(fields[key], obj[key]);
    }
    return copy;
}
function sanitize_dict2(field: $BucketModelField, dict: any) {
    if (dict == null || typeof dict !== 'object') {
        throw new Error('Not a dict');
    }
    const copy: any = {};
    const keys = Object.keys(dict);
    const item = field.children!['#'];
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        copy[key] = sanitize_value2(dict[key], item);
    }
    return copy;
}
function sanitize_list2(field: $BucketModelField, list: any) {
    if (list == null || !Array.isArray(list)) {
        throw new Error('Not a dict');
    }
    const copy = Array(list.length);
    const item = field.children!['#'];
    for (let i = 0; i < list.length; i++) {
        copy[i] = sanitize_value2(list[i], item);
    }
    return copy;
}

//

function sanitize_meta_very_simple(fields: any, obj: any) {
    return {
        id: sanitize_int(obj.id),
        boolean: sanitize_boolean(obj.boolean),
        enum: sanitize_enum(fields.enum, obj.enum),
        int: sanitize_int(obj.int),
        float: sanitize_float(obj.float),
        string: sanitize_string(obj.string),
        literal: sanitize_string(obj.literal),
    }
}

function sanitize_meta_simple(fields: any, obj: any) {
    return {
        id: sanitize_int(obj.id),
        boolean: sanitize_boolean(obj.boolean),
        date: sanitize_date(obj.date),
        datetime: sanitize_datetime(obj.datetime),
        duration: sanitize_duration(obj.duration),
        decimal: sanitize_decimal(obj.decimal),
        enum: sanitize_enum(fields.enum, obj.enum),
        int: sanitize_int(obj.int),
        float: sanitize_float(obj.float),
        string: sanitize_string(obj.string),
        literal: sanitize_string(obj.literal),
    }
}

function sanitize_meta_complex(fields: any, obj: any) {
    const obj_c: any = {};
    {
        const keys = Object.keys(obj.obj.c);
        for (let i = 0; i < keys.length; i++) {
            obj_c[i] = sanitize_boolean(obj.obj.c[keys[i]]);
        }
    }
    const obj_d: any[] = Array(obj.obj.d.length);
    {
        for (let i = 0; i < obj.obj.d.length; i++) {
            obj_d[i] = sanitize_date(obj.obj.d[i]);
        }
    }
    return {
        id: sanitize_int(obj.id),
        boolean: sanitize_boolean(obj.boolean),
        date: sanitize_date(obj.date),
        datetime: sanitize_datetime(obj.datetime),
        duration: sanitize_duration(obj.duration),
        decimal: sanitize_decimal(obj.decimal),
        enum: sanitize_enum(fields.enum, obj.enum),
        int: sanitize_int(obj.int),
        float: sanitize_float(obj.float),
        string: sanitize_string(obj.string),
        literal: sanitize_string(obj.literal),
        obj: {
            a: sanitize_value(fields.obj.children.a, obj.obj.a),
            b: sanitize_value(fields.obj.children.b, obj.obj.b),
            c: obj_c,
            d: obj_d,
        },
    }

}

function _sanitize_meta(name: string) {
    if (name === 'very_simple') return () => use[0] = sanitize_meta_very_simple(very_simple_model.fields, very_simple_obj);
    if (name === 'simple') return () => use[0] = sanitize_meta_simple(simple_model.fields, simple_obj);
    if (name === 'complex') return () => use[0] = sanitize_meta_complex(complex_model.fields, complex_obj);
    if (name === 'very_complex') return () => use[0] = sanitize_meta_complex(very_complex_model.fields, very_complex_obj);
} 

const tests: [string, $BucketModel, any][] = [
    ['very_simple', very_simple_model, very_simple_obj],
    ['simple', simple_model, simple_obj],
    ['complex', complex_model, complex_obj],
    ['very_complex', very_complex_model, very_complex_obj],
]

for (const [name, model, obj] of tests) {
    console.log('# '+name);
    const suite = new Benchmark.Suite;
    suite
        .add('sanitize_obj ', () => {
            use[0] = sanitize_obj(model.fields, obj)
        })
        .add('sanitize_obj2', () => {
            use[0] = sanitize_obj2(model.fields, obj)
        })
        .add('sanitize_meta', _sanitize_meta(name)!)

        .on('cycle', (event: any) => {
            console.log(String(event.target));
        })
        .run();
}

