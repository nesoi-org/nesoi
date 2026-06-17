/* eslint-disable no-prototype-builtins */
import { NesoiBenchmarkSuite } from '../../lib/suite';

function check(n: number, arr: any[]) {
    if (arr.length != n) throw new Error();

    let exp = 0;
    let i = n-1;
    while (i >= 0) { exp += arr[i]; i--;}

    let sum = 0;
    let j = arr.length-1;
    while (j >= 0) { sum += arr[j]; j--;}
    
    if (sum != exp) throw new Error();
}

export default new NesoiBenchmarkSuite('init_array', {
    n: [10, 100, 1000, 10000],
    data: n => ({ n })
})
    .add_('[ Array() ]', data => {
        const arr = Array(data.n);
        let i = arr.length-1;
        while (i >= 0) { arr[i] = i; i-- }
        check(data.n as number, arr);
    })
    .add_('[ Array.from(length) ]', data => {
        const arr = Array.from({ length: data.n as number });
        let i = arr.length-1;
        while (i >= 0) { arr[i] = i; i-- }
        check(data.n as number, arr);
    })
    .add_('[ Array.from(Array) ]', data => {
        const arr = Array.from(Array(data.n));
        let i = arr.length-1;
        while (i >= 0) { arr[i] = i; i-- }
        check(data.n as number, arr);
    })
    .add_('[ Array.from(length, ...) ]', data => {
        const arr = Array.from({length: data.n as number}, (_, i) => i);
        check(data.n as number, arr);
    })