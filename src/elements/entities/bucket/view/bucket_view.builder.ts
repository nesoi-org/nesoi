import { $BucketView, $BucketViewField, $BucketViews } from './bucket_view.schema';
import { $BucketModel } from '../model/bucket_model.schema';
import { $BucketGraph } from '../graph/bucket_graph.schema';
import { BucketViewFieldBuilder, BucketViewFieldBuilderTree, BucketViewFieldFactory } from './bucket_view_field.builder';
import { $Bucket } from '../bucket.schema';
import { $Module, $Space } from '~/elements';

export class BucketViewBuilder<
    Space extends $Space,
    Module extends $Module,
    Bucket extends $Bucket
> {

    private _fields: BucketViewFieldBuilderTree = {};

    constructor(
        private name: string
    ) {}
    
    public fields($: BucketViewDef<Space, Module, Bucket>) {
        const fieldBuilder = new BucketViewFieldFactory(this);
        this._fields = $(fieldBuilder);
        return this;
    }

    // Build

    public static build(builder: BucketViewBuilder<any, any, any>, model: $BucketModel, graph: $BucketGraph, views: $BucketViews) {
        const fields = BucketViewFieldBuilder.buildFields(builder._fields, model, graph, views);
        const schema = new $BucketView(builder.name, fields);
        schema.fields.id = new $BucketViewField('id', 'model', 'id', 'id', false, true, { model: { key: 'id' }});
        return schema;
    }

}

export type BucketViewDef<
    Space extends $Space,
    Module extends $Module,
    Bucket extends $Bucket
> = ($: BucketViewFieldFactory<Space, Module, Bucket>) => BucketViewFieldBuilderTree