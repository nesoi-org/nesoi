import Benchmark from 'benchmark';

const suite = new Benchmark.Suite;

const obj = {
    a: 1,
    b: 'b',
    c: true,
    d: {
        a: 2,
        b: 'bb',
        c: false
    },
    e: [
        3,
        'bbb',
        true
    ]
}

function get_a(
    obj: Record<string, any>,
    modelpath: string
) {
    let ptr = obj;
    const split = modelpath.split('.');
    for (let i = 0; i < split.length; i++) {
        const p = split[i];
        ptr = ptr[p];
        if (!ptr) break;
    }
    return ptr;
}

function get_b(
    obj: Record<string, any>,
    modelpath: string
) {
    let ptr = obj;
    
    let last = 0;
    for (let i = 0; i < modelpath.length+1; i++) {
        if (i == modelpath.length || modelpath[i] === '.') {
            const key = modelpath.slice(last, i);
            ptr = ptr[key];
            if (!ptr) break;
            last = i+1;
        }
    }

    return ptr;
}

function get_c(
    obj: Record<string, any>,
    modelpath: string
) {
    let ptr = obj;
    
    let key = '';
    for (let i = 0; i < modelpath.length+1; i++) {
        if (i == modelpath.length || modelpath[i] === '.') {
            ptr = ptr[key];
            if (!ptr) break;
            key = '';
        }
        else {
            key += modelpath[i];
        }
    }

    return ptr;
}

function get_d(
    obj: Record<string, any>,
    modelpath: string
) {
    let ptr = obj;
    
    let key = [];
    for (let i = 0; i < modelpath.length+1; i++) {
        if (i == modelpath.length || modelpath[i] === '.') {
            ptr = ptr[key.join()];
            if (!ptr) break;
            key = [];
        }
        else {
            key.push(modelpath[i]);
        }
    }

    return ptr;
}

function get_e(
    obj: Record<string, any>,
    modelpath: string,
    i0 = 0
) {
    for (let i = i0; i < modelpath.length+1; i++) {
        if (i == modelpath.length || modelpath[i] === '.') {
            const key = modelpath.slice(i0, i);
            const v = obj[key];
            if (typeof v === 'object')
                return get_e(v, modelpath, i+1)
            return v;
        }
    }
    return undefined;
}

const out_a = get_a(obj, 'd.a')
console.log('out_a', out_a);
const out_b = get_b(obj, 'd.a')
console.log('out_b', out_b);
const out_c = get_c(obj, 'd.a')
console.log('out_c', out_c);
const out_d = get_d(obj, 'd.a')
console.log('out_d', out_d);
const out_e = get_e(obj, 'd.a')
console.log('out_e', out_e);
console.log()

suite
    .add('A', () => {
        get_a(obj, 'd.a')
    })
    .add('B', () => {
        get_b(obj, 'd.a')
    })
    .add('C', () => {
        get_c(obj, 'd.a')
    })
    .add('D', () => {
        get_d(obj, 'd.a')
    })
    .add('E', () => {
        get_e(obj, 'd.a')
    })

    .on('cycle', (event: any) => {
        console.log(String(event.target));
    })
    .on('complete', () => {
        console.log('Fastest is ' + suite.filter('fastest').map('name'));
    })
    .run({ 'async': true });