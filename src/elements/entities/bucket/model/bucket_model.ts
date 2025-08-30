import { $Module , $Bucket } from '~/elements';
import { $BucketModel, $BucketModelField } from './bucket_model.schema';
import { NesoiError } from '~/engine/data/error';
import { BucketAdapterConfig } from '../adapters/bucket_adapter';

/**
 * @category Elements
 * @subcategory Entity
 * */
export class BucketModel<M extends $Module, $ extends $Bucket> {
    
    private alias: string
    private schema: $BucketModel
    
    constructor(
        bucket: $Bucket,
        private config?: BucketAdapterConfig
    ) {
        this.alias = bucket.alias;
        this.schema = bucket.model;
    }

    public copy<T extends Record<string, any>>(
        obj: T
    ): T {
        const meta = this.config?.meta || {
            created_at: 'created_at',
            created_by: 'created_by',
            updated_at: 'updated_at',
            updated_by: 'updated_by',
        };
        const copy: Record<string, any> = {};

        let poll: {
            field: $BucketModelField,
            obj: Record<string, any>,
            copy: Record<string, any>,
            path: string
        }[] = Object.entries(this.schema.fields).map(([path, field]) => ({ path, obj, copy, field }));

        while (poll.length) {
            const next: typeof poll = [];
            for (const entry of poll) {
                const val = entry.obj[entry.path];
                if (val === undefined) {
                    continue;
                }
                if (val === null) {
                    entry.copy[entry.path] = null;
                    continue;
                }

                if (entry.field.type === 'list') {
                    if (!Array.isArray(val)) continue;
                    entry.copy[entry.path] = [];
                    next.push(...val.map((_,i) => ({
                        path: i.toString(),
                        obj: val,
                        copy: entry.copy[entry.path],
                        field: entry.field.children!['#']
                    })))
                }
                else if (entry.field.type === 'dict') {
                    if (typeof val !== 'object' || Array.isArray(val)) continue;
                    entry.copy[entry.path] = {};
                    next.push(...Object.keys(val).map((path) => ({
                        path,
                        obj: val,
                        copy: entry.copy[entry.path],
                        field: entry.field.children!['#']
                    })))
                }
                else if (entry.field.type === 'obj') {
                    if (typeof val !== 'object' || Array.isArray(val)) continue;
                    entry.copy[entry.path] = {};
                    next.push(...Object.keys(entry.field.children!).map(path => ({
                        path: path,
                        obj: val,
                        copy: entry.copy[entry.path],
                        field: entry.field.children![path]
                    })))
                }
                else if (entry.field.type === 'union') {
                    // TODO: ??????????   
                    entry.copy[entry.path] = entry.obj[entry.path];
                }
                else if (entry.field.type === 'enum') {
                    const v = entry.obj[entry.path];
                    const options = entry.field.meta!.enum!.options
                    if (!(v in options)) {
                        throw NesoiError.Bucket.Model.InvalidEnum({bucket: this.alias, value: v, options: Object.keys(options)})
                    }
                    entry.copy[entry.path] = entry.obj[entry.path];
                }
                else {
                    entry.copy[entry.path] = entry.obj[entry.path];
                }
            }
            poll = next;
        }
        copy[meta.created_at] = obj[meta.created_at];
        copy[meta.created_by] = obj[meta.created_by];
        copy[meta.updated_at] = obj[meta.updated_at];
        copy[meta.updated_by] = obj[meta.updated_by];
        return copy as never;
    }

}
