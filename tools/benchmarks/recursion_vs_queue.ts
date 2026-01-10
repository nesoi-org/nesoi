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

function copy_r(val: any): any {
    if (Array.isArray(val)) {
        const new_val: any[] = [];
        for (let i = 0; i < val.length; i++) {
            new_val.push(val[i]);
        }
        return new_val;
    }
    else if (typeof val === 'object') {
        const new_val: Record<string, any> = {};
        const keys = Object.keys(val);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            new_val[key] = copy_r(val[key]);
        }
        return new_val;
    }
    else {
        return val
    }
}

function copy_q(obj: Record<string, any>) {

    const out: Record<string, any> = {};
    let queue = [{ obj, out }];

    while (queue.length) {
        const next: any[] = [];

        for (let i = 0; i < queue.length; i++) {
            const q = queue[i];

            const keys = Object.keys(q.obj);
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                
                const val = q.obj[key];

                if (Array.isArray(val)) {
                    q.out[key] = [];
                    next.push({ obj: val, out: q.out[key] })
                }
                else if (typeof val === 'object') {
                    q.out[key] = {};
                    next.push({ obj: val, out: q.out[key] })
                }
                else {
                    q.out[key] = q.obj[key]
                }
            }
        }

        queue = next;
    }

    return out;

}

const out_r = copy_r(obj)
console.log('out_r', out_r);
const out_q = copy_q(obj)
console.log('out_q', out_q);
console.log()

suite
    .add('Recursion', () => {
        for (let i = 0; i < 1000; i++) {
            copy_r(obj)
        }
    })
    .add('Queue', () => {
        for (let i = 0; i < 1000; i++) {
            copy_q(obj)
        }
    })

    .on('cycle', (event: any) => {
        console.log(String(event.target));
    })
    .on('complete', () => {
        console.log('Fastest is ' + suite.filter('fastest').map('name'));
    })
    .run({ 'async': true });