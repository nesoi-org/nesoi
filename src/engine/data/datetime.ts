import { NesoiError } from './error';

export class NesoiDatetime {

    public static tz = {
        '-12:00': 'Etc/GMT+12',
        '-11:00': 'Etc/GMT+11',
        '-10:00': 'Etc/GMT+10',
        '-07:00': 'Etc/GMT+7',
        '-06:00': 'Etc/GMT+6',
        '-05:00': 'Etc/GMT+5',
        '-04:00': 'Etc/GMT+4',
        '-03:00': 'Etc/GMT+3',
        '-02:00': 'Etc/GMT+2',
        '-01:00': 'Etc/GMT+1',
        'Z': 'Etc/GMT',
        '+01:00': 'Etc/GMT-1',
        '+02:00': 'Etc/GMT-2',
        '+03:00': 'Etc/GMT-3',
        '+04:00': 'Etc/GMT-4',
        '+05:00': 'Etc/GMT-5',
        '+06:00': 'Etc/GMT-6',
        '+07:00': 'Etc/GMT-7',
        '+08:00': 'Etc/GMT-8',
        '+09:00': 'Etc/GMT-9',
        '+10:00': 'Etc/GMT-10',
        '+11:00': 'Etc/GMT-11',
        '+12:00': 'Etc/GMT-12',
        '+13:00': 'Etc/GMT-13',
    }

    /**
     * Time in milliseconds since 1970-01-01T00:00:00.000Z
     */
    public epoch: number;

    /**
     * Timezone represented as string (Z, -03, +05, ...)
     */
    public tz: keyof typeof NesoiDatetime.tz;
    
    constructor(
        epoch?: number,
        tz: keyof typeof NesoiDatetime.tz = 'Z'
    ) {
        this.epoch = epoch || new Date().getTime();
        this.tz = tz;
    }

    // Dump

    toISO() {
        return new Date(this.epoch).toLocaleString('sv-SE', {
            timeZone: NesoiDatetime.tz[this.tz],
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            fractionalSecondDigits: 3
        } as any)
            .replace(' ','T')
            .replace(',','.')
            + this.tz
    }

    /**
     * Parse a timestamp from ISO 8601 format.
     * 
     * Example: `2025-04-16T23:04:42.000-03:00`
     */
    static fromISO(iso: string) {
        const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?(([-+]\d{2})|Z)?(:00)?$/);
        // TODO: Check invalid datetimes
        if (!match) {
            throw NesoiError.Data.InvalidISOString({ value: iso });
        }
        let tz = match[8];
        if (!tz) {
            iso += 'Z';
            tz = 'Z';
        }
        
        if (tz !== 'Z') {
            if (!match[10]) {
                iso += ':00';
            }
            tz += ':00';
        }

        const jsDate = Date.parse(iso);
        return new NesoiDatetime(jsDate, tz as any);
    }

    static now() {
        return new NesoiDatetime();
    }

    static isoNow() {
        return new NesoiDatetime().toISO();
    }

    static shortIsoNow() {
        return new NesoiDatetime().toISO().slice(5,19);
    }

    plus(period: `${number} ${'second'|'minute'|'hour'|'day'|'week'|'month'}${'s'|''}`) {
        return this;
    }


}