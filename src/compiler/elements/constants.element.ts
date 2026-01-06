import { Element } from './element';
import type { ObjTypeNode} from '../types/type_compiler';
import { t, TypeInterface, TypeNamespace } from '../types/type_compiler';
import { NameHelpers } from '~/engine/util/name_helpers';

export class ConstantsElement extends Element<$Constants> {

    // Schema

    protected prepare() {
        this.schema['#enumpath'] = Element.Never;
        Object.values(this.schema.enums).forEach(_enum => {
            _enum['#data'] = Element.Never;
        });
    }

    // Interface

    public buildInterfaces() {
        
        this.interface.name = 'Constants';
        this.child_namespace = new TypeNamespace('Constants');

        const values = this.makeValues();
        const enums = this.makeEnums();
        const enumpath = this.makeEnumpath(enums.type);    

        for (const e in values.interfaces) {
            this.child_namespace.add(values.interfaces[e])
        }
        for (const e in enums.interfaces) {
            this.child_namespace.add(enums.interfaces[e])
        }

        this.interface
            .extends('$Constants')
            .set({
                // '#enumpath': enumpath,
                module: t.literal(this.module),
                name: t.literal(this.lowName),
                values: values.type,
                enums: enums.type
            })
    }

    // [Makers]

    private makeValues() {
        const interfaces: Record<string, TypeInterface> = {};
        const type = t.obj({});

        Object.entries(this.schema.values).forEach(([key, val]) => {
            
            const typeName = val.name;
            interfaces[key] = new TypeInterface(typeName)
                .extends('$ConstantValue')
                .set({
                    module: t.literal(this.module),
                    name: t.literal(val.name),
                    scope: t.literal(val.scope),
                    key: val.key ? t.literal(val.key) : t.undefined(),
                    value: val.value
                        ? typeof val.value === 'string' ? t.literal(val.value) : t.dynamic(val.value)
                        : t.undefined(),
                })
            type.children[key] = t.ref(this.child_namespace!, typeName);
        })

        return { interfaces, type }
    }

    private makeEnums() {
        const interfaces: Record<string, TypeInterface> = {};
        const type = t.obj({});

        Object.entries(this.schema.enums).forEach(([key, val]) => {
            const options = t.obj({});
            const data = t.obj({});

            Object.entries(val.options).forEach(([optKey, optVal]) => {
                const value = t.dynamic(optVal.value);
                options.children[optKey] = t.obj({
                    key: t.literal(optKey),
                    value
                })
                data.children[optKey] = value
            });

            const typeName = NameHelpers.nameLowToHigh(val.name) + 'Enum';
            interfaces[key] = new TypeInterface(typeName)
                .extends('$ConstantEnum')
                .set({
                    '#data': data,
                    module: t.literal(val.module),
                    name: t.literal(val.name),
                    options
                })

            type.children[key] = t.ref(this.child_namespace!, typeName);
            
            // Spread enum into multiple enums if it has one or more "." on it's name
            // (Don't spread external enums)
            if (!key.includes('::')) {
                const split = key.split('.');
                if (split.length > 1) {
                    let parent = '';
                    for (let i=0; i<split.length-1; i++) {
                        parent = parent.length ? (`${parent}.${split[i]}`) : split[i];
                        const typeName = NameHelpers.nameLowToHigh(parent) + 'Enum';
                        interfaces[parent] ??= new TypeInterface(typeName)
                            .extends('$ConstantEnum')
                            .set({
                                '#data': data,
                                module: t.literal(val.module),
                                name: t.literal(parent),
                                options: t.obj({})
                            });
                        type.children[parent] ??= t.ref(this.child_namespace!, typeName);
                        const options = interfaces[parent].type.children.options as ObjTypeNode;
                        const child_options = interfaces[key].type.children.options as ObjTypeNode;
                        Object.assign(options.children, child_options.children);
                    }
                }
            }
        });

        return { interfaces, type };
    }

    private makeEnumpath(enums: ObjTypeNode) {
        const enumpath = t.obj({});

        const children = Object.entries(enums.children)
            .sort((a,b) => a[0].localeCompare(b[0]));

        // children.forEach(([key, val]) => {
        //     enumpath.children[key] = t.obj({
        //         _enum: t.literal(`${this.interface.name}['enums']['${key}']`),
        //         _subs: t.union([])
        //     })
        //     const split = key.split('.');
        //     if (split.length === 1) return;
            
        //     for (let i = split.length-1; i > 0; i--) {
        //         const supra_key = split.slice(0,i).join('.');
        //         enumpath.children[supra_key] ??= t.obj({
        //             _enum: t.literal(`${this.interface.name}['enums']['${supra_key}']`),
        //             _subs: t.union([])
        //         });

        //         const dyn_key = supra_key+'.#';
        //         enumpath.children[dyn_key] ??= t.obj({
        //             _enum: t.literal(`${this.interface.name}['enums']['${dyn_key}']`),
        //             _subs: t.union([])
        //         });

        //         console.log({key, i, supra_key, dyn_key, keys: children.map(c => c[0]), enumpath })
        //         const subs = (enumpath.children[dyn_key] as ObjTypeNode).children._subs as Extract<TypeNode, {kind: 'union'}>;
        //         subs.options.push(t.literal(split[i]));
        //     }
        // });

        return enums;
    }

}