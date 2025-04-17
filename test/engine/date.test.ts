import { NesoiDatetime } from '~/engine/data/datetime';
import { Log } from '~/engine/util/log'

Log.level = 'off';

describe('Date', () => {

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


})
