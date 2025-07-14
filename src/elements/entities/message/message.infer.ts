import { MessageTemplateFieldBuilder, MessageTemplateFieldBuilders } from './template/message_template_field.builder';
import { MessageTemplateDef } from './template/message_template.builder';
import { $Module } from '~/schema';
import { $Message } from './message.schema';

export type $MessageInputInfer<
    Fields extends MessageTemplateFieldBuilders
> = {
    // Required fields
    [K in keyof Fields as 
        Fields[K]['#optional'][0] extends true ? never : `${K & string}${Fields[K]['#input_suffix']}`
    ]: Fields[K]['#input']
} & {
    // Optional fields
    [K in keyof Fields as 
        Fields[K]['#optional'][0] extends true ? `${K & string}${Fields[K]['#input_suffix']}` : never
    ]?: Fields[K]['#input']
}

export type $MessageOutputInfer<
    Fields extends MessageTemplateFieldBuilders
> = {
    // Required fields
    [K in keyof Fields as 
        Fields[K]['#optional'][1] extends true ? never : K
    ]: Fields[K]['#output']
} & {
    // Optional fields
    [K in keyof Fields as 
        Fields[K]['#optional'][1] extends true ? K : never
    ]?: Fields[K]['#output']
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