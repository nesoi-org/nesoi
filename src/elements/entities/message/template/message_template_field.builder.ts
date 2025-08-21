import { $Module, $Space, BucketName, ViewName } from '~/schema';
import { $MessageTemplateField, $MessageTemplateFieldMeta, $MessageTemplateFieldType, $MessageTemplateFields, $MessageTemplateRule } from './message_template.schema';
import { $MessageInfer, $MessageInputInfer, $MessageOutputInfer, $MessageTemplateBuilderInfer } from '../message.infer';
import { NesoiDate } from '~/engine/data/date';
import { NesoiError } from '~/engine/data/error';
import { $Message } from '../message.schema';
import { ModuleTree } from '~/engine/tree';
import { $Dependency, $Tag } from '~/engine/dependency';
import { MessageEnumpath } from '../../constants/constants.schema';
import { NesoiDecimal } from '~/engine/data/decimal';
import { NesoiDatetime } from '~/engine/data/datetime';
import { $Bucket } from '../../bucket/bucket.schema';
import { NesoiFile } from '~/engine/data/file';
import { NesoiDuration } from '~/engine/data/duration';

/**
 * @category Builders
 * @subcategory Entity
 * */
export class MessageTemplateFieldFactory<
    Space extends $Space,
    Module extends $Module,
    MsgName extends keyof Module['messages'],
    Message extends $Message = Module['messages'][MsgName]
>{
    private alias?: string;

    constructor(
        private module: string
    ) {}

    /**
     * Specifies an alias for the field.
    */
    as(alias: string) {
        const chain = new MessageTemplateFieldFactory(this.module);
        chain.alias = alias;
        return chain as unknown as Omit<typeof this, 'as'>;
    }

    get any() {
        return new MessageTemplateFieldBuilder<Module, Message, any, any, {}>(
            'unknown',
            {},
            this.alias
        );
    }

    ts<T = any>() {
        return new MessageTemplateFieldBuilder<Module, Message, T, T, {}>(
            'unknown',
            {},
            this.alias
        );
    }

    get boolean() {
        return new MessageTemplateFieldBuilder<Module, Message, boolean, boolean, {}>(
            'boolean',
            {},
            this.alias
        );
    }
    
    get date() {
        return new MessageTemplateFieldBuilder<Module, Message, string, NesoiDate, {}>(
            'date',
            {},
            this.alias
        );
    }
     
    get datetime() {
        return new MessageTemplateFieldBuilder<Module, Message, string, NesoiDatetime, {}>(
            'datetime',
            {},
            this.alias
        );
    }
     
    get duration() {
        return new MessageTemplateFieldBuilder<Module, Message, string, NesoiDuration, {}>(
            'duration',
            {},
            this.alias
        );
    }
     
    decimal(config?: $MessageTemplateFieldMeta['decimal']) {
        return new MessageTemplateFieldBuilder<Module, Message, string, NesoiDecimal, {}>(
            'decimal',
            { decimal: config },
            this.alias
        );
    }
    
    enum<
        Enumpaths extends MessageEnumpath<Module, Module['messages'][MsgName], Space['modules']>,
        Options extends (keyof Enumpaths & string) | readonly string[] | Record<string, any>
    >(options: Options) {
        type Enumpath = Enumpaths[Options & keyof Enumpaths]
        type Opt = Options extends string
            ? keyof Enumpath['options' & keyof Enumpath]
            : Options extends (infer X)[] | readonly (infer X)[]
                ? X
                : keyof Options;

        let dep;
        if (typeof options === 'string') {
            const tag = $Tag.parseOrFail(options);
            if (tag.module) {
                dep = new $Dependency(this.module, 'constants', `${tag.module}::*`)
            }
            else {
                dep = new $Dependency(this.module, 'constants', '*')
            }
        }

        return new MessageTemplateFieldBuilder<Module, Message, Opt & string, Opt & string, {}>(
            'enum',
            { enum: { options, dep } },
            this.alias,
            undefined
        )
    }
    
    file(config?: $MessageTemplateFieldMeta['file']) {
        return new MessageTemplateFieldBuilder<Module, Message, NesoiFile, NesoiFile, {}>(
            'file',
            { file: config },
            this.alias
        );
    }
    
    get float() {
        return new MessageTemplateFieldBuilder<Module, Message, number, number, {}>(
            'float',
            {},
            this.alias
        );
    }
    
    id<
        Name extends BucketName<Module>,
        View extends ViewName<Module['buckets'][Name]> | undefined
    >(bucket: Name, view?: View) {
        // Module and tag are updated on build
        const ref = new $Dependency(this.module, 'bucket', bucket as string);
        return new MessageTemplateFieldBuilder<
            Module,
            Message,
            Module['buckets'][Name]['#data']['id'], 
            undefined extends View
                ? Module['buckets'][Name]['#data']
                : Module['buckets'][Name]['views'][NonNullable<View>]['#data'],
            {},
            [false,false],
            '_id'
        >(
            'id',
            { id: { bucket: ref, view: view as string } },
            this.alias,
            undefined
        );
    }
    
    get int() {
        return new MessageTemplateFieldBuilder<Module, Message, number, number, {}>(
            'int',
            {},
            this.alias
        );
    }

    get string() {
        return new MessageTemplateFieldBuilder<Module, Message, string, string, {}>(
            'string',
            {},
            this.alias
        );
    }

    literal<T extends string>(template: RegExp) {
        return new MessageTemplateFieldBuilder<Module, Message, T, T, {}>(
            'literal',
            {
                literal: {
                    template: template.toString().slice(1,-1)
                }
            },
            this.alias
        );
    }

    get string_or_number() {
        return new MessageTemplateFieldBuilder<Module, Message, string|number, string|number, {}>(
            'string_or_number',
            {},
            this.alias
        );
    }

    obj<
        Builders extends MessageTemplateFieldBuilders
    >(children: Builders) {
        type I = $MessageInputInfer<Builders>
        type O = $MessageOutputInfer<Builders>
        return new MessageTemplateFieldBuilder<Module, Message, I, O, Builders>(
            'obj',
            {},
            this.alias,
            children
        );
    }
    
    dict<Builder extends MessageTemplateFieldBuilder<Module, Message, any, any, any, any, any>>(item: Builder) {
        type I = Builder['#input']
        type O = Builder['#output']
        return new MessageTemplateFieldBuilder<Module, Message, Record<string, I>, Record<string, O>, { __dict: Builder }>(
            'dict',
            {},
            this.alias,
            { __dict: item }
        );
    }
    
    list<Builder extends MessageTemplateFieldBuilder<Module, Message, any, any, any, any, any>>(item: Builder) {
        type I = Builder['#input']
        type O = Builder['#output']
        return new MessageTemplateFieldBuilder<Module, Message, I[], O[], { '#': Builder }>(
            'list',
            {},
            this.alias,
            { '#': item }
        );
    }
    
    union<
        Builders extends AnyMessageTemplateFieldBuilder[],
    >(...children: Builders) {
        type I = Builders[number]['#input']
        type O = Builders[number]['#output']
        return new MessageTemplateFieldBuilder<Module, Message, I, O, { [x: number]: Builders[number] }>(
            'union',
            {},
            this.alias,
            Object.fromEntries(children.map((c,i) => [i,c])) as never
        );
    }

    msg<
        MessageName extends keyof Module['messages'],
        Message extends Module['messages'][MessageName],
        Builders extends MessageTemplateFieldBuilders
    >(msg: MessageName, extra: Builders = {} as never) {
        // Module and tag are updated on build
        const ref = new $Dependency(this.module, 'message', msg as string);
        type Infer = $MessageInfer<any, any, Builders>
        type I = Omit<Message['#raw'], '$'> & Infer['#raw']
        type O = Omit<Message['#parsed'], '$'> & Infer['#parsed']
        return new MessageTemplateFieldBuilder<Module, Message, I, O, {}>(
            'msg',
            { msg: ref },
            this.alias,
            extra
        );
    }
    
    extend<
        MsgName extends keyof Module['messages'],
        Builders extends MessageTemplateFieldBuilders
    >(name: MsgName, fields: Builders) {
        type Msg = Module['messages'][MsgName]
        const ref = new $Dependency(this.module, 'message', name as string);
        return {
            __ext: ref,
            ...fields
        } as unknown as
            $MessageTemplateBuilderInfer<Module, Msg, Msg['#raw'], Msg['#parsed']>
            & Builders;
    }

}

/**
 * @category Builders
 * @subcategory Entity
 * */
export class MessageTemplateFieldBuilder<
    Module extends $Module,
    Message extends $Message,
    Input,
    Output,
    Children extends MessageTemplateFieldBuilders,
    Optional = [false, false],
    InputSuffix extends string = ''
> {
    public '#input': Input
    public '#input_suffix': InputSuffix
    public '#output': Output
    public '#optional': Optional

    private _required = true;
    private _defaultValue?: any = undefined;
    private _nullable = false;
    private _rules: $MessageTemplateRule[] = [];

    constructor(
        private type: $MessageTemplateFieldType,
        private value: $MessageTemplateFieldMeta,
        private alias?: string,
        private children?: Children
    ) {}

    as(alias: string) {
        this.alias = alias;
        return this;
    }

    get optional(): MessageTemplateFieldBuilder<
        Module,
        Message,    
        Input | undefined,
        Output | undefined,
        Children,
        [true, true],
        InputSuffix
        > {
        this._required = false;
        return this as never;
    }

    default(value: Output): MessageTemplateFieldBuilder<
        Module,
        Message,    
        Input | undefined,
        Output,
        Children,
        [true, (Optional & [boolean, boolean])[1]],
        InputSuffix
    > {
        this._required = false;
        this._defaultValue = value;
        return this as never;
    }
    
    get nullable(): MessageTemplateFieldBuilder<
        Module,
        Message,    
        Input | null,
        Output | null,
        Children,
        Optional,
        InputSuffix
        > {
        this._nullable = true;
        return this as never;
    }

    rule(rule: MessageTemplateRuleDef<Output, Message['#raw']>) {
        this._rules.push(rule as any);
        return this;
    }

    // Build

    public static build(
        builder: AnyMessageTemplateFieldBuilder,
        name: string,
        tree: ModuleTree,
        module: $Module,
        basePathRaw: string,
        basePathParsed: string
    ) {      
        const pathRaw = basePathRaw + (
            builder.type === 'id' ? `${name}_id` : name
        );
        const pathParsed = basePathParsed + name;

        const childrenBasePathRaw = pathRaw + '.';
        const childrenBasePathParsed = pathParsed + '.';

        let type = builder.type;
        let children;

        if (builder.type === 'id') {
            const bucket = tree.getSchema(builder.value.id!.bucket) as $Bucket;
            builder.value.id!.type = bucket.model.fields.id.type as 'int'|'string';
        }
        // A .msg() parameter is an obj which takes fields from
        // another message
        else if (builder.type === 'msg') {
            const dep = builder.value.msg!;
            if (dep.type !== 'message') {
                throw NesoiError.Builder.Message.UnknownModuleMessage(dep.tag);
            }
            const $msg = tree.getSchema(dep) as $Message | undefined;
            if (!$msg) {
                throw NesoiError.Builder.Message.UnknownModuleMessage(dep.tag);
            }
            if (dep.module !== module.name) {
                if (!(dep.refName in module.externals.messages)) {
                    throw NesoiError.Builder.Message.UnknownModuleMessage(dep.tag);
                }
            }
            
            const injectFields = (target: $MessageTemplateFields, fields: $MessageTemplateFields) => {
                for (const key in fields) {
                    target[key] = $MessageTemplateField.clone(fields[key]);
                    target[key].pathRaw = childrenBasePathRaw + target[key].pathRaw;
                    target[key].pathParsed = childrenBasePathParsed + target[key].pathParsed;
                    if (fields[key].children) {
                        target[key].children = {};
                        injectFields(target[key].children!, fields[key].children!);
                    }
                }
            }
            
            type = 'obj';
            children = {};
            injectFields(children, $msg.template.fields);
        }
        else if (builder.type === 'list') {
            children = MessageTemplateFieldBuilder.buildMany( builder.children, tree, module, childrenBasePathRaw, childrenBasePathParsed, '#', '#');
        }
        else if (builder.type === 'dict') {
            children = MessageTemplateFieldBuilder.buildMany( builder.children, tree, module, childrenBasePathRaw, childrenBasePathParsed, '#', '#');
        }
        else if (builder.type === 'union') {
            children = MessageTemplateFieldBuilder.buildMany( builder.children, tree, module, basePathRaw, basePathParsed, name, undefined);
        }
        // All other fields build their children directly
        else if (builder.children) {
            children = MessageTemplateFieldBuilder.buildMany( builder.children, tree, module, childrenBasePathRaw, childrenBasePathParsed);
        }

        return new $MessageTemplateField(
            type,
            name,
            builder.alias || name,
            pathRaw,
            pathParsed,
            builder._required,
            builder._defaultValue,
            builder._nullable,
            builder._rules,
            builder.value,
            children
        );
    }

    public static buildMany(
        fields: MessageTemplateFieldBuilders,
        tree: ModuleTree,
        module: $Module,
        basePathRaw: string = '',
        basePathParsed: string = '',
        name?: string,
        key?: string,
    ) {
        const schema = {} as $MessageTemplateFields;

        for (const c in fields) {
            if (c === '__ext') continue;
            const child = fields[c];
            schema[key||c] = MessageTemplateFieldBuilder.build(child, name||c, tree, module, basePathRaw, basePathParsed);
        }

        // Extended field groups inherit from other messages
        if ('__ext' in fields) {
            const ext = tree.getSchema(fields.__ext as unknown as $Dependency) as $Message;
            Object.assign(schema, ext.template.fields);
        }
        return schema;
    }
}

export type MessageTemplateFieldBuilders = {
    [x: string]: AnyMessageTemplateFieldBuilder
}

export type AnyMessageTemplateFieldBuilder = MessageTemplateFieldBuilder<any, any, any, any, any, any, any>

// Generic version of $MessageTemplateRule
export type MessageTemplateRuleDef<I,Msg> = (def: {
    field: $MessageTemplateField,
    path: string,
    value: I,
    msg: Msg,
    inject: Record<string, any>
}) => { set: I } | true | string | Promise<{ set: I } | true | string>