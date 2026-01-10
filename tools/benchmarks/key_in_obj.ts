/* eslint-disable no-prototype-builtins */
import Benchmark from 'benchmark';

const suite = new Benchmark.Suite;
suite
    .add('in', () => {
        const obj = {
            a: 1,
            b: 2,
            c: 3
        }
        const x = 'a' in obj;
        const y = 'd' in obj;
    })
    .add('includes', () => {
        const obj = {
            a: 1,
            b: 2,
            c: 3
        }
        const x = Object.keys(obj).includes('a');
        const y = Object.keys(obj).includes('d');
    })
    .add('hasOwn', () => {
        const obj = {
            a: 1,
            b: 2,
            c: 3
        }
        const x = Object.hasOwn(obj, 'a');
        const y = Object.hasOwn(obj, 'd');
    })
    .add('hasOwnProperty', () => {
        const obj = {
            a: 1,
            b: 2,
            c: 3
        }
        const x = obj.hasOwnProperty('a');
        const y = obj.hasOwnProperty('d');
    })

    .on('cycle', (event: any) => {
        console.log(String(event.target));
    })
    .on('complete', () => {
        console.log('Fastest is ' + suite.filter('fastest').map('name'));
    })
    .run({ 'async': true });
