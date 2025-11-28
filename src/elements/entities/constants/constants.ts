import type { $ConstantEnum } from './constants.schema';

/**
 * @category Elements
 * @subcategory Entity
 * */
export class Enum<$ extends $ConstantEnum> {
    constructor(
        private schema: $
    ) {}

    keys<K extends keyof $['options']>(): K[] {
        return Object.keys(this.schema.options) as K[];
    }    

    get<K extends keyof $['options']>(key: K): $['options'][K]['value'] {
        return this.schema.options[key as string].value;
    }  
}