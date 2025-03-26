import { $Module, $Space, BucketName, ViewName } from '~/schema';
import { $MessageTemplateField, $MessageTemplateFieldMeta, $MessageTemplateFieldType, $MessageTemplateFields, $MessageTemplateRule } from './message_template.schema';
import { $MessageInfer, $MessageInputInfer, $MessageOutputInfer, $MessageTemplateBuilderInfer } from '../message.infer';
import { NesoiDate } from '~/engine/data/date';
import { NesoiError } from '~/engine/data/error';
import { $Message } from '../message.schema';
import { ModuleTree } from '~/engine/tree';
import { NesoiObj } from '~/engine/data/obj';
import { $Dependency, $Tag } from '~/engine/dependency';
import { MessageEnumpath } from '../../constants/constants.schema';
import { Decimal } from '~/engine/data/decimal';
import { NesoiDatetime } from '~/engine/data/datetime';

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

    as(alias: string) {
        this.alias = alias;
        return this as Omit<typeof this, 'as'>;
    }

    get any() {
        return new MessageTemplateFieldBuilder<Module, Message, { '': any }, { '': any }, {}>(
            'unknown',
            {},
            this.alias
        );
    }

    get boolean() {
        return new MessageTemplateFieldBuilder<Module, Message, { '': boolean }, { '': boolean }, {}>(
            'boolean',
            {},
            this.alias
        );
    }
    
    get date() {
        return new MessageTemplateFieldBuilder<Module, Message, { '': string }, { '': NesoiDate }, {}>(
            'date',
            {},
            this.alias
        );
    }
     
    get datetime() {
        return new MessageTemplateFieldBuilder<Module, Message, { '': string }, { '': NesoiDatetime }, {}>(
            'datetime',
            {},
            this.alias
        );
    }
     
    decimal(config?: $MessageTemplateFieldMeta['decimal']) {
        return new MessageTemplateFieldBuilder<Module, Message, { '': string }, { '': Decimal }, {}>(
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

        return new MessageTemplateFieldBuilder<Module, Message, { '': Opt & string }, { '': Opt & string }, {}>(
            'enum',
            { enum: { options, dep } },
            this.alias,
            undefined
        )
    }
    
    file(config?: $MessageTemplateFieldMeta['file']) {
        return new MessageTemplateFieldBuilder<Module, Message, { '': File }, { '': File }, {}>(
            'file',
            { file: config },
            this.alias
        );
    }
    
    get float() {
        return new MessageTemplateFieldBuilder<Module, Message, { '': number }, { '': number }, {}>(
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
        return new MessageTemplateFieldBuilder<Module, Message, {
            '_id': (Module['buckets'][Name]['#data'] & NesoiObj)['id']
                }, 
        {
            '': undefined extends View
                ? Module['buckets'][Name]['#data']
                : Module['buckets'][Name]['views'][NonNullable<View>]['#data'],
        }, {}>(
                'id',
                { id: { bucket: ref, view: view as string } },
                this.alias,
                undefined
                );
    }
    
    get int() {
        return new MessageTemplateFieldBuilder<Module, Message, { '': number }, { '': number }, {}>(
            'int',
            {},
            this.alias
        );
    }

    get string() {
        return new MessageTemplateFieldBuilder<Module, Message, { '': string }, { '': string }, {}>(
            'string',
            {},
            this.alias
        );
    }

    get string_or_number() {
        return new MessageTemplateFieldBuilder<Module, Message, { '': string|number }, { '': string|number }, {}>(
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
        return new MessageTemplateFieldBuilder<Module, Message, { '': I }, { '': O }, Builders>(
            'obj',
            {},
            this.alias,
            children
        );
    }
    
    dict<Builder extends MessageTemplateFieldBuilder<Module, Message, any, any, any>>(item: Builder) {
        type I = Builder extends MessageTemplateFieldBuilder<any, any, infer X, any, any>
            ? X[keyof X]
            : never
        type O = Builder extends MessageTemplateFieldBuilder<any, any, any, infer X, any>
            ? X[keyof X]
            : never
        return new MessageTemplateFieldBuilder<Module, Message, { '': Record<string, I>}, { '': Record<string, O> }, { __dict: Builder }>(
            'dict',
            {},
            this.alias,
            { __dict: item }
        );
    }
    
    msg<
        MessageName extends keyof Module['messages'],
        Message extends Module['messages'][MessageName],
        Builders extends MessageTemplateFieldBuilders
    >(msg: MessageName, extra: Builders) {
        // Module and tag are updated on build
        const ref = new $Dependency(this.module, 'message', msg as string);
        type Infer = $MessageInfer<any, any, Builders>
        type I = Omit<Message['#raw'], '$'> & Infer['#raw']
        type O = Omit<Message['#parsed'], '$'> & Infer['#parsed']
        return new MessageTemplateFieldBuilder<Module, Message, { '': I }, { '': O }, {}>(
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

export class MessageTemplateFieldBuilder<
    Module extends $Module,
    Message extends $Message,
    DefinedInput,
    DefinedOutput,
    Children extends MessageTemplateFieldBuilders,
    Optional extends [undefined|never, undefined|never] = [never, never], // Used to infer the message type
    Nullable extends [null|never, null|never] = [never, never], // Used to infer the message type
> {

    private _array = false;
    private _required = true;
    private _defaultValue?: any = undefined;
    private _nullable = true;
    private _rules: $MessageTemplateRule<any, any>[] = [];
    private _or?: AnyMessageTemplateFieldBuilder

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

    get optional() {
        this._required = false;
        return this as MessageTemplateFieldBuilder<
            Module,
            Message,    
            DefinedInput,
            DefinedOutput,
            Children,
            /* Optional */ [undefined, undefined],
            Nullable
        >;
    }

    default(value: DefinedInput[keyof DefinedInput] | Nullable[0]) {
        this._required = false;
        this._defaultValue = value;
        return this as MessageTemplateFieldBuilder<
            Module,
            Message,    
            DefinedInput,
            DefinedOutput,
            Children,
            /* Optional */ [undefined, never],
            Nullable
        >;
    }
    
    get nullable() {
        this._nullable = true;
        return this as MessageTemplateFieldBuilder<
            Module,
            Message,    
            DefinedInput,
            DefinedOutput,
            Children,
            Optional,
            /* Nullable */ [null, null]
        >;
    }

    rule(rule: $MessageTemplateRule<DefinedInput[keyof DefinedInput], Message['#raw']>) {
        this._rules.push(rule as any);
        return this;
    }

    get array() {
        this._array = true;
        return this as any as MessageTemplateFieldBuilder<
            Module,
            Message,    
            /* DefinedInput */ { [K in keyof DefinedInput]: DefinedInput[K][] },
            /* DefinedOutput */ { [K in keyof DefinedOutput]: DefinedOutput[K][] },
            Children,
            Optional,
            Nullable
        >;
    }

    or<
        Def extends AnyMessageTemplateFieldBuilder
    >(def: Def) {
        this._or = def;
        type I = Def extends MessageTemplateFieldBuilder<any, any, infer X, any, any> ? X : never;
        type O = Def extends MessageTemplateFieldBuilder<any, any, any, infer X, any> ? X : never;
        return this as any as MessageTemplateFieldBuilder<
            Module,
            Message,    
            /* DefinedInput */ { [K in keyof DefinedInput]: DefinedInput[K] | I[keyof I] },
            /* DefinedOutput */ { [K in keyof DefinedOutput]: DefinedOutput[K] | O[keyof O] },
            Children,
            Optional,
            Nullable
        >;
    }

    // Build

    public static build(
        builder: AnyMessageTemplateFieldBuilder,
        name: string,
        tree: ModuleTree,
        module: $Module,
        basePath: string
    ) {
        const or: any = builder._or
            ? this.build(builder._or, name, tree, module, basePath)
            : undefined;

        const path = basePath + name + (builder.type === 'id' ? '_id' : '') + '.';

        const childrenBasePath = builder.children
            ? path + (builder._array ? '*.' : '')
            : undefined;

        return new $MessageTemplateField(
            builder.type,
            name,
            builder.alias || name,
            basePath+name,
            builder._array,
            builder._required,
            builder._defaultValue,
            builder._nullable,
            builder._rules,
            builder.value,
            builder.children ? MessageTemplateFieldBuilder.buildChildren( builder.children, tree, module, childrenBasePath) : undefined,
            or
        );
    }

    public static buildChildren(
        fields: MessageTemplateFieldBuilders,
        tree: ModuleTree,
        module: $Module,
        basePath: string = ''
    ) {
        const schema = {} as $MessageTemplateFields;
        for (const c in fields) {
            const child = fields[c];

            // Extended fields inherit from other messages
            if ((child as any).__ext) {
                const ext = tree.getSchema((child as any).__ext as unknown as $Dependency) as $Message;
                schema[c].children = Object.assign({}, ext.template.fields, schema[c].children || {});
                continue;
            }
            const param = c;
            // A .msg() parameter is an obj which takes fields from
            // another message
            if (child.type === 'msg') {
                const name = child.value.msg!.name;
                const $msg = module.messages[name];
                if (!$msg) {
                    throw NesoiError.Builder.Message.UnknownModuleMessage(name);
                }

                const builder = new MessageTemplateFieldFactory(module.name).obj({});
                builder.alias = child.alias;
                builder._required = child._required;
                builder._defaultValue = child._defaultValue;
                builder._nullable = child._nullable;
                builder._rules = child._rules.slice(0,-1);
                builder.children = child.children;
                schema[param] = MessageTemplateFieldBuilder.build(builder, c, tree, module, basePath);
                schema[param].children = schema[param].children || {};
                Object.assign(schema[param].children!, $msg.template.fields);
                continue;
            }
            // All other parameters are built directly
            schema[param] = MessageTemplateFieldBuilder.build(child, c, tree, module, basePath);
        }
        return schema;
    }
}

export type MessageTemplateFieldBuilders = {
    [x: string]: AnyMessageTemplateFieldBuilder
}

export type AnyMessageTemplateFieldBuilder = MessageTemplateFieldBuilder<any, any, any, any, any>