import { NesoiDate } from '~/engine/data/date';
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

})
