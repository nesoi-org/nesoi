import { NesoiObj } from '~/engine/data/obj';
import { Bucket } from '../bucket';
import { $BucketView, $BucketViewField } from './bucket_view.schema';
import { AnyTrxNode } from '~/engine/transaction/trx_node';
import _Promise from '~/engine/util/promise';
import { NesoiError } from '~/engine/data/error';
import { Tree } from '~/engine/data/tree';

type ViewNode = {
    field: $BucketViewField
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
        raw: Obj
    ): Promise<$['#data']> {  

        const parsed: Record<string, any> = {};
        if ('__raw' in this.schema.fields) {
            Object.assign(parsed, raw);
        }

        let layer: ViewLayer = Object.values(this.schema.fields).map(field => ({
            field,
            data: [{
                raw,
                value: raw,
                index: [],
                target: parsed
            }]
        }))
        
        while (layer.length) {
            layer = await this.parseLayer(trx, layer);
        }

        parsed['$v'] = this.schema.name;
        return {
            id: raw.id,
            ...parsed
        };
    }

    public async parseMany<Obj extends NesoiObj>(
        trx: AnyTrxNode,
        raws: Obj[]
    ): Promise<$['#data']> {  

        const parseds: Record<string, any>[] = [];
        for (const raw of raws) {
            const parsed: Record<string, any> = {};
            if ('__raw' in this.schema.fields) {
                Object.assign(parsed, raw);
            }
            parseds.push(parsed);
        }

        let layer: ViewLayer = Object.values(this.schema.fields).map(field => ({
            field,
            data: raws.map((raw,i) => ({
                raw,
                value: raw,
                index: [],
                target: parseds[i]
            }))
        }))
        
        while (layer.length) {
            layer = await this.parseLayer(trx, layer);
        }

        for (let i = 0; i < raws.length; i++) {
            parseds[i].id = raws[i];
            parseds[i]['$v'] = this.schema.name;
        }
        return parseds;
    }

    private async parseLayer(trx: AnyTrxNode, layer: ViewLayer) {
        
        const next: ViewLayer = [];

        // Model props
        for (const node of layer) {
            if (node.field.scope !== 'model') continue;
            next.push(...this.parseModelProp(node));
        }
        // Computed props
        for (const node of layer) {
            if (node.field.scope !== 'computed') continue;
            await this.parseComputedProp(trx, node);
        }
        // Graph props
        for (const node of layer) {
            if (node.field.scope !== 'graph') continue;
            await this.parseGraphProp(trx, node);
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
                field,
                data: node.data
            })))
        }

        // Chains
        for (const node of layer) {
            if (!node.field.chain) continue;
            next.push({
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
    private parseModelProp(node: ViewNode) {
        
        const initAs = (!node.field.children) ? 'value' : 'obj';
        const rawChild = '__raw' in (node.field.children || {})
        const nextData = this.doParseModelProp(node, initAs, rawChild);

        if (!node.field.children) return [];

        const next: ViewLayer = [];
        for (const key in node.field.children) {
            if (key === '__raw') continue;
            next.push({
                field: node.field.children![key],
                data: nextData
            })
        }
        return next;
    }

    private doParseModelProp(
        node: ViewNode,
        initAs: 'value'|'obj',
        rawChild: boolean
    ): ViewNode['data'] {
        const modelpath = node.field.meta!.model!.path;
        const paths = modelpath.split('.')
        const name = node.field.name;

        let poll: {
            index: (string | number)[];
            raw: Record<string, any>;
            value: Record<string, any>;
            target: Record<string, any>;
            key: string | number;
        }[] = node.data.map(d => ({
            ...d,
            // value: d.raw,
            key: name
        }));

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
                meta.fn({ trx, raw: entry.raw, bucket: this.bucket.schema })
            );
        }
    }

    /**
     * [graph]
     */
    private async parseGraphProp(trx: AnyTrxNode, node: ViewNode) {
        const meta = node.field.meta.graph!;
        for (const entry of node.data) {
            let link;
            if (!meta.view) {
                link = this.bucket.graph.readLink(trx, entry.raw, meta.link, { silent: true })
            }
            else {
                link = this.bucket.graph.viewLink(trx, entry.raw, meta.link, meta.view, { silent: true })
            }
            entry.target[node.field.name] = await _Promise.solve(link);
        }
    }

    /**
     * [drive]
     */
    private async parseDriveProp(trx: AnyTrxNode, node: ViewNode) {
        if (!this.bucket.drive) {
            throw NesoiError.Bucket.Drive.NoAdapter({ bucket: this.bucket.schema.alias });
        }
        const meta = node.field.meta.drive!;
        for (const entry of node.data) {
            const value = Tree.get(entry.raw, meta.path);
            if (Array.isArray(value)) {
                const public_urls: string[] = [];
                for (const obj of value) {
                    public_urls.push(await this.bucket.drive.public(obj));
                }
                entry.target[node.field.name] = public_urls;
            }
            else {
                entry.target[node.field.name] = await this.bucket.drive.public(value);
            }
        }
    }
}