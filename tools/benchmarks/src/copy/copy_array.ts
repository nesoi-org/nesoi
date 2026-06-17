/* eslint-disable no-prototype-builtins */
import { NesoiBenchmarkSuite } from '../../lib/suite';

function compile_iterator(length: number) {
    let fn = 'const copy = [];';
    let i = 0;
    while (i < length) {
        fn += `copy.push(arr[${i}]);`;
        i++;
    }
    fn += 'return copy;'
    return new Function('arr', fn) as (obj: any[]) => void;
}

export default new NesoiBenchmarkSuite('copy_array', {
    n: [10, 100, 1000, 10000],
    data: n => {
        const arr = Array.from({ length: n as number }).map((x,i) => i);
        return {
            arr,
            iterator: compile_iterator(arr.length)
        }
    }
})
    .add_('[ push ]', data => {
        const copy: any[] = []
        for (let i = 0; i < data.arr.length; i++) {
            copy.push(data.arr[i]);
        }
    })
    // .add_('[ from length + assign ]', data => {
    //     const copy: any[] = Array.from({ length: data.arr.length });
    //     for (let i = 0; i < data.arr.length; i++) {
    //         copy[i] = data.arr[i];
    //     }
    // })
    .add_('[ Array(N) + assign ]', data => {
        const copy: any[] = Array(data.arr.length);
        for (let i = 0; i < data.arr.length; i++) {
            copy[i] = data.arr[i];
        }
    })
    // .add_('[ Object assign ]', data => {
    //     const copy = Object.assign([], data.arr);
    // })
    .add_('[ spread operator ]', data => {
        const copy = [...data.arr];
    })
    .add_('[ slice ]', data => {
        const copy = data.arr.slice();
    })
    .add_('[ slice0 ]', data => {
        const copy = data.arr.slice(0);
    })
    // .add_('[ compiled_copy ]', data => {
    //     const copy = data.iterator(data.arr)
    // })