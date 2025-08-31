import { TypeAsObj, ObjTypeAsObj } from '~/engine/util/type';

type TransformTypes = {
    [x: string]: TransformTypes | ((v?: any) => TypeAsObj)
}

export class DumpHelpers {

    public static dumpUnionType(types: TypeAsObj[], singleLine = false): string {
        if (types.length < 2) return this.dumpType(types[0], singleLine);
        return '(' + types.map(t => this.dumpType(t, singleLine)).join(' | ') + ')';
    }

    public static dumpIntersectionType(types: TypeAsObj[], singleLine = false): string {
        if (types.length < 2) return this.dumpType(types[0], singleLine);
        return '(' + types.map(t => this.dumpType(t, singleLine)).join(' | ') + ')';
    }

    public static dumpType(type: TypeAsObj, singleLine = false, d = 0): string {
        const pad0 = singleLine ? ' ' : '    '.repeat(d);
        const pad1 = singleLine ? ' ' : '    '.repeat(d+1);
        const lb = singleLine ? '' : '\n';
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
                str = '(' + type.map(t => this.dumpType(t, singleLine)).join(' | ') + ')';
            }
            else {
                str = 'never';
            }
        }
        else {
            str = '{' + lb +
                Object.entries(type)
                    .filter(([key]) => !['__array', '__optional', '__or'].includes(key))
                    .map(([key, value]) => {
                        let k = key;
                        // If key contains ${, it's a template string
                        if (
                            k.includes('${')
                        ) {
                            // Put single quotes around non-alphanumeric keys
                            k = '[_: `'+key+'`]';
                        }
                        // If key is not a special [],
                        else if (
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
                        const t = this.dumpType(value as TypeAsObj, singleLine, d+1);
                        return `${pad1}${k}: ${t}`;
                    }).join(',' + lb)
                + `${lb}${pad0}}`;
        }
        if (typeof type === 'object') {
            if (type.__or) {
                str += ' | ' + this.dumpType(type.__or, singleLine, d)
            }
            if (type.__array) {
                str = `(${str})[]`;
            }
            if (type.__optional) {
                str += ' | undefined';
            }
        }
        return str;
    }

    public static dumpSchema(val: any, singleLine = false, d = 0): string {
        const pad0 = singleLine ? ' ' : '    '.repeat(d);
        const pad1 = singleLine ? ' ' : '    '.repeat(d+1);
        const lb = singleLine ? '' : '\n';
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
            return '[' + lb +
                val.map(child => {
                    return `${pad1}${this.dumpSchema(child, singleLine, d+1)}`;
                }).join(','+lb)
            + `${lb}${pad0}]`;
        }
        else if (typeof val === 'object') {
            if ('__fn' in val) {
                return val.__fn;
            }
            return '{' + lb +
            Object.entries(val).map(([key, child]) => {
                const _key = key.match(/\W/) ? `'${key}'` : key;
                return `${pad1}${_key}: ${this.dumpSchema(child, singleLine, d+1)}`;
            }).join(','+lb)
            + `${lb}${pad0}}`;
        }
        else if (typeof val === 'function') {
            return this.dumpFunction(val, pad0);
        }
        return val;
    }

    private static dumpFunction(fn: (...args: any[]) => any, padding = '') {

        // Functions should have been replaced by { __fn: ... } by the Compiler,
        // if not, we try to use the JS version.

        return `/* TS BRIDGE WARN: function not properly extracted from source. Attempting JS version (imports will not work) */ (${fn.toString()}) as any`;
    }


    public static dumpValueToType(value: any, transform: TransformTypes = {}, singleLine = false, d=2): TypeAsObj {
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
                    DumpHelpers.dumpType(this.dumpValueToType(v, transform, singleLine, d+1), singleLine, d)
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
                        obj[key] = this.dumpValueToType(value, transform[key] as ObjTypeAsObj, singleLine, d+1)
                    }
                })
                return obj;
            }
        }
        return value;
    }



}