/* eslint-disable no-prototype-builtins */
import { NesoiBenchmarkSuite } from '../../lib/suite';

function shallow_clone(obj: Record<string, any>) {
    const copy: Record<string, any> = {};
    const keys = Object.keys(obj);
    let i = 0;
    while (i < keys.length) { copy[keys[i]] = obj[keys[i]]; i++ }
    return copy;
}

function compile_shallow_cloner(obj: Record<string, any>) {
    let fn = 'const copy = {};';
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
        fn += `copy['${keys[i]}'] = obj['${keys[i]}'];`;
    }
    fn += 'return copy;'
    return new Function('obj', fn) as (obj: Record<string, any>) => void;
}

export default new NesoiBenchmarkSuite('copy_shallow_obj', {
    n: [10, 100, 1000, 10000],
    data: n => {
        const obj = Object.fromEntries(
            Array.from({ length: n as number }).map((x,i) => [i,i])
        );
        return {
            obj,
            clone: compile_shallow_cloner(obj)
        }
    }
})
    .add_('[ while++ ]', data => {
        const obj: Record<string, any> = {};
        const keys = Object.keys(data.obj);
        let i = 0;
        while (i < keys.length) { obj[keys[i]] = data.obj[keys[i]]; i++ }
    })
    .add_('[ fn while++ ]', data => {
        const obj = shallow_clone(data.obj);
    })
    .add_('[ spread ]', data => {
        const obj = {...data.obj};
    })
    .add_('[ assign ]', data => {
        const obj = Object.assign({}, data.obj);
    })
    .add_('[ compiled clone ]', data => {
        const obj = data.clone(data.obj);
    })