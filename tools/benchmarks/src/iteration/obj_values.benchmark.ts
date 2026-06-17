import { NesoiBenchmarkSuite } from '../../lib/suite';

//

function compile_iterator(keys: string[]) {
    let fn = '';
    let i = 0;
    const n = keys.length;
    while (i < n) {
        fn += `fn(obj['${keys[i]}']);`;
        i++;
    }
    return new Function('obj', 'fn', fn) as (obj: Record<string, any>, fn: (v: any) => void) => void;
}

//

export default new NesoiBenchmarkSuite('obj_values', {
    n: [10, 100, 1000, 10000],
    data: n => {
        const obj = Object.fromEntries(
            Array.from({ length: n as number }).map((x,i) => [i,i])
        );
        return {
            obj,
            iterator: compile_iterator(Object.keys(obj))
        }
    }
})
    .add_('[ values.map   ]', data => {
        let a = 0;
        Object.values(data.obj).map(x => {
            a += x;
        })
    })
    .add_('[ for_i_keys ]', data => {
        let a = 0;
        const values = Object.values(data.obj);
        for (let i = 0; i < values.length; i++) {
            a += data.obj[values[i]];
        }
    })
    .add_('[ for_x_in_y ]', data => {
        let a = 0;
        for (const x in data.obj) {
            a += data.obj[x];
        }
    })
    .add_('[ for_x_of_y ]', data => {
        let a = 0;
        const values = Object.values(data.obj)
        for (const x of values) {
            a += x;
        }
    })
    .add_('[ while_keys ]', data => {
        let a = 0;
        const values = Object.values(data.obj);
        let i = 0;
        while (i < values.length) {
            a += values[i];
            i++;
        }
    })
    .add_('[ compiled_iterator ]', data => {
        let a = 0;
        data.iterator(data.obj, v => {
            a += v;
        })
    })
    // .add_('[ compiled_iterator +build ]', data => {
    //     let a = 0;
    //     const iterator = compile_iterator(Object.keys(data.obj));
    //     iterator(data.obj, v => {
    //         a += v;
    //     })
    // })