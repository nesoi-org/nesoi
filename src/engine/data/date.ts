import { NesoiError } from './error';

export class NesoiDate {
    
    constructor(
        public day: number,
        public month: number,
        public year: number
    ) {}

    static fromISO(iso: string) {
        // TODO: Check invalid ISO
        const match = iso.match(/(\d{4})-([01]\d)-([0-3]\d)/);
        if (!match) {
            throw NesoiError.Data.InvalidISOString({ value: iso });
        }
        const jsDate = new Date(iso);
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

}