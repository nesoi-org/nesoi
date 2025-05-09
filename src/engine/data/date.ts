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

    static fromISO(iso: string) {
        const match = iso.match(/(\d{4})-(\d{2})-(\d{2})/);
        // TODO: Check invalid date
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