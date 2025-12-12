import { Element } from './element';
import type { ObjTypeNode, TypeNode} from '../types/type_compiler';
import { t } from '../types/type_compiler';
import type { $Constants } from 'index';

export class ConstantsElement extends Element<$Constants> {

    // Schema

    protected prepare() {
        this.schema['#enumpath'] = Element.Never;
        Object.values(this.schema.enums).forEach(_enum => {
            _enum['#data'] = Element.Never;
        });
    }

    // Interface

    protected buildInterfaces() {
        const values = this.makeValues();
        const enums = this.makeEnums();
        const enumpath = this.makeEnumpath(enums);
        
        this.interface
            .extends('$Constants')
            .set({
                '#enumpath': enumpath,
                module: t.literal(this.module),
                name: t.literal(this.lowName),
                values,
                enums
            })
    }

    // [Makers]

    private makeValues() {
        const values = t.obj({});

        Object.entries(this.schema.values).forEach(([key, val]) => {
            values.children[key] = t.obj({
                module: t.literal(this.module),
                name: t.literal(val.name),
                scope: t.literal(val.scope),
                key: val.key ? t.literal(val.key) : t.undefined(),
                value: val.value ? t.dynamic(val.value) : t.undefined(),
            })
        })

        return values
    }

    private makeEnums() {
        const enums = t.obj({});

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

            enums.children[key] = t.obj({
                '#data': data,
                module: t.literal(val.module),
                name: t.literal(val.name),
                options
            })

            // Spread enum into multiple enums if it has one or more "." on it's name
            // (Don't spread external enums)
            if (!key.includes('::')) {
                const split = key.split('.');
                if (split.length > 1) {
                    let parent = '';
                    for (let i=0; i<split.length-1; i++) {
                        parent = parent.length ? (`${parent}.${split[i]}`) : split[i];
                        enums.children[parent] ??= t.obj({
                            '#data': data,
                            module: t.literal(val.module),
                            name: t.literal(parent),
                            options: t.obj({})
                        })
                        const options = (enums.children[parent] as ObjTypeNode).children.options as ObjTypeNode;
                        const child_options = (enums.children[key] as ObjTypeNode).children.options as ObjTypeNode;
                        Object.assign(options.children, child_options.children);
                    }
                }
            }
        });

        return enums;
    }

    private makeEnumpath(enums: ObjTypeNode) {
        const enumpath = t.obj({});

        Object.entries(enums.children).forEach(([key, val]) => {
            enumpath.children[key] = t.obj({
                _enum: t.literal(`${this.interface.name}['enums']['${key}']`),
                _subs: t.union([])
            })
            const split = key.split('.');
            if (split.length === 1) return;
            
            for (let i = split.length-1; i > 0; i--) {
                const supra_key = split.slice(0,i).join('.');
                enumpath.children[supra_key] ??= t.obj({
                    _enum: t.literal(`${this.interface.name}['enums']['${supra_key}']`),
                    _subs: t.union([])
                });

                const dyn_key = supra_key+'.#';
                enumpath.children[dyn_key] ??= t.obj({
                    _enum: t.literal(`${this.interface.name}['enums']['${dyn_key}']`),
                    _subs: t.union([])
                });

                const subs = (enumpath.children[dyn_key] as ObjTypeNode).children.subs as Extract<TypeNode, {kind: 'union'}>;
                subs.options.push(t.literal(split[i]));
            }
        });

        return enums;
    }

}