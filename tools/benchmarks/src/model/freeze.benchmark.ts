/* eslint-disable no-var */
/* eslint-disable no-prototype-builtins */
import Benchmark from 'benchmark';
import objs, { very_simple_obj } from '../objs';

/*
    Simple recursive freeze
*/

function freeze_simple(val: any) {
    if (val == null) return;
    if (typeof val !== 'object') return;
    Object.freeze(val);
    if (Array.isArray(val)) {
        for (let i = 0; i < val.length; i++) {
            freeze_simple(val[i]);
        }
    }
    else {
        const keys = Object.keys(val);
        for (let i = 0; i < keys.length; i++) {
            freeze_simple(val[keys[i]]);
        }
    }
}

/*
    Iterate with external method
*/

function foreach(val: any[], fn: (v: any) => void) {
    for (let i = 0; i < val.length; i++) {
        fn(val[i]);
    }
}

function freeze_simple_functional(val: any) {
    if (val == null) return;
    if (typeof val !== 'object') return;
    Object.freeze(val);
    if (Array.isArray(val)) {
        foreach(val, freeze_simple_functional);
    }
    else {
        foreach(Object.values(val), freeze_simple_functional);
    }
}

/*
    Iterate with external method, no branching
*/

function for_classic(list: any[]) {
    for (let i = 0; i < list.length; i++) {
        const val = list[i];
        if (val != null && typeof val === 'object') {
            Object.freeze(val);
            if (Array.isArray(val)) for_nobranch(val);
            else for_nobranch(Object.values(val));
        }
    }
}

function for_nobranch(list: any[], i = 0) {
    if (list.length > 30) {
        for_classic(list);
        return;
    }
    const val = list[i]
    if (val != null && typeof val === 'object') {
        Object.freeze(val);

        if (Array.isArray(val)) for_nobranch(val);
        else for_nobranch(Object.values(val));
    }
    if (i < list.length-1) {
        for_nobranch(list, i+1)
    }
}

function freeze_simple_nobranch(val: any) {
    return for_nobranch([val]);
}

freeze_simple_nobranch(very_simple_obj)

/*
    Reduce branching with batch loops
*/

function freeze_simple_batch_branching(val: any) {
    if (val == null) return;
    if (typeof val !== 'object') return;
    Object.freeze(val);
    if (Array.isArray(val)) {
        let i = val.length-1;
        while(i > -1) {
            freeze_simple_batch_branching(val[i]);
            if (i<1) break;
            freeze_simple_batch_branching(val[i-1]);
            if (i<2) break;
            freeze_simple_batch_branching(val[i-2]);
            if (i<3) break;
            freeze_simple_batch_branching(val[i-3]);
            if (i<4) break;
            freeze_simple_batch_branching(val[i-4]);
            i-=5;
        }
    }
    else {
        const keys = Object.keys(val);
        let i = keys.length-1;
        while(i > -1) {
            freeze_simple_batch_branching(val[keys[i]]);
            if (i<1) break;
            freeze_simple_batch_branching(val[keys[i-1]]);
            if (i<2) break;
            freeze_simple_batch_branching(val[keys[i-2]]);
            if (i<3) break;
            freeze_simple_batch_branching(val[keys[i-3]]);
            if (i<4) break;
            freeze_simple_batch_branching(val[keys[i-4]]);
            i-=5;
        }
    }
}

/*
    Dynamically generated from model
*/

function freeze_meta_simple(obj: any) {
    Object.freeze(obj);
}

function freeze_meta_complex(obj: any) {
    Object.freeze(obj);
    Object.freeze(obj.obj);
    Object.freeze(obj.obj.c);
    Object.freeze(obj.obj.d);
    Object.freeze(obj.dict);
    Object.freeze(obj.list);
}
function freeze_meta_very_complex(obj: any) {
    Object.freeze(obj);
    Object.freeze(obj.obj);
    Object.freeze(obj.obj.c);
    Object.freeze(obj.obj.d);
    Object.freeze(obj.dict);
    Object.freeze(obj.list);
    {
        const keys = Object.keys(obj.dict_obj);
        for (let i = 0; i < keys.length; i++) {
            Object.freeze(obj.dict_obj[keys[i]]);
        }
    }
    {
        for (let i = 0; i < obj.list_obj.length; i++) {
            Object.freeze(obj.list_obj[i]);
        }
    }
}

function _freeze_meta(name: string) {
    if (name === 'very_simple') return () => use[0] = freeze_meta_simple(objs['very_simple']);
    if (name === 'simple') return () => use[0] = freeze_meta_simple(objs['simple']);
    if (name === 'complex') return () => use[0] = freeze_meta_complex(objs['complex']);
    if (name === 'very_complex') return () => use[0] = freeze_meta_very_complex(objs['very_complex']);
} 

var use: any[] = [];

// 

for (const name in objs) {
    console.log('# '+name);
    const obj = objs[name as never];
    const suite = new Benchmark.Suite;
    suite
        .add('freeze_simple                ', () => {
            use[0] = freeze_simple(obj)
        })
        .add('freeze_simple_functional     ', () => {
            use[0] = freeze_simple_functional(obj)
        })
        .add('freeze_simple_nobranch       ', () => {
            use[0] = freeze_simple_nobranch(obj)
        })
        .add('freeze_simple_batch_branching', () => {
            use[0] = freeze_simple_batch_branching(obj)
        })
        .add('freeze_meta                  ', _freeze_meta(name)!)

        .on('cycle', (event: any) => {
            console.log(String(event.target));
        })
        .run();
}

