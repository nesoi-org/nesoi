import { $Module, $Space } from '~/schema';
import { $BucketModel, $BucketModelField, $BucketModelFields } from './bucket_model.schema';
import { BucketModelFieldBuilder, BucketModelFieldBuilders, BucketModelFieldFactory } from './bucket_model_field.builder';

/*
    Builder
*/

export class BucketModelBuilder<
    Module extends $Module
> {
    
    constructor(
        private module: string
    ) {}

    private builders: BucketModelFieldBuilders<Module> = {}; 
    
    fields(builders: BucketModelFieldBuilders<Module>) {
        this.builders = builders;
        return this;
    }

    // Build

    public static build(builder: BucketModelBuilder<any>) {
        const fields = BucketModelFieldBuilder.buildChildren(builder.module, builder.builders);
        return new $BucketModel(
            fields.schema as $BucketModelFields & { id: $BucketModelField },
            fields.defaults
        );
    }

}

/*
    Def
*/

export type BucketModelDef<
    Space extends $Space,
    Module extends $Module
> = ($: BucketModelFieldFactory<Space, Module>) => {
    id: BucketModelFieldBuilder<Module, any>
} & BucketModelFieldBuilders<Module>
