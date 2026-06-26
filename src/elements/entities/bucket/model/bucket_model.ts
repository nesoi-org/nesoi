import type { BucketAdapterConfig } from '../adapters/bucket_adapter';

import { CodegenErrorHandler } from '~/compiler/codegen/codegen';
import { makeCastFn, makeCastRootsFn, makeCloneFn, makeCloneRootsFn, makeGetFn } from '~/compiler/codegen/bucket_model.codegen';
import { makeFreezeFn } from '~/compiler/codegen/bucket_freeze.codegen';

/**
 * @category Elements
 * @subcategory Entity
 * */
export class BucketModel<M extends $Module, $ extends $Bucket> {

    private alias: string
    private schema: $BucketModel

    public cast: (obj: Record<string, any>, to?: 1|2) => Record<string, any>
    public cast_roots: (obj: Record<string, any>, roots: string[], to?: 1|2) => Record<string, any>
    public clone: (obj: Record<string, any>) => Record<string, any>
    public clone_roots: (obj: Record<string, any>, roots: string[]) => Record<string, any>
    public freeze: (obj: Record<string, any>) => void
    public get: (obj: Record<string, any>, path: string[]) => {
        index: (number|string)[],
        value: any
    }[]

    constructor(
        public bucket: $Bucket,
        private config?: BucketAdapterConfig
    ) {
        this.alias = bucket.alias;
        this.schema = bucket.model;

        this.cast = makeCastFn(this.bucket.model);
        this.cast_roots = makeCastRootsFn(this.bucket.model);
        this.clone = makeCloneFn(this.bucket.model);
        this.clone_roots = makeCloneRootsFn(this.bucket.model);
        this.freeze = makeFreezeFn(this.bucket.model);
        this.get = makeGetFn(this.bucket.model);
    }

    private _e = {
        data: CodegenErrorHandler.bucket_model.data.bind(this),
        required: CodegenErrorHandler.bucket_model.required.bind(this),
        type: CodegenErrorHandler.bucket_model.type.bind(this),
        union: CodegenErrorHandler.bucket_model.union.bind(this),
    };
    
    // public static serializeAny(value: any) {

    //     const target: Record<string, any> = {};
    //     const queue: {
    //         target: Record<string, any>,
    //         key: string | number,
    //         val: any
    //     }[] = [{
    //         target,
    //         key: '#',
    //         val: value
    //     }];

    //     while (queue.length) {
    //         const node = queue.shift()!;

    //         if (Array.isArray(node.val)) {
    //             node.target[node.key] = [];
    //             queue.push(...node.val.map((val, i) => ({
    //                 target: node.target[node.key],
    //                 key: i,
    //                 val
    //             })))
    //         }
    //         else if (typeof node.val === 'object') {
    //             if (node.val instanceof NesoiDatetime) {
    //                 node.target[node.key] = node.val.iso;
    //                 continue;
    //             }
    //             if (node.val instanceof NesoiDate) {
    //                 node.target[node.key] = node.val.iso;
    //                 continue;
    //             }
    //             if (node.val instanceof NesoiDuration) {
    //                 node.target[node.key] = node.val.toString();
    //                 continue;
    //             }
    //             if (node.val instanceof NesoiDecimal) {
    //                 node.target[node.key] = node.val.toString();
    //                 continue;
    //             }
    //             node.target[node.key] = {};
    //             queue.push(...Object.entries(node.val).map(([key, val]) => ({
    //                 target: node.target[node.key],
    //                 key,
    //                 val
    //             })))
    //         }
    //         else {
    //             node.target[node.key] = node.val;
    //         }
    //     }

    //     return target['#'];
    // }
}
