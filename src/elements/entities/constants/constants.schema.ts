import { $Module, $Space } from '~/schema';
import { $Message } from '../message/message.schema';
import { MergeUnion } from '~/engine/util/type';

export class $ConstantValue {
    constructor(
        public scope: string,
        public key: string,
        public value?: any,
    ) {}    
}

export class $ConstantEnumOption {
    constructor(
        public key: string,
        public value: unknown,
    ) {}    
}

export class $ConstantEnum {
    '#data'!: any;

    constructor(
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


export class $Constants {
    public $t = 'constants' as const;
    '#enumpath'!: Record<string, {
        _enum: $ConstantEnum
        _subs: string
    }>;
    
    public module: string = this.name;
    constructor(
        public name: string,
        public values: Record<string, $ConstantValue> = {},
        public enums: Record<string, $ConstantEnum> = {},
    ) {}

    public static merge(to: $Constants, from: $Constants) {
        Object.assign(to.values, from.values);
        Object.assign(to.enums, from.enums);
    }
}

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
    Path extends `${infer X}.*`
        ? `${X}.{${CompatibleMessageKey<Message['#parsed'], Subs> & string}}`
        : Path

export type MessageEnumpath<
    Module extends $Module,
    Message extends $Message,
    Modules extends Record<string, $Module>,
> = MergeUnion<{
    [M in keyof Modules]: {
        [K in keyof Modules[M]['constants']['#enumpath']
            as M extends Module['name']
                ? ParseMessageEnumpath<Message, K & string, Modules[M]['constants']['#enumpath'][K]['_subs']>
                : `${M & string}::${ParseMessageEnumpath<Message, K & string, Modules[M]['constants']['#enumpath'][K]['_subs']>}`
        ]: Modules[M]['constants']['#enumpath'][K]['_enum']
    }
}[keyof Modules]>

export type EnumName<
    Space extends $Space
> = MergeUnion<{
    [M in keyof Space['modules']]: {
        [K in keyof Space['modules'][M]['constants']['enums']
            as `${M & string}::${K & string}`
        ]: Space['modules'][M]['constants']['enums'][K]
    }
}[keyof Space['modules']]>

export type EnumFromName<
    Space extends $Space,
    Name,
    ModuleName extends keyof Space['modules'] = Name extends `${infer X}::${string}` ? X : never,
    Module extends $Module = Space['modules'][ModuleName],
    Enums = Module['constants']['enums'],
    EnumName = Name extends `${string}::${infer X}` ? X : never
> = Enums[EnumName & keyof Enums]

