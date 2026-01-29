import { NesoiDate } from '~/engine/data/date';
import type { DateDuration} from '~/engine/data/duration';
import { NesoiDuration } from '~/engine/data/duration';
import { Log } from '~/engine/util/log'

Log.level = 'off';

describe('Date', () => {

    it('should parse ISO correctly', async() => {

        function expectIsoStrings(isos: string[]) {
            return {
                toParseAs(day: number, month: number, year: number) {
                    for (const iso of isos) {
                        const date = NesoiDate.fromISO(iso)
                        expect(date.day).toEqual(day);
                        expect(date.month).toEqual(month);
                        expect(date.year).toEqual(year);
                    }
                }
            }
        }

        expectIsoStrings([
            '2025-04-17',
            '2025-04-17',
            '2025-04-17',
            '2025-04-17',
        ])
            .toParseAs(17,4,2025)
    })

    it('should dump ISO correctly', async() => {
        
        {
            const date = new NesoiDate(17, 4, 2025);
            expect(date.toISO()).toEqual('2025-04-17');
        }

    })

    it('should cycle ISO correctly', async() => {
        
        function expectIsoString(iso: string) {
            return {
                toCycle(as = iso) {
                    const date = NesoiDate.fromISO(iso);
                    const iso2 = date.toISO();
                    expect(iso2).toEqual(as);
                }
            }
        }

        expectIsoString('2025-04-17').toCycle()
        
    })


    it('should dump ISO datetime correctly', async() => {
        
        {
            const date = new NesoiDate(17, 4, 2025);
            expect(date.toISODatetime('start')).toEqual('2025-04-17T00:00:00.000Z');
        }
        
        {
            const date = new NesoiDate(17, 4, 2025);
            expect(date.toISODatetime('end')).toEqual('2025-04-17T23:59:59.999Z');
        }
        
        {
            const date = new NesoiDate(17, 4, 2025);
            expect(date.toISODatetime('start', '-07:00')).toEqual('2025-04-17T00:00:00.000-07:00');
        }
        
        {
            const date = new NesoiDate(17, 4, 2025);
            expect(date.toISODatetime('end', '-07:00')).toEqual('2025-04-17T23:59:59.999-07:00');
        }

    })

    function expectIso(iso: string) {
        return {
            toShift(period: DateDuration | NesoiDuration) {
                return {
                    as(newIso: string) {
                        const date = NesoiDate.fromISO(iso);
                        const date2 = date.plus(period);
                        const date3 = date2.minus(period);
                        expect(date2.toISO()).toEqual(newIso);
                        expect(date3.toISO()).toEqual(iso);
                    }
                }
            },
            toStartOf(period: 'week'|'month'|'year') {
                return {
                    as(newIso: string) {
                        const date = NesoiDate.fromISO(iso);
                        const date2 = date.startOf(period);
                        expect(date2.toISO()).toEqual(newIso);
                    }
                }
            },
            toEndOf(period: 'week'|'month'|'year') {
                return {
                    as(newIso: string) {
                        const date = NesoiDate.fromISO(iso);
                        const date2 = date.endOf(period);
                        expect(date2.toISO()).toEqual(newIso);
                    }
                }
            },
            toCompare(otherIso: string) {
                const date = NesoiDate.fromISO(iso);
                const date2 = NesoiDate.fromISO(otherIso);
                return {
                    asEq() {
                        expect(date.eq(date2)).toEqual(true)
                    },
                    asGt() {
                        expect(date.gt(date2)).toEqual(true)
                    },
                    asGteq() {
                        expect(date.gteq(date2)).toEqual(true)
                    },
                    asLt() {
                        expect(date.lt(date2)).toEqual(true)
                    },
                    asLteq() {
                        expect(date.lteq(date2)).toEqual(true)
                    },
                }
            },
        }
    }

    it('should shift days', async() => {
        
        expectIso('2025-04-17')
            .toShift('3 d')
            .as('2025-04-20')

        expectIso('2025-04-17')
            .toShift('3 day')
            .as('2025-04-20')

        expectIso('2025-04-17')
            .toShift('3 days')
            .as('2025-04-20')

        expectIso('2025-04-17')
            .toShift({ days: 3 })
            .as('2025-04-20')

        expectIso('2025-04-17')
            .toShift(new NesoiDuration({ days: 3 }))
            .as('2025-04-20')
            
    })

    it('should shift weeks', async() => {
        
        expectIso('2025-04-17')
            .toShift('2 w')
            .as('2025-05-01')

        expectIso('2025-04-17')
            .toShift('2 week')
            .as('2025-05-01')

        expectIso('2025-04-17')
            .toShift('2 weeks')
            .as('2025-05-01')

        expectIso('2025-04-17')
            .toShift({ weeks: 2 })
            .as('2025-05-01')

        expectIso('2025-04-17')
            .toShift(new NesoiDuration({ weeks: 2 }))
            .as('2025-05-01')
            
    })

    it('should shift months', async() => {
        
        expectIso('2025-04-17')
            .toShift('3 month')
            .as('2025-07-17')

        expectIso('2025-04-17')
            .toShift('3 months')
            .as('2025-07-17')

        expectIso('2025-04-17')
            .toShift({ months: 3 })
            .as('2025-07-17')

        expectIso('2025-04-17')
            .toShift(new NesoiDuration({ months: 3 }))
            .as('2025-07-17')
            
    })

    it('should shift years', async() => {
        
        expectIso('2025-04-17')
            .toShift('3 y')
            .as('2028-04-17')
        
        expectIso('2025-04-17')
            .toShift('3 year')
            .as('2028-04-17')

        expectIso('2025-04-17')
            .toShift('3 years')
            .as('2028-04-17')

        expectIso('2025-04-17')
            .toShift({ years: 3 })
            .as('2028-04-17')

        expectIso('2025-04-17')
            .toShift(new NesoiDuration({ years: 3 }))
            .as('2028-04-17')
            
    })


    it('should get start of week', async() => {
        
        expectIso('2025-01-01')
            .toStartOf('week')
            .as('2024-12-29')

        expectIso('2025-02-13')
            .toStartOf('week')
            .as('2025-02-09')

        expectIso('2025-04-17')
            .toStartOf('week')
            .as('2025-04-13')
        
        expectIso('2025-12-31')
            .toStartOf('week')
            .as('2025-12-28')
        
        // leap year

        expectIso('2028-01-01')
            .toStartOf('week')
            .as('2027-12-26')

        expectIso('2028-02-13')
            .toStartOf('week')
            .as('2028-02-13')

        expectIso('2028-04-17')
            .toStartOf('week')
            .as('2028-04-16')
        
        expectIso('2028-12-31')
            .toStartOf('week')
            .as('2028-12-31')
        
    })

    it('should get start of month', async() => {
        
        expectIso('2025-01-01')
            .toStartOf('month')
            .as('2025-01-01')

        expectIso('2025-02-13')
            .toStartOf('month')
            .as('2025-02-01')

        expectIso('2025-04-17')
            .toStartOf('month')
            .as('2025-04-01')
        
        expectIso('2025-12-31')
            .toStartOf('month')
            .as('2025-12-01')
        
        // leap year

        expectIso('2028-01-01')
            .toStartOf('month')
            .as('2028-01-01')

        expectIso('2028-02-13')
            .toStartOf('month')
            .as('2028-02-01')

        expectIso('2028-04-17')
            .toStartOf('month')
            .as('2028-04-01')
        
        expectIso('2028-12-31')
            .toStartOf('month')
            .as('2028-12-01')
        
    })

    it('should get start of year', async() => {
        expectIso('2025-01-01')
            .toStartOf('year')
            .as('2025-01-01')

        expectIso('2025-02-13')
            .toStartOf('year')
            .as('2025-01-01')

        expectIso('2025-04-17')
            .toStartOf('year')
            .as('2025-01-01')
        
        expectIso('2025-12-31')
            .toStartOf('year')
            .as('2025-01-01')
        
        // leap year

        expectIso('2028-01-01')
            .toStartOf('year')
            .as('2028-01-01')

        expectIso('2028-02-13')
            .toStartOf('year')
            .as('2028-01-01')

        expectIso('2028-04-17')
            .toStartOf('year')
            .as('2028-01-01')
        
        expectIso('2028-12-31')
            .toStartOf('year')
            .as('2028-01-01')
    })

    it('should get end of week', async() => {
        
        expectIso('2025-01-01')
            .toEndOf('week')
            .as('2025-01-04')

        expectIso('2025-02-13')
            .toEndOf('week')
            .as('2025-02-15')

        expectIso('2025-04-17')
            .toEndOf('week')
            .as('2025-04-19')
        
        expectIso('2025-12-31')
            .toEndOf('week')
            .as('2026-01-03')
        
        // leap year

        expectIso('2028-01-01')
            .toEndOf('week')
            .as('2028-01-01')

        expectIso('2028-02-13')
            .toEndOf('week')
            .as('2028-02-19')

        expectIso('2028-04-17')
            .toEndOf('week')
            .as('2028-04-22')
        
        expectIso('2028-12-31')
            .toEndOf('week')
            .as('2029-01-06')
        
    })

    it('should get end of month', async() => {
        
        expectIso('2025-01-01')
            .toEndOf('month')
            .as('2025-01-31')

        expectIso('2025-02-13')
            .toEndOf('month')
            .as('2025-02-28')

        expectIso('2025-04-17')
            .toEndOf('month')
            .as('2025-04-30')
        
        expectIso('2025-12-31')
            .toEndOf('month')
            .as('2025-12-31')
        
        // leap year

        expectIso('2028-01-01')
            .toEndOf('month')
            .as('2028-01-31')

        expectIso('2028-02-13')
            .toEndOf('month')
            .as('2028-02-29')

        expectIso('2028-04-17')
            .toEndOf('month')
            .as('2028-04-30')
        
        expectIso('2028-12-31')
            .toEndOf('month')
            .as('2028-12-31')
        
    })

    it('should get end of year', async() => {
        expectIso('2025-01-01')
            .toEndOf('year')
            .as('2025-12-31')

        expectIso('2025-02-13')
            .toEndOf('year')
            .as('2025-12-31')

        expectIso('2025-04-17')
            .toEndOf('year')
            .as('2025-12-31')
        
        expectIso('2025-12-31')
            .toEndOf('year')
            .as('2025-12-31')
        
        // leap year

        expectIso('2028-01-01')
            .toEndOf('year')
            .as('2028-12-31')

        expectIso('2028-02-13')
            .toEndOf('year')
            .as('2028-12-31')

        expectIso('2028-04-17')
            .toEndOf('year')
            .as('2028-12-31')
        
        expectIso('2028-12-31')
            .toEndOf('year')
            .as('2028-12-31')
    })

    it('should compare', async() => {
        expectIso('2025-04-17')
            .toCompare('2025-04-17')
            .asEq()
            
        expectIso('2025-04-18')
            .toCompare('2025-04-17')
            .asGt()

        expectIso('2025-04-17')
            .toCompare('2025-04-17')
            .asGteq()

        expectIso('2025-04-18')
            .toCompare('2025-04-17')
            .asGteq()

        expectIso('2025-04-16')
            .toCompare('2025-04-17')
            .asLt()

        expectIso('2025-04-17')
            .toCompare('2025-04-17')
            .asLteq()

        expectIso('2025-04-16')
            .toCompare('2025-04-17')
            .asLteq()
    })

    it('should convert to datetime', async() => {
        const date = NesoiDate.fromISO('2026-01-29');

        expect(date.toDatetime('start').toISO())
            .toEqual('2026-01-29T00:00:00.000Z')

        expect(date.toDatetime('end').toISO())
            .toEqual('2026-01-29T23:59:59.999Z')

        expect(date.toDatetime('start', '-03:00').toISO())
            .toEqual('2026-01-29T00:00:00.000-03:00')

        expect(date.toDatetime('end', '-03:00').toISO())
            .toEqual('2026-01-29T23:59:59.999-03:00')
    })
})
