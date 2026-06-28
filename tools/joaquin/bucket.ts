import type { AnyBucketBuilder} from '~/elements/entities/bucket/bucket.builder';
import { BucketBuilder } from '~/elements/entities/bucket/bucket.builder';
import { InlineApp } from '~/engine/app/inline.app';
import type { AnyBuilder } from '~/engine/module';
import type { AppModuleConfig } from '~/engine/app/app.config';
import type { AnyDaemon} from '~/engine/daemon';
import { Daemon } from '~/engine/daemon';
import { MemoryBucketAdapter } from '~/elements/entities/bucket/adapters/memory.bucket_adapter';
import type { Overlay } from '~/engine/util/type';
import type { Bucket } from '~/elements/entities/bucket/bucket';
import type { AnyTrxNode, TrxNode } from '~/engine/transaction/trx_node';
import { ConstantsBuilder } from '~/elements/entities/constants/constants.builder';
import type { BucketAdapter } from '~/elements/entities/bucket/adapters/bucket_adapter';
import type { TrxStatus } from '~/engine/transaction/trx';
import { AuthProvider } from '~/engine/auth/authn';
import type { TrxEngine } from '~/engine/transaction/trx_engine';
import _Promise from '~/engine/util/promise';

type TestModule<I extends Inject> = Overlay<$Module, {
    buckets: {
        [B in I as
            B extends BucketInject<any, infer X> ? X['name'] : never
        ]: 
            B extends BucketInject<any, infer X> ? X : never
    }
}>

export type When<
    Module extends $Module,
    Values,
    Data,
    Out,
> = (
    $: {
        trx: TrxNode<$Space, Module, any>,
        value: Values,
        spy: typeof jest.spyOn
    } & Data
) => Out

export type Then<
    Data
> = {
    spy: Record<string, jest.SpyInstance>
} & Data

class ConstantsInject {
    constructor(
        public builder: ConstantsBuilder
    ) {}    
}

export class BucketInject<Module extends $Module, $ extends $Bucket> {
    constructor(
        public builder: BucketBuilder<any, any, $>,
        public data: Record<string, any> = {},
        public config?: BucketAdapter<any, any>['config'],
        public behavior?: BucketAdapter<any, any>['behavior']
    ) {}

    public extend<
        Def extends (builder: BucketBuilder<$Space, Module, $>) => AnyBucketBuilder
    >(def: Def): BucketInject<Module, ReturnType<Def> extends BucketBuilder<any, any, infer X> ? X : never> {
        def(this.builder);
        return this as never
    }

    public get with() {
        return {
            config: (config: BucketInject<Module,$>['config']) => {
                return this.overriden('config', config);
            },
            behavior: (behavior: BucketInject<Module,$>['behavior']) => {
                return this.overriden('behavior', behavior);
            },
            obj: (obj: NesoiObj & Record<string, any>) => {
                return this.overriden('data', { ...this.data, [obj.id]: obj });
            },
            data: (data: Record<string, NesoiObj & Record<string, any>>) => {
                return this.overriden('data', { ...this.data, ...data });
            },
        }
    }

    private overriden<K extends keyof BucketInject<Module,$>>(key: K, value: BucketInject<Module,$>[K]) {
        const inj = new BucketInject(this.builder, this.data, this.config, this.behavior);
        inj[key] = value;
        return inj;
    }
}

type Inject = ConstantsInject | BucketInject<any,any>

type User = {
    id: number
}
export class TestAuthProvider extends AuthProvider<User, false> {
    eager = false as const;

    authenticate($: { trx: AnyTrxNode, token: string | undefined; }) {
        if (!$.token) throw new Error('TestAuthProvider requires a token with the desired user id');
        const id = parseInt($.token ?? '0');
        if (Number.isNaN(id)) throw new Error('TestAuthProvider requires a token with the desired user id');
        return Promise.resolve({
            token: $.token,
            user: {
                id
            }
        });
    }
}

export class t<Module extends $Module, Values = {}> {
   
    private values: Record<string, any> | (() => Record<string, any>) | (() => Promise<Record<string, any>>) = {};

    constructor(
        private inject: Inject[]
    ) {}

    public static constants<
        Def extends (builder: ConstantsBuilder) => ConstantsBuilder
    >(
        def: Def
    ) {
        const builder = new ConstantsBuilder('test') as ReturnType<Def>
        def(builder);
        
        return new ConstantsInject(builder);
    }

    public static bucket<
        I extends Inject,
        Name extends string,
        Def extends (builder: BucketBuilder<$Space, TestModule<I>, Overlay<$Bucket, { name: Name }>>) => AnyBucketBuilder
    >(
        name: Name,
        def: Def,
        inject?: I[]
    ) {
        const builder = new BucketBuilder('test', name) as ReturnType<Def>
        def(builder);
        
        return new BucketInject<TestModule<I>, ReturnType<Def> extends BucketBuilder<any, any, infer X> ? X : never>(builder);
    }

    public static given<I extends Inject[]>(
        ...inject: I
    ): t<TestModule<I[number]>> {
        return new t(inject);
    }

    public and<V extends Record<string, any>>(
        values: V | (() => V) | (() => Promise<V>)
    ): t<Module, V> {
        this.values = values;
        return this as never;
    }

    public get when() {
        return {
            trx_engine: this.trx_engine.bind(this),
            bucket: this.bucket.bind(this)
        }
    }

    // Transaction Engine tests
    // Read directly from daemon

    private async trx_engine<Out>(
        fn: When<Module, Values, {
            trx_engine: TrxEngine<any, Module, any>
        }, Out>
    ): Promise<Then<{
        trx_engine: TrxEngine<any, Module, any>
        out: Out extends Promise<infer X> ? X : Out
    }>> {
        const { app, value, spies, spy } = await this.init();
        const daemon = await app.daemon();

        const trx_engines = (daemon as any).trxEngines as AnyDaemon['trxEngines'];
        const trx_engine = trx_engines['test'];
        
        const status = await _Promise.solve(fn({
            trx: undefined as any,
            value,
            trx_engine: trx_engine as any,
            spy: spy as any
        }));
            
        return {
            out: status as any,
            trx_engine: trx_engine as any,
            spy: spies
        }
    }

    // Bucket tests
    // TODO: Read directly from daemon

    private async bucket<B extends keyof Module['buckets'], Out>(
        name: B,
        fn: When<Module, Values, {
            bucket: Bucket<Module, Module['buckets']['test']>,
        }, Out>
    ): Promise<Then<{
        bucket: Bucket<Module, Module['buckets']['test']>,
        status: TrxStatus<Out extends Promise<infer X> ? X : Out>
        value: Values
    }>> {
        const { app, value, spies, spy } = await this.init();
        const daemon = await app.daemon();

        let bucket;
        const status = await daemon.trx('test').run(async trx => {
            bucket = Daemon.getModule(daemon, 'test').buckets['test'];
            return fn({
                trx: trx as any,
                value,
                bucket: bucket as any,
                spy: spy as any
            });
        })
        return {
            status: status as any,
            value,
            bucket: bucket as any,
            spy: spies
        }
    }

    private async init() {
        // Prepare app
        const builders = this.inject.map(i => 'builder' in i ? i.builder : i) ?? [] as AnyBuilder[];
        const app = new InlineApp('test', builders);

        // Configure app
        const config: AppModuleConfig<any, any, any> = {
            buckets: {}
        };
        for (const inj of this.inject ?? []) {
            if (inj instanceof BucketInject) {
                config.buckets![(inj.builder as any).name] = {
                    ...inj.config,
                    adapter: (schema, services) => 
                        new MemoryBucketAdapter(schema, inj.data, inj.config, inj.behavior)
                }
            }
        }
        app.config.module('test', config)
        app.config.auth({
            'test': () => new TestAuthProvider()
        })

        // Prepare values
        let value;
        if (typeof this.values === 'function') {
            if ('then' in this.values) {
                value = await (this.values as any)();
            }
            else value = this.values();
        }
        else {
            value = { ...this.values };
        }

        // Setup jest spy bridge
        const spies: Record<string, jest.SpyInstance> = {};
        const spy = (...args: any[]) => {
            try {
                spies[args[1]] = jest.spyOn(args[0], args[1]);
            }
            catch(e) {
                console.error(e)
            }
        }

        return { app, value, spies, spy };
    }

}


// export function expectBucket<
//     Inject extends (AnyBuilder | { builder: AnyBucketBuilder, data: Record<string, any> }),
//     Module extends Overlay<$Module, {
//         buckets: InjectedBuckets<Inject>
//     }>
// >(
//     def: string | ((builder: BucketBuilder<$Space, Module, Overlay<$Bucket, { name: 'test' }>>) => any)
// ) {
//     const { inject } = this;
//     console.log({inject});

//     let builder;
//     if (typeof def === 'string') {
//         const b = inject.find(b => 
//             (b instanceof BucketBuilder && (b as any).name === def)
//             || ((b as any).bucket.name === def)
//         );
//         if (!b) throw new Error(`Bucket '${def}' not injected`);
//         if (b instanceof BucketBuilder) builder = b;
//         else builder = (b as any).builder;
//     }
//     else {
//         const builder = new BucketBuilder('test', 'test')
//         def(builder);
//     }

//     const tag = new Tag('test', 'bucket', typeof def === 'string' ? def : 'test');

//     const injectBuilders = inject.map(i => 'builder' in i ? i.builder : i) as AnyBuilder[];
//     const app = new InlineApp('test', [ ...injectBuilders, builder ])

//     // Configure buckets
//     const bucketConfig: AppBucketConfig<any, any, any> = {};
//     for (const i of inject) {
//         if (!('data' in i)) continue;
//         bucketConfig[(i.builder as any).name] = {
//             adapter: (schema: any) => new MemoryBucketAdapter(schema, i.data)
//         }
//     }
//     app.config.module('test', {
//         buckets: bucketConfig
//     })

//     const data: Record<string, any>[] = [];
//     let promise: () => Promise<TrxStatus<any>>;

//     const fillData = (daemon_or_trx: AnyDaemon | AnyTrxNode) => {
//         let bucket;
//         if (daemon_or_trx instanceof Daemon) {
//             const module = Daemon.getModule(daemon_or_trx, 'test');
//             bucket = module.buckets[tag.name];
//         }
//         else {
//             bucket = Tag.element(tag, daemon_or_trx) as AnyBucket;
//         }
//         const adapter_data = (bucket.adapter as MemoryBucketAdapter<any, any>).data;
//         for (const obj of data)
//             adapter_data[obj.id] = obj;
//     }

//     const step1 = {
//         withObj(obj: Record<string, any>) {
//             data.push(obj);
//             return step1;
//         },

//         async element(fn: (bucket: Bucket<any, any>) => void) {
//             promise = () => app.daemon().then(daemon => {
//                 fillData(daemon);
//                 const bucket = Daemon.getModule(daemon, 'test').buckets['test'];
//                 fn(bucket);
//                 return new TrxStatus('', 'trx:', NesoiDatetime.now(), NesoiDatetime.now(), 'ok');
//             })
//             return promise();
//         },

        
//         // toQueryOne(id: string|number, view?: string, flags?: {
//         //     serialize: boolean
//         // }) {
//         //     promise = () => app.daemon().then(daemon =>
//         //         daemon.trx('test').run($ =>
//         //             (view
//         //                 ? $.bucket('test').query({ id } as never).view(view)
//         //                 : $.bucket('test').query({ id } as never)
//         //             ).serialize(flags?.serialize).firstOrFail()
//         //         )
//         //     )
//         //     return step2;
//         // },
//         // toParseOne(raw: Record<string, any>) {
//         //     promise = () => app.daemon().then(daemon => {
//         //         const bucket = Daemon.getModule(daemon, 'test').buckets['test'];
//         //         const model = new BucketModel(bucket.schema);
//         //         const copy = model.parse(raw);
//         //         return new TrxStatus('', 'trx:', NesoiDatetime.now(), NesoiDatetime.now(), 'ok', copy);
//         //     })
//         //     return step2;
//         // },
//         // toFreezeOne(raw: Record<string, any>) {
//         //     promise = () => app.daemon().then(daemon => {
//         //         const bucket = Daemon.getModule(daemon, 'test').buckets['test'];
//         //         const model = new BucketModel(bucket.schema);
//         //         model.freeze(raw);
//         //         return new TrxStatus('', 'trx:', NesoiDatetime.now(), NesoiDatetime.now(), 'ok', raw);
//         //     })
//         //     return step2;
//         // },
//         // toGetFromOne(raw: Record<string, any>, modelpath: string, args?: string[]) {
//         //     promise = () => app.daemon().then(daemon => {
//         //         const bucket = Daemon.getModule(daemon, 'test').buckets['test'];
//         //         const model = new BucketModel(bucket.schema);
//         //         const copy = model.getter[modelpath]?.(raw, args);
//         //         return new TrxStatus('', 'trx:', NesoiDatetime.now(), NesoiDatetime.now(), 'ok', copy);
//         //     })
//         //     return step2;
//         // },
//         // toBuildOne(raw: Record<string, any>, view: string, flags?: {
//         //     serialize: boolean
//         // }) {
//         //     promise = () => app.daemon().then(daemon =>
//         //         daemon.trx('test').run(
//         //             trx => trx.bucket('test').buildOne(raw as any, view, flags)
//         //         )
//         //     )
//         //     return step2;
//         // },
//         // toBuildMany(raws: Record<string, any>[], view: string, flags?: {
//         //     serialize: boolean
//         // }) {
//         //     promise = () => app.daemon().then(daemon =>
//         //         daemon.trx('test').run(
//         //             trx => trx.bucket('test').buildMany(raws as any, view, flags)
//         //         )
//         //     )
//         //     return step2;
//         // },
//         // schema(fn: ($: { schema: $Bucket, module: AnyModule }) => Promise<void>) {
//         //     return app.daemon().then(daemon => {
//         //         const module = Daemon.getModule(daemon, 'test');
//         //         const schema = module.buckets['test'].schema;
//         //         return fn({ schema, module });
//         //     })
//         // }
//     }

//     type ErrorFn = (...args: any[]) => NesoiError.BaseError;

//     // const step2 = {
//     //     async then(fn: (output: any) => void) {
//     //         await dataStep();
//     //         const status = await promise();
//     //         if (status.state === 'error') {
//     //             console.log(status.summary());
//     //             console.error({
//     //                 data: status.error?.data,
//     //                 unionErrors: status.error?.data?.unionErrors,
//     //                 stack: status.error?.stack
//     //             });
//     //             // throw status.error;
//     //         }
//     //         expect(status.state).toEqual('ok')
//     //         fn(status.output)
//     //     },
//     //     async toEqual(parsed: any) {
//     //         step2.then((output) => expect(output).toEqual(parsed));
//     //     },
//     //     async butFail(error: ErrorFn) {
//     //         await dataStep();
//     //         const errorObj = error({});
//     //         try {
//     //             const status = await promise();
//     //             expect(status.state).toEqual('error')
//     //             expect(status.error?.name)
//     //                 .toEqual(errorObj.name)
//     //         }
//     //         catch (e: any) {
//     //             expect(e.toString())
//     //                 .toMatch(new RegExp(`^\\[${errorObj.name}\\]`))
//     //         }
//     //     }
//     // }

//     return step1;
// }