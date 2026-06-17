import { NesoiBenchmarkSuite } from '../../lib/suite';

// 

function branchless_loop(list: any[], fn: (v: any) => void, i = 0) {
    if (i < list.length) {
        fn(list[i]);
        branchless_loop(list, fn, i+1);
    }
}

function compile_iterator(length: number) {
    let fn = '';
    let i = 0;
    while (i < length) {
        fn += `fn(arr[${i}]);`;
        i++;
    }
    return new Function('arr', 'fn', fn) as (obj: Record<string, any>, fn: (key: string) => void) => void;
}

//

export default new NesoiBenchmarkSuite('list', {
    n: [10, 100, 1000, 10000],
    data: n => {
        const arr = Array.from({ length: n as number }).map((x,i) => i);
        return {
            arr,
            iterator: compile_iterator(arr.length)
        }
    }
})

    .add_('[ map         ]', data => {
        let a = 0;
        data.arr.map(x => {
            a += x;
        })
    })
    
    .add_('[ forEach     ]', data => {
        let a = 0;
        data.arr.forEach(x => {
            a += x;
        })
    })
    
    .add_('[ for_i       ]', data => {
        let a = 0;
        for (let i = 0; i < data.arr.length; i++) {
            a += data.arr[i];
        }
    })
    
    .add_('[ for_i, pre  ]', data => {
        let a = 0;
        for (let i = 0, n = data.arr.length; i < n; i++) {
            a += data.arr[i];
        }
    })
    
    .add_('[ for_x_of_y  ]', data => {
        let a = 0;
        for (const x of data.arr) {
            a += x;
        }
    })
    
    .add_('[ for_x_in_y  ]', data => {
        let a = 0;
        for (const x in data.arr) {
            a += data.arr[x];
        }
    })
    
    .add_('[ while ++i   ]', data => {
        let i = 0;
        const n = data.arr.length;
        let a = 0;
        while(++i < n) {
            a += data.arr[i];
        }
    })
    
    .add_('[ while ++i 2 ]', data => {
        let i = 0;
        let a = 0;
        while(++i < data.arr.length) {
            a += data.arr[i];
        }
    })
    
    .add_('[ while i--   ]', data => {
        let i = data.arr.length;
        let a = 0;
        while(i-- > 0) {
            a += data.arr[i];
        }
    })
    
    .add_('[ while i++   ]', data => {
        let i = 0;
        let a = 0;
        while(i < data.arr.length) {
            a += data.arr[i];
            i++;
        }
    })
    
    .add_('[ while i-- 2 ]', data => {
        let i = data.arr.length-1;
        let a = 0;
        while(i >= 0) {
            i--;
            a += data.arr[i];
        }
    })
    
    .add_('[ while i++5  ]', data => {
        let i = 0;
        let a = 0;
        while(i < data.arr.length) {
            a += data.arr[i];
            i++; if (i >= data.arr.length) break;
            a += data.arr[i];
            i++; if (i >= data.arr.length) break;
            a += data.arr[i];
            i++; if (i >= data.arr.length) break;
            a += data.arr[i];
            i++; if (i >= data.arr.length) break;
            a += data.arr[i];
            i++; if (i >= data.arr.length) break;
        }
    })
    
    .add_('[ branchless_loop ]', data => {
        let a = 0;
        branchless_loop(data.arr, (v: any) => {
            a += v;
        });
    })
    
    .add_('[ compiled_iterator ]', data => {
        data.iterator(data.arr, v => {
            const a = v;
        })
    })
    // .add_('[ compiled_iterator +build ]', data => {
    //     const iterator = compile_iterator(data.arr.length);
    //     iterator(data.arr, v => {
    //         const a = v;
    //     })
    // })