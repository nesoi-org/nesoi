import { NesoiError } from './error'

export type TimeDuration = 
    `${number} ${keyof typeof NesoiDuration.TIME_UNITS}`
    | { miliseconds: number }
    | { seconds: number }
    | { minutes: number }
    | { hours: number }

export type DateDuration = 
    `${number} ${keyof typeof NesoiDuration.DATE_UNITS}`
    | { days: number }
    | { weeks: number }
    | { months: number }
    | { years: number }
    
/**
 * @category Engine
 * @subcategory Data
 */
export class NesoiDuration {
    
    public static TIME_UNITS = {
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
        hours: 'hours' as const
    }

    public static DATE_UNITS = {
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

    public static UNITS = {
        ...this.TIME_UNITS,
        ...this.DATE_UNITS
    }

    public value: number
    public unit: typeof NesoiDuration.UNITS[keyof typeof NesoiDuration.UNITS]

    constructor(
        value: { [K in keyof typeof NesoiDuration.UNITS]: {[J in K]: number} }[keyof typeof NesoiDuration.UNITS]
    ) {
        const unit = Object.keys(value)[0] as keyof typeof NesoiDuration.UNITS;
        this.unit = NesoiDuration.UNITS[unit];
        const val = (value as any)[unit];
        if (typeof val === 'number')
            this.value = val;
        else if (typeof val === 'string')
            this.value = parseInt(val);
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

        return new NesoiDuration({
            [unit]: number
        } as any);
    }

    public toString() {
        return `${this.value} ${this.unit}`;
    }

}