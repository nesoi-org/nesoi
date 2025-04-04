import { $Module, $Space } from '~/schema';
import { AnyUsers } from '~/engine/auth/authn';
import { $Job, $JobAssert, $JobMethod } from '../job.schema';
import { MessageTemplateFieldBuilder } from '~/elements/entities/message/template/message_template_field.builder';
import { $MessageInfer } from '~/elements/entities/message/message.infer';
import { $Message } from '~/elements/entities/message/message.schema';
import { MessageTemplateDef } from '~/elements/entities/message/template/message_template.builder';
import { TrxNode } from '~/engine/transaction/trx_node';
import { ModuleTree } from '~/engine/tree';
import { BlockBuilder } from '../../block.builder';
import { AnyMessageBuilder, MessageBuilder } from '~/elements/entities/message/message.builder';
import { $Dependency, BuilderNode, ResolvedBuilderNode } from '~/engine/dependency';
import { JobExtrasAndAsserts } from '../job.builder';
import { AnyQuery } from '~/elements/entities/bucket/query/nql.schema';
import { NesoiError } from '~/engine/data/error';
import { $Bucket } from '~/elements/entities/bucket/bucket.schema';
import { ResourceJob } from './resource_job';
import { $BlockOutput } from '../../block.schema';

export type ResourceAssertions<
    Bucket extends $Bucket
> = {
    'query is empty': AnyQuery<any, any>
    'has no link': keyof Bucket['graph']['links']
}

export type ResourceAssertionDef<
    Bucket extends $Bucket
> = <
    T extends keyof ResourceAssertions<Bucket>
>(type: T, arg: ResourceAssertions<Bucket>[T]) => boolean

export class ResourceJobBuilder<
    Space extends $Space,
    Module extends $Module,
    Name extends string,
    Prepared,
    Authn extends AnyUsers = {},
    Bucket extends $Bucket = never,
    RequiredInput = {},
    Trigger extends $Message = never,
    MsgExtras = {},
    Ctx = {},
    CtxAfter = {}
> extends BlockBuilder<Space, Module, 'job'> {
    public $b = 'job' as const;
    public $j = 'ResourceJob' as const;

    private resource: string
    private _msg: AnyMessageBuilder

    private _customInput = false;
    private _extrasAndAsserts: JobExtrasAndAsserts = [];
    private _prepareMethod!: $JobMethod<any, any, any, any>; 
    private _afterMethod?: $JobMethod<any, any, any, any>; 
    
    constructor(
        protected module: string,
        protected name: Name,
        protected bucket: string,
        protected method: 'view' | 'query' | 'create' | 'update' | 'delete',
        private alias: string,
        private execMethod?: $JobMethod<any, any, any, any>,
        protected _authn = [] as string[],
        private implicitFields: Record<string, [string, any]> = {}
    ) {
        super(module, 'job', name);

        this.resource = this.name.split('.')[0];

        this._msg = new MessageBuilder(module, name)
            .as(alias);
        super._input(name as any);
        this._inlineNodes.push(new BuilderNode({
            module: this.module,
            type: 'message',
            name: name,
            builder: this._msg,
            isInline: true,
            filepath: [], // This is added later by Treeshake.blockInlineNodes()
            dependencies: [] // This is added later by Treeshake.*()
        }));
    }

    /**
     * The input message accepted by the job.
     * 
     * @param def A `$ => ({})` definition for a custom trigger message
     */
    public input<
        Def extends MessageTemplateDef<Space, Module, Name>
    >(def: Def) {

        type Required = { [K in keyof RequiredInput]: MessageTemplateFieldBuilder<any, any, any, { '': RequiredInput[K] }, any> }
        type TriggerMsg = $MessageInfer<Name, any, ReturnType<Def> & Required>

        this._msg.template($ => {
            const fields = def($);
            for (const f in this.implicitFields || []) {
                const [type, arg] = this.implicitFields[f];
                fields[f] = arg
                    ? ($ as any)[type](arg)
                    : ($ as any)[type];
            }
            return fields;
        });

        this._customInput = true;
        this._prepareMethod = undefined as any;
        this._afterMethod = undefined as any;
        
        return this as any as ResourceJobBuilder<
            Space, Module, Name, Prepared, Authn, Bucket, RequiredInput,
            /* Trigger */ TriggerMsg,
            MsgExtras, Ctx, CtxAfter
        >;
    }

    /*
        With
    */

    /**
     * A function that will build new fields on the input message to be
     * consumed by the job.
     * 
     * @param $ A function which returns an object to be assigned to the input.
     */
    extra<
        Extra extends { [_: string]: any },
        Trx = NoInfer<TrxNode<Space, Module, Authn>>,
        Msg = NoInfer<Trigger['#parsed']>,
        PreviousExtras = NoInfer<MsgExtras>,
        C = NoInfer<Ctx>
    >(
        $: $JobMethod<Trx, Msg, Extra, PreviousExtras, C>
    ) {
        this._extrasAndAsserts.push({ extra: $ as any });
        return this as ResourceJobBuilder<
            Space, Module, Name, Prepared, Authn, Bucket, RequiredInput, Trigger,
            /* Extras */ MsgExtras & Extra,
            Ctx, CtxAfter
        >;
    }

    /*
        Assert
    */

    /**
     * A function that checks a given condition over the input and throws an exception;
     * This assertion runs before the job method.
     * 
     * @param { cond } A function which returns true or false
     * @param { error } An error message or a function that makes one
     */
    assert<
        Trx = NoInfer<TrxNode<Space, Module, Authn>>,
        Msg = NoInfer<Trigger['#parsed']>,
        Extras = NoInfer<MsgExtras>,
        C = NoInfer<Ctx & { that: ResourceAssertionDef<Bucket> }>
    >(
        condition: $JobAssert<Trx, Msg, Extras, C>
    ) {
        this._extrasAndAsserts.push({ assert: condition as any });
        return this;
    }
    
    /*
        Action
    */

    /**
     * The function called to prepare the input for the job.
     * 
     * @param method A function which returns the required output.
     */
    prepare<
        Trx = NoInfer<TrxNode<Space,Module,Authn>>,
        Msg = NoInfer<Trigger['#parsed']>,
        Extras = NoInfer<MsgExtras>,
        C = NoInfer<Ctx>
    >(
        method: $JobMethod<Trx, Msg, Prepared, Extras, C>
    ) {
        this._prepareMethod = method as any;
        return this;
    }

    /**
     * The function called after the input has been processed.
     * 
     * @param method A function which returns void.
     */
    after<
        Trx = NoInfer<TrxNode<Space,Module,Authn>>,
        Msg = NoInfer<Trigger['#parsed']>,
        Extras = NoInfer<MsgExtras>,
        C = NoInfer<CtxAfter>
    >(
        method: $JobMethod<Trx, Msg, void, Extras, C>
    ) {
        this._afterMethod = method as any;
        return this;
    }

    // Build

    public static build(node: ResourceJobBuilderNode, tree: ModuleTree, module: $Module, output: $BlockOutput, defaultTrigger: $Message, idType?: 'string'|'int'|null) {

        if (node.builder._customInput && !node.builder._prepareMethod) {
            throw NesoiError.Builder.Resource.CustomInputRequiresPrepare(node.builder.name);
        }

        const fields = (node.builder._msg as any)._template._fields as AnyMessageBuilder['_template']['_fields'];
        if (idType !== undefined) {
            if (idType) {
                fields['id'] = new MessageTemplateFieldBuilder(idType, {})

            }
            else {
                delete fields['id'];
            }
        }

        node.schema = new $Job(
            node.builder.module,
            node.builder.name,
            node.builder.alias || node.builder.name,
            node.builder._authn,
            [new $Dependency(node.module, 'message', node.builder.name)],
            output,
            node.builder._extrasAndAsserts,
            ResourceJob.method as any,
            {
                module: node.builder.module,
                resource: node.builder.resource,
                bucket: node.builder.bucket,
                method: node.builder.method,
                prepareMethod: node.builder._prepareMethod,
                execMethod: node.builder.execMethod,
                afterMethod: node.builder._afterMethod
            }
        );

        let inlineMessages;
        if (node.builder._customInput) {
            inlineMessages = MessageBuilder.buildInlines(node, tree, module);
        } 
        else {
            inlineMessages = { [defaultTrigger.name]: defaultTrigger };
            node.inlines.message![node.builder.name].schema = defaultTrigger;
        }
        
        return {
            schema: node.schema,
            inlineMessages
        };
    }


}

export type AnyResourceJobBuilder = ResourceJobBuilder<any, any, any, any, any, any>

export type ResourceJobDef<
    S extends $Space,
    M extends $Module,
    Name extends string,
    Prepared,
    Authn extends AnyUsers,
    Bucket extends $Bucket,
    DefaultTrigger extends $Message = never,
    RequiredInput = {},
    Ctx = {},
    CtxAfter = {}
> = ($: ResourceJobBuilder<S, M, Name, Prepared, Authn, Bucket, RequiredInput, DefaultTrigger, {}, Ctx, CtxAfter>) => any

export type ResourceJobBuilderNode = Omit<ResolvedBuilderNode, 'builder'> & {
    builder: AnyResourceJobBuilder,
    schema?: $Job
}