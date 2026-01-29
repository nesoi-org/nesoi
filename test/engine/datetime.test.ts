import { NesoiDatetime } from '~/engine/data/datetime';
import type { DateDuration, TimeDuration } from '~/engine/data/duration';
import { NesoiDuration } from '~/engine/data/duration';
import { Log } from '~/engine/util/log'

Log.level = 'off';

describe('Datetime', () => {

    it('should parse ISO correctly', async() => {

        function expectIsoStrings(isos: string[]) {
            const self = {
                toParseAs(epoch: number, tz: string) {
                    for (const iso of isos) {
                        const date = NesoiDatetime.fromISO(iso)
                        expect(date.epoch).toEqual(epoch);
                        expect(date.tz).toEqual(tz);
                    }
                    return self;
                },
                andValues(values: ReturnType<NesoiDatetime['toValues']>) {
                    for (const iso of isos) {
                        const date = NesoiDatetime.fromISO(iso)
                        expect(date.toValues()).toEqual(values);
                    }
                }
            }
            return self;
        }

        expectIsoStrings([
            '2025-04-17T06:12:34',
            '2025-04-17T06:12:34Z',
        ])
            .toParseAs(1744870354000, 'Z')
            .andValues({
                year: 2025,
                month: 4,
                day: 17,
                hour: 6,
                minute: 12,
                second: 34,
                ms: 0,
                tz: 'Z'
            })

        expectIsoStrings([
            '2025-04-17T06:12:34.567',
            '2025-04-17T06:12:34.567Z',
        ])
            .toParseAs(1744870354567, 'Z')
            .andValues({
                year: 2025,
                month: 4,
                day: 17,
                hour: 6,
                minute: 12,
                second: 34,
                ms: 567,
                tz: 'Z'
            })
        
        expectIsoStrings([
            '2025-04-17T06:12:34-07',
            '2025-04-17T06:12:34-07:00',
        ])
            .toParseAs(1744895554000, '-07:00')
            .andValues({
                year: 2025,
                month: 4,
                day: 17,
                hour: 6,
                minute: 12,
                second: 34,
                ms: 0,
                tz: '-07:00'
            })

        expectIsoStrings([
            '2025-04-17T06:12:34.567-07',
            '2025-04-17T06:12:34.567-07:00',
        ])
            .toParseAs(1744895554567, '-07:00')
            .andValues({
                year: 2025,
                month: 4,
                day: 17,
                hour: 6,
                minute: 12,
                second: 34,
                ms: 567,
                tz: '-07:00'
            })
        
        
        expectIsoStrings([
            '2025-04-17T06:12:34+05',
            '2025-04-17T06:12:34+05:00',
        ])
            .toParseAs(1744852354000, '+05:00')
            .andValues({
                year: 2025,
                month: 4,
                day: 17,
                hour: 6,
                minute: 12,
                second: 34,
                ms: 0,
                tz: '+05:00'
            })

        expectIsoStrings([
            '2025-04-17T06:12:34.567+05',
            '2025-04-17T06:12:34.567+05:00',
        ])
            .toParseAs(1744852354567, '+05:00')
            .andValues({
                year: 2025,
                month: 4,
                day: 17,
                hour: 6,
                minute: 12,
                second: 34,
                ms: 567,
                tz: '+05:00'
            })
        
    })

    it('should dump ISO correctly', async() => {
        
        {
            const date = new NesoiDatetime(1744870354000);
            expect(date.toISO()).toEqual('2025-04-17T06:12:34.000Z');
        }
        
        {
            const date = new NesoiDatetime(1744884754000, '-07:00');
            expect(date.toISO()).toEqual('2025-04-17T03:12:34.000-07:00');
        }
        
        {
            const date = new NesoiDatetime(1744870354000, '+05:00');
            expect(date.toISO()).toEqual('2025-04-17T11:12:34.000+05:00');
        }
        
    })

    it('should cycle ISO correctly', async() => {
        
        function expectIsoString(iso: string) {
            return {
                toCycle(as = iso) {
                    const date = NesoiDatetime.fromISO(iso);
                    const iso2 = date.toISO();
                    expect(iso2).toEqual(as);
                }
            }
        }

        expectIsoString('2025-04-17T06:12:34').toCycle('2025-04-17T06:12:34.000Z')
        expectIsoString('2025-04-17T06:12:34.000').toCycle('2025-04-17T06:12:34.000Z')
        expectIsoString('2025-04-17T06:12:34Z').toCycle('2025-04-17T06:12:34.000Z')
        expectIsoString('2025-04-17T06:12:34.000Z').toCycle()

        expectIsoString('2025-04-17T06:12:34-07').toCycle('2025-04-17T06:12:34.000-07:00')
        expectIsoString('2025-04-17T06:12:34.000-07').toCycle('2025-04-17T06:12:34.000-07:00')
        expectIsoString('2025-04-17T06:12:34-07:00').toCycle('2025-04-17T06:12:34.000-07:00')
        expectIsoString('2025-04-17T06:12:34.000-07:00').toCycle()

        expectIsoString('2025-04-17T06:12:34+05').toCycle('2025-04-17T06:12:34.000+05:00')
        expectIsoString('2025-04-17T06:12:34.000+05').toCycle('2025-04-17T06:12:34.000+05:00')
        expectIsoString('2025-04-17T06:12:34+05:00').toCycle('2025-04-17T06:12:34.000+05:00')
        expectIsoString('2025-04-17T06:12:34.000+05:00').toCycle()
        
    })

    it('should cycle epoch correctly', async() => {
        
        function expectEpoch(epoch: number, tz: keyof typeof NesoiDatetime.tz) {
            return {
                toCycle() {
                    const date = new NesoiDatetime(epoch, tz);
                    const iso = date.toISO();
                    const date2 = NesoiDatetime.fromISO(iso);
                    expect(date2.epoch).toEqual(epoch);
                    expect(date2.tz).toEqual(tz);
                }
            }
        }

        expectEpoch(1744870354000, 'Z').toCycle()    
        expectEpoch(1744870354000, '-07:00').toCycle()    
        expectEpoch(1744870354000, '+05:00').toCycle()    

    })

    it('should dump ISO Date correctly', async() => {
        
        {
            const date = new NesoiDatetime(1744870354000);
            expect(date.toISODate()).toEqual('2025-04-17'); // T06:12:34.000Z
        }
        
        {
            const date = new NesoiDatetime(1744870354000, '-07:00');
            expect(date.toISODate()).toEqual('2025-04-16');
        }
        
        {
            const date = new NesoiDatetime(1744870354000, '+05:00');
            expect(date.toISODate()).toEqual('2025-04-17');
        }
        
    })
    
    function expectIso(iso: string) {
        return {
            toShift(period: DateDuration | TimeDuration | NesoiDuration) {
                return {
                    as(newIso: string) {
                        const date = NesoiDatetime.fromISO(iso);
                        const date2 = date.plus(period);
                        const date3 = date2.minus(period);
                        expect(date2.toISO()).toEqual(newIso);
                        expect(date3.toISO()).toEqual(iso);
                    }
                }
            },
            toStartOf(period: 'day'|'month'|'year') {
                return {
                    as(newIso: string) {
                        const date = NesoiDatetime.fromISO(iso);
                        const date2 = date.startOf(period);
                        expect(date2.toISO()).toEqual(newIso);
                    }
                }
            },
            toEndOf(period: 'day'|'month'|'year') {
                return {
                    as(newIso: string) {
                        const date = NesoiDatetime.fromISO(iso);
                        const date2 = date.endOf(period);
                        expect(date2.toISO()).toEqual(newIso);
                    }
                }
            },
            toCompare(otherIso: string) {
                const date = NesoiDatetime.fromISO(iso);
                const date2 = NesoiDatetime.fromISO(otherIso);
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

    it('should shift miliseconds', async() => {
        
        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('1 ms')
            .as('2025-04-17T06:12:34.001Z')

        expectIso('2025-04-17T06:12:34.000-07:00')
            .toShift('1 milisecond')
            .as('2025-04-17T06:12:34.001-07:00')

        expectIso('2025-04-17T06:12:34.700Z')
            .toShift('349 milisecond')
            .as('2025-04-17T06:12:35.049Z')
            
        expectIso('2025-04-17T06:12:34.700-07:00')
            .toShift('349 miliseconds')
            .as('2025-04-17T06:12:35.049-07:00')
        
        expectIso('2025-04-17T06:12:34.000-07:00')
            .toShift({ miliseconds: 1 })
            .as('2025-04-17T06:12:34.001-07:00')

        expectIso('2025-04-17T06:12:34.700-07:00')
            .toShift(new NesoiDuration({ miliseconds: 349 }))
            .as('2025-04-17T06:12:35.049-07:00')
    })

    it('should shift seconds', async() => {

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('1 s')
            .as('2025-04-17T06:12:35.000Z')

        expectIso('2025-04-17T06:12:34.000-07:00')
            .toShift('1 second')
            .as('2025-04-17T06:12:35.000-07:00')

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('34 second')
            .as('2025-04-17T06:13:08.000Z')

        expectIso('2025-04-17T06:12:34.000-07:00')
            .toShift('34 seconds')
            .as('2025-04-17T06:13:08.000-07:00')

        expectIso('2025-04-17T06:12:34.000-07:00')
            .toShift({ seconds: 1 })
            .as('2025-04-17T06:12:35.000-07:00')

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift(new NesoiDuration({ seconds: 34 }))
            .as('2025-04-17T06:13:08.000Z')

    })

    it('should shift minutes', async() => {

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('1 min')
            .as('2025-04-17T06:13:34.000Z')

        expectIso('2025-04-17T06:12:34.000-07:00')
            .toShift('1 mins')
            .as('2025-04-17T06:13:34.000-07:00')

        expectIso('2025-04-17T06:42:34.000Z')
            .toShift('34 minute')
            .as('2025-04-17T07:16:34.000Z')

        expectIso('2025-04-17T06:42:34.000-07:00')
            .toShift('34 minutes')
            .as('2025-04-17T07:16:34.000-07:00')

        expectIso('2025-04-17T06:12:34.000-07:00')
            .toShift({ minutes: 1 })
            .as('2025-04-17T06:13:34.000-07:00')

        expectIso('2025-04-17T06:42:34.000Z')
            .toShift(new NesoiDuration({ minutes: 34 }))
            .as('2025-04-17T07:16:34.000Z')
    })

    it('should shift hours', async() => {
            
        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('1 h')
            .as('2025-04-17T07:12:34.000Z')

        expectIso('2025-04-17T06:12:34.000-07:00')
            .toShift('1 hour')
            .as('2025-04-17T07:12:34.000-07:00')

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('34 hour')
            .as('2025-04-18T16:12:34.000Z')

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('34 hours')
            .as('2025-04-18T16:12:34.000Z')

        expectIso('2025-04-17T06:12:34.000-07:00')
            .toShift({ hours: 1 })
            .as('2025-04-17T07:12:34.000-07:00')

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift(new NesoiDuration({ hours: 34 }))
            .as('2025-04-18T16:12:34.000Z')

    })

    it('should shift days', async() => {

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('1 d')
            .as('2025-04-18T06:12:34.000Z')

        expectIso('2025-04-17T06:12:34.000-07:00')
            .toShift('1 day')
            .as('2025-04-18T06:12:34.000-07:00')

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('34 day')
            .as('2025-05-21T06:12:34.000Z')

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('34 days')
            .as('2025-05-21T06:12:34.000Z')

        expectIso('2025-04-17T06:12:34.000-07:00')
            .toShift({ days: 1 })
            .as('2025-04-18T06:12:34.000-07:00')

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift(new NesoiDuration({ days: 34 }))
            .as('2025-05-21T06:12:34.000Z')

    })

    it('should shift weeks', async() => {

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('1 w')
            .as('2025-04-24T06:12:34.000Z')

        expectIso('2025-04-17T06:12:34.000-07:00')
            .toShift('1 week')
            .as('2025-04-24T06:12:34.000-07:00')

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('3 week')
            .as('2025-05-08T06:12:34.000Z')

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('3 weeks')
            .as('2025-05-08T06:12:34.000Z')

        expectIso('2025-04-17T06:12:34.000-07:00')
            .toShift({ weeks: 1 })
            .as('2025-04-24T06:12:34.000-07:00')

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift(new NesoiDuration({ weeks: 3 }))
            .as('2025-05-08T06:12:34.000Z')

    })

    it('should shift months', async() => {

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('1 month')
            .as('2025-05-17T06:12:34.000Z')

        expectIso('2025-04-17T06:12:34.000-07:00')
            .toShift('1 month')
            .as('2025-05-17T06:12:34.000-07:00')

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('9 months')
            .as('2026-01-17T06:12:34.000Z')

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('9 months')
            .as('2026-01-17T06:12:34.000Z')

        expectIso('2025-04-17T06:12:34.000-07:00')
            .toShift({ months: 1 })
            .as('2025-05-17T06:12:34.000-07:00')

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift(new NesoiDuration({ months: 9 }))
            .as('2026-01-17T06:12:34.000Z')

    })

    it('should shift years', async() => {

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('1 y')
            .as('2026-04-17T06:12:34.000Z')

        expectIso('2025-04-17T06:12:34.000-07:00')
            .toShift('1 year')
            .as('2026-04-17T06:12:34.000-07:00')

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('34 year')
            .as('2059-04-17T06:12:34.000Z')

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('34 years')
            .as('2059-04-17T06:12:34.000Z')

        expectIso('2025-04-17T06:12:34.000-07:00')
            .toShift({ years: 1 })
            .as('2026-04-17T06:12:34.000-07:00')

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift(new NesoiDuration({ years: 34 }))
            .as('2059-04-17T06:12:34.000Z')

    })


    it('should get start of day', async() => {
        expectIso('2025-04-17T03:12:34.567Z')
            .toStartOf('day')
            .as('2025-04-17T00:00:00.000Z')
        expectIso('2025-04-17T21:12:34.567Z')
            .toStartOf('day')
            .as('2025-04-17T00:00:00.000Z')
        expectIso('2025-04-17T23:59:59.999Z')
            .toStartOf('day')
            .as('2025-04-17T00:00:00.000Z')
        expectIso('2025-04-17T00:00:00.000Z')
            .toStartOf('day')
            .as('2025-04-17T00:00:00.000Z')
        
        expectIso('2025-04-17T03:12:34.567-07:00')
            .toStartOf('day')
            .as('2025-04-17T00:00:00.000-07:00')
        expectIso('2025-04-17T21:12:34.567-07:00')
            .toStartOf('day')
            .as('2025-04-17T00:00:00.000-07:00')
        expectIso('2025-04-17T23:59:59.999-07:00')
            .toStartOf('day')
            .as('2025-04-17T00:00:00.000-07:00')
        expectIso('2025-04-17T00:00:00.000-07:00')
            .toStartOf('day')
            .as('2025-04-17T00:00:00.000-07:00')

        expectIso('2025-04-17T03:12:34.567+07:00')
            .toStartOf('day')
            .as('2025-04-17T00:00:00.000+07:00')
        expectIso('2025-04-17T21:12:34.567+07:00')
            .toStartOf('day')
            .as('2025-04-17T00:00:00.000+07:00')
        expectIso('2025-04-17T23:59:59.999+07:00')
            .toStartOf('day')
            .as('2025-04-17T00:00:00.000+07:00')
        expectIso('2025-04-17T00:00:00.000+07:00')
            .toStartOf('day')
            .as('2025-04-17T00:00:00.000+07:00')
    })

    it('should get start of month', async() => {
        expectIso('2025-04-17T03:12:34.567Z')
            .toStartOf('month')
            .as('2025-04-01T00:00:00.000Z')
        expectIso('2025-04-17T21:12:34.567Z')
            .toStartOf('month')
            .as('2025-04-01T00:00:00.000Z')
        expectIso('2025-04-17T23:59:59.999Z')
            .toStartOf('month')
            .as('2025-04-01T00:00:00.000Z')
        expectIso('2025-04-17T00:00:00.000Z')
            .toStartOf('month')
            .as('2025-04-01T00:00:00.000Z')
        
        expectIso('2025-04-17T03:12:34.567-07:00')
            .toStartOf('month')
            .as('2025-04-01T00:00:00.000-07:00')
        expectIso('2025-04-17T21:12:34.567-07:00')
            .toStartOf('month')
            .as('2025-04-01T00:00:00.000-07:00')
        expectIso('2025-04-17T23:59:59.999-07:00')
            .toStartOf('month')
            .as('2025-04-01T00:00:00.000-07:00')
        expectIso('2025-04-17T00:00:00.000-07:00')
            .toStartOf('month')
            .as('2025-04-01T00:00:00.000-07:00')

        expectIso('2025-04-17T03:12:34.567+07:00')
            .toStartOf('month')
            .as('2025-04-01T00:00:00.000+07:00')
        expectIso('2025-04-17T21:12:34.567+07:00')
            .toStartOf('month')
            .as('2025-04-01T00:00:00.000+07:00')
        expectIso('2025-04-17T23:59:59.999+07:00')
            .toStartOf('month')
            .as('2025-04-01T00:00:00.000+07:00')
        expectIso('2025-04-17T00:00:00.000+07:00')
            .toStartOf('month')
            .as('2025-04-01T00:00:00.000+07:00')
    })

    it('should get start of year', async() => {
        expectIso('2025-04-17T03:12:34.567Z')
            .toStartOf('year')
            .as('2025-01-01T00:00:00.000Z')
        expectIso('2025-04-17T21:12:34.567Z')
            .toStartOf('year')
            .as('2025-01-01T00:00:00.000Z')
        expectIso('2025-04-17T23:59:59.999Z')
            .toStartOf('year')
            .as('2025-01-01T00:00:00.000Z')
        expectIso('2025-04-17T00:00:00.000Z')
            .toStartOf('year')
            .as('2025-01-01T00:00:00.000Z')
        
        expectIso('2025-04-17T03:12:34.567-07:00')
            .toStartOf('year')
            .as('2025-01-01T00:00:00.000-07:00')
        expectIso('2025-04-17T21:12:34.567-07:00')
            .toStartOf('year')
            .as('2025-01-01T00:00:00.000-07:00')
        expectIso('2025-04-17T23:59:59.999-07:00')
            .toStartOf('year')
            .as('2025-01-01T00:00:00.000-07:00')
        expectIso('2025-04-17T00:00:00.000-07:00')
            .toStartOf('year')
            .as('2025-01-01T00:00:00.000-07:00')

        expectIso('2025-04-17T03:12:34.567+07:00')
            .toStartOf('year')
            .as('2025-01-01T00:00:00.000+07:00')
        expectIso('2025-04-17T21:12:34.567+07:00')
            .toStartOf('year')
            .as('2025-01-01T00:00:00.000+07:00')
        expectIso('2025-04-17T23:59:59.999+07:00')
            .toStartOf('year')
            .as('2025-01-01T00:00:00.000+07:00')
        expectIso('2025-04-17T00:00:00.000+07:00')
            .toStartOf('year')
            .as('2025-01-01T00:00:00.000+07:00')
    })


    it('should get end of day', async() => {
        expectIso('2025-04-17T03:12:34.567Z')
            .toEndOf('day')
            .as('2025-04-17T23:59:59.999Z')
        expectIso('2025-04-17T21:12:34.567Z')
            .toEndOf('day')
            .as('2025-04-17T23:59:59.999Z')
        expectIso('2025-04-17T23:59:59.999Z')
            .toEndOf('day')
            .as('2025-04-17T23:59:59.999Z')
        expectIso('2025-04-17T23:59:59.999Z')
            .toEndOf('day')
            .as('2025-04-17T23:59:59.999Z')
        
        expectIso('2025-04-17T03:12:34.567-07:00')
            .toEndOf('day')
            .as('2025-04-17T23:59:59.999-07:00')
        expectIso('2025-04-17T21:12:34.567-07:00')
            .toEndOf('day')
            .as('2025-04-17T23:59:59.999-07:00')
        expectIso('2025-04-17T23:59:59.999-07:00')
            .toEndOf('day')
            .as('2025-04-17T23:59:59.999-07:00')
        expectIso('2025-04-17T23:59:59.999-07:00')
            .toEndOf('day')
            .as('2025-04-17T23:59:59.999-07:00')

        expectIso('2025-04-17T03:12:34.567+07:00')
            .toEndOf('day')
            .as('2025-04-17T23:59:59.999+07:00')
        expectIso('2025-04-17T21:12:34.567+07:00')
            .toEndOf('day')
            .as('2025-04-17T23:59:59.999+07:00')
        expectIso('2025-04-17T23:59:59.999+07:00')
            .toEndOf('day')
            .as('2025-04-17T23:59:59.999+07:00')
        expectIso('2025-04-17T23:59:59.999+07:00')
            .toEndOf('day')
            .as('2025-04-17T23:59:59.999+07:00')
    })

    it('should get end of month', async() => {
        expectIso('2025-04-17T03:12:34.567Z')
            .toEndOf('month')
            .as('2025-04-30T23:59:59.999Z')
        expectIso('2025-04-17T21:12:34.567Z')
            .toEndOf('month')
            .as('2025-04-30T23:59:59.999Z')
        expectIso('2025-04-17T23:59:59.999Z')
            .toEndOf('month')
            .as('2025-04-30T23:59:59.999Z')
        expectIso('2025-04-17T23:59:59.999Z')
            .toEndOf('month')
            .as('2025-04-30T23:59:59.999Z')
        
        expectIso('2025-04-17T03:12:34.567-07:00')
            .toEndOf('month')
            .as('2025-04-30T23:59:59.999-07:00')
        expectIso('2025-04-17T21:12:34.567-07:00')
            .toEndOf('month')
            .as('2025-04-30T23:59:59.999-07:00')
        expectIso('2025-04-17T23:59:59.999-07:00')
            .toEndOf('month')
            .as('2025-04-30T23:59:59.999-07:00')
        expectIso('2025-04-17T23:59:59.999-07:00')
            .toEndOf('month')
            .as('2025-04-30T23:59:59.999-07:00')

        expectIso('2025-04-17T03:12:34.567+07:00')
            .toEndOf('month')
            .as('2025-04-30T23:59:59.999+07:00')
        expectIso('2025-04-17T21:12:34.567+07:00')
            .toEndOf('month')
            .as('2025-04-30T23:59:59.999+07:00')
        expectIso('2025-04-17T23:59:59.999+07:00')
            .toEndOf('month')
            .as('2025-04-30T23:59:59.999+07:00')
        expectIso('2025-04-17T23:59:59.999+07:00')
            .toEndOf('month')
            .as('2025-04-30T23:59:59.999+07:00')
    })

    it('should get end of year', async() => {
        expectIso('2025-04-17T03:12:34.567Z')
            .toEndOf('year')
            .as('2025-12-31T23:59:59.999Z')
        expectIso('2025-04-17T21:12:34.567Z')
            .toEndOf('year')
            .as('2025-12-31T23:59:59.999Z')
        expectIso('2025-04-17T23:59:59.999Z')
            .toEndOf('year')
            .as('2025-12-31T23:59:59.999Z')
        expectIso('2025-04-17T00:00:00.000Z')
            .toEndOf('year')
            .as('2025-12-31T23:59:59.999Z')
        
        expectIso('2025-04-17T03:12:34.567-07:00')
            .toEndOf('year')
            .as('2025-12-31T23:59:59.999-07:00')
        expectIso('2025-04-17T21:12:34.567-07:00')
            .toEndOf('year')
            .as('2025-12-31T23:59:59.999-07:00')
        expectIso('2025-04-17T23:59:59.999-07:00')
            .toEndOf('year')
            .as('2025-12-31T23:59:59.999-07:00')
        expectIso('2025-04-17T00:00:00.000-07:00')
            .toEndOf('year')
            .as('2025-12-31T23:59:59.999-07:00')

        expectIso('2025-04-17T03:12:34.567+07:00')
            .toEndOf('year')
            .as('2025-12-31T23:59:59.999+07:00')
        expectIso('2025-04-17T21:12:34.567+07:00')
            .toEndOf('year')
            .as('2025-12-31T23:59:59.999+07:00')
        expectIso('2025-04-17T23:59:59.999+07:00')
            .toEndOf('year')
            .as('2025-12-31T23:59:59.999+07:00')
        expectIso('2025-04-17T00:00:00.000+07:00')
            .toEndOf('year')
            .as('2025-12-31T23:59:59.999+07:00')
    })

    it('should compare', async() => {
        expectIso('2025-04-17T03:12:34.567+07:00')
            .toCompare('2025-04-17T03:12:34.567+07:00')
            .asEq()
            
        expectIso('2025-04-18T03:12:34.567+07:00')
            .toCompare('2025-04-17T03:12:34.567+07:00')
            .asGt()

        expectIso('2025-04-17T03:12:34.567+07:00')
            .toCompare('2025-04-17T03:12:34.567+07:00')
            .asGteq()

        expectIso('2025-04-18T03:12:34.567+07:00')
            .toCompare('2025-04-17T03:12:34.567+07:00')
            .asGteq()

        expectIso('2025-04-16T03:12:34.567+07:00')
            .toCompare('2025-04-17T03:12:34.567+07:00')
            .asLt()

        expectIso('2025-04-17T03:12:34.567+07:00')
            .toCompare('2025-04-17T03:12:34.567+07:00')
            .asLteq()

        expectIso('2025-04-16T03:12:34.567+07:00')
            .toCompare('2025-04-17T03:12:34.567+07:00')
            .asLteq()
    })

    it('should convert to datetime', async() => {
        const datetime_z = NesoiDatetime.fromISO('2026-01-29T02:12:34.567Z');

        expect(datetime_z.toDate().toISO())
            .toEqual('2026-01-29')

        expect(datetime_z.atTimezone('-03:00').toDate().toISO())
            .toEqual('2026-01-28')
        
        const datetime_m3 = NesoiDatetime.fromISO('2026-01-29T23:12:34.567-03:00');

        expect(datetime_m3.toDate().toISO())
            .toEqual('2026-01-29')

        expect(datetime_m3.atTimezone('Z').toDate().toISO())
            .toEqual('2026-01-30')

    })

})
