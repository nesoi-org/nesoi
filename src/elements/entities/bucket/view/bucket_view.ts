import type { BucketAdapterConfig } from '../adapters/bucket_adapter';

import type { AnyTrxNode} from '~/engine/transaction/trx_node';
import { TrxNode } from '~/engine/transaction/trx_node';
import { Daemon } from '~/engine/daemon';
import { BucketModel } from '../model/bucket_model';
import _Promise from '~/engine/util/promise';
import { BucketQuery } from '../query/bucket_query';
import type { $BucketView, $Bucket, NesoiObj, $BucketViewFields, $BucketViewField, $BucketViewFieldOp } from 'index';

type FieldData = {
    i?: number,
    j?: number,
    value: any,
    branch: Record<string, any>[]
    model_index: (string|number)[],
}

type OpData = {
    i?: number,
    j?: number | string,
    value: any,
}
& ({
    branch: Record<string, any>[]
} | {
    branches: Record<string, any>[][]
})
& ({
    model_index: (string|number)[],
} | {
    model_indexes: (string|number)[][],
})

/**
 * @category Elements
 * @subcategory Entity
 * */
export class BucketView<$ extends $BucketView> {

    constructor(
        private bucket: $Bucket,
        private config: BucketAdapterConfig,
        public schema: $
    ) {
        
    }

    public async parse<Obj extends NesoiObj>(
        trx: AnyTrxNode,
        obj: Obj,
        flags: {
            serialize?: boolean
        } = {}
    ): Promise<$['#data']> {  
        const model = new BucketModel(this.bucket, this.config);
        
        const output = await this.runView(trx, model, {
            name: this.schema.name,
            fields: this.schema.fields
        }, [{
            value: obj,
            branch: [obj],
            model_index: []
        }], flags);

        return output[0];
    }

    public async parseMany<Obj extends NesoiObj>(
        trx: AnyTrxNode,
        roots: Obj[],
        flags: {
            serialize?: boolean
        } = {}
    ): Promise<$['#data']> {        
        const model = new BucketModel(this.bucket, this.config);
        
        const field_data: FieldData[] = [];
        for (let i = 0; i < roots.length; i++) {
            field_data.push({
                value: roots[i],
                branch: [roots[i]],
                model_index: []
            });
        }
        const output = await this.runView(trx, model, {
            name: this.schema.name,
            fields: this.schema.fields
        }, field_data, flags);
        return output;
    }

    private async runView(
        trx: AnyTrxNode,
        model: BucketModel<any, any>,
        view: {
            name?: string,
            fields: $BucketViewFields
        },
        data: FieldData[],
        flags: {
            serialize?: boolean
        } = {}
    ): Promise<Record<string, any>[]> {
        
        const targets: Record<string, any>[] = Array
            .from({ length: data.length })
            .map(() => ({}));

        for (const key in view.fields) {
            const field = view.fields[key];

            let op_data: any[];

            // Parse field values across entries
            if (field.type === 'model') {
                op_data = await this.parseModelField(trx, model, field, data, flags);
            }
            else if (field.type === 'computed') {
                op_data = await this.parseComputedField(trx, model, field, data, flags);
            }
            else if (field.type === 'query') {
                op_data = await this.parseQueryField(trx, model, field, data, flags);
            }
            else if (field.type === 'view') {
                op_data = await this.parseViewField(trx, model, field, data, flags);
            }
            else if (field.type === 'drive') {
                op_data = await this.parseDriveField(trx, field, data, flags);
            }
            else if (field.type === 'inject') {
                op_data = await this.parseInjectField(trx, model, field, data, flags);
            }
            else {
                throw new Error(`Unknown field type '${field.type}'`)
            }

            // Apply operations
            let output;
            if (field.ops.length) {
                output = await this.runOpChain(field.ops, trx, model, field, data, op_data, flags)
            }
            else {
                output = op_data.map(d => d.value)
            }


            // Assign to objects
            for (let i = 0; i < output.length; i++) {
                const out = output[i];
                if (field.type === 'inject') {
                    Object.assign(targets[i], out);
                }
                else {
                    targets[i][field.name] = out;
                }
            }
        }

        if (view.name) {
            for (let i = 0; i < targets.length; i++) {
                targets[i].id = data[i].branch.at(-1)!.id;
                targets[i].$v = view.name;
            }
        }

        return targets;
    }

    // Fields

    private async parseModelField(
        trx: AnyTrxNode,
        model: BucketModel<any, any>,
        field: $BucketViewField,
        data: FieldData[],
        flags: {
            serialize?: boolean
        } = {}
    ): Promise<OpData[]> {
        const meta = field.meta.model!;
        const op_data: OpData[] = [];

        for (const entry of data) {
            let modelpath = meta.path;
            for (let i = 0; i < entry.model_index.length; i++) {
                modelpath = modelpath.replace(new RegExp('\\$'+i, 'g'), entry.model_index[i].toString());
            }
            if (modelpath === '__root') {
                op_data.push({
                    value: entry.branch[0],
                    branch: entry.branch,
                    model_index: entry.model_index
                })
                continue;
            }
            else if (modelpath === '__current') {
                op_data.push({
                    value: entry.branch.at(-1),
                    branch: entry.branch,
                    model_index: entry.model_index
                })
                continue;
            }
            else if (modelpath === '__value') {
                op_data.push({
                    value: entry.value,
                    branch: entry.branch,
                    model_index: entry.model_index
                })
                continue;
            }

            const current = entry.branch.at(-1)!;
            const extracted = model.copy(current, 'save', flags.serialize, modelpath);

            const root_map = meta.path.endsWith('.*');

            // Modelpath contains spread, so extracted returns a list of values
            if (meta.path.includes('.*')) {
                op_data.push({
                    value: extracted.map(e => e.value),
                    branch: entry.branch,
                    model_indexes: extracted.map(e =>
                        [...entry.model_index, ...e.index].slice(0, root_map ? -1 : undefined)
                    )
                });
            }
            // Modelpath doesn't spread, so extracted returns a single value
            else {
                const value = extracted[0]?.value;
                op_data.push({
                    value,
                    branch: entry.branch,
                    model_index: entry.model_index.slice(0, root_map ? -1 : undefined)
                });
            }
        }

        return op_data;
    }

    private async parseComputedField(
        trx: AnyTrxNode,
        model: BucketModel<any, any>,
        field: $BucketViewField,
        data: FieldData[],
        flags: {
            serialize?: boolean
        } = {}
    ): Promise<OpData[]> {
        const meta = field.meta.computed!;
        const op_data: OpData[] = [];

        for (const entry of data) {
            const value = await _Promise.solve(meta.fn({
                trx,
                bucket: model.bucket,
                root: ('branch' in entry) ? entry.branch?.at(0) : undefined,
                current: ('branch' in entry) ? entry.branch?.at(-1) : undefined,
                value: entry.value,
                graph: {
                    branch: entry.branch,
                    model_index: entry.model_index
                },
                flags: { serialize: !!flags.serialize }
            }));
            op_data.push({
                value,
                branch: entry.branch,
                model_index: entry.model_index
            });
        }

        return op_data;
    }

    private async parseQueryField(
        trx: AnyTrxNode,
        model: BucketModel<any, any>,
        field: $BucketViewField,
        data: FieldData[],
        flags: {
            serialize?: boolean
        } = {}
    ): Promise<OpData[]> {
        const meta = field.meta.query!;

        let tag;
        let many = true;
        let query;
        let params;
        if ('link' in meta) {
            const link = model.bucket.graph.links[meta.link];
            if (!link) {
                throw new Error(`Link '${meta.link}' not found on bucket '${model.bucket.name}'`);
            }
            tag = link.bucket;
            many = link.many;
            query = link.query;
            params = data.map(obj => obj.branch.at(0)!);
        }
        else {
            tag = meta.bucket;
            many = meta.many;
            query = meta.query;
            params = data.map(obj => meta.params({
                trx,
                bucket: model.bucket,
                root: obj.branch.at(0)!,
                current: obj.branch.at(-1)!,
                value: obj.value,
                graph: {
                    branch: obj.branch,
                    model_index: obj.model_index,
                },
                flags: { serialize: !!flags?.serialize }
            }));
        }
        
        const results = await BucketQuery.run_multi(trx, tag, query, params);

        if (meta.view) {
            const module = TrxNode.getModule(trx);
            const bucket_ref = await Daemon.getBucketReference(module.name, module.daemon!, tag);
            const field_view = bucket_ref.schema.views[meta.view];
            if (!field_view) {
                throw new Error(`View '${field_view}' not found on bucket '${bucket_ref.schema.module}::${bucket_ref.schema.name}'`);
            }

            const subview_data: FieldData[] = [];
            for (let i = 0; i < results.length; i++) {
                for (let j = 0; j < results[i].length; j++) {
                    const value = results[i][j];
                    subview_data.push({
                        i, j,
                        value,
                        branch: [value],
                        model_index: []
                    })
                }
            }

            const submodel = new BucketModel(bucket_ref.schema);
            const subview_results = await this.runView(trx, submodel, {
                name: field_view.name,
                fields: field_view.fields
            }, subview_data);

            for (let k = 0; k < subview_results.length; k++) {
                const sdata = subview_data[k];
                results[sdata.i!][sdata.j!] = subview_results[k];
            }
        }

        const op_data: OpData[] = [];
        for (let i = 0; i < data.length; i++) {
            const value = results[i];
            if (many) {
                op_data.push({
                    value,
                    branches: value.map((v, j) =>
                        [...data[i].branch, value[j]]
                    ),
                    model_index: data[i].model_index
                })
            }
            else {
                op_data.push({
                    value: value[0],
                    branch: [...data[i].branch, value[0]],
                    model_index: data[i].model_index
                })
            }
        }

        return op_data;
    }

    private async parseViewField(
        trx: AnyTrxNode,
        model: BucketModel<any, any>,
        field: $BucketViewField,
        data: FieldData[],
        flags: {
            serialize?: boolean
        } = {}
    ): Promise<OpData[]> {
        const meta = field.meta.view!;
        const op_data: OpData[] = [];

        const view = this.bucket.views[meta.view];
        if (!view) {
            throw `View ${meta.view} not found on bucket ${this.bucket.name}`;
        }

        const view_data: FieldData[] = [];
        for (let i = 0; i < data.length; i++) {
            const value = data[i].branch;
            view_data.push({
                value,
                branch: [value],
                model_index: []
            })
        }
        const results = await this.runView(trx, model, view, view_data, flags);


        for (let i = 0; i < data.length; i++) {
            const entry = data[i];
            const value = results[i];
            op_data.push({
                value,
                branch: entry.branch,
                model_index: entry.model_index
            })
        }

        return op_data;
    }

    private async parseDriveField(
        trx: AnyTrxNode,
        field: $BucketViewField,
        data: FieldData[],
        flags: {
            serialize?: boolean
        } = {}
    ): Promise<OpData[]> {
        // const meta = field.meta.drive!;

        // const module = TrxNode.getModule(trx);
        // const drive = await Daemon.getBucketDrive(module.daemon!, this.bucket.tag);

        // if (!drive) {
        //     throw NesoiError.Bucket.Drive.NoAdapter({ bucket: node.bucket.schema.alias });
        // }
        // const meta = node.field.meta.drive!;
        // for (const entry of node.data) {
        //     const value = Tree.get(entry.parent, meta.path);
        //     if (Array.isArray(value)) {
        //         const public_urls: string[] = [];
        //         for (const obj of value) {
        //             public_urls.push(await drive.public(obj));
        //         }
        //         entry.target[entry.key] = public_urls;
        //     }
        //     else {
        //         entry.target[entry.key] = await drive.public(value);
        //     }
        // }
        return []
    }

    private async parseInjectField(
        trx: AnyTrxNode,
        model: BucketModel<any, any>,
        field: $BucketViewField,
        data: FieldData[],
        flags: {
            serialize?: boolean
        } = {}
    ): Promise<OpData[]> {
        const meta = field.meta.inject!;
        const op_data: OpData[] = [];

        for (let i = 0; i < data.length; i++) {
            const entry = data[i];
            let value;
            if (meta.path === 'value') {
                value = entry.value;
                if (flags.serialize) {
                    // WARN: this serialization doesn't validate neither handles required/default values
                    value = BucketModel.serializeAny(value)
                }
            }
            else if (meta.path === 0 || meta.path === -1) {
                value = entry.branch.at(meta.path)!;
                if (flags.serialize) {
                    value = model.copy(value, 'save', true)
                }
            }
            else {
                if (flags.serialize) {
                    // WARN: this serialization doesn't validate neither handles required/default values
                    value = BucketModel.serializeAny(value)
                }
            }
            op_data.push({
                value,
                branch: entry.branch,
                model_index: entry.model_index
            })
        }

        return op_data;
    }


    private async runOpChain(
        ops: $BucketViewFieldOp[],
        trx: AnyTrxNode,
        model: BucketModel<any, any>,
        field: $BucketViewField,
        parent_data: FieldData[],
        data: OpData[],
        flags: {
            serialize?: boolean
        } = {}
    ): Promise<any[]> {
        
        for (let i = 0; i < ops.length; i++) {
            const op = ops[i];

            if (op.type === 'map') {
                await this.applyMapOp(op, trx, model, field, parent_data, data, flags);
            }
            else if (op.type === 'prop') {
                await this.applyPropOp(op, data);
            }
            else if (op.type === 'list') {
                await this.applyListOp(op, data);
            }
            else if (op.type === 'dict') {
                await this.applyDictOp(op, data);
            }
            else if (op.type === 'group') {
                await this.applyGroupOp(op, data);
            }
            else if (op.type === 'transform') {
                await this.applyTransformOp(trx, model, op, data, flags);
            }
            else if (op.type === 'subview') {
                await this.applySubviewOp(trx, model, op, parent_data, data, flags);
            }
        }

        return data.map(d => d.value);
    }


    // Map

    private async applyMapOp(
        op: Extract<$BucketViewFieldOp, {type: 'map'}>,
        trx: AnyTrxNode,
        model: BucketModel<any, any>,
        field: $BucketViewField,
        parent_data: FieldData[],
        data: OpData[],
        flags: {
            serialize?: boolean
        } = {}
    ) {

        // Each entry of `data` is assumed to be a list, which we must flatten in order
        // to avoid running a same field multiple times.
        // However we need to keep track of how many items each answer requires, in order
        // to assemble them together.

        const map_data: OpData[] = [];

        for (let i = 0; i < data.length; i++) {
            const entry = data[i];
            if (typeof entry.value !== 'object') {
                throw new Error(`Map operation expected object/array value, found ${typeof entry.value}`);
            }
            if (Array.isArray(entry.value)) {
                for (let j = 0; j < entry.value.length; j++) {
                    map_data.push({
                        i, j,
                        value: entry.value[j],
                        branch: ('branches' in entry)
                            ? entry.branches[j]
                            : entry.branch,
                        model_index: ('model_indexes' in entry)
                            ? [...entry.model_indexes[j], j]    // Each item of the list has a different index
                            : [...entry.model_index, j]         // All items of the list have the same index
                    })
                }
            }
            else {
                const keys = Object.keys(entry.value);
                for (let j = 0; j < keys.length; j++) {
                    map_data.push({
                        i, j: keys[j],
                        value: entry.value[keys[j]],
                        branch: ('branches' in entry)
                            ? entry.branches[j]
                            : entry.branch,
                        model_index: ('model_indexes' in entry)
                            ? [...entry.model_indexes[j], keys[j]]    // Each item of the list has a different index
                            : [...entry.model_index, keys[j]]         // All items of the list have the same index
                    })
                }
            }
        }

        // Run all entries at once
        const op_out = await this.runOpChain(op.ops, trx, model, field, parent_data, map_data, flags);

        // Distribute values
        for (let k = 0; k < map_data.length; k++) {
            const entry = map_data[k];
            const out = op_out[k];
            data[entry.i!].value[entry.j!] = out;
        }
    }

    // Ops

    private async applyPropOp(
        op: Extract<$BucketViewFieldOp, {type: 'prop'}>,
        data: OpData[],
    ) {
        for (let i = 0; i < data.length; i++) {
            const entry = data[i];
            if (typeof entry.value !== 'object') {
                throw new Error(`Prop operation expected object/array value, found ${typeof entry.value}`);
            }
            else {
                entry.value = entry.value?.[op.prop];
            }
        }
    }

    private async applyListOp(
        op: Extract<$BucketViewFieldOp, {type: 'list'}>,
        data: OpData[],
    ) {
        for (let i = 0; i < data.length; i++) {
            const entry = data[i];
            if (typeof entry.value !== 'object') {
                throw new Error(`List operation expected object value, found ${typeof entry.value}`);
            }
            else {
                entry.value = Object.values(entry.value);
            }
        }
    }

    private async applyDictOp(
        op: Extract<$BucketViewFieldOp, {type: 'dict'}>,
        data: OpData[],
    ) {
        for (let i = 0; i < data.length; i++) {
            const entry = data[i];
            if (!Array.isArray(entry.value)) {
                throw new Error(`Dict operation expected array value, found ${typeof entry.value}`);
            }
            else {
                const dict: {
                    [key: string]: any[]
                } = {};
                for (let j = 0; j < entry.value.length; j++) {
                    const val: any = entry.value[j];
                    if (op.key && typeof val !== 'object') {
                        throw new Error('Dict operation with explicit key expected array/object value item');
                    }
                    const key = op.key ? val[op.key] : j;
                    dict[key] = val;
                }
                entry.value = dict;
            }
        }
    }

    private async applyGroupOp(
        op: Extract<$BucketViewFieldOp, {type: 'group'}>,
        data: OpData[],
    ) {
        for (let i = 0; i < data.length; i++) {
            const entry = data[i];
            if (!Array.isArray(entry.value)) {
                throw new Error('Group operation expected array value');
            }
            else {
                const groups: {
                    [group: string]: any[]
                } = {};
                for (let j = 0; j < entry.value.length; j++) {
                    const val: any = entry.value[j];
                    if (typeof val !== 'object'){
                        // entry.value = null;
                        throw new Error('Group operation expected array/object value item');
                    }
                    const group = val[op.key];
                    groups[group] ??= [];
                    groups[group].push(val);
                }
                entry.value = groups;
            }
        }
    }

    private async applyTransformOp(
        trx: AnyTrxNode,
        model: BucketModel<any, any>,
        op: Extract<$BucketViewFieldOp, {type: 'transform'}>,
        data: OpData[],
        flags: {
            serialize?: boolean
        } = {}
    ) {
        for (let i = 0; i < data.length; i++) {
            const entry = data[i];
            entry.value = await _Promise.solve(op.fn({
                trx,
                bucket: model.bucket,
                root: ('branch' in entry) ? entry.branch?.at(0) : undefined,
                current: ('branch' in entry) ? entry.branch?.at(-1) : undefined,
                value: entry.value,
                graph: {
                    branch: (entry as any).branch,
                    branches: (entry as any).branches,
                    model_index: (entry as any).model_index,
                    model_indexes: (entry as any).model_indexes,
                } as any,
                flags: { serialize: !!flags.serialize }
            }));
        }
    }

    private async applySubviewOp(
        trx: AnyTrxNode,
        model: BucketModel<any, any>,
        op: Extract<$BucketViewFieldOp, {type: 'subview'}>,
        parent_data: FieldData[],
        data: OpData[],
        flags: {
            serialize?: boolean
        } = {}
    ) {        
        const field_data: FieldData[] = data.map((entry, i) => ({
            value: entry.value,
            branch: ('branch' in entry)
                ? entry.branch
                : parent_data[entry.i ?? i].branch,
            model_index: ('model_index' in entry)
                ? entry.model_index
                : parent_data[entry.i ?? i].model_index,
        }));

        const out = await this.runView(trx, model, {
            fields: op.children
        }, field_data, flags);

        for (let i = 0; i < data.length; i++) {
            data[i].value = out[i];
        }
    }


}