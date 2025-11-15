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
    modelpath?: {
        i: number
        asterisk_values: string[]
    }
    is_union_option?: boolean | 'last'
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
        serialize?: (cmd?: BucketModelCopyCmd) => boolean,
        modelpath?: string
    ): T {
        const meta = this.config?.meta || {
            created_at: 'created_at',
            created_by: 'created_by',
            updated_at: 'updated_at',
            updated_by: 'updated_by',
        };
        const copy: Record<string, any> = {};

        const modelpath_results: {
            value: any,
            index: string[]
         }[] = [];

        const paths = modelpath?.split('.');

        let poll: BucketModelCopyCmd[] =
            paths
                // Specific modelpath requested, start with root field only
                ? [{
                    path: paths[0],
                    obj,
                    copy,
                    field: this.schema.fields[paths[0]],
                    depth: 0,
                    modelpath: { i: 0, asterisk_values: [] }
                }]
                // No modelpath, use all fields
                : Object.entries(this.schema.fields).map(([path, field]) => ({
                    path, obj, copy, field, depth: 0
                }));

        while (poll.length) {
            const next: typeof poll = [];
            for (const entry of poll) {

                if (entry.is_union_option) {
                    const alreadyParsed = entry.copy[entry.path] !== undefined;
                    if (alreadyParsed) continue;
                }

                const val = entry.obj[entry.path];
                if (val === undefined) {
                    delete entry.copy[entry.path];
                    continue;
                }
                if (val === null) {
                    delete entry.copy[entry.path];
                    continue;
                }

                const isLeafPath = entry.modelpath
                    ? entry.modelpath.i === (paths?.length ?? 0)-1
                    : false;

                const nextPath = (!entry.modelpath || isLeafPath)
                    ? undefined
                    : paths![entry.modelpath!.i+1];

                const addChildrenToQueue = !entry.modelpath
                    || entry.modelpath.i >= (paths!.length-1)
                    || nextPath === '*';

                if (entry.field.type === 'list') {
                    if (!Array.isArray(val)) continue;
                    entry.copy[entry.path] = [];
                    // Leaf path or no modelpath = add entire list to queue
                    if (addChildrenToQueue) {
                        next.push(...val.map((_,i) => ({
                            path: i.toString(),
                            obj: val,
                            copy: entry.copy[entry.path],
                            field: entry.field.children!['#'],
                            depth: entry.depth+1,
                            modelpath: entry.modelpath ? {
                                i: entry.modelpath.i+1,
                                asterisk_values: [...entry.modelpath.asterisk_values, ...(nextPath === '*' ? [i.toString()] : [])]
                            } : undefined
                        })))
                    }
                    // Branch path = add next path to queue
                    else {
                        next.push({
                            path: nextPath!,
                            obj: val,
                            copy: entry.copy[entry.path],
                            field: entry.field.children!['#'],
                            depth: entry.depth+1,
                            modelpath: entry.modelpath ? {
                                i: entry.modelpath.i+1,
                                asterisk_values: entry.modelpath.asterisk_values
                            } : undefined
                        })
                    }
                }
                else if (entry.field.type === 'dict') {
                    if (typeof val !== 'object' || Array.isArray(val)) continue;
                    entry.copy[entry.path] = {};
                    // Leaf path or no modelpath = add entire dict to queue
                    if (addChildrenToQueue) {
                        next.push(...Object.keys(val).map((path) => ({
                            path,
                            obj: val,
                            copy: entry.copy[entry.path],
                            field: entry.field.children!['#'],
                            depth: entry.depth+1,
                            modelpath: entry.modelpath ? {
                                i: entry.modelpath.i+1,
                                asterisk_values: [...entry.modelpath.asterisk_values, ...(nextPath === '*' ? [path] : [])]
                            } : undefined
                        })))
                    }
                    // Branch path = add next path to queue
                    else {
                        next.push({
                            path: nextPath!,
                            obj: val,
                            copy: entry.copy[entry.path],
                            field: entry.field.children!['#'],
                            depth: entry.depth+1,
                            modelpath: entry.modelpath ? {
                                i: entry.modelpath.i+1,
                                asterisk_values: entry.modelpath.asterisk_values
                            } : undefined
                        })
                    }
                }
                else if (entry.field.type === 'obj') {
                    if (typeof val !== 'object' || Array.isArray(val)) continue;

                    // disambiguate between dict and obj when obj comes first
                    // on a union
                    const objectHasValidFields = Object.keys(val).some(key => key in entry.field.children!);
                    if (!objectHasValidFields) continue;

                    entry.copy[entry.path] = {};
                    // Leaf path or no modelpath = add entire dict to queue
                    if (addChildrenToQueue) {
                        next.push(...Object.keys(entry.field.children!).map(path => ({
                            path: path,
                            obj: val,
                            copy: entry.copy[entry.path],
                            field: entry.field.children![path],
                            depth: entry.depth+1,
                            modelpath: entry.modelpath ? {
                                i: entry.modelpath.i+1,
                                asterisk_values: [...entry.modelpath.asterisk_values, ...(nextPath === '*' ? [path] : [])]
                            } : undefined
                        })))
                    }
                    // Branch path = add next path to queue
                    else {
                        next.push({
                            path: nextPath!,
                            obj: val,
                            copy: entry.copy[entry.path],
                            field: entry.field.children![nextPath!],
                            depth: entry.depth+1,
                            modelpath: entry.modelpath ? {
                                i: entry.modelpath.i+1,
                                asterisk_values: entry.modelpath.asterisk_values
                            } : undefined
                        })
                    }
                }
                else if (entry.field.type === 'union') {
                    const options = Object.entries(entry.field.children!);
                    // Add union options to queue with flag
                    // This flag avoids reparsing a value if an earlier option already did it
                    next.push(...options.map(([_, option], i) => ({
                        ...entry,
                        field: option,
                        is_union_option: i === options.length -1 ? ('last' as const) : true
                    })))
                    continue;
                }
                else if (entry.field.type === 'enum') {
                    const v = entry.obj[entry.path];
                    const options = entry.field.meta!.enum!.options
                    if (!(v in options)) {
                        if (entry.is_union_option !== true) {
                            throw NesoiError.Bucket.Model.InvalidEnum({bucket: this.alias, value: v, options: Object.keys(options)})
                        }
                    }
                    entry.copy[entry.path] = entry.obj[entry.path];
                }
                else if (entry.field.type === 'date') {
                    const v = entry.obj[entry.path];
                    if (serialize?.(entry)) {
                        if (op === 'load') {
                            try { entry.copy[entry.path] = NesoiDate.fromISO(v); }
                            catch {
                                if (entry.is_union_option !== true) {
                                    throw NesoiError.Bucket.Model.InvalidISODate({bucket: this.alias, value: v })
                                }
                                continue;
                            }
                        }
                        else if (op === 'save') {
                            try { entry.copy[entry.path] = (v as NesoiDate).toISO(); }
                            catch {
                                if (entry.is_union_option !== true) {
                                    throw NesoiError.Bucket.Model.InvalidNesoiDate({bucket: this.alias, value: v })
                                }
                                continue;
                            }
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
                            catch {
                                if (entry.is_union_option !== true) {
                                    throw NesoiError.Bucket.Model.InvalidISODatetime({bucket: this.alias, value: v })
                                }
                                continue;
                            }
                        }
                        else if (op === 'save') {
                            try { entry.copy[entry.path] = (v as NesoiDatetime).toISO(); }
                            catch {
                                if (entry.is_union_option !== true) {
                                    throw NesoiError.Bucket.Model.InvalidNesoiDatetime({bucket: this.alias, value: v })
                                }
                                continue;
                            }
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
                        if ((op === 'load' && typeof v !== 'string') || (op === 'save' && !(v instanceof NesoiDecimal))) {
                            if (entry.is_union_option !== true) {
                                throw NesoiError.Bucket.Model.InvalidNesoiDecimal({bucket: this.alias, value: v })
                            }
                            continue;
                        }
                        if (op === 'load') entry.copy[entry.path] = new NesoiDecimal(v, meta?.left, meta?.right);
                        if (op === 'save') entry.copy[entry.path] = (v as NesoiDecimal).toString();
                    }
                    else {
                        if (!(v instanceof NesoiDecimal)) {
                            if (entry.is_union_option !== true) {
                                throw NesoiError.Bucket.Model.InvalidNesoiDecimal({bucket: this.alias, value: v })
                            }
                            continue;
                        }
                        entry.copy[entry.path] = v;
                    }
                }
                else if (entry.field.type === 'duration') {
                    const v = entry.obj[entry.path];
                    if (serialize?.(entry)) {
                        if ((op === 'load' && typeof v !== 'string') || (op === 'save' && !(v instanceof NesoiDuration))) {
                            if (entry.is_union_option !== true) {
                                throw NesoiError.Bucket.Model.InvalidNesoiDuration({bucket: this.alias, value: v })
                            }
                            continue;
                        }
                        if (op === 'load') entry.copy[entry.path] = NesoiDuration.fromString(v);
                        if (op === 'save') entry.copy[entry.path] = (v as NesoiDuration).toString();
                    }
                    else {
                        if (!(v instanceof NesoiDuration)) {
                            if (entry.is_union_option !== true) {
                                throw NesoiError.Bucket.Model.InvalidNesoiDuration({bucket: this.alias, value: v })
                            }
                            continue;
                        }
                        entry.copy[entry.path] = v;
                    }
                }
                else {
                    entry.copy[entry.path] = entry.obj[entry.path];
                }

                if (isLeafPath) {
                    modelpath_results.push({
                        value: entry.copy[entry.path],
                        index: entry.modelpath!.asterisk_values
                    })
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

        if (modelpath) return modelpath_results as never;
        return copy as never;
    }

}
