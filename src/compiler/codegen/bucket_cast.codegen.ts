import { c, CodegenInject } from './codegen';
import { BucketModelCode } from './bucket.codegen';
import type { BucketModel } from '~/elements/entities/bucket/model/bucket_model';

export class BucketModel__cast {
    
    private code: BucketModelCode;

    constructor(
        schema: $BucketModelField,
        depth = -1
    ) {
        this.code = new BucketModelCode(schema, depth);
    }

    public toString() {
        let fn = '';
        fn += 'const copy = {};\n\n';
        fn += c.to_str(this.code.compile('cast', undefined, undefined, undefined, -1));
        fn += 'return copy;\n';
        return fn;
    }

    public static make(
        model: $BucketModel
    ) {
        const model_code = new BucketModel__cast({
            required: true,
            type: 'obj',
            path: '',
            children: model.fields
        } as unknown as $BucketModelField);
        
        const fn_str = model_code.toString();
        // console.log(fn_str);

        const fn = new Function('_inc', 'op', 'val', fn_str);
        Object.defineProperty(fn, 'name', { value: 'cast' });

        function __fn (this: BucketModel<any, any>, obj: any) {
            return fn(CodegenInject, {
                err: (this as any)._e,
                id: obj.id
            }, obj);
        }

        return __fn;
    }
}