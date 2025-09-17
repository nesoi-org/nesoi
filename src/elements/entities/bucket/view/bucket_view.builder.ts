import { $BucketView, $BucketViewField, $BucketViews } from './bucket_view.schema';
import { $BucketModel } from '../model/bucket_model.schema';
import { $BucketGraph } from '../graph/bucket_graph.schema';
import { BucketViewFieldBuilder, BucketViewFieldBuilders, BucketViewFieldFactory } from './bucket_view_field.builder';
import { $Bucket } from '../bucket.schema';
import { $Module, $Space } from '~/elements';
import { ModuleTree } from '~/engine/tree';

/**
 * @category Builders
 * @subcategory Entity
 * */
export class BucketViewBuilder<
    Space extends $Space,
    Module extends $Module,
    Bucket extends $Bucket
> {

    private _fields: BucketViewFieldBuilders <any>= {};

    constructor(
        private name: string
    ) {}
    
    public fields($: BucketViewDef<Space, Module, Bucket>) {
        const fieldBuilder = new BucketViewFieldFactory();
        this._fields = $(fieldBuilder as never);
        return this;
    }

    // Build

    public static build(builder: BucketViewBuilder<any, any, any>, model: $BucketModel, graph: $BucketGraph, views: $BucketViews, tree: ModuleTree) {
        const fields = BucketViewFieldBuilder.buildFields(builder._fields, model, graph, views, undefined, tree);
        const schema = new $BucketView(builder.name, fields);
        schema.fields.id = new $BucketViewField('id', 'model', 'id', { model: { path: 'id' }});
        return schema;
    }

}

export type BucketViewDef<
    Space extends $Space,
    Module extends $Module,
    Bucket extends $Bucket
> = ($: BucketViewFieldFactory<Space, Module, Bucket>) => BucketViewFieldBuilders<Bucket>