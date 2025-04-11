import { $BucketModel, $BucketModelField, $BucketModelFields } from '~/elements/entities/bucket/model/bucket_model.schema';
import { Element, ObjTypeAsObj, TypeAsObj } from './element';
import { $Bucket } from '~/elements/entities/bucket/bucket.schema';
import { $BucketViewFields, $BucketViews } from '~/elements/entities/bucket/view/bucket_view.schema';
import { NameHelpers } from '../helpers/name_helpers';
import { $Dependency, $Tag } from '~/engine/dependency';
import { $Constants } from '~/elements/entities/constants/constants.schema';
import { Tree } from '~/engine/data/tree';
import { $BucketGraphLinks } from '~/elements/entities/bucket/graph/bucket_graph.schema';
import { DumpHelpers } from '../helpers/dump_helpers';

export class BucketElement extends Element<$Bucket> {

    // Prepare

    protected prepare() {
        this.schema['#data'] = Element.Any;
        this.schema['#fieldpath'] = Element.Any;
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
            else {
                field.children = Element.Never;
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
            graph: () => this.buildGraphType(),
            views: () => this.buildViewsType(model)
        })
        const fieldpaths = this.buildModelFieldNamesType(model);
        const composition = this.buildCompositionType();
        Object.assign(bucket, {
            '#fieldpath': fieldpaths,
            '#composition': composition,
            '#defaults': (bucket as ObjTypeAsObj).defaults || '{}',
            '#data': this.highName
        })
        return {
            model,
            bucket
        };
    }

    private buildModelFieldType(field: $BucketModelField) {
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
            const options = field._enum!.options;
            if (typeof options === 'string') {
                const constants = this.compiler.tree.getSchema(field._enum!.dep!) as $Constants;
                const constName = NameHelpers.names(constants);
                const tag = $Tag.parseOrFail(options);
                if (tag.module || constants.module !== this.module) {
                    const moduleName = constName.high + 'Module';
                    type = `keyof ${moduleName}['constants']['enums']['${tag.name || options}']['options']`;
                }
                else {
                    type = `keyof ${constName.type}['enums']['${options}']['options']`;
                }
            }
            else if (Array.isArray(options)) {
                type = options.map(v => DumpHelpers.dumpValueToType(v));
            }
            else if (typeof options === 'object') {
                type = Object.values(options || []).map(v => DumpHelpers.dumpValueToType(v));
            }
        }
        else if (field.type === 'file') {
            type = 'File';
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
        else if (field.type === 'obj') {
            type = this.buildModelType(field.children!);
        }
        else if (field.type === 'unknown') {
            type = 'unknown';
        }
        else if (field.type === 'dict') {
            type = this.buildModelType({
                '[x in string]': field.children!.__dict
            })
        }
        if (!field.required && field.defaultValue === undefined) {
            if (typeof type === 'object') {
                type.__optional = true;
            }
            else {
                type += ' | undefined';
            }
        }
        if (field.array) {
            if (typeof type === 'object') {
                type.__array = true;
            }
            else {
                type += '[]';
            }
        }
        if (field.or) {
            const orType = this.buildModelFieldType(field.or);
            if (typeof type === 'object') {
                type.__or = orType;
            }
            else if (typeof orType === 'object') {
                type = orType;
                type.__or = orType;
            }
            else {
                type = `${type} | ${orType}`
            }
        }
        return type;
    }

    private buildCompositionType() {
        const composition: ObjTypeAsObj = {};
        Object.values(this.schema.graph.links).forEach(link => {
            if (link.rel === 'composition') {
                const bucket = $Dependency.typeName(link.bucket, this.module);
                composition[link.name] = {
                    bucket,
                    many: link.many.toString(),
                    optional: link.optional.toString()
                }
            }
        })
        return composition;
    }

    public buildModelType(fields: $BucketModelFields = this.schema.model.fields) {
        const model = {} as ObjTypeAsObj;
        Object.entries(fields).forEach(([key, field]) => {
            model[key] = this.buildModelFieldType(field)
        });
        return model;
    }

    public buildModelFieldNamesType(model: ObjTypeAsObj, fields: $BucketModelFields = this.schema.model.fields, path?: string) {
        const fieldPaths: Record<string, TypeAsObj> = {};
        Object.entries(fields).forEach(([key, field]) => {
            if (key === '__dict') { return }
            const keyPath = (path ? path+'.' : '') + key;
            fieldPaths[keyPath] = model[key];
            if (field.children) {
                let nextFields = field.children;
                let nextKey = keyPath;
                if ('__dict' in field.children) {
                    nextFields = field.children.__dict.children as any;
                    nextKey += '.*';
                }
                if (field.array) nextKey += '.*';
                if (nextFields) {
                    Object.assign(
                        fieldPaths,
                        this.buildModelFieldNamesType(model[key], nextFields, nextKey)
                    );
                }
            }
            
        })
        return fieldPaths;
    }

    private buildGraphType() {
        const links = {} as ObjTypeAsObj;
        Object.entries(this.schema.graph.links).forEach(([key, link]) => {
            links[key] = DumpHelpers.dumpValueToType(link);
            const bucket = $Dependency.typeName(link.bucket, this.module);
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

    private buildViewsType(model: ObjTypeAsObj) {
        const views = {} as ObjTypeAsObj;
        Object.entries(this.schema.views).forEach(([key, view]) => {
            views[key] = this.buildViewType(model, view.fields, key);
        });
        return views;
    }

    private buildViewType(model: ObjTypeAsObj, schema: $BucketViewFields, name: string) {
        if (!schema) { return }

        const fields = {} as ObjTypeAsObj;
        const data = {} as ObjTypeAsObj;
        Object.entries(schema).forEach(([key, field]) => {
            if (field.scope === 'model' && 'model' in field.value) {
                data[key] = Tree.get(model, field.value.model!.key, 0) || {};
                
                let children;
                if (field.type === 'obj') {
                    children = field.children &&
                        this.buildViewType(model, field.children, field.name);
                    data[key] = Object.assign({}, data[key], children?.['#data'])
                }

                fields[key] = {
                    '#data': data[key],
                    children: children?.fields
                };
            }
            else if (field.scope === 'graph' && 'graph' in field.value) {
                const link = this.schema.graph.links[field.value.graph!.link];
                const bucket = $Dependency.typeName(link.bucket, this.module);
                if (field.value.graph!.view) {
                    data[key] = `${bucket}['views']['${field.value.graph!.view}']['#data']${link.many ? '[]' : ''}${link.optional ? ' | undefined' : ''}`
                }
                else {
                    data[key] = `${bucket}['#data']${link.many ? '[]' : ''}${link.optional ? ' | undefined' : ''}`
                }
                fields[key] = {
                    '#data': data[key],
                    children: 'undefined'
                };
            } 
            else if (field.scope === 'computed') {
                data[key] = field['#data'];
                fields[key] = {
                    '#data': data[key],
                    children: 'undefined'
                };
            }
            else if (field.scope === 'view' || field.scope === 'group') {
                const children = this.buildViewType(model, field.children!, field.name)!;
                data[key] = children['#data']
                fields[key] = {
                    '#data': data[key],
                    children: children.fields
                };
            }
            const { children, ...f } = field;
            const type = DumpHelpers.dumpValueToType(f, {
                $t: () => DumpHelpers.dumpValueToType('bucket.view.field'),
                value: {
                    model: v => ({
                        key: DumpHelpers.dumpValueToType(v.key),
                        enumOptions: v.enumOptions ? DumpHelpers.dumpValueToType(v.enumOptions) : 'undefined'
                    }),
                    graph: v => ({
                        link: DumpHelpers.dumpValueToType(v.link),
                        view: v.view ? DumpHelpers.dumpValueToType(v.view) : 'undefined'
                    })
                }
            });
            Object.assign(fields[key], type)
        });
        return {
            $t: DumpHelpers.dumpValueToType('bucket.view'),
            '#data': data,
            name: DumpHelpers.dumpValueToType(name),
            fields: 'any' // TODO: review if this might be needed
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
            buildModel: BucketElement.prototype.buildModelType,
            buildModelFieldType: BucketElement.prototype.buildModelFieldType
        } as any;
        return el.buildModel.bind(el)(model.fields);
    }

}