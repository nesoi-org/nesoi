import { MessageTemplateFieldBuilder, MessageTemplateFieldBuilders } from './template/message_template_field.builder';
import { MessageTemplateDef } from './template/message_template.builder';
import { $Module } from '~/schema';
import { $Message } from './message.schema';

export type $MessageInputInfer<
    Builder,
    Fields extends Record<string, { path: any, data: any, opt: any , nul: any }> = {
        [K in keyof Builder]:
            Builder[K] extends MessageTemplateFieldBuilder<any, any, infer I, any, any, infer Opt, infer Nul>
                ? {
                    path: `${K & string}${keyof I & string}`,
                    data: I[keyof I],
                    opt: Opt[0],
                    nul: Nul[0]
                }
                : never
    }
> = {
    // Required fields
    [K in keyof Fields as 
        Fields[K]['opt'] extends never ? Fields[K]['path'] : never
    ]: Fields[K]['data'] | Fields[K]['nul']
} & {
    // Optional fields
    [K in keyof Fields as 
        Fields[K]['opt'] extends never ? never : Fields[K]['path']
    ]?: Fields[K]['data'] | Fields[K]['nul']
}

export type $MessageOutputInfer<
    Builder,
    Fields extends Record<string, { path: any, data: any, opt: any , nul: any }> = {
        [K in keyof Builder]:
            Builder[K] extends MessageTemplateFieldBuilder<any, any, any, infer O, any, infer Opt, infer Nul>
                ? {
                    path: `${K & string}${keyof O & string}`,
                    data: O[keyof O],
                    opt: Opt[1],
                    nul: Nul[1]
                }
                : never
    }
> = {
    // Required fields
    [K in keyof Fields as 
        Fields[K]['opt'] extends never ? Fields[K]['path'] : never
    ]: Fields[K]['data'] | Fields[K]['nul']
} & {
    // Optional fields
    [K in keyof Fields as 
        Fields[K]['opt'] extends never ? never : Fields[K]['path']
    ]?: Fields[K]['data'] | Fields[K]['nul']
}

export interface $MessageInfer<
    Name extends string,
    Def extends MessageTemplateDef<any, any, any>,
    Builders extends MessageTemplateFieldBuilders = ReturnType<Def>,
    Raw = $MessageInputInfer<Builders>,
    Parsed = $MessageOutputInfer<Builders>
> extends $Message {
    name: Name
    '#raw': { $: Name } & Raw,
    '#parsed': { $: Name } & Parsed,
}


export interface $MessageInferFromData<
    Name extends string,
    Data
> extends $Message {
    name: Name
    '#raw': { $: Name } & Data,
    '#parsed': { $: Name } & Data,
}

// This is used to allow dynamic typing of an
// extended message. It infers a builder type
// from a given input and output. 
// It's impossible to rebuild the field structure,
// since we can't know how far down the type tree
// we must stop (a group of fields != a field that's typed as an object)
// So, this returns only the surface level, which
// should be enough for most cases.
export type $MessageTemplateBuilderInfer<
    Module extends $Module,
    Message extends $Message,
    Input,
    Output
> = {
    [K in Exclude<keyof Output, '$'>]: MessageTemplateFieldBuilder<
        Module,
        Message,
        { '': Input[K & keyof Input] },
        { '': Output[(K extends `${infer X}_id` ? X : K) & keyof Output] },
        {}
    >
}