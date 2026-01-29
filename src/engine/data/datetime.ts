
import { NesoiDate } from './date';
import type { DateDuration, TimeDuration } from './duration';
import { NesoiDuration } from './duration';
import { NesoiError } from './error';

export type NesoiDateTimeValues = {
    year: number
    month: number
    day: number
    hour: number
    minute: number
    second: number
    ms: number
    tz: NesoiDatetime['tz']
}

/**
 * @category Engine
 * @subcategory Data
 */
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
        this.epoch = epoch ?? new Date().getTime();
        this.tz = tz;
    }

    // Manipulate timezone

    atTimezone(tz: NesoiDatetime['tz']) {
        return new NesoiDatetime(this.epoch, tz);
    }

    /**
     * Make a new `NesoiDateTime`
     * @param year Numeric year
     * @param month 1~12
     * @param day 1~31
     * @param hour 0~24
     * @param minute 0~60
     * @param second 0~60
     * @param ms 0~999
     * @param tz 
     * @returns 
     */
    static make(
        year = 0,
        month = 1,
        day = 1,
        hour = 0,
        minute = 0,
        second = 0,
        ms = 0,
        tz: NesoiDatetime['tz'] = 'Z'
    ) {
        const _month = (month < 10 ? '0' : '') + month;
        const _day = (day < 10 ? '0' : '') + day;
        const _hour = (hour < 10 ? '0' : '') + hour;
        const _minute = (minute < 10 ? '0' : '') + minute;
        const _second = (second < 10 ? '0' : '') + second;
        const _ms = (ms < 100 ? '0' : '') + (ms < 10 ? '0' : '') + ms;
        return this.fromISO(
            `${year}-${_month}-${_day}T${_hour}:${_minute}:${_second}.${_ms}${tz}`
        )
    }

    // Parse

    static parse(value: string | NesoiDatetime) {
        if (typeof value === 'string') {
            return this.fromISO(value);
        }
        if (value instanceof NesoiDatetime) {
            return value;
        }
        throw NesoiError.Data.InvalidDatetime({ value });
    }

    /**
     * Create a NesoiDatetime from a string on the ISO 8601 format.
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

    static fromJSDate(date: Date, tz: keyof typeof NesoiDatetime.tz = 'Z') {
        return new NesoiDatetime(
            date.getTime(),
            tz
        );
    }

    static fromValues(values: Partial<NesoiDateTimeValues>) {
        return this.make(
            values.year,
            values.month,
            values.day,
            values.hour,
            values.minute,
            values.second,
            values.ms,
            values.tz,
        )
    }
    
    // Dump

    toISO() {
        const date = new Date(0);
        date.setUTCMilliseconds(this.epoch);
        return date.toLocaleString('sv-SE', {
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
            + this.tz;
    }
    toString() {
        return this.toISO();
    }

    toISODate() {
        const date = new Date(0);
        date.setUTCMilliseconds(this.epoch);
        return date.toLocaleString('sv-SE', {
            timeZone: NesoiDatetime.tz[this.tz],
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        } as any);
    }

    toValues(): NesoiDateTimeValues {
        const date = new Date(0);
        date.setUTCMilliseconds(this.epoch);
        const str = date.toLocaleString('sv-SE', {
            timeZone: NesoiDatetime.tz[this.tz],
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            second: 'numeric',
            fractionalSecondDigits: 3,

        } as any)

        const [_, year, month, day, hour, minute, second, ms] =
            str.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2}),(\d{3})/)!;

        return {
            year: parseInt(year),
            month: parseInt(month),
            day: parseInt(day),
            hour: parseInt(hour),
            minute: parseInt(minute),
            second: parseInt(second),
            ms: parseInt(ms),
            tz: this.tz
        }
    }

    toJSDate() {
        const date = new Date(0);
        date.setUTCMilliseconds(this.epoch);
        return date;
    }

    // Now

    static now() {
        return new NesoiDatetime();
    }

    static isoNow() {
        return new NesoiDatetime().toISO();
    }

    static shortIsoNow() {
        return new NesoiDatetime().toISO().slice(5,19);
    }

    // Shift

    plus(period: DateDuration | TimeDuration | NesoiDuration) {
        return this.shift(true, period);
    }

    minus(period: DateDuration | TimeDuration | NesoiDuration) {
        return this.shift(false, period);
    }
    
    private shift(plus: boolean, period: DateDuration | TimeDuration | NesoiDuration) {
        
        let duration;
        if (typeof period === 'string') {
            try {
                const [_, val, type] = period.match(/(\d+) +(\w+)/)!;
                duration = new NesoiDuration({
                    [type]: val
                } as any);
            }
            catch {
                throw new Error(`Attempt to shift NesoiDate failed due to invalid period '${period}'`);
            }
        }
        else {
            if (period instanceof NesoiDuration) {
                duration = period;
            }
            else {
                duration = new NesoiDuration(period);
            }
        }

        const mult = plus ? 1 : -1;

        let epoch = this.epoch;
        switch (duration.unit) {
        case 'miliseconds':
            epoch += mult * duration.value; break;
        case 'seconds':
            epoch += mult * duration.value * 1000; break;
        case 'minutes':
            epoch += mult * duration.value * 60 * 1000; break;
        case 'hours':
            epoch += mult * duration.value * 60 * 60 * 1000; break;
        case 'days':
            {
                const date = new Date(0);
                date.setUTCMilliseconds(this.epoch);
                date.setUTCDate(date.getUTCDate() + mult * duration.value);
                epoch = date.getTime();
            }
            break;
        case 'weeks':
            {
                const date = new Date(0);
                date.setUTCMilliseconds(this.epoch);
                date.setDate(date.getUTCDate() + mult * duration.value * 7);
                epoch = date.getTime();
            }
            break;
        case 'months':
            {
                const date = new Date(0);
                date.setUTCMilliseconds(this.epoch);
                date.setMonth(date.getUTCMonth() + mult * duration.value);
                epoch = date.getTime();
            }
            break;
        case 'years':
            {
                const date = new Date(0);
                date.setUTCMilliseconds(this.epoch);
                date.setUTCFullYear(date.getUTCFullYear() + mult * duration.value);
                epoch = date.getTime();
            }
            break;
        }
        return new NesoiDatetime(epoch, this.tz);
    }
    
    // Start Of

    /**
     * Returns a new `NesoiDatetime` which refers to the
     * start of a given period **on the object timezone**.
     * @param period 
     * @returns 
     */
    startOf(period: 'day'|'month'|'year') {
        const values = this.toValues();

        values.ms = 0;
        values.second = 0;
        values.minute = 0;
        values.hour = 0;

        switch(period) {
        case 'month':
            values.day = 1;
            break;
        case 'year':
            values.day = 1;
            values.month = 1;
            break;
        }

        return NesoiDatetime.fromValues(values)
    }
    
    // End Of

    /**
     * Returns a new `NesoiDatetime` which refers to the
     * end of a given period **on the object timezone**.
     * @param period 
     * @returns 
     */
    endOf(period: 'day'|'month'|'year') {
        const values = this.toValues();

        values.ms = 999;
        values.second = 59;
        values.minute = 59;
        values.hour = 23;

        switch(period) {
        case 'month':
            values.day = new Date(values.year, values.month, 0).getDate();
            break;
        case 'year':
            values.day = new Date(values.year, 12, 0).getDate();
            values.month = 12;
            break;
        }

        return NesoiDatetime.fromValues(values)
    }

    // Comparisons

    /**
     * Returns a float with the distance in milliseconds between the datetimes.
     * - `> 0`: left is greater
     * - `== 0`: dates match
     * - `< 0`: right is greater
     */
    compare(other: NesoiDatetime) {
        return (this.epoch - other.epoch);
    }

    eq(other: NesoiDatetime) {
        return this.compare(other) === 0;
    }

    gt(other: NesoiDatetime) {
        return this.compare(other) > 0;
    }

    gteq(other: NesoiDatetime) {
        return this.compare(other) >= 0;
    }

    lt(other: NesoiDatetime) {
        return this.compare(other) < 0;
    }

    lteq(other: NesoiDatetime) {
        return this.compare(other) <= 0;
    }

    // to NesoiDate
    toDate() {
        const values = this.toValues();
        return new NesoiDate(values.day, values.month, values.year);
    }
}