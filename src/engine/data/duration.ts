import { NesoiError } from './error'

/**
 * @category Engine
 * @subcategory Data
 */
export class NesoiDuration {
    
    public static UNITS = {
        ms: 'miliseconds' as const,
        milisecond: 'miliseconds' as const,
        miliseconds: 'miliseconds' as const,
        s: 'seconds' as const,
        second: 'seconds' as const,
        seconds: 'seconds' as const,
        min: 'minutes' as const,
        mins: 'minutes' as const,
        minute: 'minutes' as const,
        minutes: 'minutes' as const,
        h: 'hours' as const,
        hour: 'hours' as const,
        hours: 'hours' as const,
        d: 'days' as const,
        day: 'days' as const,
        days: 'days' as const,
        w: 'weeks' as const,
        week: 'weeks' as const,
        weeks: 'weeks' as const,
        month: 'months' as const,
        months: 'months' as const,
        y: 'years' as const,
        year: 'years' as const,
        years: 'years' as const,
    }

    constructor(
        public value: number,
        public unit: typeof NesoiDuration.UNITS[keyof typeof NesoiDuration.UNITS]
    ) {
        Object.freeze(this);
    }

    public static fromObj(
        value: 
        {
            miliseconds: number
        } | {
            seconds: number
        } | {
            minutes: number
        } | {
            hours: number
        } | {
            days: number
        } | {
            weeks: number
        } | {
            months: number
        } | {
            years: number
        }
    ) {
        const unit_name = Object.keys(value)[0] as keyof typeof NesoiDuration.UNITS;
        const unit = NesoiDuration.UNITS[unit_name];
        const val = (value as any)[unit_name];
        if (typeof val === 'number')
            return new NesoiDuration(val, unit);
        else if (typeof val === 'string')
            return new NesoiDuration(parseInt(val), unit);
        else {
            throw new Error(`Invalid duration value: ${val}`);
        }
    }

    public static fromString(value: string) {

        const split = value.split(' ');
        if (split.length !== 2) {
            throw NesoiError.Data.InvalidDuration({ value });
        }

        const number = parseInt(split[0]);
        if (isNaN(number)) {
            throw NesoiError.Data.InvalidDuration({ value });
        }

        const unit_str = split[1] as keyof typeof NesoiDuration.UNITS;

        const unit = NesoiDuration.UNITS[unit_str];
        if (!unit) {
            throw NesoiError.Data.InvalidDurationUnit({ value, unit: unit_str });
        }

        return NesoiDuration.fromObj({
            [unit]: number
        } as any);
    }

    public toString() {
        return `${this.value} ${this.unit}`;
    }

    public copy() {
        return new NesoiDuration(this.value, this.unit);
    }

    public toJSON() {
        return '10 minutes';
    }

}