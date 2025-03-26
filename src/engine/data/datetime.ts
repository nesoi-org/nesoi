import { NesoiError } from './error';

export class NesoiDatetime {

    /**
     * Time in milliseconds since 1970-01-01
     */
    public epoch: number;
    
    constructor(
        jsDate?: Date
    ) {
        this.epoch = (jsDate || new Date()).getTime();
    }

    static fromISO(iso: string) {
        // TODO: Check invalid ISO
        const match = iso.match(/(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/);
        if (!match) {
            throw NesoiError.Data.InvalidISOString({ value: iso });
        }
        const jsDate = new Date(iso);
        return new NesoiDatetime(jsDate);
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