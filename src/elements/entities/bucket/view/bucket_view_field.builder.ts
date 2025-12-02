import { NesoiError } from '~/engine/data/error';
import type { $BucketViewFieldFn, $BucketViewFieldMeta, $BucketViewFieldOp, $BucketViewFields, $BucketViews } from './bucket_view.schema';
import type { $Module, $Space } from '~/schema';
import type { $BucketGraph, $BucketGraphLink } from '../graph/bucket_graph.schema';
import type { BucketViewDef, BucketViewFieldDef } from './bucket_view.builder';
import type { $Bucket } from '../bucket.schema';
import type { $BucketViewDataInfer, $BucketViewFieldBuilderInfer } from './bucket_view.infer';
import type { AnyTrxNode, TrxNode } from '~/engine/transaction/trx_node';
import type { NesoiFile } from '~/engine/data/file';
import type { ModuleTree } from '~/engine/tree';

import { $BucketViewField } from './bucket_view.schema';
import { $BucketModel } from '../model/bucket_model.schema';
import type { NQL_AnyQuery, NQL_Query } from '../query/nql.schema';
import { Tag } from '~/engine/dependency';

/*
    Types
*/

type DriveFieldpath<
    Bucket extends $Bucket
> = {
    [K in keyof Bucket['#modelpath']]: NonNullable<Bucket['#modelpath'][K]> extends NesoiFile ? K : never
}[keyof Bucket['#modelpath']]

type ComputedData<
    Fn extends $BucketViewFieldFn<any, any, any, any>,
    R = ReturnType<Fn>
> = R extends Promise<infer X> ? X : R

/*
    Factory
*/


/**
 * @category Builders
 * @subcategory Entity
 * */
export class BucketViewFieldFactory<
    Space extends $Space,
    Module extends $Module,
    RootBucket extends $Bucket,
    CurrentBucket extends $Bucket,
    Value
> {

    protected scope!: $BucketViewField['type'];
    protected meta!: $BucketViewField['meta'];

    get inject() {
        return {
            get root(): {
                [K in keyof RootBucket['#data']]: BucketViewFieldBuilder<Space, Module, RootBucket, RootBucket, RootBucket['#data'][K], 'model'>
                } {
                return {
                    __inject: new BucketViewFieldBuilder<Space, Module, RootBucket, CurrentBucket, RootBucket['#data'], 'model'>(
                        'inject', { inject: { path: 0 } }
                    )
                } as never
            },
            get current(): {
                [K in keyof RootBucket['#data']]: BucketViewFieldBuilder<Space, Module, RootBucket, RootBucket, RootBucket['#data'][K], 'model'>
                } {
                return {
                    __inject: new BucketViewFieldBuilder<Space, Module, RootBucket, CurrentBucket, RootBucket['#data'], 'model'>(
                        'inject', { inject: { path: -1 } }
                    )
                } as never
            },
            get value(): {
                [K in keyof RootBucket['#data']]: BucketViewFieldBuilder<Space, Module, RootBucket, RootBucket, RootBucket['#data'][K], 'model'>
                } {
                return {
                    __inject: new BucketViewFieldBuilder<Space, Module, RootBucket, CurrentBucket, RootBucket['#data'], 'model'>(
                        'inject', { inject: { path: 'value' } }
                    )
                } as never
            },
        }
    }
    
    get root(): BucketViewFieldBuilder<Space, Module, RootBucket, CurrentBucket, RootBucket['#data'], 'model'> {
        return new BucketViewFieldBuilder<any, any, any, any, any, any>(
            'model',
            {
                model: {
                    path: '__root' as any as string
                }
            }
        )
    }

    get current(): BucketViewFieldBuilder<Space, Module, RootBucket, CurrentBucket, CurrentBucket['#data'], 'model'> {
        return new BucketViewFieldBuilder<any, any, any, any, any, any>(
            'model',
            {
                model: {
                    path: '__current' as any as string
                }
            }
        )
    }

    get value(): BucketViewFieldBuilder<Space, Module, RootBucket, CurrentBucket, Value, 'model'> {
        return new BucketViewFieldBuilder<any, any, any, any, any, any>(
            'model',
            {
                model: {
                    path: '__value' as any as string
                }
            }
        )
    }

    model<
        K extends keyof CurrentBucket['#modelpath']
    >(
        path: K
    ): NoInfer<BucketViewFieldBuilder<Space, Module, RootBucket, CurrentBucket, CurrentBucket['#modelpath'][K], 'model'>> {
        return new BucketViewFieldBuilder<any, any, any, any, any, any>(
            'model',
            {
                model: {
                    path: path as string
                }
            });
    }

    computed<
        Fn extends $BucketViewFieldFn<TrxNode<Space, Module, Space['authnUsers']>, RootBucket, CurrentBucket, Value>
    >(
        fn: Fn
    ): NoInfer<BucketViewFieldBuilder<Space, Module, RootBucket, CurrentBucket, ComputedData<Fn>, 'computed'>> {
        return new BucketViewFieldBuilder<any, any, any, any, any, any>(
            'computed',
            {
                computed: {
                    fn: fn as any
                }
            });
    }

    graph<
        LinkName extends keyof RootBucket['graph']['links'],
        ViewName extends keyof RootBucket['graph']['links'][LinkName]['#bucket']['views'],
        LinkBucket extends $Bucket = RootBucket['graph']['links'][LinkName]['#bucket'],
        Obj = undefined extends ViewName
            ? LinkBucket['#data']
            : LinkBucket['views'][NonNullable<ViewName> & string]['#data'],
        Value = RootBucket['graph']['links'][LinkName]['#many'] extends true
            ? Obj[]
            : Obj
    >(
        link: LinkName,
        view?: ViewName
    ): NoInfer<BucketViewFieldBuilder<Space, Module, RootBucket, LinkBucket, Value, 'query'>> {
        return new BucketViewFieldBuilder<any, any, any, any, any, any>(
            'query',
            {
                query: {
                    link: (link as string).replace(/\$\d+/g,'$'),
                    path: link as string,
                    view: view as string | undefined
                }
            });
    }

    query<
        LinkBucketName extends keyof Module['buckets'],
        LinkBucket extends $Bucket = Module['buckets'][LinkBucketName]
    >(
        amount: 'one'|'many',
        bucket: LinkBucketName,
        query: NQL_Query<Module, LinkBucket>,
        params?: $BucketViewFieldFn<AnyTrxNode, RootBucket, LinkBucket, Value, Record<string, any>>
    ): NoInfer<BucketViewFieldBuilder<Space, Module, RootBucket, LinkBucket, LinkBucket['#data'][], 'query'>> {
        return new BucketViewFieldBuilder<any, any, any, any, any, any>(
            'query',
            {
                query: {
                    many: amount === 'many',
                    bucket: bucket as any,
                    query: query as NQL_AnyQuery,
                    params: params as $BucketViewFieldFn<any, any, any, any>,
                    view: undefined
                }
            });
    }

    obj<
        Builders extends BucketViewFieldBuilders<RootBucket, RootBucket, any>
    >(children: Builders):
        NoInfer<BucketViewFieldBuilder<Space, Module, RootBucket, CurrentBucket, $BucketViewDataInfer<Builders>, 'obj'>>
    {
        return new BucketViewFieldBuilder<any, any, any, any, any, any>(
            'obj',
            {},
            children);
    }
    
    view<
        ViewName extends keyof RootBucket['views'],
        View extends RootBucket['views'][ViewName]
    >(
        view: ViewName
    ):
        NoInfer<BucketViewFieldBuilder<Space, Module, RootBucket, CurrentBucket, View['#data'], 'view'>>
    {
        return new BucketViewFieldBuilder<any, any, any, any, any, any>(
            'view',
            {
                view: {
                    view: view as string
                }
            });
    }

    drive<
        F extends DriveFieldpath<RootBucket>
    >(
        path: F
    ):
        NoInfer<BucketViewFieldBuilder<Space, Module, RootBucket, CurrentBucket, string, 'drive'>>
    {
        return new BucketViewFieldBuilder<any, any, any, any, any, any>(
            'drive',
            {
                drive: {
                    path: path as string,
                }
            });
    }

    extend<
        ViewName extends keyof RootBucket['views'],
        Builders extends BucketViewFieldBuilders<any, any, any>
    >(
        view: ViewName,
        fields: Builders
    ): $BucketViewFieldBuilderInfer<RootBucket['views'][ViewName]['#data']> & Builders { 
        return {
            __ext: view as never,
            ...fields
        };
    }
}

/*
    Builder
*/

/**
 * @category Builders
 * @subcategory Entity
 * */
export class BucketViewFieldBuilder<
    Space extends $Space,
    Module extends $Module,
    RootBucket extends $Bucket,
    CurrentBucket extends $Bucket,
    Value,
    Scope extends $BucketViewField['type']
> {
    $b = 'view.field' as const;

    protected ops: ({
        type: 'map'
        def: (field: BucketViewFieldBuilder<any, any, any, any, any, any>) => BucketViewFieldBuilder<any, any, any, any, any, any>
    } | {
        type: 'prop'
        prop: string
    } | {
        type: 'list'
    } | {
        type: 'dict'
        key?: string
    } | {
        type: 'group'
        key: string
    } | {
        type: 'transform'
        fn: $BucketViewFieldFn<any, any, any, any>
    } | {
        type: 'subview'
        def: BucketViewDef<any, any, any, any, any>
    })[] = [];

    private root_map = false;
    
    constructor(
        protected type: $BucketViewField['type'],
        protected meta: $BucketViewFieldMeta,
        subview?: BucketViewFieldBuilders<any, any, any>
    ) {
        if (subview) {
            this.ops.push({
                type: 'subview',
                def: () => subview
            })
        }
        if (type === 'model' && meta.model!.path.endsWith('.*')) {
            this.root_map = true;
        }
    }

    map<
        Def extends (field: BucketViewFieldBuilder<Space, Module, RootBucket, CurrentBucket, (Value & unknown[])[number], any>) => BucketViewFieldBuilder<any, any, any, any, any, any>,
        Builder extends ReturnType<Def>
    >(def: Def): Value extends Record<string, any>
        ? NoInfer<BucketViewFieldBuilder<Space, Module, RootBucket, CurrentBucket, 
            Builder extends BucketViewFieldBuilder<any, any, any, any, infer X, any> ? X[] : never
        , Scope>>
        : 'ERROR: `.map` only allowed for list values'
    {
        this.ops.push({
            type: 'map',
            def
        });
        
        return this as never;
    }

    pick<
        K extends keyof Value
    >(
        prop: K
    ): Value extends Record<string, any>
            ? NoInfer<BucketViewFieldBuilder<Space, Module, RootBucket, CurrentBucket, Value[K], Scope>>
            : 'ERROR: `.pick` only allowed for object values'
    {
        this.ops.push({
            type: 'prop',
            prop: prop as string
        });
        return this as never;
    }

    as_list<
        Val = Value extends Record<string, infer X> ? X : never
    >(): Value extends Record<string, any>
        ? NoInfer<BucketViewFieldBuilder<Space, Module, RootBucket, CurrentBucket, { [x: string]: Val }, Scope>>
        : ['ERROR: \'.as_list\' only allowed for object nodes', Value]
    {
        this.ops.push({
            type: 'list'
        });
        
        return this as never;
    }

    as_dict<
        Key extends Value extends any[] ? keyof Value[number] : never,
        Val extends Value extends any[] ? Value[number] : never
    >(
        key?: keyof { [K in Key as Val[K] extends string | number ? K : never]: never }
    ): Value extends any[]
        ? NoInfer<BucketViewFieldBuilder<Space, Module, RootBucket, CurrentBucket, { [x: string]: Val }, Scope>>
        : ['ERROR: \'.as_dict\' only allowed for list nodes', Value]
    {
        this.ops.push({
            type: 'dict',
            key: key as string
        });
        
        return this as never;
    }

    group_by<
        Key extends Value extends any[] ? keyof Value[number] : never,
        Val extends Value extends any[] ? Value[number] : never,
        ValidKey extends Val[Key] extends string | number ? Key : never
    >(
        key: ValidKey
    ): Value extends any[]
        ? NoInfer<BucketViewFieldBuilder<Space, Module, RootBucket, CurrentBucket, { [x: string]: Val[] }, Scope>>
        : 'ERROR: `.group` only allowed for list nodes'
    {
        this.ops.push({
            type: 'group',
            key: key as string
        });
        
        return this as never;
    }

    transform<
        Fn extends $BucketViewFieldFn<TrxNode<any, Module, never>, RootBucket, Value extends any[] ? never : CurrentBucket, Value>
    >(
        fn: Fn
    ): NoInfer<BucketViewFieldBuilder<Space, Module, RootBucket, CurrentBucket, ComputedData<Fn>, Scope>> {
        this.ops.push({
            type: 'transform',
            fn
        });
        return this as never;
    }

    obj<
        Def extends BucketViewDef<any, Module, RootBucket, CurrentBucket, Value>,
        Builders extends ReturnType<Def>
    >(def: Def):
        NoInfer<BucketViewFieldBuilder<Space, Module, RootBucket, CurrentBucket, {
            [K in keyof Builders]: Builders[K] extends BucketViewFieldBuilder<any, any, any, any, infer X, any> ? X : never
        }, Scope>>
    {
        this.ops.push({
            type: 'subview',
            def
        });
        return this as never;
    }

    chain<
        Def extends BucketViewFieldDef<any, Module, RootBucket, CurrentBucket, Value>,
        Builder extends ReturnType<Def>
    >(def: Def):
        NoInfer<BucketViewFieldBuilder<Space, Module, RootBucket, CurrentBucket,
            Builder extends BucketViewFieldBuilder<any, any, any, any, infer X, any> ? X : never
        , Scope>>
    {
        this.ops.push({
            type: 'subview',
            def: $ => ({ '#': def($) })
        });
        this.ops.push({
            type: 'prop',
            prop: '#'
        })
        return this as never;
    }


    // Build

    public static build(
        module: string,
        builder: BucketViewFieldBuilder<any, any, any, any, any, any>,
        model: $BucketModel,
        graph: $BucketGraph,
        views: $BucketViews,
        name: string,
        n_indexes: number,
        tree: ModuleTree
    ): $BucketViewField {

        let n_asterisks = 0;  
        let graphLink: $BucketGraphLink | undefined = undefined;      
        if (builder.type === 'model') {
            const path = builder.meta.model!.path;
            n_asterisks = path.match(/\.\*(\.|$)/g)?.length || 0;

            // Check if indexes are valid
            // $0, $1, $2.. should be up to n_indexes
            const path_indexes = path.match(/\.\$\d+(\.|$)/g)?.map(d => parseInt(d.slice(2))) || [];
            if (Math.max(...path_indexes) >= n_indexes) {
                if (n_indexes === 0) {
                    throw new Error('Index $ can only be specified inside a .map');
                }
                throw new Error(`Maximum index allowed: $${n_indexes-1}`);
            }

            if (path !== '__root' && path !== '__current' && path !== '__value') {
                // Retrieve one or more BucketModelFields referenced by a modelpath.
                // (It's only more than one when using unions)
                // The field itself is not used here, but serves to validate that the modelpath exists.
                const modelFields = $BucketModel.getFields(model, path);
                if (!modelFields.length) {
                    throw NesoiError.Builder.Bucket.UnknownModelField(builder.meta.model!.path);
                }
            }
        }
        else if (builder.type === 'query') {
            if ('link' in builder.meta.query!) {
                const key = builder.meta.query!.link?.replace(/\$\d+/g,'$');
                graphLink = builder.meta.query!.link ? graph.links[key] : undefined;
                if (!graphLink) {
                    throw NesoiError.Builder.Bucket.UnknownGraphLink(builder.meta.query!.link || '');
                }
            }
            else {
                const bucketName = builder.meta.query!.bucket as any as string;
                const tag = Tag.fromNameOrShort(module, 'bucket', bucketName);
                const bucket = Tag.resolve(tag, tree) as $Bucket;
                if (!bucket) {
                    throw NesoiError.Builder.Bucket.UnknownBucket({ bucket: bucketName });
                }
                builder.meta.query!.bucket = tag;
            }
        }
        else if (builder.type === 'view') {
            const view = builder.meta.view?.view ? views[builder.meta.view?.view] : undefined;
            if (!view) {
                throw NesoiError.Builder.Bucket.UnknownViewName(builder.meta.view?.view || '');
            }
        }

        let ops: $BucketViewFieldOp[] = [];

        const buildOp = (op: typeof builder['ops'][number], n_maps = 0): $BucketViewFieldOp => {
            if (op.type === 'map') {
                const temp_field = new BucketViewFieldBuilder('' as any, {});
                op.def(temp_field);

                return {
                    type: 'map' as const,
                    ops: temp_field.ops.map(op => buildOp(op, n_maps+1))
                };
            }
            else if (op.type === 'subview') {
                const factory = new BucketViewFieldFactory();
                const builders = op.def(factory);
                const children = this.buildMany(module, builders, model, graph, views, n_indexes+n_maps+n_asterisks, tree);
                return {
                    type: 'subview' as const,
                    children
                };
            }
            else {
                return op;
            }
        }
        
        for (const op of builder.ops) {
            const built = buildOp(op);
            ops.push(built);
        }
        if (builder.root_map) {
            ops = [{
                type: 'map',
                ops
            }]
        }

        return new $BucketViewField(
            name,
            builder.type,
            name,
            builder.meta,
            ops
        );
    }

    public static buildMany(
        module: string,
        fields: BucketViewFieldBuilders<any, any, any>,
        model: $BucketModel,
        graph: $BucketGraph,
        views: $BucketViews,
        n_indexes = 0,
        tree: ModuleTree
    ) {
        const schema = {} as $BucketViewFields;

        // Extended fields inherit from other views
        if ('__ext' in fields) {
            const ext = views[fields.__ext as any as string];
            Object.assign(schema, ext.fields);
        }

        for (const f in fields) {
            if (f === '__ext') { continue; }
            if (f === '__root') {
                schema['__root' as never] = {} as any;
                continue;
            }
            if (f === '__current') {
                schema['__current' as never] = {} as any;
                continue;
            }
            if (f === '__value') {
                schema['__value' as never] = {} as any;
                continue;
            }

            const field = fields[f];
            schema[f] = BucketViewFieldBuilder.build(module, field, model, graph, views, f, n_indexes, tree);
        }
        return schema;
    }

}

/*
    Collection
*/

export type BucketViewFieldBuilders<
    RootBucket extends $Bucket,
    CurrentBucket extends $Bucket,
    Value
> = {
    [x: string]: BucketViewFieldBuilder<any, any, RootBucket, CurrentBucket, Value, any>
}
