import type { ElementType } from '~/schema';
import type { Tag, TagType } from '../dependency';

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
        }[schema.$t];
        const typeName = highName + suffix;
        return {
            low: lowName,
            high: highName,
            type: typeName
        };
    }


    /**
     * Return the type name (UpperCamel) of the element
     * referenced by a dependency.
     * 
     * @param dep A `$Dependency` instance
     * @param fromModule Name of dependant module
     * @returns The type name of the dependency
     */
    public static tagType(tag: Tag, fromModule: string) {
        if (tag.module !== fromModule) {
            const moduleHigh = NameHelpers.nameLowToHigh(tag.module);
            // WARN: this might break non-regular plural block types in the future
            const el_t = tag.type + 's';
            return `${moduleHigh}Module['${el_t}']['${tag.name}']`
        }
        else {
            if (tag.type === 'constants.enum' || tag.type === 'constants.value') {
                throw new Error('Constants/Enums have no direct Type')
            }
            return NameHelpers
                .names({ $t: tag.type, name: tag.name})
                .type;
        }
    }

}