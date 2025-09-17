import { NesoiError } from '~/engine/data/error';
import { $BucketViewField, $BucketViewFieldFn, $BucketViewFieldMeta, $BucketViewFields, $BucketViews } from './bucket_view.schema';
import { $Module, $Space, ViewObj } from '~/schema';
import { $BucketModel } from '../model/bucket_model.schema';
import { $BucketGraph, $BucketGraphLink } from '../graph/bucket_graph.schema';
import { BucketViewDef } from './bucket_view.builder';
import { $Bucket } from '../bucket.schema';
import { $BucketViewDataInfer, $BucketViewFieldBuilderInfer } from '../bucket.infer';
import { TrxNode } from '~/engine/transaction/trx_node';
import { NesoiFile } from '~/engine/data/file';
import { ModuleTree } from '~/engine/tree';

/*
    Types
*/

type DriveFieldpath<
    Bucket extends $Bucket
> = {
    [K in keyof Bucket['#modelpath']]: NonNullable<Bucket['#modelpath'][K]> extends NesoiFile ? K : never
}[keyof Bucket['#modelpath']]

type ComputedData<
    Fn extends $BucketViewFieldFn<any, any, any, any>,
    R = ReturnType<Fn>
> = R extends Promise<infer X> ? X : R

/*
    Factory
*/

/**
 * @category Builders
 * @subcategory Entity
 * */
export class BucketViewFieldFactory<
    Space extends $Space,
    Module extends $Module,
    Bucket extends $Bucket
> {

    protected scope!: $BucketViewField['scope'];
    protected meta!: $BucketViewField['meta'];

    raw(): {
        [K in keyof Bucket['#data']]: BucketViewFieldBuilder<Module, Bucket, Bucket, Bucket['#data'][K], 'model'>
        } {
        return {
            __raw: {} as any
        } as never;
    }

    model<
        K extends keyof Bucket['#modelpath']
    >(
        path: K
    ) {
        type Data = Bucket['#modelpath'][K]
        return new BucketViewFieldBuilder<Module, Bucket, Bucket, Data, 'model', never>(
            'model',
            {
                model: {
                    path: path as string
                }
            });
    }

    value() {
        // TODO
        type Data = any
        return new BucketViewFieldBuilder<Module, Bucket, Bucket, Data, 'model', never>(
            'model',
            {
                model: {
                    path: '.'
                }
            });
    }

    computed<
        Fn extends $BucketViewFieldFn<TrxNode<Space, Module, Space['authnUsers']>, Bucket, Bucket['#data'], Bucket['#data']>
    >(
        fn: Fn
    ) {
        type Data = ComputedData<Fn>
        return new BucketViewFieldBuilder<Module, Bucket, Bucket, Data, 'computed', never>(
            'computed',
            {
                computed: {
                    fn: fn as any
                }
            });
    }

    graph<
        L extends keyof Bucket['graph']['links'],
        V extends (keyof Bucket['graph']['links'][L]['#bucket']['views']) | undefined
    >(
        link: L,
        view?: V
    ) {
        type LinkBucket = Bucket['graph']['links'][L]['#bucket'];
        type Data = undefined extends V
            ? LinkBucket['#data']
            : ViewObj<LinkBucket, NonNullable<V>>
        type Out = Bucket['graph']['links'][L]['#many'] extends true
            ? Data[]
            : Data
        return new BucketViewFieldBuilder<Module, Bucket, LinkBucket, Out, 'graph', `${LinkBucket['name']}.${V & string}`>(
            'graph',
            {
                graph: {
                    link: (link as string).replace(/\$\d+/g,'$'),
                    path: link as string,
                    view: view as string | undefined
                }
            });
    }

    drive<
        F extends DriveFieldpath<Bucket>
    >(
        path: F
    ) {
        type Data = string
        return new BucketViewFieldBuilder<Module, Bucket, Bucket, Data, 'drive', never>(
            'drive',
            {
                drive: {
                    path: path as string,
                }
            });
    }

    view<
        ViewName extends keyof Bucket['views'],
        View extends Bucket['views'][ViewName]
    >(
        view: ViewName
    ) {
        type Data = View['#data'];
        return new BucketViewFieldBuilder<Module, Bucket, Bucket, Data, 'view'>(
            'view',
            {
                view: {
                    view: view as string
                }
            });
    }

    // from<
    // >(

    // ) {

    // }

    extend<
        ViewName extends keyof Bucket['views'],
        Builders extends BucketViewFieldBuilders<any>
    >(
        view: ViewName,
        fields: Builders
    ) {
        type Data = Bucket['views'][ViewName]['#data']
        return {
            __ext: view as never,
            ...fields
        } as unknown as
            $BucketViewFieldBuilderInfer<Data>
            & Builders;
    }

    obj<Builders extends BucketViewFieldBuilders<Bucket>>(children: Builders) {
        type Data = $BucketViewDataInfer<Builders>
        return new BucketViewFieldBuilder<Module, Bucket, Bucket, Data, 'group', never>(
            'group',
            {},
            children);
    }
}

/*
    Builder
*/

/**
 * @category Builders
 * @subcategory Entity
 * */
export class BucketViewFieldBuilder<
    Module extends $Module,
    Bucket extends $Bucket,
    ChainBucket extends $Bucket,
    Data,
    Scope extends $BucketViewField['scope'],
    GraphLink extends string = never
> {
    $b = 'view.field' as const;

    protected _prop?: string;
    protected _chain?: BucketViewFieldBuilder<any, any, any, any, any>;

    constructor(
        protected scope: $BucketViewField['scope'],
        protected meta: $BucketViewFieldMeta,
        protected subview?: BucketViewFieldBuilders<any> | BucketViewDef<any, any, any>
    ) {}

    prop<Obj extends Data extends any[] ? Data[number] : Data, K extends keyof Obj>(
        prop: K
    ) {
        if (this.subview) {
            throw new Error('Prop not allowed for view field with subview')
        }
        this._prop = prop as string;
        return this as BucketViewFieldBuilder<Module, Bucket, ChainBucket, Obj[K], Scope, GraphLink>;
    }


    map<
        Def extends BucketViewDef<any, Module, ChainBucket>
    >(def: Def) {
        if (this._prop) {
            throw new Error('Subview not allowed for view field which picks a prop')
        }
        this.subview = def;
        return this as BucketViewFieldBuilder<Module, Bucket, ChainBucket, {
            [K in keyof Def]: Def extends BucketViewFieldBuilder<any, any, infer X, any, any> ? X : never
        }, Scope, GraphLink>
    }

    chain<
        Fn extends $BucketViewFieldFn<TrxNode<any, Module, never>, ChainBucket, Bucket['#data'], Data>
    >(
        fn: Fn
    ) {
        this._chain = new BucketViewFieldBuilder<any, any, any, 'computed', never>(
            'computed',
            {
                computed: {
                    fn: fn as any
                }
            });
        type CData = ComputedData<Fn>
        return this as BucketViewFieldBuilder<Module, Bucket, ChainBucket, CData, Scope, GraphLink>;
    }

    // Build

    public static build(
        builder: BucketViewFieldBuilder<any, any, any, any, any>,
        model: $BucketModel,
        graph: $BucketGraph,
        views: $BucketViews,
        name: string,
        n_indexes: number,
        tree?: ModuleTree
    ): $BucketViewField {

        let children = undefined as $BucketViewFields | undefined;
        const chainBuilder = builder._chain as BucketViewFieldBuilder<any, any, any, any, any>['_chain'];

        let spread_n = 0;  
        let graphLink: $BucketGraphLink | undefined = undefined;      
        if (builder.scope === 'model') {
            const path = builder.meta.model!.path;
            spread_n = path.match(/\.\*(\.|$)/g)?.length || 0;

            if (spread_n === 0 && builder.subview) {
                throw new Error('Subviews can only be specified for modelpaths with at least one \'*\'');
            }

            // Check if indexes are valid
            // $0, $1, $2.. should be up to n_indexes
            const path_indexes = path.match(/\.\$\d+(\.|$)/g)?.map(d => parseInt(d.slice(2))) || [];
            if (Math.max(...path_indexes) >= n_indexes) {
                if (n_indexes === 0) {
                    throw new Error('Index $ can only be specified inside a subview');
                }
                throw new Error(`Maximum index allowed: $${n_indexes-1}`);
            }

            // Retrieve one or more BucketModelFields referenced by a modelpath.
            // (It's only more than one when using unions)
            // The field itself is not used, but serves to validate that the modelpath exists.
            const modelFields = $BucketModel.getField(model, path);
            if (!modelFields.length) {
                throw NesoiError.Builder.Bucket.UnknownModelField(builder.meta.model!.path);
            }
        }
        else if (builder.scope === 'graph') {
            const key = builder.meta.graph!.link?.replace(/\$\d+/g,'$');
            graphLink = builder.meta.graph!.link ? graph.links[key] : undefined;
            if (!graphLink) {
                throw NesoiError.Builder.Bucket.UnknownGraphLink(builder.meta.graph!.link || '');
            }
        }
        else if (builder.scope === 'view') {
            const view = builder.meta.view?.view ? views[builder.meta.view?.view] : undefined;
            if (!view) {
                throw NesoiError.Builder.Bucket.UnknownViewName(builder.meta.view?.view || '');
            }
            children = view.fields;
        }


        // If there's a subview, add it as children
        if (builder.subview) {

            let subview;
            if (typeof builder.subview === 'function') {
                const factory = new BucketViewFieldFactory();
                subview = builder.subview(factory);
            }
            else {
                subview = builder.subview;
            }

            let submodelBucket = { model, graph, views } as $Bucket;
            if (builder.scope === 'graph') {
                const tag = graphLink!.bucket;
                if (tree) {
                    submodelBucket = tree.allNodes()
                        .find(node => node.tag.full === tag.full)!.schema as $Bucket;
                }
            }

            const overrides = this.buildFields(
                subview,
                submodelBucket.model,
                submodelBucket.graph,
                submodelBucket.views,
                n_indexes+spread_n,
                tree
            );
            children = Object.assign({}, children, overrides);
        }

        let chain;
        if (chainBuilder) {
            chain = BucketViewFieldBuilder.build(chainBuilder, model, graph, views, name, n_indexes, tree)
        }

        return new $BucketViewField(
            name,
            builder.scope,
            name,
            builder.meta,
            builder._prop,
            children,
            chain
        );
    }

    public static buildFields(
        fields: BucketViewFieldBuilders<any>,
        model: $BucketModel,
        graph: $BucketGraph,
        views: $BucketViews,
        n_indexes = 0,
        tree?: ModuleTree
    ) {
        const schema = {} as $BucketViewFields;

        // Extended fields inherit from other views
        if ('__ext' in fields) {
            const ext = views[fields.__ext as any as string];
            Object.assign(schema, ext.fields);
        }

        for (const f in fields) {
            if (f === '__ext') { continue; }
            if (f === '__raw') { schema['__raw'] = {} as any }

            const field = fields[f];
            schema[f] = BucketViewFieldBuilder.build(field, model, graph, views, f, n_indexes, tree);
        }
        return schema;
    }

}

/*
    Collection
*/

export type BucketViewFieldBuilders<
    Bucket extends $Bucket
> = {
    [x: string]: BucketViewFieldBuilder<any, Bucket, any, any, any>
}
