import { NesoiError } from './error'

export class NesoiDecimal {

    private neg: boolean = false;
    private left: number
    private right: number

    private prec: {
        left: number,
        right: number
    }
    private r_pad: number // Number of zeros before right value
    private r_exp: number // Number to be multiplied with right value when converting to float

    constructor(
        value: string,
        pLeft: number = 12,
        pRight: number = 12
    ) {
        let payload = value.trim();
        if (value[0] === '-') {
            this.neg = true;
            payload = value.slice(1);
        }

        this.prec = {
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
        
        // Possibly an integer value
        if (!payload.includes('.')) {
            // If it contains non-digits, it's invalid
            if (payload.match(/\D/)) {
                throw NesoiError.Data.InvalidDecimalValue({ value });
            }

            this.left = parseInt(payload);
            this.right = 0;
            this.r_pad = 0;
            this.r_exp = 0;
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
            
            if (lval.length > this.prec.left) {
                throw NesoiError.Data.DecimalLeftTooBig({ value, prec: this.prec.left });
            }
            if (rval.length > this.prec.right) {
                throw NesoiError.Data.DecimalRightTooBig({ value, prec: this.prec.right });
            }

            this.left = parseInt(lval);
            this.right = parseInt(rval);
            this.r_pad = rval.match(/^0+/)?.[0].length || 0;
            this.r_exp = 10**(-rval.length);
        }
        if (isNaN(this.left) || isNaN(this.right)) {
            throw NesoiError.Data.InvalidDecimalValue({ value });
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

}