import { NesoiObj } from '~/engine/data/obj';
import { Bucket } from '../bucket';
import { $BucketView, $BucketViewField, $BucketViewFields } from './bucket_view.schema';
import _Promise from '~/engine/util/promise';
import { AnyTrxNode } from '~/engine/transaction/trx_node';
import { Tree } from '~/engine/data/tree';

export class BucketView<$ extends $BucketView> {

    constructor(
        private bucket: Bucket<any, any>,
        public schema: $
    ) {}

    public async parse<Obj extends NesoiObj>(
        trx: AnyTrxNode,
        raw: Obj
    ): Promise<$['#data']> {
        const bucket = this.bucket;
        const doParse = async (schema: $BucketViewFields, index: null | (string|number)[]) => {
            const parsedObj = {} as any;

            // Model props
            for (const k in schema) {
                const prop = schema[k];
                if (prop.scope !== 'model') { continue; }
                
                const value = (prop as $BucketViewField).value.model!;
                const rawValue = Tree.get(raw, value.key, index);
                

                if (prop.children) {
                    if (prop.array) {
                        if (!Array.isArray(rawValue)) {
                            continue;
                        }
                        const parsedArray: any[] = []
                        for (let i = 0; i < rawValue.length; i++) {
                            const child = await doParse(prop.children, [...(index || []), i]);
                            parsedArray.push(child)
                        }
                        parsedObj[k] = parsedArray;
                        continue;
                    }
                    else if (prop.type === 'dict') {
                        if (typeof rawValue !== 'object' || Array.isArray(rawValue)) {
                            continue;
                        }
                        const parsedArray: any[] = []
                        for (const k in rawValue) {
                            const child = await doParse(prop.children, [...(index || []), k]);
                            parsedArray.push(child)
                        }
                        parsedObj[k] = parsedArray;
                        continue;
                    }
                    else {
                        parsedObj[k] = await doParse(prop.children, index || []);
                        continue;
                    }
                }
                parsedObj[k] = rawValue;
            }
            
            // Computed props
            for (const k in schema) {
                const prop = schema[k];
                if (prop.$t !== 'bucket.view.field') { continue; }
                if (prop.scope !== 'computed') { continue; }
                const value = (prop as $BucketViewField).value.computed!;
                parsedObj[k] = await _Promise.solve(
                    value.fn({ trx, raw, bucket: bucket.schema })
                );
            }
            
            // Graph props
            for (const k in schema) {
                const prop = schema[k];
                if (prop.$t !== 'bucket.view.field') { continue; }
                if (prop.scope !== 'graph') { continue; }
                const value = (prop as $BucketViewField).value.graph!;
                parsedObj[k] = await _Promise.solve(
                    bucket.graph.readLink(trx, value.link, raw, value.view, index || [])
                );
            }
            
            // Group props
            for (const k in schema) {
                const prop = schema[k];
                if (prop.$t !== 'bucket.view.field') { continue; }
                if (prop.scope !== 'group') { continue; }
                parsedObj[k] = await doParse(prop.children || {}, index); 
            }
            return parsedObj;
        };
        
        const parsedObj = await doParse(this.schema.fields, null);
        return {
            id: raw.id,
            ...parsedObj
        };
    }
}