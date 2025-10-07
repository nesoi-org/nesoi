import { NesoiDatetime } from '~/engine/data/datetime';
import { NesoiDuration } from '~/engine/data/duration';
import { Log } from '~/engine/util/log'

Log.level = 'off';

describe('Datetime', () => {

    it('should parse ISO correctly', async() => {

        function expectIsoStrings(isos: string[]) {
            return {
                toParseAs(epoch: number, tz: string) {
                    for (const iso of isos) {
                        const date = NesoiDatetime.fromISO(iso)
                        expect(date.epoch).toEqual(epoch);
                        expect(date.tz).toEqual(tz);
                    }
                }
            }
        }

        expectIsoStrings([
            '2025-04-17T06:12:34',
            '2025-04-17T06:12:34.000',
            '2025-04-17T06:12:34Z',
            '2025-04-17T06:12:34.000Z',
        ])
            .toParseAs(1744870354000, 'Z')
        
        expectIsoStrings([
            '2025-04-17T06:12:34-03',
            '2025-04-17T06:12:34.000-03',
            '2025-04-17T06:12:34-03:00',
            '2025-04-17T06:12:34.000-03:00',
        ])
            .toParseAs(1744881154000, '-03:00')
        
        
        expectIsoStrings([
            '2025-04-17T06:12:34+05',
            '2025-04-17T06:12:34.000+05',
            '2025-04-17T06:12:34+05:00',
            '2025-04-17T06:12:34.000+05:00',
        ])
            .toParseAs(1744852354000, '+05:00')
        
    })

    it('should dump ISO correctly', async() => {
        
        {
            const date = new NesoiDatetime(1744870354000);
            expect(date.toISO()).toEqual('2025-04-17T06:12:34.000Z');
        }
        
        {
            const date = new NesoiDatetime(1744870354000, '-03:00');
            expect(date.toISO()).toEqual('2025-04-17T03:12:34.000-03:00');
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

        expectIsoString('2025-04-17T06:12:34-03').toCycle('2025-04-17T06:12:34.000-03:00')
        expectIsoString('2025-04-17T06:12:34.000-03').toCycle('2025-04-17T06:12:34.000-03:00')
        expectIsoString('2025-04-17T06:12:34-03:00').toCycle('2025-04-17T06:12:34.000-03:00')
        expectIsoString('2025-04-17T06:12:34.000-03:00').toCycle()

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
        expectEpoch(1744870354000, '-03:00').toCycle()    
        expectEpoch(1744870354000, '+05:00').toCycle()    

    })
    
    function expectIso(iso: string) {
        return {
            toShift(period: `${number} ${keyof typeof NesoiDuration.UNITS}`) {
                return {
                    as(newIso: string) {
                        const date = NesoiDatetime.fromISO(iso);
                        const date2 = date.shift(`+ ${period}`);
                        const date3 = date2.shift(`- ${period}`);
                        expect(date2.toISO()).toEqual(newIso);
                        expect(date3.toISO()).toEqual(iso);
                    }
                }
            }
        }
    }

    it('should shift miliseconds', async() => {
        
        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('1 ms')
            .as('2025-04-17T06:12:34.001Z')

        expectIso('2025-04-17T06:12:34.000-03:00')
            .toShift('1 milisecond')
            .as('2025-04-17T06:12:34.001-03:00')

        expectIso('2025-04-17T06:12:34.700Z')
            .toShift('349 milisecond')
            .as('2025-04-17T06:12:35.049Z')
            
        expectIso('2025-04-17T06:12:34.700-03:00')
            .toShift('349 miliseconds')
            .as('2025-04-17T06:12:35.049-03:00')
    })

    it('should shift seconds', async() => {

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('1 s')
            .as('2025-04-17T06:12:35.000Z')

        expectIso('2025-04-17T06:12:34.000-03:00')
            .toShift('1 second')
            .as('2025-04-17T06:12:35.000-03:00')

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('34 second')
            .as('2025-04-17T06:13:08.000Z')

        expectIso('2025-04-17T06:12:34.000-03:00')
            .toShift('34 seconds')
            .as('2025-04-17T06:13:08.000-03:00')

    })

    it('should shift minutes', async() => {

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('1 min')
            .as('2025-04-17T06:13:34.000Z')

        expectIso('2025-04-17T06:12:34.000-03:00')
            .toShift('1 mins')
            .as('2025-04-17T06:13:34.000-03:00')

        expectIso('2025-04-17T06:42:34.000Z')
            .toShift('34 minute')
            .as('2025-04-17T07:16:34.000Z')

        expectIso('2025-04-17T06:42:34.000-03:00')
            .toShift('34 minutes')
            .as('2025-04-17T07:16:34.000-03:00')

    })

    it('should shift hours', async() => {
            
        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('1 h')
            .as('2025-04-17T07:12:34.000Z')

        expectIso('2025-04-17T06:12:34.000-03:00')
            .toShift('1 hour')
            .as('2025-04-17T07:12:34.000-03:00')

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('34 hour')
            .as('2025-04-18T16:12:34.000Z')

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('34 hours')
            .as('2025-04-18T16:12:34.000Z')

    })

    it('should shift days', async() => {

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('1 d')
            .as('2025-04-18T06:12:34.000Z')

        expectIso('2025-04-17T06:12:34.000-03:00')
            .toShift('1 day')
            .as('2025-04-18T06:12:34.000-03:00')

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('34 day')
            .as('2025-05-21T06:12:34.000Z')

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('34 days')
            .as('2025-05-21T06:12:34.000Z')

    })

    it('should shift weeks', async() => {

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('1 w')
            .as('2025-04-24T06:12:34.000Z')

        expectIso('2025-04-17T06:12:34.000-03:00')
            .toShift('1 week')
            .as('2025-04-24T06:12:34.000-03:00')

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('3 week')
            .as('2025-05-08T06:12:34.000Z')

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('3 weeks')
            .as('2025-05-08T06:12:34.000Z')

    })

    it('should shift months', async() => {

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('1 month')
            .as('2025-05-17T06:12:34.000Z')

        expectIso('2025-04-17T06:12:34.000-03:00')
            .toShift('1 month')
            .as('2025-05-17T06:12:34.000-03:00')

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('9 months')
            .as('2026-01-17T06:12:34.000Z')

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('9 months')
            .as('2026-01-17T06:12:34.000Z')

    })

    it('should shift years', async() => {

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('1 y')
            .as('2026-04-17T06:12:34.000Z')

        expectIso('2025-04-17T06:12:34.000-03:00')
            .toShift('1 year')
            .as('2026-04-17T06:12:34.000-03:00')

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('34 year')
            .as('2059-04-17T06:12:34.000Z')

        expectIso('2025-04-17T06:12:34.000Z')
            .toShift('34 years')
            .as('2059-04-17T06:12:34.000Z')

    })


})
