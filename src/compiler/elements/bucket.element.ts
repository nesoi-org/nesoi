import { $BucketModel, $BucketModelField, $BucketModelFields } from '~/elements/entities/bucket/model/bucket_model.schema';
import { Element } from './element';
import { TypeAsObj, ObjTypeAsObj } from '~/engine/util/type';
import { $Bucket } from '~/elements/entities/bucket/bucket.schema';
import { $BucketViewFields, $BucketViews } from '~/elements/entities/bucket/view/bucket_view.schema';
import { $BucketGraphLinks } from '~/elements/entities/bucket/graph/bucket_graph.schema';
import { DumpHelpers } from '../helpers/dump_helpers';
import { NameHelpers } from '~/engine/util/name_helpers';

export class BucketElement extends Element<$Bucket> {

    // Prepare

    protected prepare() {
        this.schema['#data'] = Element.Any;
        this.schema['#modelpath'] = Element.Any;
        this.schema['#querypath'] = Element.Any;
        this.schema['#composition'] = Element.Any;
        this.schema['#defaults'] = Element.Any;
        this.prepareGraph(this.schema.graph.links);
        this.prepareViews(this.schema.views);
    }

    private prepareGraph(links: $BucketGraphLinks) {
        Object.values(links).forEach(field => {
            field['#bucket'] = Element.Any;
            field['#many'] = Element.Any;
        });
    }

    private prepareViews(views: $BucketViews) {
        Object.values(views).forEach(view => {
            view['#data'] = Element.Any;
            this.prepareViewFields(view.fields);
        });
    }

    private prepareViewFields(fields: $BucketViewFields) {
        Object.values(fields).forEach(field => {
            field['#data'] = Element.Any;
            if (field.children) {
                this.prepareViewFields(field.children);
            }
        });
    }

    // Imports 

    protected customImports(nesoiPath: string) {
        // TODO: only include this import if there are computed fields
        return `import { $BucketViewFieldFn } from '${nesoiPath}/lib/elements/entities/bucket/view/bucket_view.schema';\n`
    }

    // Build Type

    protected buildType() {
        const model = this.buildModelType();
        const bucket = DumpHelpers.dumpValueToType(this.schema, {
            model: () => 'any', // = this.buildModelType(),
            graph: () => this.buildGraphType(),
            views: () => this.buildViewsType()
        })
        const modelpath = this.buildModelpath();
        const querypath = this.buildQuerypath();
        const composition = this.buildCompositionType();
        Object.assign(bucket, {
            '#modelpath': modelpath,
            '#querypath': querypath,
            '#composition': composition,
            '#defaults': (bucket as ObjTypeAsObj).defaults || '{}',
            '#data': this.highName
        })
        return {
            model,
            bucket
        };
    }

    private buildModelFieldType(field: $BucketModelField, singleLine = false) {
        let type = 'unknown' as any;

        if (field.type === 'boolean') {
            type = 'boolean';
        }
        else if (field.type === 'date') {
            type = 'NesoiDate';
        }
        else if (field.type === 'datetime') {
            type = 'NesoiDatetime';
        }
        else if (field.type === 'enum') {
            const options = field.meta!.enum!.options as string[];
            if (Array.isArray(options)) {
                type = options.map(v => DumpHelpers.dumpValueToType(v, undefined, singleLine));
            }
            else if (typeof options === 'object') {
                type = Object.keys(options).map(v => DumpHelpers.dumpValueToType(v, undefined, singleLine));
            }
        }
        else if (field.type === 'file') {
            type = 'NesoiFile';
        }
        else if (field.type === 'float') {
            type = 'number';
        }
        else if (field.type === 'int') {
            type = 'number';
        }
        else if (field.type === 'string') {
            type = 'string';
        }
        else if (field.type === 'literal') {
            const regex = field.meta!.literal!.template;
            const rtype = regex
                .replace(/[.][*+]/g,'${string}')
                .replace(/\\d[*+]?/g,'${number}')
                .replace(/\\(.)/g, '$1')
            type = `\`${rtype}\``;
        }
        else if (field.type === 'obj') {
            type = this.buildModelType(field.children!, singleLine);
        }
        else if (field.type === 'unknown') {
            type = 'unknown';
        }
        else if (field.type === 'dict') {
            type = this.buildModelType({
                '[x in string]': field.children!['#']
            }, singleLine)
        }
        else if (field.type === 'list') {
            type = this.buildModelFieldType(field.children!['#'])
            if (typeof type === 'object') {
                type.__array = true;
            }
            else {
                type = `(${type})[]`;
            }
        }
        else if (field.type === 'union') {
            const types = Object.values(this.buildModelType(field.children, singleLine))
            type = DumpHelpers.dumpUnionType(types, singleLine)
        }
        if (!field.required) {
            type = '('
                + DumpHelpers.dumpType(type, singleLine)
                + ' | null | undefined'
                + ')';
        }
        return type;
    }

    private buildCompositionType() {
        const composition: ObjTypeAsObj = {};
        Object.values(this.schema.graph.links).forEach(link => {
            if (link.rel === 'composition') {
                const bucket = NameHelpers.tagType(link.bucket, this.module);
                composition[link.name] = {
                    bucket,
                    many: link.many.toString(),
                    optional: link.optional.toString()
                }
            }
        })
        return composition;
    }

    public buildModelType(fields: $BucketModelFields = this.schema.model.fields, singleLine = false) {
        const model = {} as ObjTypeAsObj;
        Object.entries(fields).forEach(([key, field]) => {
            model[key] = this.buildModelFieldType(field, singleLine)
        });
        return model;
    }

    public buildModelpath() {
        const modelpath: Record<string, TypeAsObj> = {
            '[x: string]': 'any'
        };

        // const fields = $BucketModel.getModelpaths(this.schema.model);
        // console.log({fields});
        // for (const k in fields) {
        //     modelpath[k] = DumpHelpers.dumpUnionType(
        //         fields[k].map(field => this.buildModelFieldType(field, true))
        //         , true)
        //     console.log(k, modelpath[k]);
        // }

        return modelpath;
    }

    public buildQuerypath(fields: $BucketModelFields = this.schema.model.fields) {
        const querypath: Record<string, TypeAsObj> = {
            '[x: string]': 'any'
        };
        return querypath;
    }

    private buildGraphType() {
        const links = {} as ObjTypeAsObj;
        Object.entries(this.schema.graph.links).forEach(([key, link]) => {
            links[key] = DumpHelpers.dumpValueToType(link);
            const bucket = NameHelpers.tagType(link.bucket, this.module);
            Object.assign(links[key], {
                '#bucket': bucket,
                '#many': link.many.toString()
            })
        });
        return {
            $t: DumpHelpers.dumpValueToType('bucket.graph'),
            links
        };
    }

    private buildViewsType() {
        const views = {} as ObjTypeAsObj;
        Object.entries(this.schema.views).forEach(([key, view]) => {
            views[key] = this.buildViewType(view.fields, key);
        });
        return views;
    }

    private buildViewType(schema: $BucketViewFields, name: string) {
        if (!schema) { return }

        const buildFields = (fields: $BucketViewFields): ObjTypeAsObj => {
            
            const data = {} as ObjTypeAsObj;

            for (const key in fields) {
                const field = fields[key];

                if (field.scope === 'model' && 'model' in field.meta) {
                    const modelFields = $BucketModel.getField(this.schema.model, field.meta.model!.path);

                    const types = [];
                    if (!field.children || '__raw' in field.children) {
                        types.push(DumpHelpers.dumpUnionType(
                            modelFields.map(f =>this.buildModelFieldType(f))
                        ));
                    }
                    // Contains children
                    if (field.children) {
                        types.push(buildFields(field.children));
                    }
                    data[key] = DumpHelpers.dumpIntersectionType(types);
                }
                else if (field.scope === 'graph' && 'graph' in field.meta) {
                    const link = this.schema.graph.links[field.meta.graph!.link];
                    const bucket = NameHelpers.tagType(link.bucket, this.module);
                    if (field.meta.graph!.view) {
                        data[key] = `${bucket}['views']['${field.meta.graph!.view}']['#data']${link.many ? '[]' : ''}${link.optional ? ' | undefined' : ''}`
                    }
                    else {
                        data[key] = `${bucket}['#data']${link.many ? '[]' : ''}${link.optional ? ' | undefined' : ''}`
                    }
                } 
                else if (field.scope === 'computed') {
                    data[key] = field['#data'];
                }
                else if (field.scope === 'view' || field.scope === 'group') {
                    const children = this.buildViewType(field.children!, field.name)!;
                    data[key] = children['#data']
                }
            }

            return data;
        }

        const data = buildFields(schema);

        return {
            $t: DumpHelpers.dumpValueToType('bucket.view'),
            fields: 'any',
            '#data': data,
            name: DumpHelpers.dumpValueToType(name),
        };
    }

    // Dump

    public dumpTypeSchema() {
        this.type = this.buildType();
        this.prepare();
        const type = this.type as ObjTypeAsObj;
        const obj = `export type ${this.highName} = ${DumpHelpers.dumpType(type.model)};\n`;
        const bucket = `export interface ${this.typeName} extends $Bucket ${DumpHelpers.dumpType(type.bucket)};\n`;
        return obj + '\n' + bucket;
    }

    //

    public static buildModelTypeFromSchema(model: $BucketModel) {
        // This currently breaks with enum, which are module-level
        // Since this method is used to build space-level models
        const el = {
            buildModelType: BucketElement.prototype.buildModelType,
            buildModelFieldType: BucketElement.prototype.buildModelFieldType
        } as any;
        return el.buildModelType.bind(el)(model.fields);
    }

}