import { NesoiObj } from '~/engine/data/obj';
import { Bucket } from '../bucket';
import { $BucketView, $BucketViewField } from './bucket_view.schema';
import { AnyTrxNode, TrxNode } from '~/engine/transaction/trx_node';
import _Promise from '~/engine/util/promise';
import { NesoiError } from '~/engine/data/error';
import { Tree } from '~/engine/data/tree';
import { $Bucket } from '../bucket.schema';
import { Daemon } from '~/engine/daemon';
import { BucketMetadata } from '~/engine/transaction/trx_engine';
import { Tag } from '~/engine/dependency';

type ViewNode = {
    bucket: BucketMetadata,
    field: $BucketViewField,
    data: {
        raw: Record<string, any>
        value: Record<string, any>
        index: (string|number)[]
        target: Record<string, any>
    }[]
}
type ViewLayer = ViewNode[]

class ViewValue {
    public value = undefined
    constructor() {}
}

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
        raw: Obj,
        flags?: {
            nesoi_serial: boolean
        }
    ): Promise<$['#data']> {  

        const module = TrxNode.getModule(trx);
        const tag = new Tag(this.bucket.module.name, 'bucket', this.bucket.schema.name)
        const meta = await Daemon.getBucketMetadata(module.daemon!, tag);

        const parsed: Record<string, any> = {};
        if ('__raw' in this.schema.fields) {
            Object.assign(parsed, raw);
        }

        let layer: ViewLayer = Object.values(this.schema.fields).map(field => ({
            bucket: meta,
            field,
            data: [{
                raw,
                value: raw,
                index: [],
                target: parsed
            }]
        }))
        
        while (layer.length) {
            layer = await this.parseLayer(trx, layer, flags);
        }

        parsed['$v'] = this.schema.name;
        return {
            id: raw.id,
            ...parsed
        };
    }

    public async parseMany<Obj extends NesoiObj>(
        trx: AnyTrxNode,
        raws: Obj[],
        flags?: {
            nesoi_serial: boolean
        }
    ): Promise<$['#data']> {  

        const module = TrxNode.getModule(trx);
        const tag = new Tag(this.bucket.module.name, 'bucket', this.bucket.schema.name)
        const meta = await Daemon.getBucketMetadata(module.daemon!, tag);

        const parseds: Record<string, any>[] = [];
        for (const raw of raws) {
            const parsed: Record<string, any> = {};
            if ('__raw' in this.schema.fields) {
                Object.assign(parsed, raw);
            }
            parseds.push(parsed);
        }

        let layer: ViewLayer = Object.values(this.schema.fields).map(field => ({
            bucket: meta,
            field,
            data: raws.map((raw,i) => ({
                raw,
                value: raw,
                index: [],
                target: parseds[i]
            }))
        }))
        
        while (layer.length) {
            layer = await this.parseLayer(trx, layer, flags);
        }

        for (let i = 0; i < raws.length; i++) {
            parseds[i].id = raws[i].id;
            parseds[i]['$v'] = this.schema.name;
        }
        return parseds;
    }

    private async parseLayer(trx: AnyTrxNode, layer: ViewLayer, flags?: {
        nesoi_serial: boolean
    }) {
        
        const next: ViewLayer = [];

        // Model props
        for (const node of layer) {
            if (node.field.scope !== 'model') continue;
            next.push(...this.parseModelProp(node, flags));
            
        }
        // Computed props
        for (const node of layer) {
            if (node.field.scope !== 'computed') continue;
            await this.parseComputedProp(trx, node);
        }
        // Graph props
        for (const node of layer) {
            if (node.field.scope !== 'graph') continue;
            next.push(...await this.parseGraphProp(trx, node));
        }
        // Drive props
        for (const node of layer) {
            if (node.field.scope !== 'drive') continue;
            await this.parseDriveProp(trx, node);
        }
        // Group props
        for (const node of layer) {
            if (node.field.scope !== 'group') continue;
            if (!node.field.children) continue;
            if ('__raw' in node.field.children) {
                for (const d of node.data) {
                    d.target[node.field.name] = d.value;
                }
            }
            next.push(...Object.values(node.field.children).map(field => ({
                bucket: node.bucket,
                field,
                data: node.data
            })))
        }

        // Chains
        for (const node of layer) {
            if (!node.field.chain) continue;
            next.push({
                bucket: node.bucket,
                field: node.field.chain,
                data: node.data.map(d => ({
                    index: d.index,
                    target: d.target,
                    raw: d.raw,
                    value: d.target[node.field.name]
                }))
            })
        }

        return next;
    }

    /**
     * [model]
     * Read one property from 
     */
    private parseModelProp(node: ViewNode, flags?: {
        nesoi_serial: boolean
    }) {
        
        const initAs = (!node.field.children) ? 'value' : 'obj';
        const rawChild = '__raw' in (node.field.children || {})
        const nextData = this.doParseModelProp(node, initAs, rawChild, flags);

        if (!node.field.children) return [];

        const next: ViewLayer = [];
        // subview
        for (const key in node.field.children) {
            if (key === '__raw') continue;
            next.push({
                bucket: node.bucket,
                field: node.field.children![key],
                data: nextData
            })
        }
        return next;
    }

    private doParseModelProp(
        node: ViewNode,
        initAs: 'value'|'obj',
        rawChild: boolean,
        flags?: {
            nesoi_serial: boolean
        }
    ): ViewNode['data'] {
        const modelpath = node.field.meta!.model!.path;
        
        const isValueModel = modelpath === '.';
        const name = node.field.name;
        
        let poll: {
            index: (string | number)[];
            raw: Record<string, any>;
            value: Record<string, any>;
            target: Record<string, any>;
            key: string | number;
        }[] = node.data.map(d => ({
            ...d,
            value: isValueModel ? d.value : d.raw,
            key: name
        }));
        
        if (isValueModel) {
            for (const data of poll) {
                data.target[data.key] = data.value;
            }
        }
        else {
            const paths = modelpath.split('.')
            for (const path of paths) {
                // *
                if (path === '*') {
                    // Expand each value of the poll (assumed to be a dict or list)
                    poll = poll.map(item => {
                        if (typeof item.value !== 'object') {
                            throw new Error(`Failed to parse ${paths}, intermediate value ${item.value} is not a list or object`);
                        }
                        if (Array.isArray(item.value)) {
                            item.target[item.key] = initAs === 'value'
                                ? [...item.value]
                                : item.value.map(() => ({}));
    
                            return item.value.map((v, i) => ({
                                index: [...item.index, i],
                                raw: item.raw,
                                value: v,
                                target: item.target[item.key],
                                key: i
                            }))
                        }
                        else {
                            item.target[item.key] = initAs === 'value'
                                ? {...item.value}
                                : Object.fromEntries(Object.entries(item.value).map(([k]) => [k,{}]));
                                
                            return Object.entries(item.value).map(([k, v]) => ({
                                index: [...item.index, k],
                                raw: item.raw,
                                value: v,
                                target: item.target[item.key],
                                key: k
                            }))
                        }
                    }).flat(1);
                    continue;
                }
                // $1, $2.. or string|number
                else {                
                    // Walk each node
                    const next: {
                        index: (string|number)[]
                        raw: Record<string, any>
                        value: any
                        target: Record<string, any>
                        key: string | number
                    }[] = [];
                    for (const item of poll) {
                        // $0, $1.. -> string
                        const idx = path.match(/^\$(\d+)/)?.[1];
                        let _path = path;
                        if (idx !== undefined) {
                            // Replace by index key
                            _path = item.index[parseInt(idx)] as string;
                        }
                        const n = typeof item.value === 'object'
                            ? item.value[_path]
                            : undefined;
                        item.target[item.key] = initAs === 'value'
                            ? n
                            : {};
                        if (n !== undefined) {
                            next.push({
                                index: item.index,
                                raw: item.raw,
                                value: n,
                                target: item.target,
                                key: item.key
                            });
                        }
                    }
                    poll = next;
                }
            }
        }

        // For each leaf, if it's an object (not an array),
        // pre-fill with it's value.
        // This means that ...$.raw() only works on modelpaths that
        // result in an object. Otherwise, it's ignored.
        if (rawChild) {
            for (const data of poll) {
                if (typeof data.value === 'object' && !Array.isArray(data.value)) {
                    data.target[data.key] = data.value;
                }
            }
        }

        // Apply prop
        for (const data of poll) {
            if (node.field.prop) {
                data.target[data.key] = data.target[data.key][node.field.prop];
            }
        }

        return poll.map(p => ({
            index: p.index,
            raw: p.raw,
            value: p.value,
            target: p.target[p.key]
        }));
    }

    /**
     * [computed]
     */
    private async parseComputedProp(trx: AnyTrxNode, node: ViewNode) {
        const meta = node.field.meta.computed!;
        for (const entry of node.data) {
            entry.target[node.field.name] = await _Promise.solve(
                meta.fn({ trx, raw: entry.raw, value: entry.value, bucket: node.bucket.schema })
            );
        }
    }

    /**
     * [graph]
     */
    private async parseGraphProp(trx: AnyTrxNode, node: ViewNode) {
        const meta = node.field.meta.graph!;

        let linksObjs;
        const module = TrxNode.getModule(trx);

        // Step 1: Read many links from bucket

        // External
        if (node.bucket.tag.module !== module.name) {
            linksObjs = await trx.bucket(node.bucket.tag.short).readManyLinks(
                node.data.map(entry => entry.raw.id), //ids -> objs -> params
                meta.path,
                [] // param templates temporarily disabled
            );
        }
        // Internal
        else {
            const bucket = module.buckets[node.bucket.tag.name];
            linksObjs = await bucket.graph.readManyLinks(trx,
                node.data.map(entry => entry.raw) as NesoiObj[],
                {
                    name: meta.link,
                    indexes: [] // param templates temporarily disabled
                },
                { silent: true }
            )
        }

        
        // Step 2: Initialize target values
        
        const link = node.bucket.schema.graph.links[meta.link];
        for (let i = 0; i < linksObjs.length; i++) {
            if (meta.view) {
                if (link.many) {
                    node.data[i].target[node.field.name] = []
                }
                else {
                    node.data[i].target[node.field.name] = linksObjs[i] ? {} : undefined;
                }
            }
            else if (node.field.prop) {
                if (link.many) {
                    node.data[i].target[node.field.name] = linksObjs[i].map((link: any) => link[node.field.prop!]);
                }
                else {
                    node.data[i].target[node.field.name] = linksObjs[i]?.[node.field.prop as never];
                }
            }
            else {
                node.data[i].target[node.field.name] = linksObjs[i];
            }
        }

        // Step 3: Build view

        let next: ViewLayer = [];
        let nextData: any[] = linksObjs;
        if (meta.view) {
            const schema = node.bucket.schema as $Bucket;
            const otherBucketDep = schema.graph.links[meta.link].bucket;

            const module = TrxNode.getModule(trx);
            const daemon = module.daemon!;
            const otherBucket = await Daemon.getBucketMetadata(daemon, otherBucketDep);
            const view = otherBucket.schema.views[meta.view];

            const { __raw, ...v } = view.fields;

            const link = node.bucket.schema.graph.links[meta.link];
            if (link.many) {
                const _links = linksObjs as NesoiObj[][];
                for (let i = 0; i < _links.length; i++) {
                    const target = node.data[i].target[node.field.name];
                    for (let j = 0; j < _links[i].length; j++) {
                        if (node.field.prop) {
                            target.push(_links[i][j][node.field.prop as never]);
                        }
                        else {
                            target.push(__raw ? {..._links[i][j]} : {});
                            target[j].$v = meta.view;
                        }
                    }
                }
                if (!node.field.prop) {
                    nextData = _links.map((ll, i) => 
                        ll.map((l, j) => ({ value: l, target: node.data[i].target[node.field.name][j] }))
                    ).flat(1);
                }
                else {
                    nextData = [];
                }
            }
            else {
                const _links = linksObjs as NesoiObj[];
                nextData = [];
                for (let i = 0; i < _links.length; i++) {
                    if (!_links[i]) continue;
                    if (node.field.prop) {
                        node.data[i].target[node.field.name] = _links[i][node.field.prop as never];
                    }
                    else {
                        const target = node.data[i].target[node.field.name];
                        if (__raw) {
                            Object.assign(target, _links[i]);
                        }
                        target.$v = meta.view;
                        nextData.push({
                            value: _links[i], target: node.data[i].target[node.field.name]
                        })
                    }
                }
            }
            
            // (still step 3) Add link bucket view fields to queue

            next = [];
            const bucket = await Daemon.getBucketMetadata(module.daemon!, otherBucketDep);
            // Next data is empty if meta.prop is defined, since there's no need to go deeper
            if (nextData.length) {
                for (const field of Object.values(v)) {
                    next.push({
                        bucket,
                        field,
                        data: nextData.map($ => ({
                            raw: $.value,
                            value: $.value,
                            index: [],
                            target: $.target
                        }))
                    })
                }
            }
        }

        // Step 4: Add subview fields to queue
        if (node.field.children) {

            // Prepare subview data
            const subview_data: {
                obj: any,
                target: any
            }[] = [];
            for (let i = 0; i < linksObjs.length; i++) {
                const objs = linksObjs[i] as NesoiObj | NesoiObj[];

                let target: NesoiObj | NesoiObj[];
                if (link.many) {
                    target = [];
                    for (const tobj of node.data[i].target[node.field.name]) {
                        if ('__raw' in node.field.children) {
                            target.push({...tobj});
                        }
                        else {
                            target.push({id: tobj.id})
                        }
                    }
                    subview_data.push(...(objs as NesoiObj[]).map((obj, i) => ({
                        obj: {...obj},
                        target: (target as NesoiObj[])[i]
                    })));
                }
                else {
                    target = { id: (objs as NesoiObj).id };
                    if ('__raw' in node.field.children) {
                        Object.assign(target, node.data[i].target[node.field.name])
                    }
                    subview_data.push({ obj: {...objs}, target });
                }
                node.data[i].target[node.field.name] = target;
            }

            const module = TrxNode.getModule(trx);
            const subview_bucket = Daemon.getBucketMetadata(module.daemon!, link.bucket);

            // Add subview data to queue
            for (const key in node.field.children) {
                if (key === '__raw') continue;
                next.push({
                    bucket: subview_bucket,
                    field: node.field.children![key],
                    data: subview_data.map(data => ({
                        raw: data.obj,
                        value: data.obj,
                        index: [],
                        target: data.target
                    }))
                })
            }
        }
        return next;
    }

    /**
     * [drive]
     */
    private async parseDriveProp(trx: AnyTrxNode, node: ViewNode) {

        const module = TrxNode.getModule(trx);
        const drive = await Daemon.getBucketDrive(module.daemon!, node.bucket.tag);

        if (!drive) {
            throw NesoiError.Bucket.Drive.NoAdapter({ bucket: node.bucket.schema.alias });
        }
        const meta = node.field.meta.drive!;
        for (const entry of node.data) {
            const value = Tree.get(entry.raw, meta.path);
            if (Array.isArray(value)) {
                const public_urls: string[] = [];
                for (const obj of value) {
                    public_urls.push(await drive.public(obj));
                }
                entry.target[node.field.name] = public_urls;
            }
            else {
                entry.target[node.field.name] = await drive.public(value);
            }
        }
    }
}