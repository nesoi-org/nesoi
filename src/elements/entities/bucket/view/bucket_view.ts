import { NesoiObj } from '~/engine/data/obj';
import { Bucket } from '../bucket';
import { $BucketView, $BucketViewField, $BucketViewFields } from './bucket_view.schema';
import _Promise from '~/engine/util/promise';
import { AnyTrxNode } from '~/engine/transaction/trx_node';
import { Tree } from '~/engine/data/tree';
import { NesoiError } from '~/engine/data/error';

/**
 * @category Elements
 * @subcategory Entity
 * */
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
        const doParse = async (schema: $BucketViewFields, index: '*' | (string|number)[]) => {
            const parsedObj = {} as any;

            // Model props
            for (const k in schema) {
                const prop = schema[k];
                if (prop.scope !== 'model') { continue; }
                parsedObj[k] = await parseModelProp(raw, prop, index);
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
                let link;
                if (!value.view) {
                    link = bucket.graph.readLink(trx, raw, value.link, { silent: true }) // TODO: fieldpath indexes
                }
                else {
                    link = bucket.graph.viewLink(trx, raw, value.link, value.view, { silent: true }) // TODO: fieldpath indexes
                }
                parsedObj[k] = await _Promise.solve(link);
            }
            
            // Drive props
            for (const k in schema) {
                const prop = schema[k];
                if (prop.$t !== 'bucket.view.field') { continue; }
                if (prop.scope !== 'drive') { continue; }
                if (!bucket.drive) {
                    throw NesoiError.Bucket.Drive.NoAdapter({ bucket: bucket.schema.alias });
                }
                const value = (prop as $BucketViewField).value.drive!;
                const model = Tree.get(raw, value.path);
                if (Array.isArray(model)) {
                    const public_urls: string[] = [];
                    for (const obj of model) {
                        public_urls.push(await bucket.drive.public(obj));
                    }
                    parsedObj[k] = public_urls;
                }
                else {
                    parsedObj[k] = (await bucket.drive.public(model));
                }
            }
            
            // Group props
            for (const k in schema) {
                const prop = schema[k];
                if (prop.$t !== 'bucket.view.field') { continue; }
                if (prop.scope !== 'group') { continue; }
                parsedObj[k] = await doParse(prop.children || {}, index); 
            }
            parsedObj['$v'] = this.schema.name;
            return parsedObj;
        };

        const parseModelProp = async (obj: Record<string, any>, prop: $BucketViewField, index: '*' | (string|number)[], key?: string) => {
            const value = prop.value.model!;
            const rawValue = Tree.get(obj, key || value.key, index);

            if (prop.children) {
                if (prop.array) {
                    if (!Array.isArray(rawValue)) {
                        return undefined;
                    }
                    const parsedArray: any[] = []
                    for (let i = 0; i < rawValue.length; i++) {
                        const child = await doParse(prop.children, [...(index || []), i]);
                        parsedArray.push(child)
                    }
                    return parsedArray;
                }
                else if (prop.type === 'dict') {
                    if (typeof rawValue !== 'object' || Array.isArray(rawValue)) {
                        return undefined;
                    }
                    const parsedDict: Record<string, any> = {}
                    for (const j in rawValue) {
                        parsedDict[j] = await parseModelProp(rawValue, prop.children.__dict, [...(index || []), j], j);
                    }
                    return parsedDict;
                }
                else {
                    return doParse(prop.children, index || []);
                }
            }
            return rawValue;        
        };
        
        const parsedObj = await doParse(this.schema.fields, '*');
        return {
            id: raw.id,
            ...parsedObj
        };
    }
}