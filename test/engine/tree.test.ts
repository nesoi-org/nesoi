import { Log } from '~/engine/util/log'
import { Tree } from '~/engine/data/tree';
import { Deep } from '~/engine/util/deep';

Log.level = 'off';

describe('Tree', () => {

    describe('get', () => {

        it('Should get root values', () => {
    
            const obj = {
                boolean: true,
                number: 12.34,
                string: 'string',
                null: null,
                undefined: undefined,
                symbol: Symbol('symbol'),
                obj: {
                    boolean: true,
                    number: 12.34,
                    string: 'string',
                    null: null,
                    undefined: undefined,
                    symbol: Symbol('symbol')
                },
                array: [
                    true,
                    12.34,
                    'string',
                    null,
                    undefined,
                    Symbol('symbol')
                ]
            }
    
            expect(Tree.get(obj, 'boolean')).toBe(obj['boolean']);
            expect(Tree.get(obj, 'number')).toBe(obj['number']);
            expect(Tree.get(obj, 'string')).toBe(obj['string']);
            expect(Tree.get(obj, 'null')).toBe(obj['null']);
            expect(Tree.get(obj, 'undefined')).toBe(obj['undefined']);
            expect(Tree.get(obj, 'symbol')).toBe(obj['symbol']);
            expect(Tree.get(obj, 'obj')).toBe(obj['obj']);
            expect(Tree.get(obj, 'array')).toBe(obj['array']);
        })
    
        it('Should get nested values', () => {
    
            const obj = {
                nested: {
                    boolean: true,
                    number: 12.34,
                    string: 'string',
                    null: null,
                    undefined: undefined,
                    symbol: Symbol('symbol'),
                    obj: {
                        boolean: true,
                        number: 12.34,
                        string: 'string',
                        null: null,
                        undefined: undefined,
                        symbol: Symbol('symbol'),
                    },
                    array: [
                        true,
                        12.34,
                        'string',
                        null,
                        undefined,
                        Symbol('symbol')
                    ]
                }
            }
    
            expect(Tree.get(obj, 'nested.boolean')).toBe(obj['nested']['boolean']);
            expect(Tree.get(obj, 'nested.number')).toBe(obj['nested']['number']);
            expect(Tree.get(obj, 'nested.string')).toBe(obj['nested']['string']);
            expect(Tree.get(obj, 'nested.null')).toBe(obj['nested']['null']);
            expect(Tree.get(obj, 'nested.undefined')).toBe(obj['nested']['undefined']);
            expect(Tree.get(obj, 'nested.symbol')).toBe(obj['nested']['symbol']);
            expect(Tree.get(obj, 'nested.obj')).toBe(obj['nested']['obj']);
            expect(Tree.get(obj, 'nested.array')).toBe(obj['nested']['array']);
            
            expect(Tree.get(obj, 'nested.obj.boolean')).toBe(obj['nested']['obj']['boolean']);
            expect(Tree.get(obj, 'nested.obj.number')).toBe(obj['nested']['obj']['number']);
            expect(Tree.get(obj, 'nested.obj.string')).toBe(obj['nested']['obj']['string']);
            expect(Tree.get(obj, 'nested.obj.null')).toBe(obj['nested']['obj']['null']);
            expect(Tree.get(obj, 'nested.obj.undefined')).toBe(obj['nested']['obj']['undefined']);
            expect(Tree.get(obj, 'nested.obj.symbol')).toBe(obj['nested']['obj']['symbol']);
            
        })
    
        it('Should get values from array using spread path', () => {
    
            const obj = {
                array: [
                    true,
                    12.34,
                    'string',
                    null,
                    undefined,
                    Symbol('symbol'),
                    {
                        boolean: true,
                        number: 12.34,
                        string: 'string',
                        null: null,
                        undefined: undefined,
                        symbol: Symbol('symbol'),
                    },
                    {
                        boolean: true,
                        number: 12.34,
                        string: 'string',
                        null: null,
                        undefined: undefined,
                        symbol: Symbol('symbol'),
                    },
                    {
                        boolean: true,
                        number: 12.34,
                        string: 'string',
                        null: null,
                        undefined: undefined,
                        symbol: Symbol('symbol'),
                    }
                ] as any[]
            }
    
            expect(Tree.get(obj, 'array')).toBe(obj['array']);
            expect(Tree.get(obj, 'array.#', 0)).toBe(obj['array'][0]);
            expect(Tree.get(obj, 'array.#', [3])).toBe(obj['array'][3]);
            expect(Tree.get(obj, 'array.#', [99])).toBe(undefined);
            expect(Tree.get(obj, 'array.#', '*')).toBe(obj['array']);
    
            expect(Tree.get(obj, 'array.#.boolean', 0)).toEqual(undefined);
            expect(Tree.get(obj, 'array.#.number', 0)).toEqual(undefined);
            expect(Tree.get(obj, 'array.#.string', 0)).toEqual(undefined);
            expect(Tree.get(obj, 'array.#.null', 0)).toEqual(undefined);
            expect(Tree.get(obj, 'array.#.undefined', 0)).toEqual(undefined);
            expect(Tree.get(obj, 'array.#.symbol', 0)).toEqual(undefined);
            
            expect(Tree.get(obj, 'array.#.boolean', [3])).toEqual(undefined);
            expect(Tree.get(obj, 'array.#.number', [3])).toEqual(undefined);
            expect(Tree.get(obj, 'array.#.string', [3])).toEqual(undefined);
            expect(Tree.get(obj, 'array.#.null', [3])).toEqual(undefined);
            expect(Tree.get(obj, 'array.#.undefined', [3])).toEqual(undefined);
            expect(Tree.get(obj, 'array.#.symbol', [3])).toEqual(undefined);
            
            expect(Tree.get(obj, 'array.#.boolean', [99])).toEqual(undefined);
            expect(Tree.get(obj, 'array.#.number', [99])).toEqual(undefined);
            expect(Tree.get(obj, 'array.#.string', [99])).toEqual(undefined);
            expect(Tree.get(obj, 'array.#.null', [99])).toEqual(undefined);
            expect(Tree.get(obj, 'array.#.undefined', [99])).toEqual(undefined);
            expect(Tree.get(obj, 'array.#.symbol', [99])).toEqual(undefined);
            
            expect(Tree.get(obj, 'array.#.boolean', [7])).toEqual(obj['array'][7]['boolean']);
            expect(Tree.get(obj, 'array.#.number', [7])).toEqual(obj['array'][7]['number']);
            expect(Tree.get(obj, 'array.#.string', [7])).toEqual(obj['array'][7]['string']);
            expect(Tree.get(obj, 'array.#.null', [7])).toEqual(obj['array'][7]['null']);
            expect(Tree.get(obj, 'array.#.undefined', [7])).toEqual(obj['array'][7]['undefined']);
            expect(Tree.get(obj, 'array.#.symbol', [7])).toEqual(obj['array'][7]['symbol']);
    
            expect(Tree.get(obj, 'array.#.boolean', '*')).toEqual([
                obj['array'][6]['boolean'], obj['array'][7]['boolean'], obj['array'][8]['boolean']
            ]);
            expect(Tree.get(obj, 'array.#.number', '*')).toEqual([
                obj['array'][6]['number'], obj['array'][7]['number'], obj['array'][8]['number']
            ]);
            expect(Tree.get(obj, 'array.#.string', '*')).toEqual([
                obj['array'][6]['string'], obj['array'][7]['string'], obj['array'][8]['string']
            ]);
            expect(Tree.get(obj, 'array.#.null', '*')).toEqual([
                obj['array'][6]['null'], obj['array'][7]['null'], obj['array'][8]['null']
            ]);
            expect(Tree.get(obj, 'array.#.undefined', '*')).toEqual([
                obj['array'][6]['undefined'], obj['array'][7]['undefined'], obj['array'][8]['undefined']
            ]);
            expect(Tree.get(obj, 'array.#.symbol', '*')).toEqual([
                obj['array'][6]['symbol'], obj['array'][7]['symbol'], obj['array'][8]['symbol']
            ]);
        })
    
        it('Should get values from dict using spread path', () => {
    
            const obj = {
                dict: {
                    boolean: true,
                    number: 12.34,
                    string: 'string',
                    null: null,
                    undefined: undefined,
                    symbol: Symbol('symbol'),
                    obj1: {
                        boolean: true,
                        number: 12.34,
                        string: 'string',
                        null: null,
                        undefined: undefined,
                        symbol: Symbol('symbol'),
                    },
                    obj2: {
                        boolean: true,
                        number: 12.34,
                        string: 'string',
                        null: null,
                        undefined: undefined,
                        symbol: Symbol('symbol'),
                    },
                    obj3: {
                        boolean: true,
                        number: 12.34,
                        string: 'string',
                        null: null,
                        undefined: undefined,
                        symbol: Symbol('symbol'),
                    }
                }
            }
    
            expect(Tree.get(obj, 'dict.#', 0)).toBe(obj['dict']['boolean']);
            expect(Tree.get(obj, 'dict.#', ['obj2'])).toBe(obj['dict']['obj2']);
            expect(Tree.get(obj, 'dict.#', ['obj9'])).toBe(undefined);
            expect(Tree.get(obj, 'dict.#', '*')).toEqual(Object.values(obj['dict']));
    
            expect(Tree.get(obj, 'dict.#.boolean', 0)).toBe(undefined);
            expect(Tree.get(obj, 'dict.#.number', 0)).toBe(undefined);
            expect(Tree.get(obj, 'dict.#.string', 0)).toBe(undefined);
            expect(Tree.get(obj, 'dict.#.null', 0)).toBe(undefined);
            expect(Tree.get(obj, 'dict.#.undefined', 0)).toBe(undefined);
            expect(Tree.get(obj, 'dict.#.symbol', 0)).toBe(undefined);
    
            expect(Tree.get(obj, 'dict.#.boolean', ['boolean'])).toBe(undefined);
            expect(Tree.get(obj, 'dict.#.number', ['boolean'])).toBe(undefined);
            expect(Tree.get(obj, 'dict.#.string', ['boolean'])).toBe(undefined);
            expect(Tree.get(obj, 'dict.#.null', ['boolean'])).toBe(undefined);
            expect(Tree.get(obj, 'dict.#.undefined', ['boolean'])).toBe(undefined);
            expect(Tree.get(obj, 'dict.#.symbol', ['boolean'])).toBe(undefined);
    
            expect(Tree.get(obj, 'dict.#.boolean', ['none'])).toBe(undefined);
            expect(Tree.get(obj, 'dict.#.number', ['none'])).toBe(undefined);
            expect(Tree.get(obj, 'dict.#.string', ['none'])).toBe(undefined);
            expect(Tree.get(obj, 'dict.#.null', ['none'])).toBe(undefined);
            expect(Tree.get(obj, 'dict.#.undefined', ['none'])).toBe(undefined);
            expect(Tree.get(obj, 'dict.#.symbol', ['none'])).toBe(undefined);
    
            expect(Tree.get(obj, 'dict.#.boolean', ['obj1'])).toBe(obj['dict']['obj1']['boolean']);
            expect(Tree.get(obj, 'dict.#.number', ['obj1'])).toBe(obj['dict']['obj1']['number']);
            expect(Tree.get(obj, 'dict.#.string', ['obj1'])).toBe(obj['dict']['obj1']['string']);
            expect(Tree.get(obj, 'dict.#.null', ['obj1'])).toBe(obj['dict']['obj1']['null']);
            expect(Tree.get(obj, 'dict.#.undefined', ['obj1'])).toBe(obj['dict']['obj1']['undefined']);
            expect(Tree.get(obj, 'dict.#.symbol', ['obj1'])).toBe(obj['dict']['obj1']['symbol']);
    
            expect(Tree.get(obj, 'dict.#.boolean', '*')).toEqual([
                obj['dict']['obj1']['boolean'], obj['dict']['obj2']['boolean'], obj['dict']['obj3']['boolean']
            ])
            expect(Tree.get(obj, 'dict.#.number', '*')).toEqual([
                obj['dict']['obj1']['number'], obj['dict']['obj2']['number'], obj['dict']['obj3']['number']
            ])
            expect(Tree.get(obj, 'dict.#.string', '*')).toEqual([
                obj['dict']['obj1']['string'], obj['dict']['obj2']['string'], obj['dict']['obj3']['string']
            ])
            expect(Tree.get(obj, 'dict.#.null', '*')).toEqual([
                obj['dict']['obj1']['null'], obj['dict']['obj2']['null'], obj['dict']['obj3']['null']
            ])
            expect(Tree.get(obj, 'dict.#.undefined', '*')).toEqual([
                obj['dict']['obj1']['undefined'], obj['dict']['obj2']['undefined'], obj['dict']['obj3']['undefined']
            ])
            expect(Tree.get(obj, 'dict.#.symbol', '*')).toEqual([
                obj['dict']['obj1']['symbol'], obj['dict']['obj2']['symbol'], obj['dict']['obj3']['symbol']
            ])
        })
    
        it('Super nested arrays', () => {
    
            const obj = {
                array: [
                    1, 2, [
                        3, 4, [
                            5, 6, [
                                7, 8
                            ]
                        ]
                    ]
                ]
            } as any
    
            expect(Tree.get(obj, 'array.#', 0)).toBe(1);
            expect(Tree.get(obj, 'array.#.#', 0)).toBe(undefined);
            expect(Tree.get(obj, 'array.#.#.#', 0)).toBe(undefined);
            expect(Tree.get(obj, 'array.#.#.#.#', 0)).toBe(undefined);
    
            expect(Tree.get(obj, 'array.#', [0])).toBe(1);
            expect(Tree.get(obj, 'array.#.#', [0,0])).toBe(undefined);
            expect(Tree.get(obj, 'array.#.#.#', [0,0,0])).toBe(undefined);
            expect(Tree.get(obj, 'array.#.#.#.#', [0,0,0,0])).toBe(undefined);
    
            expect(Tree.get(obj, 'array.#', [2])).toEqual([3,4,[5,6,[7,8]]]);
            expect(Tree.get(obj, 'array.#.#', [2,2])).toEqual([5,6,[7,8]]);
            expect(Tree.get(obj, 'array.#.#.#', [2,2,2])).toEqual([7,8]);
            expect(Tree.get(obj, 'array.#.#.#.#', [2,2,2,1])).toEqual(8);
    
            expect(Tree.get(obj, 'array.#', '*')).toEqual([1,2,[3,4,[5,6,[7,8]]]]);
            expect(Tree.get(obj, 'array.#.#', '*')).toEqual([3,4,[5,6,[7,8]]]);
            expect(Tree.get(obj, 'array.#.#.#', '*')).toEqual([5,6,[7,8]]);
            expect(Tree.get(obj, 'array.#.#.#.#', '*')).toEqual([7,8]);
        })
    
        it('Super nested dicts', () => {
    
            const obj = {
                dict: {
                    a: 1,
                    b: 2,
                    c: {
                        d: 3,
                        e: 4,
                        f: {
                            g: 5,
                            h: 6,
                            i: {
                                j: 7,
                                k: 8
                            }
                        }
                    }
                }
            } as any
    
            expect(Tree.get(obj, 'dict.#', 0)).toBe(1);
            expect(Tree.get(obj, 'dict.#.#', 0)).toBe(undefined);
            expect(Tree.get(obj, 'dict.#.#.#', 0)).toBe(undefined);
            expect(Tree.get(obj, 'dict.#.#.#.#', 0)).toBe(undefined);
    
            expect(Tree.get(obj, 'dict.#', ['a'])).toBe(1);
            expect(Tree.get(obj, 'dict.#.#', ['a','a'])).toBe(undefined);
            expect(Tree.get(obj, 'dict.#.#.#', ['a','a','a'])).toBe(undefined);
            expect(Tree.get(obj, 'dict.#.#.#.#', ['a','a','a','a'])).toBe(undefined);
    
            expect(Tree.get(obj, 'dict.#', ['c'])).toEqual(obj['dict']['c']);
            expect(Tree.get(obj, 'dict.#.#', ['c','f'])).toEqual(obj['dict']['c']['f']);
            expect(Tree.get(obj, 'dict.#.#.#', ['c','f','i'])).toEqual(obj['dict']['c']['f']['i']);
            expect(Tree.get(obj, 'dict.#.#.#.#', ['c','f','i','k'])).toEqual(obj['dict']['c']['f']['i']['k']);
    
            expect(Tree.get(obj, 'dict.#', '*')).toEqual(Object.values(obj['dict']));
            expect(Tree.get(obj, 'dict.#.#', '*')).toEqual(Object.values(obj['dict']['c']));
            expect(Tree.get(obj, 'dict.#.#.#', '*')).toEqual(Object.values(obj['dict']['c']['f']));
            expect(Tree.get(obj, 'dict.#.#.#.#', '*')).toEqual(Object.values(obj['dict']['c']['f']['i']));
        })
    })

    describe('get', () => {

        it('Should replace root values', () => {
    
            const obj = {
                boolean: true,
                number: 12.34,
                string: 'string',
                null: null,
                undefined: undefined,
                symbol: Symbol('symbol'),
                obj: {
                    boolean: true,
                    number: 12.34,
                    string: 'string',
                    null: null,
                    undefined: undefined,
                    symbol: Symbol('symbol')
                },
                array: [
                    true,
                    12.34,
                    'string',
                    null,
                    undefined,
                    Symbol('symbol')
                ]
            } as any
    
            Tree.set(obj, 'boolean', () => false);
            expect(obj['boolean']).toBe(false);
    
            Tree.set(obj, 'number', v => 2*v);
            expect(obj['number']).toBe(24.68);
    
            Tree.set(obj, 'string', v => v+'abc');
            expect(obj['string']).toBe('stringabc');
    
            Tree.set(obj, 'null', () => 'notnull');
            expect(obj['null']).toBe('notnull');
    
            Tree.set(obj, 'undefined', () => 'defined');
            expect(obj['undefined']).toBe('defined');
    
            const otherSymbol = Symbol('other');
            Tree.set(obj, 'symbol', () => otherSymbol);
            expect(obj['symbol']).toBe(otherSymbol);
    
            Tree.set(obj, 'obj', v => ({ ...v, extra: 'sauce' }));
            expect(obj['obj']['extra']).toBe('sauce')
    
            Tree.set(obj, 'array', v => ([ ...v, 'sauce' ]));
            expect(obj['array']).toHaveLength(7)
            expect(obj['array'].at(-1)).toBe('sauce')
        })
    
        it('Should replace nested values', () => {
    
            const obj = {
                nested: {
                    boolean: true,
                    number: 12.34,
                    string: 'string',
                    null: null,
                    undefined: undefined,
                    symbol: Symbol('symbol'),
                    obj: {
                        boolean: true,
                        number: 12.34,
                        string: 'string',
                        null: null,
                        undefined: undefined,
                        symbol: Symbol('symbol'),
                    },
                    array: [
                        true,
                        12.34,
                        'string',
                        null,
                        undefined,
                        Symbol('symbol')
                    ]
                }
            } as any

            Tree.set(obj, 'nested.obj.boolean', () => false);
            expect(obj['nested']['obj']['boolean']).toBe(false);
    
            Tree.set(obj, 'nested.obj.number', v => 2*v);
            expect(obj['nested']['obj']['number']).toBe(24.68);
    
            Tree.set(obj, 'nested.obj.string', v => v+'abc');
            expect(obj['nested']['obj']['string']).toBe('stringabc');
    
            Tree.set(obj, 'nested.obj.null', () => 'notnull');
            expect(obj['nested']['obj']['null']).toBe('notnull');
    
            Tree.set(obj, 'nested.obj.undefined', () => 'defined');
            expect(obj['nested']['obj']['undefined']).toBe('defined');
    
            const otherSymbol = Symbol('other');
            Tree.set(obj, 'nested.obj.symbol', () => otherSymbol);
            expect(obj['nested']['obj']['symbol']).toBe(otherSymbol);
    

            Tree.set(obj, 'nested.boolean', () => false);
            expect(obj['nested']['boolean']).toBe(false);
    
            Tree.set(obj, 'nested.number', v => 2*v);
            expect(obj['nested']['number']).toBe(24.68);
    
            Tree.set(obj, 'nested.string', v => v+'abc');
            expect(obj['nested']['string']).toBe('stringabc');
    
            Tree.set(obj, 'nested.null', () => 'notnull');
            expect(obj['nested']['null']).toBe('notnull');
    
            Tree.set(obj, 'nested.undefined', () => 'defined');
            expect(obj['nested']['undefined']).toBe('defined');
    
            Tree.set(obj, 'nested.symbol', () => otherSymbol);
            expect(obj['nested']['symbol']).toBe(otherSymbol);
    
            Tree.set(obj, 'nested.obj', v => ({ ...v, extra: 'sauce' }));
            expect(obj['nested']['obj']['extra']).toBe('sauce')
    
            Tree.set(obj, 'nested.array', v => ([ ...v, 'sauce' ]));
            expect(obj['nested']['array']).toHaveLength(7)
            expect(obj['nested']['array'].at(-1)).toBe('sauce')
    
            // expect(Tree.get(obj, 'nested.boolean')).toBe(obj['nested']['boolean']);
            // expect(Tree.get(obj, 'nested.number')).toBe(obj['nested']['number']);
            // expect(Tree.get(obj, 'nested.string')).toBe(obj['nested']['string']);
            // expect(Tree.get(obj, 'nested.null')).toBe(obj['nested']['null']);
            // expect(Tree.get(obj, 'nested.undefined')).toBe(obj['nested']['undefined']);
            // expect(Tree.get(obj, 'nested.symbol')).toBe(obj['nested']['symbol']);
            // expect(Tree.get(obj, 'nested.obj')).toBe(obj['nested']['obj']);
            // expect(Tree.get(obj, 'nested.array')).toBe(obj['nested']['array']);
            
            // expect(Tree.get(obj, 'nested.obj.boolean')).toBe(obj['nested']['obj']['boolean']);
            // expect(Tree.get(obj, 'nested.obj.number')).toBe(obj['nested']['obj']['number']);
            // expect(Tree.get(obj, 'nested.obj.string')).toBe(obj['nested']['obj']['string']);
            // expect(Tree.get(obj, 'nested.obj.null')).toBe(obj['nested']['obj']['null']);
            // expect(Tree.get(obj, 'nested.obj.undefined')).toBe(obj['nested']['obj']['undefined']);
            // expect(Tree.get(obj, 'nested.obj.symbol')).toBe(obj['nested']['obj']['symbol']);
            
        })
    
        it('Should replace values from array using spread path', () => {
    
            const obj = {
                array: [
                    true,
                    12.34,
                    'string',
                    null,
                    undefined,
                    Symbol('symbol'),
                    {
                        boolean: true,
                        number: 12.34,
                        string: 'string',
                        null: null,
                        undefined: undefined,
                        symbol: Symbol('symbol'),
                    },
                    {
                        boolean: true,
                        number: 12.34,
                        string: 'string',
                        null: null,
                        undefined: undefined,
                        symbol: Symbol('symbol'),
                    },
                    {
                        boolean: true,
                        number: 12.34,
                        string: 'string',
                        null: null,
                        undefined: undefined,
                        symbol: Symbol('symbol'),
                    }
                ] as any[]
            }
            let tObj;
            
            
            tObj = Deep.copy(obj);
            Tree.set(tObj, 'array.#', (v, i) => `${i[0]}: ${typeof v}`);
            expect(tObj['array']).toEqual([
                '0: boolean',
                '1: number',
                '2: string',
                '3: object',
                '4: undefined',
                '5: symbol',
                '6: object',
                '7: object',
                '8: object'
            ]);

            tObj = Deep.copy(obj);
            Tree.set(tObj, 'array.#.number', (v, i) => v*(i[0] as number));
            expect(tObj['array'][6]['number']).toBeCloseTo(6*12.34)
            expect(tObj['array'][7]['number']).toBeCloseTo(7*12.34)
            expect(tObj['array'][8]['number']).toBeCloseTo(8*12.34)
        })
    
        it('Should replace values from dict using spread path', () => {
    
            const obj = {
                dict: {
                    boolean: true,
                    number: 12.34,
                    string: 'string',
                    null: null,
                    undefined: undefined,
                    symbol: Symbol('symbol'),
                    obj1: {
                        boolean: true,
                        number: 12.34,
                        string: 'string',
                        null: null,
                        undefined: undefined,
                        symbol: Symbol('symbol'),
                    },
                    obj2: {
                        boolean: true,
                        number: 56.78,
                        string: 'string',
                        null: null,
                        undefined: undefined,
                        symbol: Symbol('symbol'),
                    },
                    obj3: {
                        boolean: true,
                        number: 90.12,
                        string: 'string',
                        null: null,
                        undefined: undefined,
                        symbol: Symbol('symbol'),
                    }
                }
            }
            let tObj;
            
            tObj = Deep.copy(obj);
            Tree.set(tObj, 'dict.#', (v, i) => `${i[0]}: ${typeof v}`);
            expect(tObj['dict']).toEqual({
                boolean: 'boolean: boolean',
                number: 'number: number',
                string: 'string: string',
                null: 'null: object',
                undefined: 'undefined: undefined',
                symbol: 'symbol: symbol',
                obj1: 'obj1: object',
                obj2: 'obj2: object',
                obj3: 'obj3: object'
            });

            tObj = Deep.copy(obj);
            Tree.set(tObj, 'dict.#.number', (v, i) => i[0]+'='+v);
            expect(tObj['dict']['obj1']['number']).toBe('obj1=12.34')
            expect(tObj['dict']['obj2']['number']).toBe('obj2=56.78')
            expect(tObj['dict']['obj3']['number']).toBe('obj3=90.12')
        })
    
        it('Super nested arrays', () => {
    
            const obj = {
                array: [
                    1, 2, [
                        3, 4, [
                            5, 6, [
                                7, 8
                            ]
                        ]
                    ]
                ]
            } as any
            let tObj;
            
            tObj = Deep.copy(obj);
            Tree.set(tObj, 'array.#', (v,i) => i.join(':'));
            expect(tObj['array']).toEqual(['0','1','2'])
            
            tObj = Deep.copy(obj);
            Tree.set(tObj, 'array.#.#', (v,i) => i.join(':'));
            expect(tObj['array']).toEqual([1,2,['2:0','2:1','2:2']])
            
            tObj = Deep.copy(obj);
            Tree.set(tObj, 'array.#.#.#', (v,i) => i.join(':'));
            expect(tObj['array']).toEqual([1,2,[3,4,['2:2:0','2:2:1','2:2:2']]])
            
            tObj = Deep.copy(obj);
            Tree.set(tObj, 'array.#.#.#.#', (v,i) => i.join(':'));
            expect(tObj['array']).toEqual([1,2,[3,4,[5,6,['2:2:2:0','2:2:2:1']]]])
            
        })
    
        it('Super nested dicts', () => {
    
            const obj = {
                dict: {
                    a: 1,
                    b: 2,
                    c: {
                        d: 3,
                        e: 4,
                        f: {
                            g: 5,
                            h: 6,
                            i: {
                                j: 7,
                                k: 8
                            }
                        }
                    }
                }
            } as any
            let tObj;
            
            tObj = Deep.copy(obj);
            Tree.set(tObj, 'dict.#', (v,i) => i.join(':'));
            expect(tObj['dict']).toEqual({
                a: 'a',
                b: 'b',
                c: 'c',
            })
            
            tObj = Deep.copy(obj);
            Tree.set(tObj, 'dict.#.#', (v,i) => i.join(':'));
            expect(tObj['dict']).toEqual({
                a: 1,
                b: 2,
                c: {
                    d: 'c:d',
                    e: 'c:e',
                    f: 'c:f',
                }
            })
            
            tObj = Deep.copy(obj);
            Tree.set(tObj, 'dict.#.#.#', (v,i) => i.join(':'));
            expect(tObj['dict']).toEqual({
                a: 1,
                b: 2,
                c: {
                    d: 3,
                    e: 4,
                    f: {
                        g: 'c:f:g',
                        h: 'c:f:h',
                        i: 'c:f:i'
                    }
                }
            })
            
            tObj = Deep.copy(obj);
            Tree.set(tObj, 'dict.#.#.#.#', (v,i) => i.join(':'));
            expect(tObj['dict']).toEqual({
                a: 1,
                b: 2,
                c: {
                    d: 3,
                    e: 4,
                    f: {
                        g: 5,
                        h: 6,
                        i: {
                            j: 'c:f:i:j',
                            k: 'c:f:i:k'
                        }
                    }
                }
            })
            
        })
    })

})
