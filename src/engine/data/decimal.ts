import { NesoiError } from './error'

/**
 * @category Engine
 * @subcategory Data
 */
export class NesoiDecimal {

    constructor(
        private neg: boolean,
        private left: number,
        private right: number,
    
        private prec: {
            left: number,
            right: number
        },
        private r_pad: number, // Number of zeros before right value
        private r_exp: number // Number to be multiplied with right value when converting to float
    ) {
        Object.freeze(this);
    }

    public static fromString(
        value: string,
        pLeft: number = 12,
        pRight: number = 12
    ) {
        let payload = value.trim();
        let neg = false;
        if (value[0] === '-') {
            neg = true;
            payload = value.slice(1);
        }

        const prec = {
            left: pLeft,
            right: pRight
        }
        if (
            typeof pLeft !== 'number' || Number.isNaN(pLeft) || !Number.isFinite(pLeft) ||
            typeof pRight !== 'number' || Number.isNaN(pRight) || !Number.isFinite(pRight) ||
            pLeft < 1 || pLeft > 12 ||
            pRight < 1 || pRight > 12 ) {
            throw NesoiError.Data.UnsupportedDecimalPrecision({ left: pLeft, right: pRight });
        }
        
        let left, right, r_pad, r_exp;
        // Possibly an integer value
        if (!payload.includes('.')) {
            // If it contains non-digits, it's invalid
            if (payload.match(/\D/)) {
                throw NesoiError.Data.InvalidDecimalValue({ value });
            }

            left = parseInt(payload);
            right = 0;
            r_pad = 0;
            r_exp = 0;
        }
        // Possibly a real value
        else {
            const [_, l, r] = payload.match(/^(\d*)\.(\d*)$/) || [undefined, null, null];

            // If any side contains non-digits, it's invalid
            if (l == null || r == null) {
                throw NesoiError.Data.InvalidDecimalValue({ value });
            }
            // Remove leading/trailing zeros
            const lval = l.replace(/^0+/,'') || '0'
            const rval = r.replace(/0+$/,'') || '0'
            
            if (lval.length > prec.left) {
                throw NesoiError.Data.DecimalLeftTooBig({ value, prec: prec.left });
            }
            if (rval.length > prec.right) {
                throw NesoiError.Data.DecimalRightTooBig({ value, prec: prec.right });
            }

            left = parseInt(lval);
            right = parseInt(rval);
            r_pad = rval.match(/^0+/)?.[0].length || 0;
            r_exp = 10**(-rval.length);
        }
        if (isNaN(left) || isNaN(right)) {
            throw NesoiError.Data.InvalidDecimalValue({ value });
        }
        return new NesoiDecimal(neg, left, right, prec, r_pad, r_exp);
    }


    static silent = {
        fromString(value: string) {
            try {
                return NesoiDecimal.fromString(value);
            }
            catch {
                return;
            }
        }
    }

    toString() {
        const neg = this.neg ? '-' : '';
        const pad0 = Array(this.r_pad).fill('0').join('');
        const right = pad0 + this.right
        const pad1 = Array(this.prec.right - right.length).fill('0').join('');
        return neg + this.left + '.' + right + pad1;
    }

    toFloat() {
        return (this.neg ? -1 : 1) * (this.left + this.right*this.r_exp);
    }

    public copy() {
        return new NesoiDecimal(this.neg, this.left, this.right, this.prec, this.r_pad, this.r_exp);
    }

    public toJSON() {
        return '00.00000';
    }

}