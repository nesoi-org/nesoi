/* eslint-disable no-prototype-builtins */
import Benchmark from 'benchmark';

const suite = new Benchmark.Suite;
suite
    .add('for', () => {
        const keys = ['a', 'b', 'c'];
        const val = 1;
        
        const obj: Record<string, any> = {}
        for (let i = 0; i < keys.length; i++) {
            obj[keys[i]] = val;
        }
    })
    .add('map+fromEntries', () => {
        const keys = ['a', 'b', 'c'];
        const val = 1;
        
        const obj = Object.fromEntries(keys.map(k => [k, val]));
    })
    .add('for+fromEntries', () => {
        const keys = ['a', 'b', 'c'];
        const val = 1;
        
        const entries = [];
        for (let i = 0; i < keys.length; i++) {
            entries.push([keys[i], val]);
        }
        const obj = Object.fromEntries(entries);
    })

    .on('cycle', (event: any) => {
        console.log(String(event.target));
    })
    .on('complete', () => {
        console.log('Fastest is ' + suite.filter('fastest').map('name'));
    })
    .run({ 'async': true });
