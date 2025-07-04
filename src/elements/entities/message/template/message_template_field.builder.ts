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
     * - If this field is a union (.or), this alias is used when
     * referring to the union and it's first option.
     * - You can specify a different alias for the first options
     * by also using the .as() after the type
    */
    as(alias: string) {
        const chain = new MessageTemplateFieldFactory(this.module);
        chain.alias = alias;
        return chain as unknown as Omit<typeof this, 'as'>;
    }

    get any() {
        return new MessageTemplateFieldBuilder<Module, Message, { '': any }, { '': any }, {}>(
            'unknown',
            {},
            this.alias
        );
    }

    ts<T = any>() {
        return new MessageTemplateFieldBuilder<Module, Message, { '': T }, { '': T }, {}>(
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
     
    get duration() {
        return new MessageTemplateFieldBuilder<Module, Message, { '': string }, { '': NesoiDuration }, {}>(
            'duration',
            {},
            this.alias
        );
    }
     
    decimal(config?: $MessageTemplateFieldMeta['decimal']) {
        return new MessageTemplateFieldBuilder<Module, Message, { '': string }, { '': NesoiDecimal }, {}>(
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
        return new MessageTemplateFieldBuilder<Module, Message, { '': NesoiFile }, { '': NesoiFile }, {}>(
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
        item = item.optional as any;
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

/**
 * @category Builders
 * @subcategory Entity
 * */
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
    private _rules: $MessageTemplateRule[] = [];
    private _arrayRules: $MessageTemplateRule[] = [];
    private _or?: AnyMessageTemplateFieldBuilder
    private preAlias?: string

    constructor(
        private type: $MessageTemplateFieldType,
        private value: $MessageTemplateFieldMeta,
        private alias?: string,
        private children?: Children
    ) {
        this.preAlias = alias;
    }

    as(alias: string) {
        this.alias = alias;
        return this;
    }

    get optional() {
        this._required = false;
        if (this._or) {
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            this._or.optional
        }
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
        if (this._or) {
            this._or.default(value);
        }
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
        if (this._or) {
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            this._or.nullable;
        }
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

    rule(rule: MessageTemplateRuleDef<DefinedOutput[keyof DefinedOutput], Message['#raw']>) {
        if (this._array) {
            this._arrayRules.push(rule as any);
        }
        else {
            this._rules.push(rule as any);
        }
        return this;
    }

    get array() {
        this._array = true;
        if (this._or) {
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            this._or.array;
        }
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
        this._or.preAlias = this.preAlias;
        this._or._array = this._array;
        this._or._defaultValue = this._defaultValue;
        this._or._nullable = this._nullable;
        this._or._required = this._required;
        this._or._arrayRules = this._arrayRules;
        
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
        basePathRaw: string,
        basePathParsed: string
    ) {
        const or: any = builder._or
            ? this.build(builder._or, name, tree, module, basePathRaw, basePathParsed)
            : undefined;

        const pathParsed = basePathParsed + name;
        const pathRaw = basePathParsed + (
            builder.type === 'id'
                ? builder._array ? `${name}_ids` : `${name}_id`
                : name
        );
        const childrenBasePathRaw = pathRaw + (builder._array ? '.#.' : '.');
        const childrenBasePathParsed = pathParsed + (builder._array ? '.#.' : '.');

        if (builder.value.id) {
            const bucket = tree.getSchema(builder.value.id.bucket) as $Bucket;
            builder.value.id.type = bucket.model.fields.id.type as 'int'|'string';
        }

        return new $MessageTemplateField(
            builder.type,
            name,
            builder.alias || name,
            builder.preAlias || name,
            pathRaw,
            pathParsed,
            builder._array,
            builder._required,
            builder._defaultValue,
            builder._nullable,
            builder._rules,
            builder._arrayRules,
            builder.value,
            builder.children ? MessageTemplateFieldBuilder.buildChildren( builder.children, tree, module, childrenBasePathRaw, childrenBasePathParsed) : undefined,
            or
        );
    }

    public static buildChildren(
        fields: MessageTemplateFieldBuilders,
        tree: ModuleTree,
        module: $Module,
        basePathRaw: string = '',
        basePathParsed: string = ''
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
                schema[param] = MessageTemplateFieldBuilder.build(builder, c, tree, module, basePathRaw, basePathParsed);
                schema[param].children = schema[param].children || {};
                Object.assign(schema[param].children!, $msg.template.fields);
                continue;
            }
            // All other parameters are built directly
            schema[param] = MessageTemplateFieldBuilder.build(child, c, tree, module, basePathRaw, basePathParsed);
        }
        return schema;
    }
}

export type MessageTemplateFieldBuilders = {
    [x: string]: AnyMessageTemplateFieldBuilder
}

export type AnyMessageTemplateFieldBuilder = MessageTemplateFieldBuilder<any, any, any, any, any>

// Generic version of $MessageTemplateRule
export type MessageTemplateRuleDef<I,Msg> = (def: {
    field: $MessageTemplateField,
    path: string,
    value: I,
    msg: Msg,
    inject: Record<string, any>
}) => { set: I } | true | string | Promise<{ set: I } | true | string>