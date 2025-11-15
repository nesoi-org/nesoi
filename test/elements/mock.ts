/* eslint-disable @typescript-eslint/no-namespace */
import { NesoiDatetime as _Datetime } from '~/engine/data/datetime';
import { NesoiDate as _Date } from '~/engine/data/date';
import { NesoiDecimal as _Decimal } from '~/engine/data/decimal';

export namespace Mock {
    
    export const Int = 123;
    export const Float = 123.456;
    export const DecimalStr = '123.456';
    export const DecimalStr2 = '789.012';
    export const Datetime = _Datetime.now();
    export const Date = _Date.now();
    export const Decimal = new _Decimal(Mock.DecimalStr);
    export const Decimal2 = new _Decimal(Mock.DecimalStr2);
    export const String = 'abcdef';
    export const String2 = '123456';
    export const Bool = true;
    export const List = [Mock.Float, Mock.String, Mock.Bool]
    export const Obj = {
        prop1: Mock.Int,
        prop2: Mock.String,
        prop3: Mock.Bool
    }
    export const Fn = () => {}

    export namespace File {

        export const Raw = {
            size: 1,
            extname: 'raw',
            data: { clientName: 'client' }
        }
        export const RawBig = {
            size: 1000,
            extname: 'raw',
            data: { clientName: 'client' }
        }
        export const Png = {
            size: 10,
            extname: 'png',
            data: { clientName: 'client' }
        }
    }

    export const Garbage = {
        garbage1: Mock.Int,
        garbage2: Mock.Float,
        garbage3: Mock.String,
        garbage4: Mock.Bool,
        garbage5: Mock.List,
        garbage6: Mock.Obj
    }    

}
