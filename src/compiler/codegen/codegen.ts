import type { BucketModel } from '~/elements/entities/bucket/model/bucket_model';
import { NesoiDate } from '~/engine/data/date';
import { NesoiDatetime } from '~/engine/data/datetime';
import { NesoiDecimal } from '~/engine/data/decimal';
import { NesoiDuration } from '~/engine/data/duration';
import { NesoiError } from '~/engine/data/error';

export const CodegenInject = {
    NesoiDate: NesoiDate,
    NesoiDatetime: NesoiDatetime,
    NesoiDuration: NesoiDuration,
    NesoiDecimal: NesoiDecimal
};


export const CodegenErrorHandler = {
    bucket_model: {
        required (this: BucketModel<any, any>, modelpath: string, id: number|string) {
            return NesoiError.Bucket.Model.CorruptedData({
                module: this.bucket.module,
                bucket: this.bucket.alias,
                id: id!,
                message: `Value at '${modelpath}' is required`
            });
        },
        type (this: BucketModel<any, any>, value: any, modelpath: string, exp: string, id: number|string) {
            return NesoiError.Bucket.Model.CorruptedData({
                module: this.bucket.module,
                bucket: this.bucket.alias,
                id: id!,
                message: `Value '${value}' at '${modelpath}' should be a ${exp}`
            });
        },
        data (this: BucketModel<any, any>, value: any, modelpath: string, msg: string, id: number|string) {
            return NesoiError.Bucket.Model.CorruptedData({
                module: this.bucket.module,
                bucket: this.bucket.alias,
                id: id!,
                message: `Value '${value}' at '${modelpath}' ${msg}`
            });
        },
        union (this: BucketModel<any, any>, value: any, modelpath: string, children: NesoiError.BaseError[], id: number|string) {
            return NesoiError.Bucket.Model.CorruptedData({
                module: this.bucket.module,
                bucket: this.bucket.alias,
                id: id!,
                message: `Value '${value}' at '${modelpath}' doesn't match any of the union options`,
                children
            });
        }
    }
}