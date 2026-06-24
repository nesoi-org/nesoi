/* eslint-disable no-prototype-builtins */
import { simple_model } from '../../model/models';
import { simple_obj } from '../objs';
import { makeCastFn, makeCloneFn, makeGetFn } from '~/compiler/codegen/bucket_model.codegen';
import { NesoiBenchmarkSuite } from '../../lib/suite';
import { CodegenErrorHandler } from '~/compiler/codegen/codegen';
import { Deep } from '~/engine/util/deep';

function make_model(schema: $BucketModel) {
    const model = {
        bucket: {
            module: 'test',
            alias: 'test',
        },
        cast: makeCastFn(schema),
        copy: makeCloneFn(schema),
        get: makeGetFn(schema)
    } as any;
    model._e = {
        data: CodegenErrorHandler.bucket_model.data.bind(model as any),
        required: CodegenErrorHandler.bucket_model.required.bind(model as any),
        type: CodegenErrorHandler.bucket_model.type.bind(model as any),
        union: CodegenErrorHandler.bucket_model.union.bind(model as any),
    }
    return model
}

const model = make_model(simple_model);

export default new NesoiBenchmarkSuite('option', {
    n: [0],
    data: n => ({ })
})
    .add_('[ nesoi cast ]', () => {
        try {
            const copy = model.cast(simple_obj)
        }
        catch (e) {
            console.error(e);
        }
    })
    .add_('[ structured clone ]', () => {
        try {
            const copy = structuredClone(simple_obj)
        }
        catch (e) {
            console.error(e);
        }
    })
    .add_('[ deep copy ]', () => {
        try {
            const copy = Deep.copy(simple_obj)
        }
        catch (e) {
            console.error(e);
        }
    })
    .add_('[ nesoi cast ]', () => {
        try {
            const copy = model.cast(simple_obj)
        }
        catch (e) {
            console.error(e);
        }
    })
    .add_('[ nesoi copy ]', () => {
        try {
            const copy = model.copy(simple_obj)
        }
        catch (e) {
            console.error(e);
        }
    })
    .add_('[ deep get ]', () => {
        try {
            const get = Deep.get(simple_obj, 'list_obj.0.x')
        }
        catch (e) {
            console.error(e);
        }
    })
    .add_('[ nesoi get ]', () => {
        try {
            const get = model.get(simple_obj, 'list_obj.0.x')
        }
        catch (e) {
            console.error(e);
        }
    })