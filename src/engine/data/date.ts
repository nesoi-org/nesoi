import { NesoiDatetime } from './datetime';
import type { DateDuration} from './duration';
import { NesoiDuration } from './duration';
import { NesoiError } from './error';

/**
 * @category Engine
 * @subcategory Data
 */
export class NesoiDate {
    
    constructor(
        public day: number,
        public month: number,
        public year: number
    ) {}

    static from(iso_or_date: any) {
        if (typeof iso_or_date === 'string') {
            return this.fromISO(iso_or_date);
        }
        if (iso_or_date instanceof NesoiDate) {
            return iso_or_date;
        }
        throw NesoiError.Data.InvalidDate({ value: iso_or_date });
    }

    static fromISO(iso: string) {
        const match = iso.match(/(\d{4})-(\d{2})-(\d{2})/);
        // TODO: Check invalid date
        if (!match) {
            throw NesoiError.Data.InvalidISOString({ value: iso });
        }
        return new NesoiDate(parseInt(match[3]),parseInt(match[2]),parseInt(match[1]));
    }

    static now() {
        const iso = new Date().toISOString().split('T')[0];
        return NesoiDate.fromISO(iso);
    }

    static isoNow() {
        const iso = new Date().toISOString().split('T')[0];
        return iso;
    }

    toISO() {
        return `${('0000'+this.year).slice(-4)}-${('00'+this.month).slice(-2)}-${('00'+this.day).slice(-2)}`
    }
    toString() {
        return this.toISO();
    }

    toISODatetime(at: 'start' | 'end', tz: keyof typeof NesoiDatetime.tz = 'Z') {
        return `${('0000'+this.year).slice(-4)}-${('00'+this.month).slice(-2)}-${('00'+this.day).slice(-2)}`
            + (at === 'start'
                ? 'T00:00:00.000'
                : 'T23:59:59.999')
            + tz;
    }

    // Shift
    
    plus(period: DateDuration | NesoiDuration) {
        return this.shift(true, period);
    }
    
    minus(period: DateDuration | NesoiDuration) {
        return this.shift(false, period);
    }
        
    private shift(plus: boolean, period: DateDuration | NesoiDuration) {

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

        if (!['days', 'weeks', 'months', 'years'].includes(duration.unit)) {
            throw new Error(`Attempt to shift NesoiDate failed due to invalid duration unit '${duration.unit}'`);
        }

        const mult = plus ? 1 : -1;
        
        const d = new Date(this.year, this.month-1, this.day);

        switch (duration.unit) {
        case 'days':
            d.setDate(d.getDate() + mult * duration.value);
            break;
        case 'weeks':
            d.setDate(d.getDate() + mult * duration.value*7);
            break;
        case 'months':
            d.setMonth(d.getMonth() + mult * duration.value);
            break;
        case 'years':
            d.setFullYear(d.getFullYear() + mult * duration.value);
            break;
        }

        return new NesoiDate(d.getDate(), d.getMonth()+1, d.getFullYear());
    }

    // Start Of

    /**
     * Returns a new `NesoiDate` which refers to the
     * start of a given period.
     * @param period 
     * @returns 
     */
    startOf(period: 'week'|'month'|'year') {
        switch(period) {
        case 'week':
        {
            const d = new Date(this.year, this.month-1, this.day);
            d.setDate(d.getDate()-d.getDay());
            return new NesoiDate(d.getDate(), d.getMonth()+1, d.getFullYear());
        }
        case 'month':
            return new NesoiDate(1, this.month, this.year);
        case 'year':
            return new NesoiDate(1, 1, this.year);
        }
    }
    
    // End Of

    /**
     * Returns a new `NesoiDatetime` which refers to the
     * end of a given period.
     * @param period 
     * @returns 
     */
    endOf(period: 'week'|'month'|'year') {
        switch(period) {
        case 'week':
        {
            const d = new Date(this.year, this.month-1, this.day);
            d.setDate(d.getDate()+6-d.getDay());
            return new NesoiDate(d.getDate(), d.getMonth()+1, d.getFullYear());
        }
        case 'month':
            return new NesoiDate(
                new Date(this.year, this.month, 0).getDate(),
                this.month,
                this.year
            );
        case 'year':
            return new NesoiDate(
                new Date(this.year, 12, 0).getDate(),
                12,
                this.year
            );
        }
    }

    // Comparisons

    /**
     * Returns a float with the distance in days between the dates.
     * - `> 0`: left is greater
     * - `== 0`: dates match
     * - `< 0`: right is greater
     */
    compare(other: NesoiDate) {
        return (this.year - other.year)*365.25
            +(this.month - other.month)*12
            +(this.day - other.day);
    }

    eq(other: NesoiDate) {
        return this.compare(other) === 0;
    }

    gt(other: NesoiDate) {
        return this.compare(other) > 0;
    }

    gteq(other: NesoiDate) {
        return this.compare(other) >= 0;
    }

    lt(other: NesoiDate) {
        return this.compare(other) < 0;
    }

    lteq(other: NesoiDate) {
        return this.compare(other) <= 0;
    }

    // to NesoiDateTime
    toDatetime(at: 'start'|'end', tz: keyof typeof NesoiDatetime.tz = 'Z') {
        if (at === 'start') return NesoiDatetime.fromValues({
            ...this,
            hour: 0,
            minute: 0,
            second: 0,
            ms: 0,
            tz
        })
        else return NesoiDatetime.fromValues({
            ...this,
            hour: 23,
            minute: 59,
            second: 59,
            ms: 999,
            tz
        })
    }


}