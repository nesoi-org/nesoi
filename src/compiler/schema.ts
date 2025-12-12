
export class SchemaDumper {

    public static dump(val: any, singleLine = false, d = 0): string {
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
                    return `${pad1}${this.dump(child, singleLine, d+1)}`;
                }).join(','+lb)
            + `${lb}${pad0}]`;
        }
        else if (typeof val === 'object') {
            if ('__fn' in val) {
                return '//@ts-ignore\n'+val.__fn;
            }
            return '{' + lb +
            Object.entries(val).map(([key, child]) => {
                const _key = (key.match(/^\d/) || key.match(/\W/)) ? `'${key}'` : key;
                return `${pad1}${_key}: ${this.dump(child, singleLine, d+1)}`;
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

}