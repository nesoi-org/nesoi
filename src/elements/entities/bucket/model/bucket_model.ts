import { $Module , $Bucket } from '~/elements';
import { $BucketModel, $BucketModelField } from './bucket_model.schema';
import { NesoiError } from '~/engine/data/error';
import { BucketAdapterConfig } from '../adapters/bucket_adapter';
import { NesoiDate } from '~/engine/data/date';
import { NesoiDatetime } from '~/engine/data/datetime';
import { NesoiDecimal } from '~/engine/data/decimal';
import { NesoiDuration } from '~/engine/data/duration';
import { Log } from '~/engine/util/log';
import { parseBoolean, parseFloat_, parseInt_, parseLiteral, parseString } from '~/engine/util/parse';

type BucketModelCopyCmd = {
    field: $BucketModelField,
    obj: Record<string, any>,
    copy: Record<string, any>,
    key: string,
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
        roots?: string[]
    ): T;
    public copy<T extends Record<string, any>>(
        obj: T,
        op: 'save'|'load',
        serialize?: (cmd?: BucketModelCopyCmd) => boolean,
        modelpath?: string
    ): {
        value: any,
        index: string[]
    }[];
    public copy<T extends Record<string, any>>(
        obj: T,
        op: 'save'|'load',
        serialize?: (cmd?: BucketModelCopyCmd) => boolean,
        modelpath_or_roots?: string | string[]
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

        const roots = Array.isArray(modelpath_or_roots) ? modelpath_or_roots : undefined;
        const paths = Array.isArray(modelpath_or_roots) ? undefined : modelpath_or_roots?.split('.');

        const poll: BucketModelCopyCmd[] =
            paths
                // Specific modelpath requested, start with root field only
                ? [{
                    key: paths[0],
                    obj,
                    copy,
                    field: this.schema.fields[paths[0]],
                    depth: 0,
                    modelpath: { i: 0, asterisk_values: [] }
                }]
                // No modelpath, use all fields
                : Object.entries(this.schema.fields)
                    .filter(([_, field]) => !roots || roots.includes(field.path))
                    .map(([path, field]) => ({
                        key: path,
                        obj,
                        copy,
                        field,
                        depth: 0
                    }));

        modelpath_results.push(
            ...this.runCopyCmdPoll(
                op, poll, paths, serialize
            )
        );
            
        copy[meta.created_by] = obj[meta.created_by];
        copy[meta.updated_by] = obj[meta.updated_by];
        
        const meta_as_json = serialize?.();

        const created_at = obj[meta.created_at];
        if (typeof created_at === 'string') {
            copy[meta.created_at] = meta_as_json ? created_at : NesoiDatetime.fromISO(obj[created_at]);
        }
        else if (created_at instanceof NesoiDatetime) {
            copy[meta.created_at] = meta_as_json ? created_at.toISO() : created_at
        }

        const updated_at = obj[meta.updated_at];
        if (typeof updated_at === 'string') {
            copy[meta.updated_at] = meta_as_json ? updated_at : NesoiDatetime.fromISO(obj[updated_at]);
        }
        else if (updated_at instanceof NesoiDatetime) {
            copy[meta.updated_at] = meta_as_json ? updated_at.toISO() : updated_at
        }

        if (paths) return modelpath_results as never;
        return copy as never;
    }
   
    private runCopyCmdPoll(
        op: 'save'|'load',
        poll: BucketModelCopyCmd[],
        modelpath?: string[],
        serialize?: (cmd?: BucketModelCopyCmd) => boolean
    ) {
        const modelpath_results: {
            value: any,
            index: string[]
         }[] = [];

        while (poll.length) {
            const next: typeof poll = [];
            for (const cmd of poll) {

                const isLeafPath = cmd.modelpath
                    ? cmd.modelpath.i === (modelpath?.length ?? 0)-1
                    : false;

                if (cmd.field.type === 'union') {
                    const options = Object.values(cmd.field.children!);
                    let unionErrors: Record<string, any>[] = [];
                    for (const option of options) {
                        try {
                            // Clean field for next attempt
                            delete cmd.copy[cmd.key];
                            // Attempt union option
                            modelpath_results.push(
                                ...this.runCopyCmdPoll(
                                    op,
                                    [{
                                        ...cmd,
                                        field: option
                                    }],
                                    modelpath,
                                    serialize
                                )
                            );
                            // Success, clear errors and proceed
                            unionErrors = []
                            break;
                        }
                        catch(e: any) {
                            unionErrors.push(e);
                        }
                    }
                    if (unionErrors.length) {
                        throw NesoiError.Message.ValueDoesntMatchUnion({ alias: cmd.field.alias, path: '', value: cmd.obj[cmd.key], unionErrors });
                    }
                }
                else {
                    const as_json = serialize?.(cmd);
                    next.push(
                        ...this.runCopyCmd(
                            op,
                            cmd,
                            modelpath,
                            as_json
                        )
                    );
                }

                if (isLeafPath) {
                    modelpath_results.push({
                        value: cmd.copy[cmd.key],
                        index: cmd.modelpath!.asterisk_values
                    })
                }
            }
            poll = next;
        }

        return modelpath_results;
    }
   
    private runCopyCmd(
        op: 'save'|'load',
        cmd: BucketModelCopyCmd,
        modelpath?: string[],
        as_json = false
    ) {
        const next: BucketModelCopyCmd[] = [];

        const value = cmd.obj[cmd.key];
        if (value === undefined || value === null) {
            if (cmd.field.path !== 'id' && cmd.field.required) {
                if (op === 'load') {
                    Log.warn('bucket.model', this.alias, `Object with id ${cmd.obj.id} missing required field '${cmd.field.path}' during read`);
                }
                else {
                    throw NesoiError.Bucket.Model.FieldRequired({ bucket: this.alias, field: cmd.field.alias })
                }
            }
            delete cmd.copy[cmd.key];
            return [];
        }

        const isLeafPath = cmd.modelpath
            ? cmd.modelpath.i === (modelpath?.length ?? 0)-1
            : false;

        const nextPath = (!cmd.modelpath || isLeafPath)
            ? undefined
            : modelpath![cmd.modelpath!.i+1];

        const addChildrenToQueue = !cmd.modelpath
            || cmd.modelpath.i >= (modelpath!.length-1) // is leaf or inner field
            || nextPath === '*';

        if (cmd.field.type === 'list') {
            if (!Array.isArray(value)) {
                throw NesoiError.Message.InvalidFieldType({ alias: cmd.field.alias, path: '', value, type: 'list' });
            }
            cmd.copy[cmd.key] = [];
            // Leaf path or no modelpath = add entire list to queue
            if (addChildrenToQueue) {
                next.push(...value.map((_,i) => ({
                    key: i.toString(),
                    obj: value,
                    copy: cmd.copy[cmd.key],
                    field: cmd.field.children!['#'],
                    depth: cmd.depth+1,
                    modelpath: cmd.modelpath ? {
                        i: cmd.modelpath.i+1,
                        asterisk_values: [...cmd.modelpath.asterisk_values, ...(nextPath === '*' ? [i.toString()] : [])]
                    } : undefined
                })))
            }
            // Branch path = add next path to queue
            else {
                next.push({
                    key: nextPath!,
                    obj: value,
                    copy: cmd.copy[cmd.key],
                    field: cmd.field.children!['#'],
                    depth: cmd.depth+1,
                    modelpath: cmd.modelpath ? {
                        i: cmd.modelpath.i+1,
                        asterisk_values: cmd.modelpath.asterisk_values
                    } : undefined
                })
            }
            return next;
        }
        else if (cmd.field.type === 'dict') {
            if (typeof value !== 'object' || Array.isArray(value)) {
                throw NesoiError.Message.InvalidFieldType({ alias: cmd.field.alias, path: '', value, type: 'dict' });
            }
            cmd.copy[cmd.key] = {};
            // Leaf path or no modelpath = add entire dict to queue
            if (addChildrenToQueue) {
                next.push(...Object.keys(value).map((key) => ({
                    key,
                    obj: value,
                    copy: cmd.copy[cmd.key],
                    field: cmd.field.children!['#'],
                    depth: cmd.depth+1,
                    modelpath: cmd.modelpath ? {
                        i: cmd.modelpath.i+1,
                        asterisk_values: [...cmd.modelpath.asterisk_values, ...(nextPath === '*' ? [key] : [])]
                    } : undefined
                })))
            }
            // Branch path = add next path to queue
            else if (nextPath! in value) {
                next.push({
                    key: nextPath!,
                    obj: value,
                    copy: cmd.copy[cmd.key],
                    field: cmd.field.children!['#'],
                    depth: cmd.depth+1,
                    modelpath: cmd.modelpath ? {
                        i: cmd.modelpath.i+1,
                        asterisk_values: cmd.modelpath.asterisk_values
                    } : undefined
                })
            }
            return next;
        }
        else if (cmd.field.type === 'obj') {
            if (typeof value !== 'object' || Array.isArray(value)) {
                throw NesoiError.Message.InvalidFieldType({ alias: cmd.field.alias, path: '', value, type: 'obj' });
            }
            
            if (op === 'save') {
                const missingKeys = Object.entries(cmd.field.children!)
                    .filter(([key, child]) =>
                        child.required
                    && key !== 'id'
                    && !(key in cmd.obj[cmd.key]));
                if (missingKeys.length) {
                    throw new Error(`Object with id ${cmd.obj.id} from bucket ${this.alias} is missing keys`);
                }
            }
            else {
                const matchingKeys = Object.entries(cmd.field.children!)
                    .filter(([key, child]) =>
                        !child.required
                        || (key !== 'id' && key in cmd.obj[cmd.key])
                    );
                if (!matchingKeys.length) {
                    throw new Error(`Object with id ${cmd.obj.id} from bucket ${this.alias} has no matching keys`);
                }
            }         

            cmd.copy[cmd.key] = {};
            // Leaf path or no modelpath = add entire dict to queue
            if (addChildrenToQueue) {
                next.push(...Object.keys(cmd.field.children!).map(path => ({
                    key: path,
                    obj: value,
                    copy: cmd.copy[cmd.key],
                    field: cmd.field.children![path],
                    depth: cmd.depth+1,
                    modelpath: cmd.modelpath ? {
                        i: cmd.modelpath.i+1,
                        asterisk_values: [...cmd.modelpath.asterisk_values, ...(nextPath === '*' ? [path] : [])]
                    } : undefined
                })))
            }
            // Branch path = add next path to queue
            else {
                next.push({
                    key: nextPath!,
                    obj: value,
                    copy: cmd.copy[cmd.key],
                    field: cmd.field.children![nextPath!],
                    depth: cmd.depth+1,
                    modelpath: cmd.modelpath ? {
                        i: cmd.modelpath.i+1,
                        asterisk_values: cmd.modelpath.asterisk_values
                    } : undefined
                })
            }
            return next;
        }
        else if (cmd.field.type === 'enum') {
            if (typeof value !== 'string') {
                throw NesoiError.Message.InvalidFieldType({ alias: cmd.field.alias, path: '', value, type: 'obj' });
            }
            const options = cmd.field.meta!.enum!.options
            if (!(value in options)) {
                throw NesoiError.Bucket.Model.InvalidEnum({bucket: this.alias, value, options: Object.keys(options)})
            }
            cmd.copy[cmd.key] = cmd.obj[cmd.key];
            return [];
        }
        else if (cmd.field.type === 'date') {
            if (value instanceof NesoiDate) {
                cmd.copy[cmd.key] = as_json ? value.toISO() : value;
            }
            else if (typeof value === 'string') {
                const date = NesoiDate.fromISO(value);
                cmd.copy[cmd.key] = as_json ? date.toISO() : date;
            }
            else {
                throw NesoiError.Message.InvalidFieldType({ alias: cmd.field.alias, path: '', value, type: 'date' });
            }
        }
        else if (cmd.field.type === 'datetime') {
            if (value instanceof NesoiDatetime) {
                cmd.copy[cmd.key] = as_json ? value.toISO() : value;
            }
            else if (typeof value === 'string') {
                const datetime = NesoiDatetime.fromISO(value);
                cmd.copy[cmd.key] = as_json ? datetime.toISO() : datetime;
            }
            else {
                throw NesoiError.Message.InvalidFieldType({ alias: cmd.field.alias, path: '', value, type: 'datetime' });
            }
        }
        else if (cmd.field.type === 'decimal') {
            if (value instanceof NesoiDecimal) {
                cmd.copy[cmd.key] = as_json ? value.toString() : value;
            }
            else if (typeof value === 'string') {
                const meta = cmd.field.meta!.decimal;
                const decimal = new NesoiDecimal(value, meta?.left, meta?.right);
                cmd.copy[cmd.key] = as_json ? decimal.toString() : decimal;
            }
            else {
                throw NesoiError.Message.InvalidFieldType({ alias: cmd.field.alias, path: '', value, type: 'decimal' });
            }
        }
        else if (cmd.field.type === 'duration') {
            if (value instanceof NesoiDuration) {
                cmd.copy[cmd.key] = as_json ? value.toString() : value;
            }
            else if (typeof value === 'string') {
                const duration = NesoiDuration.fromString(value);
                cmd.copy[cmd.key] = as_json ? duration.toString() : duration;
            }
            else {
                throw NesoiError.Message.InvalidFieldType({ alias: cmd.field.alias, path: '', value, type: 'decimal' });
            }
        }
        else if (cmd.field.type === 'int') {
            cmd.copy[cmd.key] = parseInt_({ alias: cmd.field.alias }, [], cmd.obj[cmd.key]);
        }
        else if (cmd.field.type === 'float') {
            cmd.copy[cmd.key] = parseFloat_({ alias: cmd.field.alias }, [], cmd.obj[cmd.key]);
        }
        else if (cmd.field.type === 'string') {
            cmd.copy[cmd.key] = parseString({ alias: cmd.field.alias }, [], cmd.obj[cmd.key]);
        }
        else if (cmd.field.type === 'literal') {
            cmd.copy[cmd.key] = parseLiteral({ alias: cmd.field.alias }, [], cmd.obj[cmd.key], cmd.field.meta!.literal!.template);
        }
        else if (cmd.field.type === 'boolean') {
            cmd.copy[cmd.key] = parseBoolean({ alias: cmd.field.alias }, [], cmd.obj[cmd.key]);
        }
        else {
            cmd.copy[cmd.key] = cmd.obj[cmd.key];
        }

        return next;
    }

}
