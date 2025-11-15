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
import { BucketModel } from '../model/bucket_model';

type ViewNode = {
    bucket: BucketMetadata,
    field: $BucketViewField,
    data: {
        // static
        root: Record<string, any>
        // parent
        parent: Record<string, any>
        // value
        index: string[]
        value: Record<string, any>
        // target
        target: Record<string, any>
        key: string
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
        root: Obj,
        flags?: {
            serialize: boolean
        }
    ): Promise<$['#data']> {  

        const module = TrxNode.getModule(trx);
        const tag = new Tag(this.bucket.module.name, 'bucket', this.bucket.schema.name)
        const meta = await Daemon.getBucketMetadata(module.daemon!, tag);

        const parsed: Record<string, any> = {};
        if ('__root' in this.schema.fields || '__parent' in this.schema.fields || '__value' in this.schema.fields) {
            Object.assign(parsed, root);
        }

        let layer: ViewLayer = Object.values(this.schema.fields).map(field => ({
            bucket: meta,
            field,
            data: [{
                root,
                parent: root,
                index: [],
                value: root,
                target: parsed,
                key: field.name
            }]
        }))
        
        while (layer.length) {
            layer = await this.parseLayer(trx, layer, flags);
        }

        parsed['$v'] = this.schema.name;
        return {
            id: root.id,
            ...parsed
        };
    }

    public async parseMany<Obj extends NesoiObj>(
        trx: AnyTrxNode,
        roots: Obj[],
        flags?: {
            serialize: boolean
        }
    ): Promise<$['#data']> {  

        const module = TrxNode.getModule(trx);
        const tag = new Tag(this.bucket.module.name, 'bucket', this.bucket.schema.name)
        const meta = await Daemon.getBucketMetadata(module.daemon!, tag);

        const parseds: Record<string, any>[] = [];
        for (const root of roots) {
            const parsed: Record<string, any> = {};
            if ('__root' in this.schema.fields || '__parent' in this.schema.fields || '__value' in this.schema.fields) {
                Object.assign(parsed, root);
            }
            parseds.push(parsed);
        }

        let layer: ViewLayer = Object.values(this.schema.fields).map(field => ({
            bucket: meta,
            field,
            data: roots.map((root,i) => ({
                root,
                parent: root,
                index: [],
                value: root,
                target: parseds[i],
                key: field.name
            }))
        }))
        
        while (layer.length) {
            layer = await this.parseLayer(trx, layer, flags);
        }

        for (let i = 0; i < roots.length; i++) {
            parseds[i].id = roots[i].id;
            parseds[i]['$v'] = this.schema.name;
        }
        return parseds;
    }

    private async parseLayer(trx: AnyTrxNode, layer: ViewLayer, flags?: {
        serialize: boolean
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
            if ('__root' in node.field.children || '__parent' in this.schema.fields || '__value' in node.field.children) {
                for (const d of node.data) {
                    d.target[d.key] = d.value;
                }
            }
            next.push(...Object.values(node.field.children).map(field => ({
                bucket: node.bucket,
                field,
                data: node.data
            })))
        }

        return next;
    }


    private toDict(as_dict: number[], data: { value: any, index: string[] }[], final = false) {
        const dict: Record<string, any> = {}
        const next_data: {
            target: any,
            value: any,
            index: string[]
        }[] = [];
        
        let poll: {
            i: number,
            index: string[],
            value: any,
            target: Record<string, any>
        }[] = data.map(d => ({
            i: 0,
            index: d.index,
            value: d.value,
            target: dict
        }));
        
        while(poll.length) {
            const next: typeof poll = [];

            for (const entry of poll) {
                const isLeaf = entry.i === as_dict.length-1;
    
                const key = entry.index.at(as_dict[entry.i]);
                if (!key) {
                    throw new Error(`Invalid view dict argument ${as_dict}`) // TODO: NesoiError
                }
                if (isLeaf) {
                    if (final) {
                        entry.target[key] = entry.value;
                    }
                    else {
                        entry.target[key] = {};
                        next_data.push({
                            target: entry.target[key],
                            value: entry.value,
                            index: entry.index
                        })
                    }
                }
                else {
                    entry.target[key] = {};
                    next.push({
                        i: entry.i+1,
                        index: entry.index,
                        value: entry.value,
                        target: entry.target[key]
                    })
                }
            }

            poll = next;
        }

        return {
            value: dict,
            next: next_data
        };
    }
    
    /**
     * [model]
     * Read one property from 
     */
    private parseModelProp(node: ViewNode, flags?: {
        serialize: boolean
    }) {
        const nextData = this.doParseModelProp(node, flags);

        const next: ViewLayer = [];

        // Add children (subview) to queue
        if (node.field.children) {
            for (const key in node.field.children) {
                if ((key as any) === '__root') continue;
                if ((key as any) === '__parent') continue;
                if ((key as any) === '__value') continue;
                next.push({
                    bucket: node.bucket,
                    field: node.field.children![key],
                    data: nextData.map(d => ({
                        ...d,
                        key: d.key ?? node.field.children![key].name
                    }))
                })
            }
        }

        // Chains
        if (node.field.chain) {
            next.push({
                bucket: node.bucket,
                field: node.field.chain,
                data: nextData.map(d => ({
                    root: d.root,
                    parent: d.parent,
                    index: d.index,
                    value: d.value,
                    target: d.target,
                    key: d.key!
                }))
            })
        }

        return next;
    }

    private doParseModelProp(
        node: ViewNode,
        flags?: {
            serialize: boolean
        }
    ) {
        const model = new BucketModel(node.bucket.schema);

        let modelpath = node.field.meta!.model!.path;
        if (node.field.prop) modelpath += '.' + node.field.prop;

        const hasSubview = node.field.children;
        const hasChain = node.field.chain;
        const hasRootSubviewField = '__root' in (node.field.children || {});
        const hasParentSubviewField = '__parent' in (node.field.children || {});
        const hasValueSubviewField = '__value' in (node.field.children || {});

        const nextData: (Omit<ViewNode['data'][number], 'key'> & { key?: string })[] = [];

        for (const data of node.data) {

            // Modelpath refers to the whole value 
            if (modelpath === '__root') {
                data.target[data.key] = data.root
                continue;
            }
            if (modelpath === '__parent') {
                data.target[data.key] = data.parent
                continue;
            }
            if (modelpath === '__value') {
                data.target[data.key] = data.value
                continue;
            }

            let node_modelpath = modelpath;
            if (data.index.length) {
                for (let i = 0; i < data.index.length; i++) {
                    node_modelpath = node_modelpath.replace(new RegExp('\\$'+i, 'g'), data.index[i].toString());
                }
            }

            // Copy modelpath value from object
            
            const value = model.copy(
                data.parent,
                'save',
                () => !!flags?.serialize,
                node_modelpath
            ) as {
                value: any,
                index: string[]
            }[];
            
            const many = modelpath.split('.').includes('*');

            // Modelpath contains '*', so it returns N results
            if (many) {
                const next = value.map(v => {
                    const index = [...data.index, ...v.index];
                    if (hasRootSubviewField || hasParentSubviewField || hasValueSubviewField) {
                        // Value is not an object, start subview as empty object
                        if (typeof v.value !== 'object' || Array.isArray(v.value))
                            return { value: v.value, target: {}, index: index }
                        // Value is an object, start subview with root/value
                        else {
                            const val = Object.assign({},
                                hasRootSubviewField ? data.root : {},
                                hasParentSubviewField ? data.parent : {},
                                hasValueSubviewField ? v.value : {},
                            )
                            return { value: v.value, target: val, index: index }
                        }
                    }
                    else if (hasSubview) return { value: v.value, target: {}, index: index }
                    else return { value: v.value, target: v.value, index: index }
                });

                if (node.field.as_dict) {
                    const dict = this.toDict(node.field.as_dict, next, !node.field.children);
                    data.target[data.key] = dict.value;
                    // Add to be processed by subview
                    nextData.push(...dict.next.map((v, i) => ({
                        root: data.root,
                        parent: data.parent,
                        index: v.index,
                        value: v.value,
                        target: v.target
                    })))
                }
                else {
                    if (hasChain) {
                        data.target[data.key] = []
                        nextData.push(...next.map((v, i) => ({
                            root: data.root,
                            parent: data.parent,
                            index: v.index,
                            value: v.value,
                            target: data.target[data.key],
                            key: i.toString()
                        })))
                    }
                    else {
                        data.target[data.key] = next.map(v => v.target)
                        // Add to be processed by subview
                        nextData.push(...next.map((v, i) => ({
                            root: data.root,
                            parent: data.parent,
                            index: v.index,
                            value: v.value,
                            target: v.target
                        })))
                    }
                }
            }
            // Modelpath does not contain '*', so it returns 1 result
            else {
                const v = value[0];
                
                const index = [...data.index, ...(v?.index ?? [])];
                let target = v?.value;
                if (hasRootSubviewField || hasParentSubviewField || hasValueSubviewField) {
                    // Value is not an object, start subview as empty object
                    if (typeof v.value !== 'object' || Array.isArray(v.value))
                        target = {}
                    // Value is an object, start subview with root/value
                    else {
                        target = Object.assign({},
                            hasRootSubviewField ? data.root : {},
                            hasParentSubviewField ? data.parent : {},
                            hasValueSubviewField ? v.value : {},
                        )
                    }
                }
                else if (hasSubview) target = {}

                if (target) {
                    if (hasChain) {
                        nextData.push({
                            root: data.root,
                            parent: data.parent,
                            index: index,
                            value: v.value,
                            target: data.target,
                            key: data.key
                        })
                    }
                    else {
                        data.target[data.key] = target;
                        // Add to be processed by subview
                        nextData.push({
                            root: data.root,
                            parent: target,
                            index: index,
                            value: v.value,
                            target
                        })
                    }
                }

            }

        }

        return nextData;
    }

    /**
     * [computed]
     */
    private async parseComputedProp(trx: AnyTrxNode, node: ViewNode) {
        const meta = node.field.meta.computed!;
        for (const entry of node.data) {
            entry.target[entry.key] = await _Promise.solve(
                meta.fn({ trx, root: entry.root, parent: entry.parent, value: entry.value, bucket: node.bucket.schema })
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
                node.data.map(entry => entry.parent.id), //ids -> objs -> params
                meta.path,
                node.data.map(entry => entry.index)
            );
        }
        // Internal
        else {
            const bucket = module.buckets[node.bucket.tag.name];
            linksObjs = await bucket.graph.readManyLinks(trx,
                node.data.map(entry => entry.parent) as NesoiObj[],
                {
                    name: meta.link,
                    indexes: node.data.map(entry => entry.index)
                },
                { silent: true }
            )
        }

        
        // Step 2: Initialize target values
        
        const link = node.bucket.schema.graph.links[meta.link];
        for (let i = 0; i < linksObjs.length; i++) {
            const target = node.data[i].target;
            const key = node.data[i].key;
            if (meta.view) {
                if (link.many) {
                    target[key] = []
                }
                else {
                    target[key] = linksObjs[i] ? {} : undefined;
                }
            }
            else if (node.field.prop) {
                if (link.many) {
                    target[key] = linksObjs[i].map((link: any) => link[node.field.prop!]);
                }
                else {
                    target[key] = linksObjs[i]?.[node.field.prop as never];
                }
            }
            else {
                target[key] = linksObjs[i];
            }
        }

        const schema = node.bucket.schema as $Bucket;
        const otherBucketDep = schema.graph.links[meta.link].bucket;

        const daemon = module.daemon!;
        const otherBucket = await Daemon.getBucketMetadata(daemon, otherBucketDep);

        // Step 3: Build view

        let next: ViewLayer = [];
        let nextData: any[] = linksObjs;
        if (meta.view) {
            const view = otherBucket.schema.views[meta.view];

            const includeRoot = '__root' in view.fields;
            const includeParent = '__parent' in view.fields;
            const includeValue = '__value' in view.fields;
            const v: {
                [x: string|symbol]: any
            } = { ...view.fields };
            delete v['__root'];
            delete v['__parent'];
            delete v['__value'];

            const link = node.bucket.schema.graph.links[meta.link];
            if (link.many) {
                const _links = linksObjs as NesoiObj[][];
                for (let i = 0; i < _links.length; i++) {
                    const key = node.data[i].key;
                    const target = node.data[i].target[key];
                    for (let j = 0; j < _links[i].length; j++) {
                        if (node.field.prop) {
                            target.push(_links[i][j][node.field.prop as never]);
                        }
                        else {
                            const init = Object.assign(
                                { $v: meta.view },
                                (includeRoot || includeParent || includeValue) ? _links[i][j] : {},
                            )
                            target.push(init);
                            target[j].$v = meta.view;
                        }
                    }
                }
                if (!node.field.prop) {
                    nextData = _links.map((ll, i) => 
                        ll.map((l, j) => ({ value: l, target: node.data[i].target[node.data[i].key][j] }))
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
                    const key = node.data[i].key;
                    if (node.field.prop) {
                        node.data[i].target[key] = _links[i][node.field.prop as never];
                    }
                    else {
                        const target = node.data[i].target[key];
                        if (includeRoot || includeParent || includeValue) {
                            Object.assign(target, _links[i]);
                        }
                        target.$v = meta.view;
                        nextData.push({
                            value: _links[i], target: node.data[i].target[key]
                        })
                    }
                }
            }
            
            // (still step 3) Add link bucket view fields to queue

            next = [];
            // const bucket = await Daemon.getBucketMetadata(module.daemon!, otherBucketDep);
            // Next data is empty if meta.prop is defined, since there's no need to go deeper
            if (nextData.length) {
                for (const field of Object.values(v)) {
                    next.push({
                        bucket: otherBucket,
                        field,
                        data: nextData.map($ => ({
                            root: $.value,
                            parent: $.value,
                            value: $.value,
                            index: [],
                            target: $.target,
                            key: field.name
                        }))
                    })
                }
            }
        }

        // Step 4: Add subview fields to queue
        if (node.field.children) {

            // Prepare subview data
            const subview_data: {
                root: any,
                parent: any,
                value: any,
                target: any
            }[] = [];
            for (let i = 0; i < linksObjs.length; i++) {
                const objs = linksObjs[i] as NesoiObj | NesoiObj[];
                if (!objs) continue;

                const key = node.data[i].key;
                
                let target: NesoiObj | NesoiObj[];
                if (link.many) {
                    target = [];
                    for (const tobj of node.data[i].target[key]) {
                        const init = Object.assign(
                            { id: tobj.id },
                            '__root' in node.field.children ? node.data[i].root : {},
                            '__parent' in node.field.children ? node.data[i].root : {},
                            '__value' in node.field.children ? tobj : {}
                        )
                        target.push(init)
                    }
                    subview_data.push(...(objs as NesoiObj[]).map((obj, j) => ({
                        root: node.data[i].root,
                        parent: node.data[i].parent,
                        value: {...obj},
                        target: (target as NesoiObj[])[j]
                    })));
                }
                else {
                    target = { id: (objs as NesoiObj).id };
                    if ('__root' in node.field.children) {
                        Object.assign(target, node.data[i].root)
                    }
                    if ('__parent' in node.field.children) {
                        Object.assign(target, node.data[i].parent)
                    }
                    if ('__value' in node.field.children) {
                        Object.assign(target, node.data[i].target[key])
                    }
                    subview_data.push({
                        root: node.data[i].root,
                        parent: node.data[i].parent,
                        value: {...objs},
                        target
                    });
                }
                node.data[i].target[key] = target;
            }

            const module = TrxNode.getModule(trx);
            const subview_bucket = Daemon.getBucketMetadata(module.daemon!, link.bucket);

            // Add subview data to queue
            for (const key in node.field.children) {
                if ((key as never) === '__root') continue;
                if ((key as never) === '__parent') continue;
                if ((key as never) === '__value') continue;
                next.push({
                    bucket: subview_bucket,
                    field: node.field.children![key],
                    data: subview_data.map(data => ({
                        root: data.root,
                        parent: data.value,
                        index: [],
                        value: data.value,
                        target: data.target,
                        key: node.field.children![key].name
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
            const value = Tree.get(entry.root, meta.path);
            if (Array.isArray(value)) {
                const public_urls: string[] = [];
                for (const obj of value) {
                    public_urls.push(await drive.public(obj));
                }
                entry.target[entry.key] = public_urls;
            }
            else {
                entry.target[entry.key] = await drive.public(value);
            }
        }
    }
}