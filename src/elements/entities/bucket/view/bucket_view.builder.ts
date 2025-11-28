import type { $BucketViews } from './bucket_view.schema';
import type { $BucketModel } from '../model/bucket_model.schema';
import type { $BucketGraph } from '../graph/bucket_graph.schema';
import type { BucketViewFieldBuilders} from './bucket_view_field.builder';
import type { $Bucket } from '../bucket.schema';
import type { $Module, $Space } from '~/elements';
import type { ModuleTree } from '~/engine/tree';

import { $BucketView, $BucketViewField } from './bucket_view.schema';
import { BucketViewFieldBuilder, BucketViewFieldFactory } from './bucket_view_field.builder';

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