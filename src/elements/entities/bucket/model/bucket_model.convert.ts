import { $BucketModel, $BucketModelField, $BucketModelFields } from '~/elements/entities/bucket/model/bucket_model.schema';
import { BucketViewBuilder } from '~/elements/entities/bucket/view/bucket_view.builder';
import { $BucketView, $BucketViewFields } from '~/elements/entities/bucket/view/bucket_view.schema';
import { $MessageTemplate, $MessageTemplateField, $MessageTemplateFields } from '~/elements/entities/message/template/message_template.schema';
import { $BucketGraph } from '../graph/bucket_graph.schema';
import { BucketViewFieldBuilder, BucketViewFieldFactory } from '../view/bucket_view_field.builder';
import { $Message } from '~/elements/entities/message/message.schema';

/**
 * @category Elements
 * @subcategory Entity
 * */
export function convertToView<
    Model extends $BucketModel
>(
    model: Model,
    name: string,
    fields: $BucketModelFields = model.fields,
    path?: string,
    depth = 0
) {
    const view = new BucketViewBuilder(name);
    const convertFields = (fields: $BucketModelFields) => {
        const viewFields = {} as $BucketViewFields;
        for (const f in fields) {
            const field = fields[f];
            const $ = new BucketViewFieldFactory();

            const key = (path ? path+'.' : '')
                + field.name;
            
            const builder = $.model(key as never);
            const graph = new $BucketGraph();
            viewFields[f] = BucketViewFieldBuilder.build(builder, model, graph, {}, field.name, depth);
        }
        return viewFields;
    };
    const v=  new $BucketView(
        name,
        convertFields(fields)
    );
    return v;
}

/**
 * @category Elements
 * @subcategory Entity
 * */
export function convertToMessage<
    Model extends $BucketModel
>(
    module: string,
    model: Model,
    name: string,
    alias: string,
    include: string[]=[],
    exclude: string[]=[],
    optional: string[]=[]
) {
    const convertField = (field: $BucketModelField): $MessageTemplateField => {
        return new $MessageTemplateField(
            field.type,
            field.name,
            field.alias,
            field.path,
            field.path,
            optional.includes(field.path) ? false : field.required,
            undefined,
            false,
            [],
            {
                enum: field.meta?.enum
            },
            field.children ? convertFields(field.children) : undefined
        )
    }
    const convertFields = (fields: $BucketModelFields) => {
        const msgFields = {} as $MessageTemplateFields;
        for (const f in fields) {
            const field = fields[f];
            if (
                (include.length && !include.includes(field.path))
                || exclude.includes(field.path)
            ) {
                continue;
            }
            msgFields[f] = convertField(field);
        }
        return msgFields;
    };
    
    const msgFields = convertFields(model.fields);
    const template = new $MessageTemplate(msgFields);

    return new $Message(
        module,
        name,
        alias,
        template
    );
}