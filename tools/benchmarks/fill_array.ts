/* eslint-disable no-prototype-builtins */
import Benchmark from 'benchmark';

const N = 1000;

const original = Array(N).map((_,i) => i);

const suite = new Benchmark.Suite;
suite
    .add('push', () => {
        const copy: any[] = []
        for (let i = 0; i < original.length; i++) {
            copy.push(original[i]);
        }
    })
    .add('from length + assign', () => {
        const copy: any[] = Array.from({ length: original.length });
        for (let i = 0; i < original.length; i++) {
            copy[i] = original[i];
        }
    })
    .add('Array(N) + assign', () => {
        const copy: any[] = Array(original.length);
        for (let i = 0; i < original.length; i++) {
            copy[i] = original[i];
        }
    })

    .on('cycle', (event: any) => {
        console.log(String(event.target));
    })
    .on('complete', () => {
        console.log('Fastest is ' + suite.filter('fastest').map('name'));
    })
    .run({ 'async': true });
