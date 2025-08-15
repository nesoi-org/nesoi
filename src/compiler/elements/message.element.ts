import { $Message } from '~/elements/entities/message/message.schema';
import { Element, ObjTypeAsObj } from './element';
import { NameHelpers } from '~/engine/util/name_helpers';
import { $Dependency, $Tag } from '~/engine/dependency';
import { $MessageTemplateField, $MessageTemplateFields } from '~/elements/entities/message/template/message_template.schema';
import { DumpHelpers } from '../helpers/dump_helpers';

export class MessageElement extends Element<$Message> {

    protected prepare() {
        this.schema['#raw'] = Element.Any;
        this.schema['#parsed'] = Element.Any;
        this.prepareFields(this.schema.template.fields);
    }

    private prepareFields(fields: $MessageTemplateFields) {
        Object.values(fields).forEach(field => {
            field['#raw'] = Element.Any;
            field['#parsed'] = Element.Any;
            if (field.children) {
                this.prepareFields(field.children);
            }
        });
    }


    protected customImports(nesoiPath: string) {
        // TODO: only include this import if there are computed fields
        return `import { $MessageTemplateRule } from '${nesoiPath}/lib/elements/entities/message/template/message_template.schema'`
    }

    protected buildType() {
        const { input, output } = this.buildIO();
        const type = DumpHelpers.dumpValueToType(this.schema, {
            template: v => 'any'
        })
        Object.assign(type, {
            '#raw': {
                $: DumpHelpers.dumpValueToType(this.lowName),
                ...(input as Record<string, any>)
            },
            '#parsed': {
                $: DumpHelpers.dumpValueToType(this.lowName),
                ...(output as Record<string, any>)
            }
        });
        return type;
    }

    private buildIO(fields = this.schema.template.fields) {
        const input = {} as ObjTypeAsObj;
        const output = {} as ObjTypeAsObj;

        const buildField = (key: string, field: $MessageTemplateField, isUnion = false) => {

            if (field.type === 'boolean') {
                input[key] = 'boolean';
                output[key] = 'boolean';
            }
            else if (field.type === 'date') {
                input[key] = 'string';
                output[key] = 'NesoiDate';
            }
            else if (field.type === 'datetime') {
                input[key] = 'string';
                output[key] = 'NesoiDatetime';
            }
            else if (field.type === 'enum') {
                const options = field.meta.enum!.options;
                if (typeof options === 'string') {
                    const constants = this.compiler.tree.getSchema(field.meta.enum!.dep!);
                    const constName = NameHelpers.names(constants);
                    
                    const tag = $Tag.parseOrFail(options);
                    const moduleName = constName.high + 'Module';
                    let enumkeys;
                    if (tag.module || constants.module !== this.module) {
                        const key = tag.name || options;
                        const enumpath = key.match(/(.*)\.\{(.*)\}$/);
                        enumkeys = enumpath
                            ? `keyof ${moduleName}['constants']['enums']['${enumpath[1]}']['options']`
                            : `keyof ${moduleName}['constants']['enums']['${key}']['options']`;
                    }
                    else {
                        const enumpath = options.match(/(.*)\.\{(.*)\}$/);
                        enumkeys = enumpath
                            ? `keyof ${constName.type}['enums']['${enumpath[1]}']['options']`
                            : `keyof ${constName.type}['enums']['${options}']['options']`;
                    }

                    input[key] = enumkeys;
                    output[key] = enumkeys;

                }
                else if (Array.isArray(options)) {
                    input[key] = options.map(v => DumpHelpers.dumpValueToType(v));
                    output[key] = options.map(v => DumpHelpers.dumpValueToType(v));
                }
                else if (typeof options === 'object') {
                    input[key] = Object.keys(options || []).map(v => DumpHelpers.dumpValueToType(v));
                    output[key] = Object.values(options || []).map(v => DumpHelpers.dumpValueToType(v));
                }
            }
            else if (field.type === 'file') {
                input[key] = 'NesoiFile';
                output[key] = 'NesoiFile';
            }
            else if (field.type === 'float') {
                input[key] = 'number';
                output[key] = 'number';
            }
            else if (field.type === 'id') {
                const ref = field.meta.id!.bucket;
                const modelName = $Dependency.typeName(ref, this.module);
                input[key+'_id'] = `${modelName}['#data']['id']`;
                output[key] = `${modelName}['#data']`;
            }
            else if (field.type === 'int') {
                input[key] = 'number';
                output[key] = 'number';
            }
            else if (field.type === 'string') {
                input[key] = 'string';
                output[key] = 'string';
            }
            else if (field.type === 'string_or_number') {
                input[key] = '(string | number)';
                output[key] = '(string | number)';
            }
            else if (field.type === 'obj') {
                const child = this.buildIO(field.children!);
                input[key] = child.input;
                output[key] = child.output;
            }
            else if (field.type === 'dict') {
                const child = this.buildIO(field.children!);
                input[key] = {
                    '[x in string]': child.input['#']
                };
                output[key] = {
                    '[x in string]': child.output['#']
                };
            }
            else if (field.type === 'list') {
                const child = this.buildIO(field.children!);
                input[key] = child.input['#'];
                output[key] = child.output['#'];
                if (typeof input[key] === 'object') {
                    input[key].__array = true;
                }
                else {
                    input[key] = `(${input[key]})[]`;
                }
                if (typeof output[key] === 'object') {
                    output[key].__array = true;
                }
                else {
                    output[key] = `(${output[key]})[]`;
                }
            }
            else if (field.type === 'union') {
                const child = this.buildIO(field.children!);
                input[key] = '(' + Object.values(child.input).map(t => DumpHelpers.dumpType(t)).join( ' | ') + ')';
                output[key] = '(' + Object.values(child.output).map(t => DumpHelpers.dumpType(t)).join( ' | ') + ')';
            }
            else if (field.type === 'msg') {
                input[key] = 'any';
                output[key] = 'any';
            }
            else {
                input[key] = 'unknown';
                output[key] = 'unknown';
            }

            if (!field.required || field.nullable) {
                const inkey = field.type === 'id' ? `${key}_id` : key;
                input[inkey] = '('
                    + DumpHelpers.dumpType(input[inkey])
                    + (!field.required ? ' | undefined' : '')
                    + (field.nullable ? ' | null' : '')
                    + ')';
                output[key] = '('
                    + DumpHelpers.dumpType(output[key])
                    + ((!field.required && field.defaultValue === undefined) ? ' | undefined' : '')
                    + (field.nullable ? ' | null' : '')
                    + ')';
            }

        };
        Object.entries(fields).forEach(([key, field]) => {
            buildField(key, field)
        })
        return { input, output };
    }


}