import { NesoiError } from '~/engine/data/error';
import { $BucketViewField, $BucketViewFieldFn, $BucketViewFieldMeta, $BucketViewFields, $BucketViews } from './bucket_view.schema';
import { $Module, $Space, ViewObj } from '~/schema';
import { $BucketModel } from '../model/bucket_model.schema';
import { $BucketGraph } from '../graph/bucket_graph.schema';
import { BucketViewBuilder } from './bucket_view.builder';
import { $Bucket } from '../bucket.schema';
import { $BucketViewFieldBuilderInfer } from '../bucket.infer';
import { TrxNode } from '~/engine/transaction/trx_node';
import { NesoiFile } from '~/engine/data/file';

/*
    Types
*/

type DriveFieldpath<
    Bucket extends $Bucket
> = {
    [K in keyof Bucket['#modelpath']]: NonNullable<Bucket['#modelpath'][K]> extends NesoiFile ? K : never
}[keyof Bucket['#modelpath']]

type GraphLinkBucket<
    Bucket extends $Bucket,
    L extends keyof Bucket['graph']['links']
> = Bucket['graph']['links'][L]['#bucket']

type ComputedData<
    Fn extends $BucketViewFieldFn<any, any>,
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

    constructor(
        private _view: BucketViewBuilder<any, any, any>
    ) {}

    raw(): {
        [K in keyof Bucket['#data']]: BucketViewFieldBuilder<Bucket['#data'][K], 'model'>
        } {
        return {
            __raw: {} as any
        } as never;
    }

    model<
        K extends keyof Bucket['#modelpath'],
        SubModel extends BucketViewFieldBuilders
    >(
        path: K,
        submodel?: SubModel
    ) {
        type Data = Bucket['#modelpath'][K]
        return new BucketViewFieldBuilder<Data, 'model', never>(
            'model',
            {
                model: {
                    path: path as string
                }
            },
            submodel as any);
    }

    value() {
        // TODO
        type Data = any
        return new BucketViewFieldBuilder<Data, 'model', never>(
            'model',
            {
                model: {
                    path: '.'
                }
            });
    }
     
    computed<
        Fn extends $BucketViewFieldFn<TrxNode<Space, Module, Space['authnUsers']>, Bucket>
    >(
        fn: Fn
    ) {
        type Data = ComputedData<Fn>
        return new BucketViewFieldBuilder<Data, 'computed', never>(
            'computed',
            {
                computed: {
                    fn: fn as any
                }
            });
    }

    graph<
        L extends keyof Bucket['graph']['links'],
        LinkBucket extends GraphLinkBucket<Bucket, L>,
        V extends (keyof LinkBucket['views']) | undefined
    >(
        link: L,
        view?: V
    ) {
        type Data = undefined extends V ? LinkBucket['#data'] : ViewObj<LinkBucket, NonNullable<V>>
        return new BucketViewFieldBuilder<Data, 'graph', `${LinkBucket['name']}.${V & string}`>(
            'graph',
            {
                graph: {
                    link: link as string,
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
        return new BucketViewFieldBuilder<Data, 'drive', never>(
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
        return new BucketViewFieldBuilder<Data, 'view'>(
            'view',
            {
                view: {
                    view: view as string
                }
            });
    }

    extend<
        ViewName extends keyof Bucket['views'],
        Builders extends BucketViewFieldBuilders
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

    static group(name: string, children: $BucketViewFields) {
        return new $BucketViewField(
            name,
            'group',
            name,
            {},
            children
        );
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
    Data,
    Scope extends $BucketViewField['scope'],
    GraphLink extends string = never
> {
    $b = 'view.field' as const;

    protected _chain?: BucketViewFieldBuilder<any, any, any>;

    constructor(
        protected scope: $BucketViewField['scope'],
        protected meta: $BucketViewFieldMeta,
        protected submodel?: BucketViewFieldBuilders
    ) {}

    chain<
        Fn extends $BucketViewFieldFn<any, any>
    >(
        fn: Fn
    ) {
        this._chain = new BucketViewFieldBuilder<any, 'computed', never>(
            'computed',
            {
                computed: {
                    fn: fn as any
                }
            });
    }

    // Build

    public static build(
        builder: BucketViewFieldBuilder<any, any>,
        model: $BucketModel,
        graph: $BucketGraph,
        views: $BucketViews,
        name: string,
        n_indexes: number
    ): $BucketViewField {

        let children = undefined as $BucketViewFields | undefined;
        const chain = builder._chain as $BucketViewField['chain'];

        if (builder.scope === 'model') {
            const path = builder.meta.model!.path;
            const spread_n = path.match(/\.\*(\.|$)/g)?.length || 0;

            if (spread_n === 0 && builder.submodel) {
                throw new Error('Submodels can only be specified for modelpaths with at least one \'*\'');
            }
            
            // Check if indexes are valid
            // $0, $1, $2.. should be up to n_indexes
            const path_indexes = path.match(/\.\$\d+(\.|$)/g)?.map(d => parseInt(d.slice(2))) || [];
            if (Math.max(...path_indexes) >= n_indexes) {
                if (n_indexes === 0) {
                    throw new Error('Index $ can only be specified inside a submodel');
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

            // If there's a submodel, add it as children
            if (builder.submodel) {
                const overrides = this.buildFields(builder.submodel, model, graph, views, n_indexes+spread_n);
                children = Object.assign({}, children, overrides);
            }
        }
        else if (builder.scope === 'graph') {
            const graphLink = builder.meta.graph!.link ? graph.links[builder.meta.graph!.link] : undefined;
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
                
        return new $BucketViewField(
            name,
            builder.scope,
            name,
            builder.meta,
            children,
            chain
        );
    }

    public static buildFields(
        fields: BucketViewFieldBuilders,
        model: $BucketModel,
        graph: $BucketGraph,
        views: $BucketViews,
        n_indexes = 0
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
            schema[f] = BucketViewFieldBuilder.build(field, model, graph, views, f, n_indexes);
        }
        return schema;
    }

}

/*
    Collection
*/

export type BucketViewFieldBuilders = {
    [x: string]: BucketViewFieldBuilder<any, any, any>
}
