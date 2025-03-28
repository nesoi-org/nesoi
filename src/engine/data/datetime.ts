import { NesoiError } from './error';

export class NesoiDatetime {

    /**
     * Time in milliseconds since 1970-01-01
     */
    public epoch: number;

    /**
     * Timezone represented as string (-03, +02, UTC, etc)
     */
    public tz?: string;
    
    constructor(
        jsDate?: Date,
        tz?: string
    ) {
        this.epoch = (jsDate || new Date()).getTime();
        this.tz = tz;
    }

    static fromISO(iso: string) {
        const match = iso.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(.\d+)?([-+]\d{2}Z)?/);
        // TODO: Check invalid datetimes
        if (!match) {
            throw NesoiError.Data.InvalidISOString({ value: iso });
        }
        const [_, year, month, day, hour, min, sec, ms, tz] = match;

        const jsDate = new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}${ms}`);
        return new NesoiDatetime(jsDate, tz?.replace('Z',''));
    }

    static now() {
        return new NesoiDatetime();
    }

    static isoNow() {
        return new Date().toISOString();
    }

    static shortNow() {
        return new Date().toISOString().slice(5,19);
    }

    toISO() {
        return new Date(this.epoch).toISOString();
    }

}