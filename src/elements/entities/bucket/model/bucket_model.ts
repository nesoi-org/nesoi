import { $Module , $Bucket } from '~/elements';
import { $BucketModel, $BucketModelField } from './bucket_model.schema';
import { NesoiError } from '~/engine/data/error';
import { BucketAdapterConfig } from '../adapters/bucket_adapter';
import { NesoiDate } from '~/engine/data/date';
import { NesoiDatetime } from '~/engine/data/datetime';
import { NesoiDecimal } from '~/engine/data/decimal';
import { NesoiDuration } from '~/engine/data/duration';

type BucketModelCopyCmd = {
    field: $BucketModelField,
    obj: Record<string, any>,
    copy: Record<string, any>,
    path: string,
    depth: number
}

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
        obj: T,
        op: 'save'|'load',
        serialize?: (cmd?: BucketModelCopyCmd) => boolean
    ): T {
        const meta = this.config?.meta || {
            created_at: 'created_at',
            created_by: 'created_by',
            updated_at: 'updated_at',
            updated_by: 'updated_by',
        };
        const copy: Record<string, any> = {};

        let poll: BucketModelCopyCmd[] =
            Object.entries(this.schema.fields).map(([path, field]) => ({
                path, obj, copy, field, depth: 0
            }));

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
                        field: entry.field.children!['#'],
                        depth: entry.depth+1
                    })))
                }
                else if (entry.field.type === 'dict') {
                    if (typeof val !== 'object' || Array.isArray(val)) continue;
                    entry.copy[entry.path] = {};
                    next.push(...Object.keys(val).map((path) => ({
                        path,
                        obj: val,
                        copy: entry.copy[entry.path],
                        field: entry.field.children!['#'],
                        depth: entry.depth+1
                    })))
                }
                else if (entry.field.type === 'obj') {
                    if (typeof val !== 'object' || Array.isArray(val)) continue;
                    entry.copy[entry.path] = {};
                    next.push(...Object.keys(entry.field.children!).map(path => ({
                        path: path,
                        obj: val,
                        copy: entry.copy[entry.path],
                        field: entry.field.children![path],
                        depth: entry.depth+1
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
                else if (entry.field.type === 'date') {
                    const v = entry.obj[entry.path];
                    if (serialize?.(entry)) {
                        if (op === 'load') {
                            try { entry.copy[entry.path] = NesoiDate.fromISO(v); }
                            catch { throw NesoiError.Bucket.Model.InvalidISODate({bucket: this.alias, value: v }) }
                        }
                        else if (op === 'save') {
                            try { entry.copy[entry.path] = (v as NesoiDate).toISO(); }
                            catch { throw NesoiError.Bucket.Model.InvalidNesoiDate({bucket: this.alias, value: v }) }
                        }
                    }
                    else {
                        entry.copy[entry.path] = entry.obj[entry.path];
                    }
                }
                else if (entry.field.type === 'datetime') {
                    const v = entry.obj[entry.path];
                    if (serialize?.(entry)) {
                        if (op === 'load') {
                            try { entry.copy[entry.path] = NesoiDatetime.fromISO(v); }
                            catch { throw NesoiError.Bucket.Model.InvalidISODatetime({bucket: this.alias, value: v }) }
                        }
                        else if (op === 'save') {
                            try { entry.copy[entry.path] = (v as NesoiDatetime).toISO(); }
                            catch { throw NesoiError.Bucket.Model.InvalidNesoiDatetime({bucket: this.alias, value: v }) }
                        }
                    }
                    else {
                        entry.copy[entry.path] = entry.obj[entry.path];
                    }
                }
                else if (entry.field.type === 'decimal') {
                    const meta = entry.field.meta!.decimal;
                    const v = entry.obj[entry.path];
                    if (serialize?.(entry)) {
                        if (op === 'load') entry.copy[entry.path] = new NesoiDecimal(v, meta?.left, meta?.right);
                        if (op === 'save') entry.copy[entry.path] = (v as NesoiDecimal).toString();
                    }
                    else {
                        entry.copy[entry.path] = v;
                    }
                }
                else if (entry.field.type === 'duration') {
                    const v = entry.obj[entry.path];
                    if (serialize?.(entry)) {
                        if (op === 'load') entry.copy[entry.path] = NesoiDuration.fromString(v);
                        if (op === 'save') entry.copy[entry.path] = (v as NesoiDuration).toString();
                    }
                    else {
                        entry.copy[entry.path] = v;
                    }
                }
                else {
                    entry.copy[entry.path] = entry.obj[entry.path];
                }
            }
            poll = next;
        }

        copy[meta.created_by] = obj[meta.created_by];
        copy[meta.updated_by] = obj[meta.updated_by];
        if (serialize?.()) {
            if (op === 'load') {
                copy[meta.created_at] = obj[meta.created_at] ? NesoiDatetime.fromISO(obj[meta.created_at]) : undefined;
                copy[meta.updated_at] = obj[meta.updated_at] ? NesoiDatetime.fromISO(obj[meta.updated_at]) : undefined;
            }
            else if (op === 'save') {
                copy[meta.created_at] = obj[meta.created_at]?.toISO?.();
                copy[meta.updated_at] = obj[meta.updated_at]?.toISO?.();
            }
        }
        else {
            copy[meta.created_at] = obj[meta.created_at];
            copy[meta.updated_at] = obj[meta.updated_at];
        }

        return copy as never;
    }

}
