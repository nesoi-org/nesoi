import { $BucketModel, $BucketModelField, $BucketModelFields } from '~/elements/entities/bucket/model/bucket_model.schema';
import { BucketViewBuilder } from '~/elements/entities/bucket/view/bucket_view.builder';
import { $BucketView, $BucketViewFields } from '~/elements/entities/bucket/view/bucket_view.schema';
import { $MessageTemplate, $MessageTemplateField, $MessageTemplateFields } from '~/elements/entities/message/template/message_template.schema';
import { $BucketGraph } from '../graph/bucket_graph.schema';
import { BucketViewFieldBuilder, BucketViewFieldFactory } from '../view/bucket_view_field.builder';
import { $Message } from '~/elements/entities/message/message.schema';
import { $Dependency } from '~/engine/dependency';

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
    path?: string
) {
    const view = new BucketViewBuilder(name);
    const convertFields = (fields: $BucketModelFields) => {
        const viewFields = {} as $BucketViewFields;
        for (const f in fields) {
            const field = fields[f];
            const $ = new BucketViewFieldFactory(view);

            const key = (path ? path+'.' : '')
                + field.name;
            
            const builder = $.model(key as never);
            const graph = new $BucketGraph();
            viewFields[f] = BucketViewFieldBuilder.build(builder, model, graph, {}, field.name);
        }
        return viewFields;
    };
    return new $BucketView(
        name,
        convertFields(fields)
    );
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
    exclude: string[]=[]
) {
    const convertField = (field: $BucketModelField): $MessageTemplateField => {
        return new $MessageTemplateField(
            field.type,
            field.name,
            field.alias,
            field.path,
            field.path,
            field.array,
            field.required,
            undefined,
            false,
            [],
            {
                enum: field.meta?.enum ? {
                    options: field.meta.enum.options,
                    dep: field.meta.enum.dep ? new $Dependency(module,'constants', `${field.meta.enum.dep.module}::${field.meta.enum.dep.name}`) : undefined
                } : undefined
            },
            field.children ? convertFields(field.children, include, exclude) : undefined,
            field.or ? convertField(field.or) : undefined
        )
    }
    const convertFields = (fields: $BucketModelFields, include: string[]=[], exclude: string[]=[], root='') => {
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
    
    const msgFields = convertFields(model.fields, include, exclude);
    const template = new $MessageTemplate(msgFields);

    return new $Message(
        module,
        name,
        alias,
        template
    );
}