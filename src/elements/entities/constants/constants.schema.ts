;
import type { MergeUnion } from '~/engine/util/type';

/**
 * @category Schemas
 * @subcategory Entity
 * */
export class $ConstantValue {
    public $t = 'constants.value' as const;
    constructor(
        public module: string,
        public name: string,
        public scope: string,
        public key?: string,
        public value?: any,
    ) {}    
}

/**
 * @category Schemas
 * @subcategory Entity
 * */
export class $ConstantEnumOption {
    constructor(
        public key: string,
        public value: unknown,
    ) {}    
}

/**
 * @category Schemas
 * @subcategory Entity
 * */
export class $ConstantEnum {
    public $t = 'constants.enum' as const;
    '#data'!: any;

    constructor(
        public module: string,
        public name: string,
        public options: Record<string, $ConstantEnumOption>,
    ) {}

    static keys(schema: $ConstantEnum) {
        return Object.keys(schema.options);
    }    

    static get(schema: $ConstantEnum, key: string) {
        return schema.options[key as string].value;
    }

}

/**
 * @category Schemas
 * @subcategory Entity
 * */
export class $Constants {
    public $t = 'constants' as const;
    '#enumpath'!: Record<string, {
        _enum: $ConstantEnum
        _subs: string
    }>;
    
    public module: string;
    constructor(
        public name: string,
        public values: Record<string, $ConstantValue> = {},
        public enums: Record<string, $ConstantEnum> = {},
    ) {
        this.module = this.name
    }

    public static merge(to: $Constants, from: $Constants) {
        Object.assign(to.values, from.values);
        Object.assign(to.enums, from.enums);
    }
}

// Types

type CompatibleMessageKey<
    Data,
    Subs extends string
> = {
    [K in keyof Data]: Data[K] extends Subs ? K : never
}[keyof Data]

type ParseMessageEnumpath<
    Message extends $Message,
    Path extends string,
    Subs extends string
> = 
    Path extends `${infer X}.#`
        ? `${X}.{${CompatibleMessageKey<Message['#parsed'], Subs> & string}}`
        : Path

export type MessageEnumpath<
    Module extends $Module,
    Message extends $Message,
    Modules extends Record<string, $Module>,
> = MergeUnion<{
    [K in keyof Module['constants']['#enumpath']
        as ParseMessageEnumpath<Message, K & string, Module['constants']['#enumpath'][K]['_subs']>
    ]: Module['constants']['#enumpath'][K]['_enum']
}>

