import type { BucketAdapterConfig } from '../adapters/bucket_adapter';

import { NesoiError } from '~/engine/data/error';
import { NesoiDate } from '~/engine/data/date';
import { NesoiDatetime } from '~/engine/data/datetime';
import { NesoiDecimal } from '~/engine/data/decimal';
import { NesoiDuration } from '~/engine/data/duration';
import { parseBoolean, parseFloat_, parseInt_, parseLiteral, parseString } from '~/engine/util/parse';
import { NesoiFile } from '~/engine/data/file';

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

//
// get(obj, 'model.*.path') ->
//  {many:true, values: [x]}
//  {many:false, value: x}
//

// copy(obj) -> obj

type BucketModelGetTarget = {
    value: Record<string, any>,
    idx: string[]
}
type BucketModelGetValue = {
    value: any,
    idx: string[]
}

type BucketModelGetResponse = {
    many: true,
    results: BucketModelGetValue[]
} | {
    many: false,
    value: any
} | undefined

/**
 * @category Elements
 * @subcategory Entity
 * */
export class BucketModel<M extends $Module, $ extends $Bucket> {

    private alias: string
    private schema: $BucketModel

    constructor(
        public bucket: $Bucket,
        private config?: BucketAdapterConfig
    ) {
        this.alias = bucket.alias;
        this.schema = bucket.model;
    }

    private error(
        error: 'invalid_modelpath' | 'corrupted_data',
        message: string,
        id?: number|string,
    ) {
        if (error === 'invalid_modelpath') {
            return NesoiError.Bucket.Model.InvalidModelpath({
                module: this.bucket.module,
                bucket: this.bucket.alias,
                message
            });
        }
        else if (error === 'corrupted_data') {
            return NesoiError.Bucket.Model.CorruptedData({
                module: this.bucket.module,
                bucket: this.bucket.alias,
                id: id!,
                message
            });
        }
    }

    ///

    private copy_primitive(
        field: $BucketModelField,
        value: any,
        as_json: boolean,
        id: string,        // used for error reporting only
        modelpath: string  // used for error reporting only
    ): any {
        if (field.type === 'boolean') {
            if (typeof value !== 'boolean') throw this.error('corrupted_data', `Value '${value}' at '${modelpath}' should be a boolean, but it's a ${typeof value}`, id);
            return value;
        }
        else if (field.type === 'date') {
            if (value instanceof NesoiDate) {
                if (as_json) return value.toISO();
                return value;
            }
            if (typeof value !== 'string') throw this.error('corrupted_data', `Value '${value}' at '${modelpath}' should be a date or string, but it's a ${typeof value}`, id);
            if (as_json) return value;
            else {
                try {
                    return NesoiDate.fromISO(value);
                }
                catch {
                    throw this.error('corrupted_data', `Value '${value}' at '${modelpath}' is an invalid date string`, id);
                }
            }
        }
        else if (field.type === 'datetime') {
            if (value instanceof NesoiDatetime) {
                if (as_json) return value.toISO();
                return value;
            }
            if (typeof value !== 'string') throw this.error('corrupted_data', `Value '${value}' at '${modelpath}' should be a datetime or string, but it's a ${typeof value}`, id);
            if (as_json) return value;
            else return NesoiDate.fromISO(value);
        }
        else if (field.type === 'duration') {
            if (value instanceof NesoiDuration) {
                if (as_json) return value.toString();
                return value;
            }
            if (typeof value !== 'string') throw this.error('corrupted_data', `Value '${value}' at '${modelpath}' should be a duration or string, but it's a ${typeof value}`, id);
            if (as_json) return value;
            else return NesoiDuration.fromString(value);
        }
        else if (field.type === 'decimal') {
            if (value instanceof NesoiDecimal) {
                if (as_json) return value.toString();
                return value;
            }
            if (typeof value !== 'string') throw this.error('corrupted_data', `Value '${value}' at '${modelpath}' should be a decimal or string, but it's a ${typeof value}`, id);
            if (as_json) return value;
            else return new NesoiDecimal(value, field.meta!.decimal!.left, field.meta!.decimal!.right);
        }
        else if (field.type === 'enum') {
            if (typeof value !== 'string') throw this.error('corrupted_data', `Value '${value}' at '${modelpath}' should be a enum string, but it's a ${typeof value}`, id);
            if (!(value in field.meta!.enum!.options)) {
                throw this.error('corrupted_data', `Value '${value}' at '${modelpath}' is not a valid enum options. Options: ${field.meta!.enum!.options}`, id);
            }
            return value;
        }
        else if (field.type === 'file') {
            if (typeof value !== 'object') throw this.error('corrupted_data', `Value '${value}' at '${modelpath}' should be a file descriptor object, but it's a ${typeof value}`, id);
            return NesoiFile.from(value, {});
        }
        else if (field.type === 'float') {
            if (typeof value !== 'number') throw this.error('corrupted_data', `Value '${value}' at '${modelpath}' should be a float number, but it's a ${typeof value}`, id);
            return value;
        }
        else if (field.type === 'int') {
            if (typeof value !== 'number') throw this.error('corrupted_data', `Value '${value}' at '${modelpath}' should be a int number, but it's a ${typeof value}`, id);
            if (!Number.isInteger(value)) throw this.error('corrupted_data', `Value '${value}' at '${modelpath}' should be a integer number, but it's a float number`, id);
            return value;
        }
        else if (field.type === 'string') {
            if (typeof value !== 'string') throw this.error('corrupted_data', `Value '${value}' at '${modelpath}' should be a string, but it's a ${typeof value}`, id);
            return value;
        }
        else if (field.type === 'literal') {
            if (typeof value !== 'string') throw this.error('corrupted_data', `Value '${value}' at '${modelpath}' should be a string, but it's a ${typeof value}`, id);
            if (!value.match(new RegExp(field.meta!.literal!.template))) throw this.error('corrupted_data', `Value '${value}' at '${modelpath}' does not match the template: '${field.meta!.literal!.template}'`, id);
            return value;
        }
        else if (field.type === 'unknown') {
            return value;
        }
        throw this.error('corrupted_data', `Modelpath '${modelpath}' resolves to an invalid field`, id);
    }

    private copy_obj(
        field: $BucketModelField,
        value: any,
        as_json: boolean,
        id: string,        // used for error reporting only
        modelpath: string   // used for error reporting only
    ): Record<string, any> {
        if (typeof value !== 'object') throw this.error('corrupted_data', `Value '${value}' at '${modelpath}' should be an object, but it's a ${typeof value}`, id);
        if (Array.isArray(value)) throw this.error('corrupted_data', `Value '${value}' at '${modelpath}' should be an object, but it's an array`, id);

        const copy: Record<string, any> = {};
        const keys = Object.keys(field.children!);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            copy[key] = this.copy_any(field.children![key], value[key], as_json, id, modelpath+'.'+key)
        }
        return copy;
    }

    private copy_dict(
        field: $BucketModelField,
        value: any,
        as_json: boolean,
        id: string,        // used for error reporting only
        modelpath: string   // used for error reporting only
    ): Record<string, any> {
        if (typeof value !== 'object') throw this.error('corrupted_data', `Value '${value}' at '${modelpath}' should be a dictionary, but it's a ${typeof value}`, id);
        if (Array.isArray(value)) throw this.error('corrupted_data', `Value '${value}' at '${modelpath}' should be a dictionary, but it's an array`, id);

        const copy: Record<string, any> = {};
        const keys = Object.keys(value);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            copy[key] = this.copy_any(field.children!['#'], value[key], as_json, id, modelpath+'.'+key)
        }
        return copy;
    }

    private copy_list(
        field: $BucketModelField,
        value: any,
        as_json: boolean,
        id: string,        // used for error reporting only
        modelpath: string   // used for error reporting only
    ): any[] {
        if (!Array.isArray(value)) throw this.error('corrupted_data', `Value '${value}' at '${modelpath}' should be a list, but it's a ${typeof value}`, id);
        const children: $BucketModelFields = {};

        const copy: any[] = Array(value.length);
        const keys = Object.keys(value);
        for (let i = 0; i < value.length; i++) {
            copy[i] = this.copy_any(field.children!['#'], value[i], as_json, id, modelpath+'.'+i);
        }
        return copy;
    }

    private copy_union(
        field: $BucketModelField,
        value: any,
        as_json: boolean,
        id: string,        // used for error reporting only
        modelpath: string   // used for error reporting only
    ): any {
        const keys = Object.keys(field.children!);
        const errors: Error[] = [];
        for (let i = 0; i < keys.length; i++) {
            const option = field.children![keys[i]];
            try {
                return this.copy_any(option, value, as_json, id, modelpath);
            }
            catch (e: any) {
                errors.push(e);
            }
        }
        throw this.error('corrupted_data', `Value '${value}' at '${modelpath}' doesn't match any of the union options. Errors: \n- ${errors.map(e => e.toString()).join('\n- ')}`, id);
    }

    private copy_any(
        field: $BucketModelField,
        value: any,
        as_json: boolean,
        id: string,        // used for error reporting only
        modelpath: string   // used for error reporting only
    ) {
        if (value == null) {
            if (field.required) {
                throw this.error('corrupted_data', `Value '${value}' at '${modelpath}' is undefined, but field is required, id`)
            }
            // Collapse null/undefined into undefined.
            return undefined;
        }

        if (field.type === 'obj') {
            return this.copy_obj(field, value, as_json, id, modelpath)
        }
        else if (field.type === 'dict') {
            return this.copy_dict(field, value, as_json, id, modelpath)
        }
        else if (field.type === 'list') {
            return this.copy_list(field, value, as_json, id, modelpath)
        }
        else if (field.type === 'union') {
            return this.copy_union(field, value, as_json, id, modelpath)
        }
        else {
            return this.copy_primitive(field, value, as_json, id, modelpath)
        }
    }

    public copy2(
        obj: Record<string, any>,
        as_json?: boolean,
        keys?: string[]
    ) {
        const out: Record<string, any> = {};
        keys ??= Object.keys(this.schema.fields);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const field = this.schema.fields[key];
            out[key] = this.copy_any(field, obj[key], !!as_json, obj.id, key);
        }
        return out
    }

    //

    private spread_obj(
        parent_field: $BucketModelField,
        parent_value: any,
        as_json: boolean,
        modelpath: string,
        i: number,
        id: string, // error only
    ) {
        if (typeof parent_value !== 'object') throw this.error('invalid_modelpath', `Value '${parent_value}' at '${modelpath}' should be an object, but it's a ${typeof parent_value}`);
        if (Array.isArray(parent_value)) throw this.error('invalid_modelpath', `Value '${parent_value}' at '${modelpath}' should be an object, but it's an array`);

        const next: Record<string, any> = {};
        const keys = Object.keys(parent_field.children!);
        for (let j = 0; j < keys.length; j++) {
            const key = keys[j];
            const field = parent_field.children![key];
            const value = parent_value[key];
            if (value == null)
                next[key] = undefined;
            else 
                next[key] = this.walk(id, field, value, modelpath, as_json, i+1);
        }
        return next;
    }

    private spread_dict(
        parent_field: $BucketModelField,
        parent_value: any,
        as_json: boolean,
        modelpath: string,
        i: number,
        id: string, // error only
    ) {
        if (typeof parent_value !== 'object') throw this.error('invalid_modelpath', `Value '${parent_value}' at '${modelpath}' should be a dictionary, but it's a ${typeof parent_value}`);
        if (Array.isArray(parent_value)) throw this.error('invalid_modelpath', `Value '${parent_value}' at '${modelpath}' should be a dictionary, but it's an array`);

        const field = parent_field.children!['#'];
        
        const next: Record<string, any> = {};
        const keys = Object.keys(parent_value);
        for (let j = 0; j < keys.length; j++) {
            const key = keys[j];
            const value = parent_value[key];
            if (value == null)
                next[key] = undefined;
            else 
                next[key] = this.walk(id, field, value, modelpath, as_json, i+1);
        }
        return next;
    }

    private spread_list(
        parent_field: $BucketModelField,
        parent_value: any,
        as_json: boolean,
        modelpath: string,
        i: number,
        id: string, // error only
    ) {
        if (!Array.isArray(parent_value)) throw this.error('invalid_modelpath', `Value '${parent_value}' at '${modelpath}' should be a list, but it's a ${typeof parent_value}`);

        const field = parent_field.children!['#'];
        const next = Array(parent_value.length);
        for (let j = 0; j < parent_value.length; j++) {
            const child = parent_value[j];
            if (child == null)
                next[j] = undefined;
            else 
                next[j] = this.walk(id, field, child, modelpath, as_json, i+1)
        }
        return next;
    }

    private spread_union(
        parent_field: $BucketModelField,
        parent_value: any,
        as_json: boolean,
        modelpath: string,
        i: number,
        id: string, // error only
    ) {
        if (!Array.isArray(parent_value)) throw this.error('invalid_modelpath', `Value '${parent_value}' at '${modelpath}' should be a list, but it's a ${typeof parent_value}`);

        let next: any = undefined;
        const errors: Error[] = [];
        const keys = Object.keys(parent_field.children!);
        for (let j = 0; j < keys.length; j++) {
            const option = parent_field.children![keys[j]];
            try {
                next = this.spread_any(option, parent_value, as_json, modelpath, i, id);
                return next;
            }
            catch (e: any) {
                errors.push(e);
            }
        }
        throw this.error('invalid_modelpath', `Value '${parent_value}' at '${modelpath}' doesn't match any of the union options. Errors: \n- ${errors.map(e => e.toString()).join('\n- ')}`);
    }

    private spread_any(
        parent_field: $BucketModelField,
        parent_value: any,
        as_json: boolean,
        modelpath: string,
        i: number,
        id: string, // error only
    ) {
        if (parent_field.type === 'obj') {
            return this.spread_obj(parent_field, parent_value, as_json, modelpath, i, id);
        }
        else if (parent_field.type === 'dict') {
            return this.spread_dict(parent_field, parent_value, as_json, modelpath, i, id)
        }
        else if (parent_field.type === 'list') {
            return this.spread_list(parent_field, parent_value, as_json, modelpath, i, id);
        }
        else if (parent_field.type === 'union') {
            return this.spread_union(parent_field, parent_value, as_json, modelpath, i, id);
        }
    }

    private is_spreadable(
        field: $BucketModelField
    ) {
        if (field.type === 'obj') return true;
        if (field.type === 'dict') return true;
        if (field.type === 'list') return true;
        if (field.type === 'union') {
            const keys = Object.keys(field.children!);
            for (let i = 0; i < keys.length; i++) {
                if (this.is_spreadable(field.children![keys[i]]))
                    return true;
            }
        }
        return false;
    }

    private walk(
        id: string,
        parent_field: $BucketModelField | undefined,
        parent_value: Record<string, any>,
        modelpath: string,
        as_json: boolean,
        i0: number = 0,
    ): any {
        if (parent_value == null) {
            return undefined;   
        }

        let key;
        let final = false;
        let i = i0;
        for (; i < modelpath.length; i++) {
            if (modelpath[i] === '.') {
                key = modelpath.slice(i0, i);
                break;
            }
        }
        if (!key) {
            key = modelpath.slice(i0);
            final = true;
        }

        if (key === '*') {
            if (!parent_field)
                throw this.error('invalid_modelpath', `Modelpath '${modelpath.slice(0,i)}' attempts to spread the model's root, which is not allowed.`);

            const is_spreadable = this.is_spreadable(parent_field);
            if (!is_spreadable) {
                throw this.error('invalid_modelpath', `Modelpath '${modelpath.slice(0,i)}' attempts to spread a non-spreadable field ${parent_field.type}.`);
            }

            if (final)
                return this.copy_any(parent_field, parent_value, as_json, id, modelpath.slice(0,i));
            else
                return this.spread_any(parent_field, parent_value, as_json, modelpath, i, id);
        }
        else {
            // const fields = parent?.children ?? this.schema.fields;
            // const field = fields[key] ?? fields['#'];
            let field;
            if (!parent_field)
                field = this.schema.fields[key];
            else if (parent_field.type === 'obj')
                field = parent_field.children![key];
            else if (parent_field.type === 'dict')
                field = parent_field.children!['#'];
            else if (parent_field.type === 'list') {
                field = parent_field.children!['#'];
                if (Number.isNaN(parseInt(key))) {
                    throw this.error('invalid_modelpath', `Modelpath '${modelpath.slice(0,i)}' attempts to read a list property with a non-integer key.`)
                }
            }
            else if (parent_field.type === 'union') {
                field = parent_field;
            }
            else {
                throw this.error('invalid_modelpath', `Modelpath '${modelpath.slice(0,i)}' attempts to read a property from a non-object (${parent_field.type}) field.`);
            }

            if (!field) throw this.error('invalid_modelpath', `Modelpath '${modelpath.slice(0,i)}' doesn't resolve to a model field`);
    
            const next = parent_value[key];
            if (next == null) return undefined;

            if (final)
                return this.copy_any(field, next, as_json, id, modelpath.slice(0,i));
            else
                return this.walk(id, field, next, modelpath, as_json, i+1)
        }

    }


    public get(
        obj: Record<string, any>,
        modelpath: string,
        as_json: boolean = false
    ): BucketModelGetResponse {
        return this.walk(obj.id, undefined, obj, modelpath, as_json);
    }

    // const a = {
    //     a: [
    //         { x: 0, y: 0},
    //         undefined,
    //         { x: 1, y: 0},
    //     ]
    // }

    // 'a.*.x' = [0, undefined, 1]

    // const a = {
    //     a: {
    //         i: { x: 0, y: 0},
    //         j: undefined,
    //         k: { x: 1, y: 0},
    //     ]}
    // }

    // 'a.*.x' = { i: 0, j: undefined, k: 1 }

    

    // const a = {
    //     a: [
    //         { x: { i:[0,10], j:undefined, k:[2,12] }, y: { i:[3,13], j:[4,14], k:undefined } },
    //         undefined,
    //         { x: { i:undefined, j:[7,17], k:[8,18] }, y: { i:[9,19], j:undefined, k:[11,21] } },
    //     ]
    // }

    // 'a.*.x.*.1' = [ { i: 10, j: undefined, k: 12}, undefined, {} ]



    // The modelpath below doesn't support $ parts,
    // these should have been replaced before calling this method.

    public copy<T extends Record<string, any>>(
        obj: T,
        op: 'save' | 'load',
        serialize?: boolean,
        roots?: string[]
    ): T;
    public copy<T extends Record<string, any>>(
        obj: T,
        op: 'save' | 'load',
        serialize?: boolean,
        modelpath?: string
    ): {
        value: any,
        index: string[]
    }[];
    public copy<T extends Record<string, any>>(
        obj: T,
        op: 'save' | 'load',
        serialize?: boolean,
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

        const meta_as_json = serialize;

        const created_at = obj[meta.created_at];
        if (typeof created_at === 'string') {
            copy[meta.created_at] = meta_as_json ? created_at : NesoiDatetime.fromISO(created_at);
        }
        else if (created_at instanceof NesoiDatetime) {
            copy[meta.created_at] = meta_as_json ? created_at.toISO() : created_at
        }

        const updated_at = obj[meta.updated_at];
        if (typeof updated_at === 'string') {
            copy[meta.updated_at] = meta_as_json ? updated_at : NesoiDatetime.fromISO(updated_at);
        }
        else if (updated_at instanceof NesoiDatetime) {
            copy[meta.updated_at] = meta_as_json ? updated_at.toISO() : updated_at
        }

        if (paths) return modelpath_results as never;
        return copy as never;
    }

    public copyMany<T extends Record<string, any>>(
        objs: T[],
        op: 'save' | 'load',
        serialize?: boolean,
        roots?: string[]
    ): T[] {
        const out: T[] = [];
        for (const obj of objs) {
            out.push(this.copy(obj, op, serialize, roots));
        }
        return out;
    }

    private runCopyCmdPoll(
        op: 'save' | 'load',
        poll: BucketModelCopyCmd[],
        modelpath?: string[],
        serialize?: boolean
    ) {
        const modelpath_results: {
            value: any,
            index: string[]
        }[] = [];

        while (poll.length) {
            const next: typeof poll = [];
            for (const cmd of poll) {

                const isLeafPath = cmd.modelpath
                    ? cmd.modelpath.i === (modelpath?.length ?? 0) - 1
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
                        catch (e: any) {
                            unionErrors.push(e);
                        }
                    }
                    if (unionErrors.length) {
                        throw NesoiError.Message.ValueDoesntMatchUnion({ alias: cmd.field.alias, path: cmd.field.path, value: cmd.obj[cmd.key], unionErrors });
                    }
                }
                else {
                    const as_json = serialize;
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
        op: 'save' | 'load',
        cmd: BucketModelCopyCmd,
        modelpath?: string[],
        as_json = false
    ) {
        const next: BucketModelCopyCmd[] = [];

        const value = cmd.obj[cmd.key];
        if (value === undefined || value === null) {
            if (cmd.field.path !== 'id' && cmd.field.required) {
                throw NesoiError.Bucket.Model.FieldRequired({ bucket: this.alias, field: cmd.field.path, indexes: cmd.modelpath?.asterisk_values })
            }
            if (cmd.field.defaultValue) {
                cmd.copy[cmd.key] = cmd.field.defaultValue;
            }
            else {
                delete cmd.copy[cmd.key];
            }
            return [];
        }

        const isLeafPath = cmd.modelpath
            ? cmd.modelpath.i === (modelpath?.length ?? 0) - 1
            : false;

        const nextPath = (!cmd.modelpath || isLeafPath)
            ? undefined
            : modelpath![cmd.modelpath!.i + 1];

        const addChildrenToQueue = !cmd.modelpath
            || cmd.modelpath.i >= (modelpath!.length - 1) // is leaf or inner field
            || nextPath === '*';

        if (cmd.field.type === 'list') {
            if (!Array.isArray(value)) {
                throw NesoiError.Message.InvalidFieldType({ alias: cmd.field.alias, path: cmd.field.path, value, type: 'list' });
            }
            cmd.copy[cmd.key] = [];
            // Leaf path or no modelpath = add entire list to queue
            if (addChildrenToQueue) {
                next.push(...value.map((_, i) => ({
                    key: i.toString(),
                    obj: value,
                    copy: cmd.copy[cmd.key],
                    field: cmd.field.children!['#'],
                    depth: cmd.depth + 1,
                    modelpath: cmd.modelpath ? {
                        i: cmd.modelpath.i + 1,
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
                    depth: cmd.depth + 1,
                    modelpath: cmd.modelpath ? {
                        i: cmd.modelpath.i + 1,
                        asterisk_values: cmd.modelpath.asterisk_values
                    } : undefined
                })
            }
            return next;
        }
        else if (cmd.field.type === 'dict') {
            if (typeof value !== 'object' || Array.isArray(value)) {
                throw NesoiError.Message.InvalidFieldType({ alias: cmd.field.alias, path: cmd.field.path, value, type: 'dict' });
            }
            cmd.copy[cmd.key] = {};
            // Leaf path or no modelpath = add entire dict to queue
            if (addChildrenToQueue) {
                next.push(...Object.keys(value).map((key) => ({
                    key,
                    obj: value,
                    copy: cmd.copy[cmd.key],
                    field: cmd.field.children!['#'],
                    depth: cmd.depth + 1,
                    modelpath: cmd.modelpath ? {
                        i: cmd.modelpath.i + 1,
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
                    depth: cmd.depth + 1,
                    modelpath: cmd.modelpath ? {
                        i: cmd.modelpath.i + 1,
                        asterisk_values: cmd.modelpath.asterisk_values
                    } : undefined
                })
            }
            return next;
        }
        else if (cmd.field.type === 'obj') {
            if (typeof value !== 'object' || Array.isArray(value)) {
                throw NesoiError.Message.InvalidFieldType({ alias: cmd.field.alias, path: cmd.field.path, value, type: 'obj' });
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
                    depth: cmd.depth + 1,
                    modelpath: cmd.modelpath ? {
                        i: cmd.modelpath.i + 1,
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
                    depth: cmd.depth + 1,
                    modelpath: cmd.modelpath ? {
                        i: cmd.modelpath.i + 1,
                        asterisk_values: cmd.modelpath.asterisk_values
                    } : undefined
                })
            }
            return next;
        }
        else if (cmd.field.type === 'enum') {
            if (typeof value !== 'string') {
                throw NesoiError.Message.InvalidFieldType({ alias: cmd.field.alias, path: cmd.field.path, value, type: 'obj' });
            }
            const options = cmd.field.meta!.enum!.options
            if (!(value in options)) {
                throw NesoiError.Bucket.Model.InvalidEnum({ bucket: this.alias, value, options: Object.keys(options) })
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
                throw NesoiError.Message.InvalidFieldType({ alias: cmd.field.alias, path: cmd.field.path, value, type: 'date' });
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
                throw NesoiError.Message.InvalidFieldType({ alias: cmd.field.alias, path: cmd.field.path, value, type: 'datetime' });
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
                throw NesoiError.Message.InvalidFieldType({ alias: cmd.field.alias, path: cmd.field.path, value, type: 'decimal' });
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
                throw NesoiError.Message.InvalidFieldType({ alias: cmd.field.alias, path: cmd.field.path, value, type: 'decimal' });
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


    public static serializeAny(value: any) {

        const target: Record<string, any> = {};
        const queue: {
            target: Record<string, any>,
            key: string | number,
            val: any
        }[] = [{
            target,
            key: '#',
            val: value
        }];

        while (queue.length) {
            const node = queue.shift()!;

            if (Array.isArray(node.val)) {
                node.target[node.key] = [];
                queue.push(...node.val.map((val, i) => ({
                    target: node.target[node.key],
                    key: i,
                    val
                })))
            }
            else if (typeof node.val === 'object') {
                if (node.val instanceof NesoiDatetime) {
                    node.target[node.key] = node.val.toISO();
                    continue;
                }
                if (node.val instanceof NesoiDate) {
                    node.target[node.key] = node.val.toISO();
                    continue;
                }
                if (node.val instanceof NesoiDuration) {
                    node.target[node.key] = node.val.toString();
                    continue;
                }
                if (node.val instanceof NesoiDecimal) {
                    node.target[node.key] = node.val.toString();
                    continue;
                }
                node.target[node.key] = {};
                queue.push(...Object.entries(node.val).map(([key, val]) => ({
                    target: node.target[node.key],
                    key,
                    val
                })))
            }
            else {
                node.target[node.key] = node.val;
            }
        }

        return target['#'];
    }
}
