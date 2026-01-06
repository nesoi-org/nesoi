import type { BucketName } from '~/schema';
import type { BucketGraphDef } from './graph/bucket_graph.builder';
import type { BucketViewDef } from './view/bucket_view.builder';
import type { BucketModelDef } from './model/bucket_model.builder';
import type { $BucketViewDataInfer, $BucketViewFieldsInfer } from './view/bucket_view.infer';
import type { BucketGraphLinkBuilders} from './graph/bucket_graph_link.builder';
import type { $BucketGraphLinksInfer } from './graph/bucket_graph.infer';
import type { ResolvedBuilderNode} from '~/engine/dependency';
import type { ModuleTree } from '~/engine/tree';
import type { BucketModelInfer } from './model/bucket_model.infer';
import type { Overlay } from '~/engine/util/type';

import { BucketGraphBuilder } from './graph/bucket_graph.builder';
import { BucketViewBuilder } from './view/bucket_view.builder';
import { $Bucket } from './bucket.schema';
import { BucketModelBuilder } from './model/bucket_model.builder';
import { $BucketModel } from './model/bucket_model.schema';
import { convertToView } from '~/elements/entities/bucket/model/bucket_model.convert';
import { BucketModelFieldFactory } from './model/bucket_model_field.builder';
import { BucketGraphLinkFactory } from './graph/bucket_graph_link.builder';
import { Dependency, Tag } from '~/engine/dependency';
import { NesoiError } from '~/engine/data/error';


/**
 * @category Builders
 * @subcategory Entity
 * */
export class BucketBuilder<
    Space extends $Space,
    Module extends $Module,
    Bucket extends $Bucket = Omit<$Bucket, 'views'> & { views: {} }
> {
    public $b = 'bucket' as const;

    private _extend?: Dependency;

    private _alias?: string;
    
    private _model!: BucketModelBuilder<any>;
    private _graph: BucketGraphLinkBuilders = {};
    private _views: Record<string, BucketViewBuilder<any, any, any>> = {};

    private _tenancy?: $BucketTenancy<any, any>;
    
    constructor(
        private module: string,
        private name: string
    ) {}

    as(alias: string) {
        this._alias = alias;
        return this;
    }
    
    extend<
        N extends Exclude<BucketName<Module>, Bucket['name']>
    >(nameOrShort: N) {
        const tag = Tag.fromNameOrShort(this.module, 'bucket', nameOrShort as string);
        this._extend = new Dependency(this.module, tag, { build: true });
        return this as unknown as BucketBuilder<
            Space,
            Module,
            Module['buckets'][N]
        >;
    }

    model<
        Def extends BucketModelDef<Space, Module>,
        Obj extends NesoiObj = { id: Id } & BucketModelInfer<Def>
    >($: Def) {
        const fieldBuilder = new BucketModelFieldFactory(this.module);
        const fields = $(fieldBuilder);
        this._model = new BucketModelBuilder(this.module).fields(fields);
        type _Bucket = Overlay<Bucket, {
            '#data': Obj
        }>
        return this as unknown as BucketBuilder<
            Space,
            Overlay<Module, {
                buckets: Overlay<Module['buckets'], {
                    [K in Bucket['name']]: _Bucket
                }>
            }>,
            _Bucket
        >;
    }
    
    /**
     * Optional query to be appended to every read of this bucket, based on the user
     * This allows implementing complex multi-tenancy rules through NQL
     */
    tenancy<T extends $BucketTenancy<Module, Bucket>>($: T) {
        this._tenancy = $;
        return this;
    }

    graph<
        Def extends BucketGraphDef<Module, Bucket>
    >($: Def) {
        const linkFactory = new BucketGraphLinkFactory<any, any>(this.module);
        const links = $(linkFactory);
        this._graph = links;
        type GraphLinks = $BucketGraphLinksInfer<ReturnType<Def>>
        return this as unknown as BucketBuilder<
            Space,
            Module,
            Overlay<Bucket, { 
                graph: Overlay<Bucket['graph'], {
                    links: GraphLinks
                }>
            }>
        >;
    }

    view<
        ViewName extends string,
        Def extends BucketViewDef<Space, Module, Bucket, Bucket, Bucket['#data']>
    >(
        name: ViewName,
        $: Def
    ) {
        const view = new BucketViewBuilder(name as string);
        view.fields($ as never);
        this._views[name as string] = view;
        type ViewFields = $BucketViewFieldsInfer<ReturnType<Def>>
        type Data = $BucketViewDataInfer<ReturnType<Def>>
        return this as BucketBuilder<
            Space,
            Module,
            Bucket & { 
                views: {
                    [K in ViewName]: $BucketView & {
                        '#data': Data
                        fields: ViewFields
                    }
                }
            }
        >;
    }

    // Build

    static build(node: BucketBuilderNode, tree: ModuleTree) {

        const model = node.builder._extend
            ? new $BucketModel({} as any, {})
            : BucketModelBuilder.build(node.builder._model, tree)
        
        // If there's an external bucket linked, merge some of
        // the information before starting.
        let $ext;
        const extend = node.builder._extend;
        if (extend) {
            $ext = Tag.resolve(extend.tag, tree) as $Bucket;
            // Model
            model.fields = Object.assign({}, $ext.model.fields, model.fields);
            model.defaults = Object.assign({}, $ext.model.defaults, model.defaults);
        }
        
        const graph = BucketBuilder.buildGraph(node, tree, extend);
        const views = BucketBuilder.buildViews(node.builder, graph, tree, model, extend);

        node.schema = new $Bucket(
            node.builder.module,
            node.builder.name,
            node.builder._alias || $ext?.alias || node.builder.name,
            model,
            graph,
            views,
            node.builder._tenancy,
            extend?.tag
        );

        return node.schema;
    }

    static buildGraph(node: BucketBuilderNode, tree: ModuleTree, extend?: Dependency) {
        const links = {} as $BucketGraph['links'];

        if (extend) {
            const ext = Tag.resolve(extend.tag, tree) as $Bucket;
            Object.assign(links, ext.graph.links);
        }

        const graphBuilder = new BucketGraphBuilder().links(node.builder._graph);
        const graph = BucketGraphBuilder.build(node, graphBuilder);

        graph.links = Object.assign(graph.links, links);
        return graph;
    }

    static buildViews(builder: AnyBucketBuilder, graph: $BucketGraph, tree: ModuleTree, model: $BucketModel, extend?: Dependency) {       
        const views = {
            default: convertToView(tree, builder.module, model, 'default')
        } as $BucketViews;

        if (extend) {
            const ext = Tag.resolve(extend.tag, tree) as $Bucket;
            Object.assign(views, ext.views);
        }

        for (const v in builder._views) {
            views[v] = BucketViewBuilder.build(builder.module, builder._views[v], model, graph, views, tree);
        }
        return views;
    }

    static checkComposition(node: BucketBuilderNode, graph: $BucketGraph) {
        Object.values(graph.links).forEach(link => {
            if (link.rel === 'composition' && link.keyOwner === 'pivot') {
                throw NesoiError.Builder.Bucket.CompositionThroughPivotNotAllowed({ bucket: this.name, link: link.name });
            }
        })
    }
}

export type AnyBucketBuilder = BucketBuilder<any, any>

export type BucketBuilderNode = ResolvedBuilderNode & {
    builder: AnyBucketBuilder,
    schema?: $Bucket
}