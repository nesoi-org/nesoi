import { NesoiBenchmarkSuite } from '../../lib/suite';

//

function compile_iterator(keys: string[]) {
    let fn = '';
    let i = 0;
    const n = keys.length;
    while (i < n) {
        fn += `fn('${keys[i]}');`;
        i++;
    }
    return new Function('obj', 'fn', fn) as (obj: Record<string, any>, fn: (key: string) => void) => void;
}

//

export default new NesoiBenchmarkSuite('obj_keys', {
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
    .add_('[ keys.map   ]', data => {
        Object.keys(data.obj).map(x => {
            const a = x;
        })
    })
    .add_('[ for_i_keys ]', data => {
        const keys = Object.keys(data.obj);
        for (let i = 0; i < keys.length; i++) {
            const a = data.obj[keys[i]];
        }
    })
    .add_('[ for_x_in_y ]', data => {
        for (const x in data.obj) {
            const a = x;
        }
    })
    .add_('[ while_keys ]', data => {
        const keys = Object.keys(data.obj);
        let i = 0;
        while (i < keys.length) {
            const a = keys[i];
            i++;
        }
    })
    .add_('[ compiled_iterator ]', data => {
        data.iterator(data.obj, v => {
            const a = v;
        })
    })
    // .add_('[ compiled_iterator +build ]', data => {
    //     const iterator = compile_iterator(Object.keys(data.obj));
    //     iterator(data.obj, v => {
    //         const a = v;
    //     })
    // })