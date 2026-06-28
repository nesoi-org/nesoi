import { Deep } from '~/engine/util/deep';

describe('Deep', () => {

    describe('Copy', () => {

        it('Should copy object with primitives only', () => {

            const obj = {
                boolean: true,
                number: 12.34,
                string: 'string',
                null: null,
                undefined: undefined,
                symbol: Symbol('symbol')
            }

            const copy = Deep.copy(obj);
            expect(copy).toEqual(obj);
        })

        it('Should copy object with level-1 nested objects', () => {

            const obj = {
                boolean: true,
                number: 12.34,
                nested1: {
                    string: 'string',
                    null: null,
                }
            }

            const copy = Deep.copy(obj);
            expect(copy).toEqual(obj);
            expect(copy.nested1).not.toBe(obj.nested1);
        })

        it('Should copy object with level-2 nested objects', () => {

            const obj = {
                boolean: true,
                number: 12.34,
                nested1: {
                    string: 'string',
                    null: null,
                    nested2: {
                        undefined: undefined,
                        symbol: Symbol('symbol')
                    }
                }
            }

            const copy = Deep.copy(obj);
            expect(copy).toEqual(obj);
            expect(copy.nested1).not.toBe(obj.nested1);
            expect(copy.nested1.nested2).not.toBe(obj.nested1.nested2);
        })


        it('Should copy object with array', () => {

            const obj = {
                array: [
                    true,
                    12.34,
                    'string',
                    null,
                    undefined,
                    Symbol('symbol')
                ]
            }

            const copy = Deep.copy(obj);
            expect(copy).toEqual(obj);
            expect(copy.array).not.toBe(obj.array);
        })

        it('Should copy object with level-1 nested array', () => {

            const obj = {
                array: [
                    true,
                    12.34,
                    [
                        'string',
                        null,
                    ]
                ]
            }

            const copy = Deep.copy(obj);
            expect(copy).toEqual(obj);
            expect(copy.array).not.toBe(obj.array);
            expect(copy.array[2]).not.toBe(obj.array[2]);
        })

        it('Should copy object with level-2 nested array', () => {

            const obj = {
                array: [
                    true,
                    12.34,
                    [
                        'string',
                        null,
                        [
                            undefined,
                            Symbol('symbol')
                        ]
                    ]
                ]
            }

            const copy = Deep.copy(obj);
            expect(copy).toEqual(obj);
            expect(copy.array).not.toBe(obj.array);
            expect(copy.array[2]).not.toBe(obj.array[2]);
            expect((copy.array[2] as any[])[2] as any[]).not.toBe((obj.array[2] as any[])[2]);
        })
    })
})
