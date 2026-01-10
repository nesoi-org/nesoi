/* eslint-disable no-prototype-builtins */
import Benchmark from 'benchmark';

const str_a = 'aaa';
const str_b = 'bbb';

const suite = new Benchmark.Suite;
suite
    .add('+', () => {
        const str2 = str_a + '.' + str_b;
    })
    .add('template string', () => {
        const str2 = `${str_a}.${str_b}`
    })

    .on('cycle', (event: any) => {
        console.log(String(event.target));
    })
    .on('complete', () => {
        console.log('Fastest is ' + suite.filter('fastest').map('name'));
    })
    .run({ 'async': true });
