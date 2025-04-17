import { NesoiError } from '~/engine/data/error'
import { Log } from '~/engine/util/log'
import { NesoiDecimal } from '~/engine/data/decimal';

Log.level = 'off';

function expectPrecisionError($: { left: number, right: number}) {
    expect(() => new NesoiDecimal('', $.left, $.right)).toThrow(
        NesoiError.Data.UnsupportedDecimalPrecision($)
    )
}

function expectLeftTooBigError($: { value: string, prec: number}) {
    expect(() => new NesoiDecimal($.value, $.prec, 12)).toThrow(
        NesoiError.Data.DecimalLeftTooBig($)
    )
}

function expectRightTooBigError($: { value: string, prec: number}) {
    expect(() => new NesoiDecimal($.value, 12, $.prec)).toThrow(
        NesoiError.Data.DecimalRightTooBig($)
    )
}

function expectInvalidError($: { value: string }) {
    expect(() => new NesoiDecimal($.value)).toThrow(
        NesoiError.Data.InvalidDecimalValue($)
    )
}

describe('Decimal', () => {

    it('should fail to set invalid precisions', async() => {
        expectPrecisionError({ left: -1, right: 12 })
        expectPrecisionError({ left: 0, right: 12 })
        expectPrecisionError({ left: 13, right: 12 })
        expectPrecisionError({ left: 999, right: 12 })
        expectPrecisionError({ left: NaN, right: 12 })
        expectPrecisionError({ left: Infinity, right: 12 })
        expectPrecisionError({ left: 'abc' as any, right: 12 })
        expectPrecisionError({ left: true as any, right: 12 })
        expectPrecisionError({ left: [1,2,3] as any, right: 12 })
        expectPrecisionError({ left: {a: 1, b: 'c'} as any, right: 12 })

        expectPrecisionError({ left: 12, right: -1 })
        expectPrecisionError({ left: 12, right: 0 })
        expectPrecisionError({ left: 12, right: 13 })
        expectPrecisionError({ left: 12, right: 999 })
        expectPrecisionError({ left: 12, right: NaN })
        expectPrecisionError({ left: 12, right: Infinity })
        expectPrecisionError({ left: 12, right: 'abc' as any })
        expectPrecisionError({ left: 12, right: true as any })
        expectPrecisionError({ left: 12, right: [1,2,3] as any })
        expectPrecisionError({ left: 12, right: {a: 1, b: 'c'} as any })
    })

    it('should fail to parse values greater than precision', async() => {
        expectLeftTooBigError({ value: '10.0', prec: 1 })
        expectLeftTooBigError({ value: '100.0', prec: 1 })
        expectLeftTooBigError({ value: '100.0', prec: 2 })
        expectLeftTooBigError({ value: '1000.0', prec: 2 })
        expectLeftTooBigError({ value: '1000.0', prec: 3 })
        expectLeftTooBigError({ value: '10000.0', prec: 3 })
        expectLeftTooBigError({ value: '10000.0', prec: 4 })
        expectLeftTooBigError({ value: '100000.0', prec: 4 })
        expectLeftTooBigError({ value: '100000.0', prec: 5 })
        expectLeftTooBigError({ value: '1000000.0', prec: 5 })
        expectLeftTooBigError({ value: '1000000.0', prec: 6 })
        expectLeftTooBigError({ value: '10000000.0', prec: 6 })
        expectLeftTooBigError({ value: '10000000.0', prec: 7 })
        expectLeftTooBigError({ value: '100000000.0', prec: 7 })
        expectLeftTooBigError({ value: '100000000.0', prec: 8 })
        expectLeftTooBigError({ value: '1000000000.0', prec: 8 })
        expectLeftTooBigError({ value: '1000000000.0', prec: 9 })
        expectLeftTooBigError({ value: '10000000000.0', prec: 9 })
        expectLeftTooBigError({ value: '10000000000.0', prec: 10 })
        expectLeftTooBigError({ value: '100000000000.0', prec: 10 })
        expectLeftTooBigError({ value: '100000000000.0', prec: 11 })
        expectLeftTooBigError({ value: '1000000000000.0', prec: 11 })
        expectLeftTooBigError({ value: '1000000000000.0', prec: 12 })
        
        expectRightTooBigError({ value: '0.01', prec: 1 })
        expectRightTooBigError({ value: '0.001', prec: 1 })
        expectRightTooBigError({ value: '0.001', prec: 2 })
        expectRightTooBigError({ value: '0.0001', prec: 2 })
        expectRightTooBigError({ value: '0.0001', prec: 3 })
        expectRightTooBigError({ value: '0.00001', prec: 3 })
        expectRightTooBigError({ value: '0.00001', prec: 4 })
        expectRightTooBigError({ value: '0.000001', prec: 4 })
        expectRightTooBigError({ value: '0.000001', prec: 5 })
        expectRightTooBigError({ value: '0.0000001', prec: 5 })
        expectRightTooBigError({ value: '0.0000001', prec: 6 })
        expectRightTooBigError({ value: '0.00000001', prec: 6 })
        expectRightTooBigError({ value: '0.00000001', prec: 7 })
        expectRightTooBigError({ value: '0.000000001', prec: 7 })
        expectRightTooBigError({ value: '0.000000001', prec: 8 })
        expectRightTooBigError({ value: '0.0000000001', prec: 8 })
        expectRightTooBigError({ value: '0.0000000001', prec: 9 })
        expectRightTooBigError({ value: '0.00000000001', prec: 9 })
        expectRightTooBigError({ value: '0.00000000001', prec: 10 })
        expectRightTooBigError({ value: '0.000000000001', prec: 10 })
        expectRightTooBigError({ value: '0.000000000001', prec: 11 })
        expectRightTooBigError({ value: '0.0000000000001', prec: 11 })
        expectRightTooBigError({ value: '0.0000000000001', prec: 12 })
    })

    it('should fail to parse negative values smaller than precision', async() => {
        expectLeftTooBigError({ value: '-10.0', prec: 1 })
        expectLeftTooBigError({ value: '-100.0', prec: 1 })
        expectLeftTooBigError({ value: '-100.0', prec: 2 })
        expectLeftTooBigError({ value: '-1000.0', prec: 2 })
        expectLeftTooBigError({ value: '-1000.0', prec: 3 })
        expectLeftTooBigError({ value: '-10000.0', prec: 3 })
        expectLeftTooBigError({ value: '-10000.0', prec: 4 })
        expectLeftTooBigError({ value: '-100000.0', prec: 4 })
        expectLeftTooBigError({ value: '-100000.0', prec: 5 })
        expectLeftTooBigError({ value: '-1000000.0', prec: 5 })
        expectLeftTooBigError({ value: '-1000000.0', prec: 6 })
        expectLeftTooBigError({ value: '-10000000.0', prec: 6 })
        expectLeftTooBigError({ value: '-10000000.0', prec: 7 })
        expectLeftTooBigError({ value: '-100000000.0', prec: 7 })
        expectLeftTooBigError({ value: '-100000000.0', prec: 8 })
        expectLeftTooBigError({ value: '-1000000000.0', prec: 8 })
        expectLeftTooBigError({ value: '-1000000000.0', prec: 9 })
        expectLeftTooBigError({ value: '-10000000000.0', prec: 9 })
        expectLeftTooBigError({ value: '-10000000000.0', prec: 10 })
        expectLeftTooBigError({ value: '-100000000000.0', prec: 10 })
        expectLeftTooBigError({ value: '-100000000000.0', prec: 11 })
        expectLeftTooBigError({ value: '-1000000000000.0', prec: 11 })
        expectLeftTooBigError({ value: '-1000000000000.0', prec: 12 })
        
        expectRightTooBigError({ value: '-0.01', prec: 1 })
        expectRightTooBigError({ value: '-0.001', prec: 1 })
        expectRightTooBigError({ value: '-0.001', prec: 2 })
        expectRightTooBigError({ value: '-0.0001', prec: 2 })
        expectRightTooBigError({ value: '-0.0001', prec: 3 })
        expectRightTooBigError({ value: '-0.00001', prec: 3 })
        expectRightTooBigError({ value: '-0.00001', prec: 4 })
        expectRightTooBigError({ value: '-0.000001', prec: 4 })
        expectRightTooBigError({ value: '-0.000001', prec: 5 })
        expectRightTooBigError({ value: '-0.0000001', prec: 5 })
        expectRightTooBigError({ value: '-0.0000001', prec: 6 })
        expectRightTooBigError({ value: '-0.00000001', prec: 6 })
        expectRightTooBigError({ value: '-0.00000001', prec: 7 })
        expectRightTooBigError({ value: '-0.000000001', prec: 7 })
        expectRightTooBigError({ value: '-0.000000001', prec: 8 })
        expectRightTooBigError({ value: '-0.0000000001', prec: 8 })
        expectRightTooBigError({ value: '-0.0000000001', prec: 9 })
        expectRightTooBigError({ value: '-0.00000000001', prec: 9 })
        expectRightTooBigError({ value: '-0.00000000001', prec: 10 })
        expectRightTooBigError({ value: '-0.000000000001', prec: 10 })
        expectRightTooBigError({ value: '-0.000000000001', prec: 11 })
        expectRightTooBigError({ value: '-0.0000000000001', prec: 11 })
        expectRightTooBigError({ value: '-0.0000000000001', prec: 12 })
    })

    it('should fail to parse invalid values', async() => {
        expectInvalidError({ value: 'a.0' })
        expectInvalidError({ value: '0.a' })
        expectInvalidError({ value: '0 1.0' })
        expectInvalidError({ value: '0_1.0' })
        expectInvalidError({ value: '0.0 1' })
        expectInvalidError({ value: '0.0_1' })
        expectInvalidError({ value: '0.1.0' })
        expectInvalidError({ value: '-a.0' })
        expectInvalidError({ value: '-0.a' })
        expectInvalidError({ value: '-0 1.0' })
        expectInvalidError({ value: '-0_1.0' })
        expectInvalidError({ value: '-0.0 1' })
        expectInvalidError({ value: '-0.0_1' })
        expectInvalidError({ value: '-0.1.0' })
    })

    it('should parse partial values', async() => {
        {
            const dec = new NesoiDecimal('1.');
            expect(dec.toString()).toEqual('1.000000000000')
            expect(dec.toFloat()).toEqual(1)
        }
        {
            const dec = new NesoiDecimal('.4');
            expect(dec.toString()).toEqual('0.400000000000')
            expect(dec.toFloat()).toEqual(0.4)
        }
        {
            const dec = new NesoiDecimal('-1.');
            expect(dec.toString()).toEqual('-1.000000000000')
            expect(dec.toFloat()).toEqual(-1)
        }
        {
            const dec = new NesoiDecimal('-.4');
            expect(dec.toString()).toEqual('-0.400000000000')
            expect(dec.toFloat()).toEqual(-0.4)
        }
    })

    it('should parse values inside precision with leading/trailing zeros', async() => {
        {
            const dec = new NesoiDecimal('0000000000000.0000000000000');
            expect(dec.toString()).toEqual('0.000000000000')
            expect(dec.toFloat()).toEqual(0)
        }
        {
            const dec = new NesoiDecimal('0000000000001.0000000000000');
            expect(dec.toString()).toEqual('1.000000000000')
            expect(dec.toFloat()).toEqual(1)
        }
        {
            const dec = new NesoiDecimal('0000000000000.1000000000000');
            expect(dec.toString()).toEqual('0.100000000000')
            expect(dec.toFloat()).toEqual(0.1)
        }
        {
            const dec = new NesoiDecimal('-0000000000001.0000000000000');
            expect(dec.toString()).toEqual('-1.000000000000')
            expect(dec.toFloat()).toEqual(-1)
        }
        {
            const dec = new NesoiDecimal('-0000000000000.1000000000000');
            expect(dec.toString()).toEqual('-0.100000000000')
            expect(dec.toFloat()).toEqual(-0.1)
        }
    })
    
    it('should parse integer values up to precision (default = 12,12)', async() => {
        {
            const dec = new NesoiDecimal('0');
            expect(dec.toString()).toEqual('0.000000000000')
            expect(dec.toFloat()).toEqual(0)
        }
        {
            const dec = new NesoiDecimal('1');
            expect(dec.toString()).toEqual('1.000000000000')
            expect(dec.toFloat()).toEqual(1)
        }
        {
            const dec = new NesoiDecimal('123');
            expect(dec.toString()).toEqual('123.000000000000')
            expect(dec.toFloat()).toEqual(123)
        }
        {
            const dec = new NesoiDecimal('123456789012');
            expect(dec.toString()).toEqual('123456789012.000000000000')
            expect(dec.toFloat()).toEqual(123456789012)
        }
        {
            const dec = new NesoiDecimal('-1');
            expect(dec.toString()).toEqual('-1.000000000000')
            expect(dec.toFloat()).toEqual(-1)
        }
        {
            const dec = new NesoiDecimal('-123');
            expect(dec.toString()).toEqual('-123.000000000000')
            expect(dec.toFloat()).toEqual(-123)
        }
        {
            const dec = new NesoiDecimal('-123456789012');
            expect(dec.toString()).toEqual('-123456789012.000000000000')
            expect(dec.toFloat()).toEqual(-123456789012)
        }
    })

    it('should parse integer values up to precision (6,12)', async() => {
        {
            const dec = new NesoiDecimal('0', 6, 12);
            expect(dec.toString()).toEqual('0.000000000000')
            expect(dec.toFloat()).toEqual(0)
        }
        {
            const dec = new NesoiDecimal('1', 6, 12);
            expect(dec.toString()).toEqual('1.000000000000')
            expect(dec.toFloat()).toEqual(1)
        }
        {
            const dec = new NesoiDecimal('123', 6, 12);
            expect(dec.toString()).toEqual('123.000000000000')
            expect(dec.toFloat()).toEqual(123)
        }
        {
            const dec = new NesoiDecimal('123456', 6, 12);
            expect(dec.toString()).toEqual('123456.000000000000')
            expect(dec.toFloat()).toEqual(123456)
        }
        {
            const dec = new NesoiDecimal('-1', 6, 12);
            expect(dec.toString()).toEqual('-1.000000000000')
            expect(dec.toFloat()).toEqual(-1)
        }
        {
            const dec = new NesoiDecimal('-123', 6, 12);
            expect(dec.toString()).toEqual('-123.000000000000')
            expect(dec.toFloat()).toEqual(-123)
        }
        {
            const dec = new NesoiDecimal('-123456', 6, 12);
            expect(dec.toString()).toEqual('-123456.000000000000')
            expect(dec.toFloat()).toEqual(-123456)
        }
    })

    it('should parse integer values up to precision (6,6)', async() => {
        {
            const dec = new NesoiDecimal('0', 6, 6);
            expect(dec.toString()).toEqual('0.000000')
            expect(dec.toFloat()).toEqual(0)
        }
        {
            const dec = new NesoiDecimal('1', 6, 6);
            expect(dec.toString()).toEqual('1.000000')
            expect(dec.toFloat()).toEqual(1)
        }
        {
            const dec = new NesoiDecimal('123', 6, 6);
            expect(dec.toString()).toEqual('123.000000')
            expect(dec.toFloat()).toEqual(123)
        }
        {
            const dec = new NesoiDecimal('123456', 6, 6);
            expect(dec.toString()).toEqual('123456.000000')
            expect(dec.toFloat()).toEqual(123456)
        }
        {
            const dec = new NesoiDecimal('-1', 6, 6);
            expect(dec.toString()).toEqual('-1.000000')
            expect(dec.toFloat()).toEqual(-1)
        }
        {
            const dec = new NesoiDecimal('-123', 6, 6);
            expect(dec.toString()).toEqual('-123.000000')
            expect(dec.toFloat()).toEqual(-123)
        }
        {
            const dec = new NesoiDecimal('-123456', 6, 6);
            expect(dec.toString()).toEqual('-123456.000000')
            expect(dec.toFloat()).toEqual(-123456)
        }
    })

    it('should parse real values up to precision (default = 12,12)', async() => {
        {
            const dec = new NesoiDecimal('0.1');
            expect(dec.toString()).toEqual('0.100000000000')
            expect(dec.toFloat()).toEqual(0.1)
        }
        {
            const dec = new NesoiDecimal('0.000001');
            expect(dec.toString()).toEqual('0.000001000000')
            expect(dec.toFloat()).toEqual(0.000001)
        }
        {
            const dec = new NesoiDecimal('0.000000000001');
            expect(dec.toString()).toEqual('0.000000000001')
            expect(dec.toFloat()).toEqual(0.000000000001)
        }
        {
            const dec = new NesoiDecimal('123456.789012');
            expect(dec.toString()).toEqual('123456.789012000000')
            expect(dec.toFloat()).toEqual(123456.789012)
        }
        {
            const dec = new NesoiDecimal('123456789012.123456789012');
            expect(dec.toString()).toEqual('123456789012.123456789012')
            expect(dec.toFloat()).toEqual(123456789012.123456789012)
        }
        {
            const dec = new NesoiDecimal('999999999999.999999999999');
            expect(dec.toString()).toEqual('999999999999.999999999999')
            expect(dec.toFloat()).toEqual(999999999999.999999999999)
        }
        {
            const dec = new NesoiDecimal('-0.1');
            expect(dec.toString()).toEqual('-0.100000000000')
            expect(dec.toFloat()).toEqual(-0.1)
        }
        {
            const dec = new NesoiDecimal('-0.000001');
            expect(dec.toString()).toEqual('-0.000001000000')
            expect(dec.toFloat()).toEqual(-0.000001)
        }
        {
            const dec = new NesoiDecimal('-0.000000000001');
            expect(dec.toString()).toEqual('-0.000000000001')
            expect(dec.toFloat()).toEqual(-0.000000000001)
        }
        {
            const dec = new NesoiDecimal('-123456.789012');
            expect(dec.toString()).toEqual('-123456.789012000000')
            expect(dec.toFloat()).toEqual(-123456.789012)
        }
        {
            const dec = new NesoiDecimal('-123456789012.123456789012');
            expect(dec.toString()).toEqual('-123456789012.123456789012')
            expect(dec.toFloat()).toEqual(-123456789012.123456789012)
        }
        {
            const dec = new NesoiDecimal('-999999999999.999999999999');
            expect(dec.toString()).toEqual('-999999999999.999999999999')
            expect(dec.toFloat()).toEqual(-999999999999.999999999999)
        }
    })

    it('should parse real values up to precision (12,6)', async() => {
        {
            const dec = new NesoiDecimal('0.1', 12, 6);
            expect(dec.toString()).toEqual('0.100000')
            expect(dec.toFloat()).toEqual(0.1)
        }
        {
            const dec = new NesoiDecimal('0.001', 12, 6);
            expect(dec.toString()).toEqual('0.001000')
            expect(dec.toFloat()).toEqual(0.001)
        }
        {
            const dec = new NesoiDecimal('0.000001', 12, 6);
            expect(dec.toString()).toEqual('0.000001')
            expect(dec.toFloat()).toEqual(0.000001)
        }
        {
            const dec = new NesoiDecimal('123456.789012', 12, 6);
            expect(dec.toString()).toEqual('123456.789012')
            expect(dec.toFloat()).toEqual(123456.789012)
        }
        {
            const dec = new NesoiDecimal('123456789012.789012', 12, 6);
            expect(dec.toString()).toEqual('123456789012.789012')
            expect(dec.toFloat()).toEqual(123456789012.789012)
        }
        {
            const dec = new NesoiDecimal('999999999999.999999', 12, 6);
            expect(dec.toString()).toEqual('999999999999.999999')
            expect(dec.toFloat()).toEqual(999999999999.999999)
        }
        {
            const dec = new NesoiDecimal('-0.1', 12, 6);
            expect(dec.toString()).toEqual('-0.100000')
            expect(dec.toFloat()).toEqual(-0.1)
        }
        {
            const dec = new NesoiDecimal('-0.001', 12, 6);
            expect(dec.toString()).toEqual('-0.001000')
            expect(dec.toFloat()).toEqual(-0.001)
        }
        {
            const dec = new NesoiDecimal('-0.000001', 12, 6);
            expect(dec.toString()).toEqual('-0.000001')
            expect(dec.toFloat()).toEqual(-0.000001)
        }
        {
            const dec = new NesoiDecimal('-123456.789012', 12, 6);
            expect(dec.toString()).toEqual('-123456.789012')
            expect(dec.toFloat()).toEqual(-123456.789012)
        }
        {
            const dec = new NesoiDecimal('-123456789012.789012', 12, 6);
            expect(dec.toString()).toEqual('-123456789012.789012')
            expect(dec.toFloat()).toEqual(-123456789012.789012)
        }
        {
            const dec = new NesoiDecimal('-999999999999.999999', 12, 6);
            expect(dec.toString()).toEqual('-999999999999.999999')
            expect(dec.toFloat()).toEqual(-999999999999.999999)
        }
    })

    it('should parse real values up to precision (6,6)', async() => {
        {
            const dec = new NesoiDecimal('0.1', 6, 6);
            expect(dec.toString()).toEqual('0.100000')
            expect(dec.toFloat()).toEqual(0.1)
        }
        {
            const dec = new NesoiDecimal('0.001', 6, 6);
            expect(dec.toString()).toEqual('0.001000')
            expect(dec.toFloat()).toEqual(0.001)
        }
        {
            const dec = new NesoiDecimal('0.000001', 6, 6);
            expect(dec.toString()).toEqual('0.000001')
            expect(dec.toFloat()).toEqual(0.000001)
        }
        {
            const dec = new NesoiDecimal('123456.789012', 6, 6);
            expect(dec.toString()).toEqual('123456.789012')
            expect(dec.toFloat()).toEqual(123456.789012)
        }
        {
            const dec = new NesoiDecimal('999999.999999', 6, 6);
            expect(dec.toString()).toEqual('999999.999999')
            expect(dec.toFloat()).toEqual(999999.999999)
        }
        {
            const dec = new NesoiDecimal('-0.1', 6, 6);
            expect(dec.toString()).toEqual('-0.100000')
            expect(dec.toFloat()).toEqual(-0.1)
        }
        {
            const dec = new NesoiDecimal('-0.001', 6, 6);
            expect(dec.toString()).toEqual('-0.001000')
            expect(dec.toFloat()).toEqual(-0.001)
        }
        {
            const dec = new NesoiDecimal('-0.000001', 6, 6);
            expect(dec.toString()).toEqual('-0.000001')
            expect(dec.toFloat()).toEqual(-0.000001)
        }
        {
            const dec = new NesoiDecimal('-123456.789012', 6, 6);
            expect(dec.toString()).toEqual('-123456.789012')
            expect(dec.toFloat()).toEqual(-123456.789012)
        }
        {
            const dec = new NesoiDecimal('-999999.999999', 6, 6);
            expect(dec.toString()).toEqual('-999999.999999')
            expect(dec.toFloat()).toEqual(-999999.999999)
        }
    })


})
