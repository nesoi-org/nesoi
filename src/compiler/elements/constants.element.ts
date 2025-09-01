import { Element } from './element';
import { ObjTypeAsObj } from '~/engine/util/type';
import { $ConstantEnum, $Constants } from '~/elements/entities/constants/constants.schema';
import { DumpHelpers } from '../helpers/dump_helpers';

type EnumTree = {
    [K: string]: EnumTree & {
        _enum: $ConstantEnum
        _subs: string[]
    }
}

export class ConstantsElement extends Element<$Constants> {

    protected prepare() {
        // Enums
        this.schema['#enumpath'] = Element.Any;
        Object.values(this.schema.enums).forEach(enu => {
            enu['#data'] = Element.Any;
        });
    }

    protected buildType() {

        const enums = this.buildEnums();

        // Make a tree of subenums, to generate enumpaths
        // These are paths that can be used to refer to an enum
        // on a message, to allow for dynamically scoped enums
        const enumTree = this.buildEnumTree(enums);
        const enumPaths = this.buildEnumPaths(enumTree);
        

        return DumpHelpers.dumpValueToType(this.schema, {
            '#enumpath': v => enumPaths,
            enums: v => enums
        });
    }

    private buildEnums() {
        const enums = {} as ObjTypeAsObj;
        Object.entries(this.schema.enums).forEach(([key, val]) => {
            const type = {} as ObjTypeAsObj;
            const data = {} as ObjTypeAsObj;
            Object.entries(val.options).forEach(([optKey, optVal]) => {
                const value = DumpHelpers.dumpValueToType(optVal.value);
                type[optKey] = {
                    key: DumpHelpers.dumpValueToType(optKey),
                    value
                }
                data[optKey] = value
            });

            enums[key] = {
                '#data': data,
                module: DumpHelpers.dumpValueToType(this.schema.module),
                name: DumpHelpers.dumpValueToType(val.name),
                options: type
            }
        });

        return enums;
    }


    private buildEnumTree(enums: ObjTypeAsObj) {
        const enumTree: Record<string, any> = {};
        Object.keys(enums).forEach(name => {
            const split = name.split('.');
            let key = '';
            let node = enumTree;
            split.forEach((part, i) => {
                key += key.length ? `.${part}` : part;
                node[part] ??= {
                    _enum: `${this.typeName}['enums']['${key}']`,
                    _subs: []
                }
                if (i < split.length-1) {
                    if (!node[part]._subs.includes(split[i+1])) {
                        node[part]._subs.push(split[i+1]);
                    }
                }
                node = node[part];
            })
        })
        return enumTree as EnumTree;
    }

    private buildEnumPaths(enumTree: EnumTree, path = '') {
        const paths: Record<string, any> = {};
        Object.entries(enumTree).forEach(([key, val]) => {
            const { _enum, _subs, ...next } = val;
            paths[path+key] = {
                _enum: _enum,
                _subs: 'never'
            }
            if (_subs.length) {
                paths[path+key+'.#'] = {
                    _enum: _enum,
                    _subs: _subs.map(v => `'${v}'`).join(' | ')
                }   
            }
            Object.assign(paths, this.buildEnumPaths(next, path+key+'.'))
        })

        return paths;
    }
}