import { BuilderType } from '~/schema';

export type ParsedType = string | ({ [x: string] : ParsedType } & { __array?: boolean, __optional?: boolean })

export class NameHelpers {
    public static nameLowToHigh(low: string) {
        const words = low.split(/[\W_]/).filter(c => c);
        return words.map(word => word[0].toUpperCase()+word.slice(1)).join('');
    }
    
    public static nameHighToLow(high: string) {
        return high.replace(/([a-zA-Z])(?=[A-Z])/g, '$1_').toLowerCase();
    }

    public static unabbrevName(name: string, context: string) {
        if (name === '@') {
            return context;
        }
        const abbrev = name.match(/@\.(.*)/);
        if (abbrev) {
            return `${context}${abbrev[1].length ? ('.' + abbrev[1]) : abbrev[1]}`;
        }
        return name;
    }
    
    public static names(schema: { $t: BuilderType, name: string }) {
        const lowName = schema.name;
        const highName = this.nameLowToHigh(lowName);
        const suffix = {
            'constants': 'Constants',
            'externals': 'Externals',
            'bucket': 'Bucket',
            'message': 'Message',
            'job': 'Job',
            'resource': 'Resource',
            'machine': 'Machine',
            'controller': 'Controller',
            'queue': 'Queue'
        }[schema.$t];
        const typeName = highName + suffix;
        return {
            low: lowName,
            high: highName,
            type: typeName
        };
    }

}