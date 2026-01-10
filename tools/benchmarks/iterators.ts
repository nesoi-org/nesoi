import Benchmark from 'benchmark';

const N = 1000

console.log('\n--- list ---')

const list = Array.from({ length: N }).map((x,i) => i);

const suite_list = new Benchmark.Suite;
suite_list
    .add('[ map        ]', () => {
        list.map(x => {
            const a = x;
        })
    })
    .add('[ for_i      ]', () => {
        for (let i = 0; i < list.length; i++) {
            const a = list[i];
        }
    })
    .add('[ for_x_of_y ]', () => {
        for (const x of list) {
            const a = x;
        }
    })
    .add('[ for_x_in_y ]', () => {
        for (const x in list) {
            const a = list[x];
        }
    })

    .on('cycle', (event: any) => {
        console.log(String(event.target));
    })
    .on('complete', () => {
        console.log('Fastest is ' + suite_list.filter('fastest').map('name'));
    })
    .run({ 'async': false });

console.log('\n--- dict (keys) ---')

const dict_keys = Object.fromEntries(
    Array.from({ length: N }).map((x,i) => [i,i])
);

const suite_dict_keys_val = new Benchmark.Suite;
suite_dict_keys_val
    .add('[ keys.map   ]', () => {
        Object.keys(dict_keys).map(x => {
            const a = x;
        })
    })
    .add('[ for_i_keys ]', () => {
        const keys = Object.keys(dict_keys);
        for (let i = 0; i < keys.length; i++) {
            const a = dict_keys[keys[i]];
        }
    })
    .add('[ for_x_in_y ]', () => {
        for (const x in dict_keys) {
            const a = x;
        }
    })

    .on('cycle', (event: any) => {
        console.log(String(event.target));
    })
    .on('complete', () => {
        console.log('Fastest is ' + suite_dict_keys_val.filter('fastest').map('name'));
    })
    .run({ 'async': false });

console.log('\n--- dict (values) ---')

const dict = Object.fromEntries(
    Array.from({ length: N }).map((x,i) => [i,i])
);

const suite_dict_val = new Benchmark.Suite;
suite_dict_val
    .add('[ keys.map   ]', () => {
        Object.keys(dict).map(x => {
            const a = dict[x];
        })
    })
    .add('[ values.map ]', () => {
        Object.values(dict).map(x => {
            const a = x;
        })
    })
    .add('[ for_i_keys ]', () => {
        const keys = Object.keys(dict);
        for (let i = 0; i < keys.length; i++) {
            const a = dict[keys[i]];
        }
    })
    .add('[ for_i_vals ]', () => {
        const values = Object.values(dict);
        for (let i = 0; i < values.length; i++) {
            const a = values[i];
        }
    })
    .add('[ for_x_of_v ]', () => {
        for (const x of Object.values(dict)) {
            const a = x;
        }
    })
    .add('[ for_x_in_y ]', () => {
        for (const x in dict) {
            const a = dict[x];
        }
    })

    .on('cycle', (event: any) => {
        console.log(String(event.target));
    })
    .on('complete', () => {
        console.log('Fastest is ' + suite_dict_val.filter('fastest').map('name'));
    })
    .run({ 'async': false });

console.log('\n--- dict (keys and values) ---')

const suite_dict_keyval = new Benchmark.Suite;
suite_dict_keyval
    .add('[ keys.map    ]', () => {
        Object.keys(dict).map(x => {
            const k = x;
            const a = dict[x];
        })
    })
    .add('[ entries.map ]', () => {
        Object.entries(dict).map(x => {
            const k = x[0];
            const a = x[1];
        })
    })
    .add('[ for_i_keys  ]', () => {
        const keys = Object.keys(dict);
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            const a = dict[k];
        }
    })
    .add('[ for_i_kvs   ]', () => {
        const keys = Object.keys(dict);
        const values = Object.values(dict);
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            const a = values[i];
        }
    })
    .add('[ for_i_ents  ]', () => {
        const entries = Object.entries(dict);
        for (let i = 0; i < entries.length; i++) {
            const k = entries[i][0];
            const a = entries[i][1];
        }
    })
    .add('[ for_x_of_v  ]', () => {
        for (const x of Object.entries(dict)) {
            const k = x[0];
            const a = x[1];
        }
    })
    .add('[ for_x_in_y  ]', () => {
        for (const x in dict) {
            const k = x;
            const a = dict[x];
        }
    })

    .on('cycle', (event: any) => {
        console.log(String(event.target));
    })
    .on('complete', () => {
        console.log('Fastest is ' + suite_dict_keyval.filter('fastest').map('name'));
    })
    .run({ 'async': false });