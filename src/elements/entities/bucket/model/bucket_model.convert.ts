import { $BucketModel, $BucketModelFields } from '~/elements/entities/bucket/model/bucket_model.schema';
import { BucketViewBuilder } from '~/elements/entities/bucket/view/bucket_view.builder';
import { $BucketView, $BucketViewFields } from '~/elements/entities/bucket/view/bucket_view.schema';
import { $MessageTemplate, $MessageTemplateField, $MessageTemplateFields } from '~/elements/entities/message/template/message_template.schema';
import { $BucketGraph } from '../graph/bucket_graph.schema';
import { BucketViewFieldBuilder, BucketViewFieldFactory } from '../view/bucket_view_field.builder';
import { $Message } from '~/elements/entities/message/message.schema';
import { $Dependency } from '~/engine/dependency';

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
    const convertFields = (fields: $BucketModelFields, include: string[]=[], exclude: string[]=[], root='') => {
        const msgFields = {} as $MessageTemplateFields;
        for (const f in fields) {
            const field = fields[f];
            const path = root.length ? `${root}.${f}` : f;
            if (
                (include.length && !include.includes(path))
                || exclude.includes(path)
            ) {
                continue;
            }
            msgFields[f] = new $MessageTemplateField(
                field.type,
                field.name,
                field.alias,
                path,
                field.array,
                field.required,
                undefined,
                false,
                [],
                {
                    enum: field._enum ? {
                        options: field._enum.options,
                        dep: field._enum.dep ? new $Dependency(module,'constants', `${field._enum.dep.module}::${field._enum.dep.name}`) : undefined
                    } : undefined
                },
                field.children ? convertFields(field.children, include, exclude) : undefined
            );
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