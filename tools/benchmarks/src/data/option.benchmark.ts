/* eslint-disable no-prototype-builtins */
import { NesoiBenchmarkSuite } from '../../lib/suite';

export default new NesoiBenchmarkSuite('option', {
    n: [10, 100, 1000, 10000],
    data: n => ({ 
        n: n as number,
        list: Array.from({ length: n as number }).map((_,i) => i),    
        dict: Object.fromEntries(Array.from({ length: n as number }).map((_,i) => [i,true])),
        list_string: Array.from({ length: n as number }).map((_,i) => `${i}`),    
        dict_string: Object.fromEntries(Array.from({ length: n as number }).map((_,i) => [`${i}`,true])),
    })
})
    .add_('[ includes ]', data => {
        let i = 0;
        const key = data.n-1;
        if (data.list.includes(key)) i++;
    })
    .add_('[ in ]', data => {
        let i = 0;
        const key = data.n-1;
        if (key in data.dict) i++;
    })
    .add_('[ get ]', data => {
        let i = 0;
        const key = data.n-1;
        if (data.dict[key]) i++;
    })
    .add_('[ keys includes ]', data => {
        let i = 0;
        const key = data.n-1;
        if (Object.keys(data.dict).includes(key.toString())) i++;
    })

    .add_('[ includes (str) ]', data => {
        let i = 0;
        const key = `${data.n-1}`;
        if (data.list_string.includes(key)) i++;
    })
    .add_('[ in (str) ]', data => {
        let i = 0;
        const key = `${data.n-1}`;
        if (key in data.dict_string) i++;
    })
    .add_('[ get (str) ]', data => {
        let i = 0;
        const key = `${data.n-1}`;
        if (data.dict_string[key]) i++;
    })
    .add_('[ keys includes (str) ]', data => {
        let i = 0;
        const key = `${data.n-1}`;
        if (Object.keys(data.dict_string).includes(key)) i++;
    })