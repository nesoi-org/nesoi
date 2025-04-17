import { NesoiError } from '~/engine/data/error';
import { $BucketViewField, $BucketViewFieldFn, $BucketViewFieldValue, $BucketViewFields, $BucketViews } from './bucket_view.schema';
import { $Module, $Space, ViewObj } from '~/schema';
import { $BucketModel } from '../model/bucket_model.schema';
import { $BucketGraph } from '../graph/bucket_graph.schema';
import { BucketViewBuilder } from './bucket_view.builder';
import { $Bucket } from '../bucket.schema';
import { $BucketViewFieldBuilderInfer } from '../bucket.infer';
import { convertToView } from '../model/bucket_model.convert';
import { TrxNode } from '~/engine/transaction/trx_node';

/*
    Types
*/

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

export class BucketViewFieldFactory<
    Space extends $Space,
    Module extends $Module,
    Bucket extends $Bucket
> {

    protected scope!: $BucketViewField['scope'];
    protected type!: $BucketViewField['type'];
    protected value!: $BucketViewField['value'];

    constructor(
        private _view: BucketViewBuilder<any, any, any>
    ) {}


    model<
        K extends keyof Bucket['#fieldpath'],
        Extra extends BucketViewFieldBuilderTree
    >(
        key: K,
        extra?: Extra
    ) {
        type Data = Bucket['#fieldpath'][K]
        return new BucketViewFieldBuilder<Data, 'model', never>(
            'model',
            {
                model: {
                    key: key as string
                }
            },
            key as string,
            extra as any);
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
            },
        link as string);
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
            },
            view as string);
    }

    extend<
        ViewName extends keyof Bucket['views'],
        Builders extends BucketViewFieldBuilderTree
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
            'obj',
            name,
            false,
            true,
            { group: {} },
            children
        );
    }

}

/*
    Builder
*/

export class BucketViewFieldBuilder<
    Data,
    Scope extends $BucketViewField['scope'],
    GraphLink extends string = never
> {

    protected type: $BucketViewField['type'] = 'unknown';

    constructor(
        protected scope: $BucketViewField['scope'],
        protected value: $BucketViewFieldValue,
        protected refKey?: string,
        protected extra?: BucketViewFieldBuilderTree
    ) {
        this.type = 'unknown';
    }

    // Build

    public static build(
        builder: BucketViewFieldBuilder<any, any>,
        model: $BucketModel,
        graph: $BucketGraph,
        views: $BucketViews,
        name: string
    ) {

        let type = 'unknown' as $BucketViewField['type'];
        let array = 'unknown' as $BucketViewField['array'];
        let required = true as $BucketViewField['required'];
        let children = undefined as $BucketViewFields | undefined;

        if (builder.scope === 'model') {
            const modelField = $BucketModel.get(model, builder.refKey!);
            if (!modelField) {
                throw NesoiError.Builder.Bucket.UnknownModelField(builder.refKey!);
            }
            type = modelField.type;
            array = builder.refKey?.includes('.#') || modelField.array;
            required = modelField.required;
            if (modelField.meta?.enum) {
                builder.value.model!.enumOptions = modelField.meta.enum.options;
            }
            if (modelField.children) {
                const path = builder.refKey! + ((modelField.array || modelField.type === 'dict') ? '.#' : '');
                const fromModel = convertToView(model, '', modelField.children, path).fields;
                children = Object.assign({}, fromModel);
            }
            if (builder.extra) {
                const extra = this.buildFields(builder.extra, model, graph, views);
                children = Object.assign({}, children, extra);
            }
        }
        else if (builder.scope === 'graph') {
            const graphLink = builder.refKey ? graph.links[builder.refKey] : undefined;
            if (!graphLink) {
                throw NesoiError.Builder.Bucket.UnknownGraphLink(builder.refKey || '');
            }
            array = graphLink.many;
        }
        else if (builder.scope === 'view') {
            const view = builder.refKey ? views[builder.refKey] : undefined;
            if (!view) {
                throw NesoiError.Builder.Bucket.UnknownViewName(builder.refKey || '');
            }
            type = 'obj';
            array = false;
            children = view.fields;
        }
                
        return new $BucketViewField(
            name,
            builder.scope,
            type,
            name,
            array,
            required,
            builder.value,
            children
        );
    }

    public static buildFields(
        fields: BucketViewFieldBuilderTree,
        model: $BucketModel,
        graph: $BucketGraph,
        views: $BucketViews
    ) {
        const schema = {} as $BucketViewFields;
        
        // Extended fields inherit from other views
        if ('__ext' in fields) {
            const ext = views[fields.__ext as any as string];
            Object.assign(schema, ext.fields);
        }

        for (const f in fields) {
            if (f === '__ext') { continue; }
            const field = fields[f];
            // Normal fields are built here
            if (field instanceof BucketViewFieldBuilder) {
                schema[f] = BucketViewFieldBuilder.build(field, model, graph, views, f);
            }
            // Builders are allowed to implicitly declare nested fields.
            // The code below transforms these groups into fields of the scope 'group'.
            else {
                const children = BucketViewFieldBuilder.buildFields(field, model, graph, views);
                schema[f] = BucketViewFieldFactory.group(f, children);
            }
        }
        return schema;
    }

}

/*
    Collection
*/

export type BucketViewFieldBuilderTree = {
    [x: string]: BucketViewFieldBuilder<any, any, any> | BucketViewFieldBuilderTree
}