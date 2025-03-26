import { ObjTypeAsObj, TypeAsObj } from '../elements/element';

type TransformTypes = {
    [x: string]: TransformTypes | ((v?: any) => TypeAsObj)
}

export class DumpHelpers {

    public static dumpType(type: TypeAsObj, d = 0): string {
        const pad0 = '    '.repeat(d);
        const pad1 = '    '.repeat(d+1);
        let str = '';
        if (typeof type === 'undefined') {
            str = 'never';
        }
        else if (typeof type === 'string') {
            str = type;
        }
        else if (typeof type === 'number') {
            str = type;
        }
        else if (Array.isArray(type)) {
            if (type.length) {
                str = '(' + type.map(t => this.dumpType(t)).join(' | ') + ')';
            }
            else {
                str = 'never';
            }
        }
        else {
            str = '{\n' +
                Object.entries(type)
                    .filter(([key]) => key !== '__array' && key !== '__optional')
                    .map(([key, value]) => {
                        let k = key;
                        // If key is not a special [],
                        if (
                            !(k.startsWith('[') && k.endsWith(']'))
                            && !(k.startsWith('`') && k.endsWith('`'))
                        ) {
                            // Put single quotes around non-alphanumeric keys
                            k = /[^\w]/.exec(key) ? `'${key}'` : key;
                        }
                        // Put ? on possibly undefined keys
                        if (typeof value === 'string' && value.includes('| undefined') && !k.startsWith('\'#')) {
                            k += '?';
                            value = value.replace('| undefined', '');
                        }
                        else if (typeof value === 'object' && value.__optional) {
                            k += '?';
                            delete value.__optional;
                        }
                        else if (value === 'undefined') {
                            k += '?';
                        }
                        // Dump element type
                        const t = this.dumpType(value as TypeAsObj, d+1);
                        return `${pad1}${k}: ${t}`;
                    }).join(',\n')
                + `\n${pad0}}`;
        }
        if (typeof type === 'object') {
            if (type.__array) {
                str += '[]';
            }
            if (type.__optional) {
                str += ' | undefined';
            }
        }
        return str;
    }

    public static dumpSchema(val: any, d = 0): string {
        const pad0 = '    '.repeat(d);
        const pad1 = '    '.repeat(d+1);
        if (typeof val === 'undefined') {
            return 'undefined';
        }
        if (typeof val === 'number') {
            return val.toString();
        }
        if (typeof val === 'boolean') {
            return val.toString();
        }
        if (typeof val === 'string') {
            return `'${val}'`;
        }
        if (typeof val === 'symbol') {
            return val.description || 'undefined';
        }
        else if (Array.isArray(val)) {
            return '[\n' +
                val.map(child => {
                    return `${pad1}${this.dumpSchema(child, d+1)}`;
                }).join(',\n')
            + `\n${pad0}]`;
        }
        else if (typeof val === 'object') {
            if ('__fn' in val) {
                return val.__fn;
            }
            return '{\n' +
            Object.entries(val).map(([key, child]) => {
                const _key = key.match(/\W/) ? `'${key}'` : key;
                return `${pad1}${_key}: ${this.dumpSchema(child, d+1)}`;
            }).join(',\n')
            + `\n${pad0}}`;
        }
        else if (typeof val === 'function') {
            return this.dumpFunction(val, pad0);
        }
        return val;
    }

    private static dumpFunction(fn: (...args: any[]) => any, padding = '') {

        // Functions should have been replaced by { __fn: ... } by the Compiler,
        // if any is missed, this flag causes a typescript error when compiling.

        return `/* TS BRIDGE ERROR: function not properly extracted from source. Function: ${fn.toString()} */`;
    }


    public static dumpValueToType(value: any, transform: TransformTypes = {}, d=2): TypeAsObj {
        if (value === undefined) {
            return 'undefined'
        }
        if (typeof value == 'boolean') {
            return value.toString()
        }
        if (typeof value === 'string') {
            return `'${value}'`;
        }
        if (typeof value === 'function') {
            return 'any // TODO: TypesScript API';
        }
        if (typeof value === 'object') {
            if ('__fn' in value) {
                return value.__fn_type || 'any /* WARN: non-compiled function */';
            }
            if (Array.isArray(value)) {
                if (value.length === 0) {
                    return 'never[]'
                }
                return '[' + value.map((v: any) => 
                    DumpHelpers.dumpType(this.dumpValueToType(v, transform, d+1), d)
                ).join(', ') + ']';
            }
            else {
                const obj = {} as ObjTypeAsObj;
                // Type-only keys (#something)
                Object.entries(transform).forEach(([key, trf]) => {
                    if (key.startsWith('#') && typeof trf === 'function') {
                        obj[key] = trf();
                    }
                })
                Object.entries(value).forEach(([key, value]) => {
                    if (typeof transform[key] === 'function') {
                        obj[key] = (transform[key] as any)(value)
                    }
                    else {
                        obj[key] = this.dumpValueToType(value, transform[key] as ObjTypeAsObj, d+1)
                    }
                })
                return obj;
            }
        }
        return value;
    }



}