import { $Module, $Space, BucketName } from '~/schema';
import { BucketGraphBuilder, BucketGraphDef } from './graph/bucket_graph.builder';
import { $BucketView, $BucketViews } from './view/bucket_view.schema';
import { BucketViewBuilder, BucketViewDef } from './view/bucket_view.builder';
import { $Bucket, $BucketTenancy } from './bucket.schema';
import { BucketModelBuilder, BucketModelDef } from './model/bucket_model.builder';
import { $BucketModel, $BucketModelFields } from './model/bucket_model.schema';
import { convertToView } from '~/elements/entities/bucket/model/bucket_model.convert';
import { $BucketViewDataInfer, $BucketViewFieldsInfer } from './bucket.infer';
import { BucketModelFieldFactory } from './model/bucket_model_field.builder';
import { BucketGraphLinkBuilders, BucketGraphLinkFactory } from './graph/bucket_graph_link.builder';
import { $BucketGraphLinksInfer } from './graph/bucket_graph.infer';
import { $BucketGraph } from './graph/bucket_graph.schema';
import { $Dependency, ResolvedBuilderNode } from '~/engine/dependency';
import { ModuleTree } from '~/engine/tree';
import { BucketModelpathInfer, BucketModelInfer, BucketQuerypathInfer } from './model/bucket_model.infer';
import { Overlay } from '~/engine/util/type';
import { $ConstantEnum, $Constants } from '../constants/constants.schema';
import { NesoiError } from '~/engine/data/error';
import { NesoiObj } from '~/engine/data/obj';

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

    private _extend?: $Dependency;

    private _alias?: string;
    
    private _model!: $BucketModel;
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
    >(name: N) {
        this._extend = new $Dependency(this.module, 'bucket', name as string);
        return this as unknown as BucketBuilder<
            Space,
            Module,
            Module['buckets'][N]
        >;
    }

    model<
        Def extends BucketModelDef<Space, Module>,
        Obj = BucketModelInfer<Def>,
        Modelpath extends {} = BucketModelpathInfer<Def>,
        Querypath extends {} = BucketQuerypathInfer<Def>
    >($: Def) {
        const fieldBuilder = new BucketModelFieldFactory(this.module);
        const fields = $(fieldBuilder);
        const builder = new BucketModelBuilder(this.module).fields(fields);
        this._model = BucketModelBuilder.build(builder);
        type _Bucket = Overlay<Bucket, {
            '#data': Obj & NesoiObj,
            '#modelpath': Modelpath
            '#querypath': Querypath
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
        Def extends BucketViewDef<Space, Module, Bucket>
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

        // If there's an external bucket linked, merge some of
        // the information before starting.
        let $ext;
        const extend = node.builder._extend;
        if (extend) {
            $ext = tree.getSchema(extend) as $Bucket | undefined;

            // Model
            node.builder._model = Object.assign({}, $ext?.model || {}, node.builder._model);

            // Enums
            // (In order to avoid having to import constants definitions for extended buckets)
            const constants = tree.getSchema({
                module: extend.module,
                type: 'constants',
                name: '*'
            }) as $Constants;
            this.mergeModelEnums( node.builder._model.fields, constants);
        }

        const graph = BucketBuilder.buildGraph(node, tree, extend);
        const views = BucketBuilder.buildViews(node.builder, graph, tree, extend);

        node.schema = new $Bucket(
            node.builder.module,
            node.builder.name,
            node.builder._alias || $ext?.alias || node.builder.name,
            node.builder._model,
            graph,
            views,
            node.builder._tenancy,
            extend
        );

        return node.schema;
    }

    static mergeModelEnums(fields: $BucketModelFields, constants: $Constants) {
        Object.values(fields).forEach(field => {
            if (field.type === 'enum' && typeof field.meta?.enum?.options === 'string') {
                field.meta.enum = {
                    options: $ConstantEnum.keys(constants.enums[field.meta.enum.options])
                }
            }
            if (field.children) {
                this.mergeModelEnums(field.children, constants);
            }
        })
    }

    static buildGraph(node: BucketBuilderNode, tree: ModuleTree, extend?: $Dependency) {
        const links = {} as $BucketGraph['links'];

        if (extend) {
            const ext = tree.getSchema(extend) as $Bucket;
            Object.assign(links, ext.graph.links);
        }

        const graphBuilder = new BucketGraphBuilder().links(node.builder._graph);
        const graph = BucketGraphBuilder.build(node, graphBuilder);

        graph.links = Object.assign(graph.links, links);
        return graph;
    }

    static buildViews(builder: AnyBucketBuilder, graph: $BucketGraph, tree: ModuleTree, extend?: $Dependency) {       
        const views = {
            default: convertToView(builder._model, 'default')
        } as $BucketViews;

        if (extend) {
            const ext = tree.getSchema(extend) as $Bucket;
            Object.assign(views, ext.views);
        }

        for (const v in builder._views) {
            views[v] = BucketViewBuilder.build(builder._views[v], builder._model, graph, views);
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