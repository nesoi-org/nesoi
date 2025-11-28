import type { $Module, $Space } from '~/schema';
import type { AnyUsers } from '~/engine/auth/authn';
import type { $JobAssert, $JobMethod } from '../job.schema';
import type { $MessageInfer } from '~/elements/entities/message/message.infer';
import type { $Message } from '~/elements/entities/message/message.schema';
import type { MessageTemplateDef } from '~/elements/entities/message/template/message_template.builder';
import type { TrxNode } from '~/engine/transaction/trx_node';
import type { ModuleTree } from '~/engine/tree';
import type { AnyMessageBuilder} from '~/elements/entities/message/message.builder';
import type { ResolvedBuilderNode} from '~/engine/dependency';
import type { JobExtrasAndAsserts } from '../job.builder';
import type { NQL_AnyQuery } from '~/elements/entities/bucket/query/nql.schema';
import type { $Bucket } from '~/elements/entities/bucket/bucket.schema';
import type { $BlockAuth, $BlockOutput } from '../../block.schema';
import type { $ResourceQueryRoutes } from './resource_job.schema';

import { $Job } from '../job.schema';
import { MessageTemplateFieldBuilder } from '~/elements/entities/message/template/message_template_field.builder';
import { BlockBuilder } from '../../block.builder';
import { MessageBuilder } from '~/elements/entities/message/message.builder';
import { BuilderNode, Tag } from '~/engine/dependency';
import { NesoiError } from '~/engine/data/error';
import { ResourceJob } from './resource_job';

export type ResourceAssertions<
    Bucket extends $Bucket
> = {
    'query is empty': NQL_AnyQuery,
    'has no link': keyof Bucket['graph']['links']
}

export type ResourceAssertionDef<
    Bucket extends $Bucket
> = <
    T extends keyof ResourceAssertions<Bucket>
>(type: T, arg: ResourceAssertions<Bucket>[T]) => {
    else: (error: string) => Promise<true | string>
}

/**
 * @category Builders
 * @subcategory Block
 */
export class ResourceJobBuilder<
    Space extends $Space,
    Module extends $Module,
    Name extends string,
    Prepared,
    AuthUsers extends AnyUsers = {},
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
    
    private _routes: $ResourceQueryRoutes = {};

    constructor(
        protected module: string,
        protected name: Name,
        protected bucket: string,
        protected method: 'view' | 'query' | 'create' | 'update' | 'delete',
        private alias: string,
        private execMethod?: $JobMethod<any, any, any, any>,
        protected _auth = [] as $BlockAuth[],
        private implicitFields: Record<string, [string, any, boolean]> = {}
    ) {
        super(module, 'job', name);

        this.resource = this.name.split('.')[0];

        this._msg = new MessageBuilder(module, name)
            .as(alias);
        super._input(name as any);
        this._inlineNodes.push(new BuilderNode({
            tag: new Tag(this.module, 'message', name),
            builder: this._msg,
            isInline: true,
            filepath: [], // This is added later by Treeshake.blockInlineNodes()
            dependencies: [] // This is added later by Treeshake.*()
        }));
    }

    /* [Block] */

    public auth<U extends keyof Space['authnUsers']>(
        provider: U,
        resolver?: (user: Space['authnUsers'][U]) => boolean
    ) {
        return super.auth(provider, resolver) as unknown as ResourceJobBuilder<
            Space,
            Module,
            Name,
            Prepared,
            AuthUsers & { [K in U]: Space['authnUsers'][U] },
            Bucket,
            RequiredInput,
            Trigger,
            MsgExtras,
            Ctx,
            CtxAfter
        >;
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
            for (const f in this.implicitFields || {}) {
                if (f in fields) continue;
                const [type, arg, required] = this.implicitFields[f];
                fields[f] = arg
                    ? ($ as any)[type](arg)
                    : ($ as any)[type];
                // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                if (!required) fields[f].optional
            }
            return fields;
        });

        this._customInput = true;
        this._prepareMethod = undefined as any;
        this._afterMethod = undefined as any;
        
        return this as any as ResourceJobBuilder<
            Space, Module, Name, Prepared, AuthUsers, Bucket, RequiredInput,
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
        Trx = NoInfer<TrxNode<Space, Module, AuthUsers>>,
        Msg = NoInfer<Trigger['#parsed']>,
        PreviousExtras = NoInfer<MsgExtras>,
        C = NoInfer<Ctx>
    >(
        $: $JobMethod<Trx, Msg, Extra, PreviousExtras, C>
    ) {
        this._extrasAndAsserts.push({ extra: $ as any });
        return this as ResourceJobBuilder<
            Space, Module, Name, Prepared, AuthUsers, Bucket, RequiredInput, Trigger,
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
        Trx = NoInfer<TrxNode<Space, Module, AuthUsers>>,
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
        Trx = NoInfer<TrxNode<Space,Module,AuthUsers>>,
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
        Trx = NoInfer<TrxNode<Space,Module,AuthUsers>>,
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
        
        const msgTag = node.builder._inlineNodes[0].tag;

        node.schema = new $Job(
            node.builder.module,
            node.builder.name,
            node.builder.alias || node.builder.name,
            node.builder._auth,
            [msgTag],
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
                afterMethod: node.builder._afterMethod,
                routes: node.builder._routes
            },
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
    AuthUsers extends AnyUsers,
    Bucket extends $Bucket,
    DefaultTrigger extends $Message = never,
    RequiredInput = {},
    Ctx = {},
    CtxAfter = {}
> = ($: ResourceJobBuilder<S, M, Name, Prepared, AuthUsers, Bucket, RequiredInput, DefaultTrigger, {}, Ctx, CtxAfter>) => any

export type ResourceJobBuilderNode = Omit<ResolvedBuilderNode, 'builder'> & {
    builder: AnyResourceJobBuilder,
    schema?: $Job
}