import Benchmark from 'benchmark';

const suite = new Benchmark.Suite;

suite
    .add('If', () => {
        const type: string = 'literal';
        if (type === 'boolean') { const t = type; }
        else if (type === 'date') { const t = type; }
        else if (type === 'datetime') { const t = type; }
        else if (type === 'duration') { const t = type; }
        else if (type === 'decimal') { const t = type; }
        else if (type === 'enum') { const t = type; }
        else if (type === 'file') { const t = type; }
        else if (type === 'float') { const t = type; }
        else if (type === 'int') { const t = type; }
        else if (type === 'string') { const t = type; }
        else if (type === 'obj') { const t = type; }
        else if (type === 'unknown') { const t = type; }
        else if (type === 'dict') { const t = type; }
        else if (type === 'list') { const t = type; }
        else if (type === 'union') { const t = type; }
        else if (type === 'literal') { const t = type; }
    })
    .add('Switch', () => {
        const type: string = 'literal';
        switch (type) {
        case 'boolean': { const t = type; break; }
        case 'date': { const t = type; break; }
        case 'datetime': { const t = type; break; }
        case 'duration': { const t = type; break; }
        case 'decimal': { const t = type; break; }
        case 'enum': { const t = type; break; }
        case 'file': { const t = type; break; }
        case 'float': { const t = type; break; }
        case 'int': { const t = type; break; }
        case 'string': { const t = type; break; }
        case 'obj': { const t = type; break; }
        case 'unknown': { const t = type; break; }
        case 'dict': { const t = type; break; }
        case 'list': { const t = type; break; }
        case 'union': { const t = type; break; }
        case 'literal': { const t = type; break; }
        }
    })

    .on('cycle', (event: any) => {
        console.log(String(event.target));
    })
    .on('complete', () => {
        console.log('Fastest is ' + suite.filter('fastest').map('name'));
    })
    .run({ 'async': true });
