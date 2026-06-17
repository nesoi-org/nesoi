import { NesoiError } from './error';

/**
 * @category Engine
 * @subcategory Data
 */
export class NesoiDate {
    
    public readonly iso: string

    constructor(
        public readonly day: number,
        public readonly month: number,
        public readonly year: number,
        _iso?: string
    ) {
        this.iso = _iso ? _iso : this.toISO();
        Object.freeze(this);
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

    public toJSON() {
        return this.iso;
    }

    private toISO() {
        // Ugly, but stupid fast (~8.7 / 10).
        if (this.year < 10) {
            if (this.month < 10) {
                if (this.day < 10) return `000${this.year}-0${this.month}-0${this.day}`;
                else return `000${this.year}-0${this.month}-${this.day}`;
            }
            else {
                if (this.day < 10) return `000${this.year}-${this.month}-0${this.day}`;
                else return `000${this.year}-${this.month}-${this.day}`;
            }
        }
        else if (this.year < 100) {
            if (this.month < 10) {
                if (this.day < 10) return `00${this.year}-0${this.month}-0${this.day}`;
                else return `00${this.year}-0${this.month}-${this.day}`;
            }
            else {
                if (this.day < 10) return `00${this.year}-${this.month}-0${this.day}`;
                else return `00${this.year}-${this.month}-${this.day}`;
            }
        }
        else if (this.year < 1000) {
            if (this.month < 10) {
                if (this.day < 10) return `0${this.year}-0${this.month}-0${this.day}`;
                else return `0${this.year}-0${this.month}-${this.day}`;
            }
            else {
                if (this.day < 10) return `0${this.year}-${this.month}-0${this.day}`;
                else return `0${this.year}-${this.month}-${this.day}`;
            }
        }
        else {
            if (this.month < 10) {
                if (this.day < 10) return `${this.year}-0${this.month}-0${this.day}`;
                else return `${this.year}-0${this.month}-${this.day}`;
            }
            else {
                if (this.day < 10) return `${this.year}-${this.month}-0${this.day}`;
                else return `${this.year}-${this.month}-${this.day}`;
            }
        }
    }
    
    // 8.5 / 10
    // return (this.year < 10 ? ('000' + this.year)
    //     : this.year < 100 ? ('00' + this.year)
    //         : this.year < 1000 ? ('0' + this.year)
    //             : this.year)
    // + '-'
    // + (this.month < 10 ? ('0' + this.month)
    //     : this.month)
    // + '-'
    // + (this.day < 10 ? ('0' + this.day)
    //     : this.day);
    
    // 7 / 10
    // let str = '';
    // if (this.year < 10) str += '000';
    // else if (this.year < 100) str += '00';
    // else if (this.year < 1000) str += '0';
    // str += this.year.toString();
    // str += '-';
    // if (this.month < 10) str += '0';
    // str += this.month.toString();
    // str += '-';
    // if (this.day < 10) str += '0';
    // str += this.day.toString();
    // return str;
    
    // 5 / 10
    // return this.year.toString().padStart(4,'0') + '-'
    //     + this.month.toString().padStart(2,'0') +'-'
    //     + this.day.toString().padStart(2,'0')
    
    // 4 / 10
    // return `${('0000'+this.year).slice(-4)}-${('00'+this.month).slice(-2)}-${('00'+this.day).slice(-2)}`

    public copy() {
        return new NesoiDate(this.day, this.month, this.year);
    }

}