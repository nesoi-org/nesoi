
import type { ElementType } from '~/schema';

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

    public static parseRefName(refName: string) {
        if (refName.includes('::')) {
            const [module, name] = refName.split('::');
            return { module, name }
        }
        return { name: refName }
    }
    
    public static names(schema: { $t: ElementType | TagType, name: string }) {
        const lowName = schema.name;
        const highName = this.nameLowToHigh(lowName);
        const typeName = this.typeName({ type: schema.$t, name: schema.name })
        return {
            low: lowName,
            high: highName,
            type: typeName
        };
    }
    
    public static typeName(tag: { type: ElementType | TagType, name: string }) {
        const highName = this.nameLowToHigh(tag.name);
        const suffix = {
            'constants': 'Constants',
            'constants.enum': 'ConstantsEnum',
            'constants.value': 'ConstantsValue',
            'externals': 'Externals',
            'bucket': 'Bucket',
            'message': 'Message',
            'job': 'Job',
            'resource': 'Resource',
            'machine': 'Machine',
            'controller': 'Controller',
            'queue': 'Queue',
            'topic': 'Topic'
        }[tag.type];
        return highName + suffix;
    }


    /**
     * Return the type name (UpperCamel) of the element
     * referenced by a dependency.
     * 
     * @param dep A `$Dependency` instance
     * @param fromModule Name of dependant module
     * @returns The type name of the dependency
     */
    public static tagType(space: string, tag: Tag, fromModule: string) {
        const typeName = this.typeName(tag);
        if (tag.module !== fromModule) {
            const moduleName = NameHelpers.nameLowToHigh(tag.module);
            return `${space}.${moduleName}.${typeName}`;
        }
        else {
            if (tag.type === 'constants.enum' || tag.type === 'constants.value') {
                throw new Error('Constants/Enums have no direct Type')
            }
            return typeName;
        }
    }

}