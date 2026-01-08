import type { AnyBucketBuilder} from '~/elements/entities/bucket/bucket.builder';
import { BucketBuilder } from '~/elements/entities/bucket/bucket.builder';
import type { NesoiError } from '~/engine/data/error';
import { InlineApp } from '~/engine/app/inline.app';
import { TrxStatus } from '~/engine/transaction/trx';
import type { AnyBuilder, AnyModule } from '~/engine/module';
import type { AppBucketConfig } from '~/engine/app/app.config';
import { Daemon } from '~/engine/daemon';
import { BucketModel } from '~/elements/entities/bucket/model/bucket_model';
import { NesoiDatetime } from '~/engine/data/datetime';
import { MemoryBucketAdapter } from '~/elements/entities/bucket/adapters/memory.bucket_adapter';
import type { Overlay } from '~/engine/util/type';

export function givenBucket<
    Name extends string,
    Def extends (builder: BucketBuilder<$Space, $Module, Overlay<$Bucket, { name: Name }>>) => AnyBucketBuilder
>(
    name: Name,
    def: Def
) {
    const builder = new BucketBuilder('test', name) as ReturnType<Def>
    const data: Record<string, any> = {};
    def(builder);
    return {
        builder,
        data,
        withData(mock: Record<string, any>) {
            Object.assign(data, mock);
            return this;
        }
    };
}

type InjectedBuckets<
    Inject extends (AnyBuilder | { builder: AnyBucketBuilder, data: Record<string, any> })
> = {
    [B in Inject as
        B extends BucketBuilder<any, any, infer X> ? X['name']
        : B extends { builder: BucketBuilder<any, any, infer X> } ? X['name']
        : never
    ]: B extends BucketBuilder<any, any, infer X> ? X
        : B extends { builder: BucketBuilder<any, any, infer X> } ? X
        : never
}

export function expectBucket<
    Inject extends (AnyBuilder | { builder: AnyBucketBuilder, data: Record<string, any> }),
>(
    def: (builder: BucketBuilder<$Space, Overlay<$Module, {
        buckets: InjectedBuckets<Inject>
    }>, Overlay<$Bucket, { name: 'test' }>>) => any,
    inject: Inject[] = []
) {
    const builder = new BucketBuilder('test', 'test')
    def(builder);

    const injectBuilders = inject.map(i => 'builder' in i ? i.builder : i) as AnyBuilder[];
    const app = new InlineApp('test', [ ...injectBuilders, builder ])

    // Configure buckets
    const bucketConfig: AppBucketConfig<any, any, any> = {};
    for (const i of inject) {
        if (!('data' in i)) continue;
        bucketConfig[(i.builder as any).name] = {
            adapter: (schema: any) => new MemoryBucketAdapter(schema, i.data)
        }
    }
    app.config.module('test', {
        buckets: bucketConfig
    })

    const data: Record<string, any>[] = [];
    let promise: () => Promise<TrxStatus<any>>;

    const step1 = {
        withObj(obj: Record<string, any>) {
            data.push(obj);
            return step1;
        },
        toQueryOne(id: string|number, view?: string, flags?: {
            serialize: boolean
        }) {
            promise = () => app.daemon().then(daemon =>
                daemon.trx('test').run($ =>
                    (view
                        ? $.bucket('test').query({ id } as never).view(view)
                        : $.bucket('test').query({ id } as never)
                    ).serialize(flags?.serialize).firstOrFail()
                )
            )
            return step2;
        },
        toCopyOne(raw: Record<string, any>, op: 'save'|'load') {
            promise = () => app.daemon().then(daemon => {
                const bucket = Daemon.getModule(daemon, 'test').buckets['test'];
                const model = new BucketModel(bucket.schema);
                const copy = model.copy(raw, op);
                return new TrxStatus('', 'trx:', NesoiDatetime.now(), NesoiDatetime.now(), 'ok', copy);
            })
            return step2;
        },
        toBuildOne(raw: Record<string, any>, view: string, flags?: {
            serialize: boolean
        }) {
            promise = () => app.daemon().then(daemon =>
                daemon.trx('test').run(
                    trx => trx.bucket('test').buildOne(raw as any, view, flags)
                )
            )
            return step2;
        },
        toBuildMany(raws: Record<string, any>[], view: string, flags?: {
            serialize: boolean
        }) {
            promise = () => app.daemon().then(daemon =>
                daemon.trx('test').run(
                    trx => trx.bucket('test').buildMany(raws as any, view, flags)
                )
            )
            return step2;
        },
        schema(fn: ($: { schema: $Bucket, module: AnyModule }) => Promise<void>) {
            return app.daemon().then(daemon => {
                const module = Daemon.getModule(daemon, 'test');
                const schema = module.buckets['test'].schema;
                return fn({ schema, module });
            })
        }
    }

    type ErrorFn = (...args: any[]) => NesoiError.BaseError;

    const dataStep = () => {
        if (!data.length) return Promise.resolve();
        app.daemon()
            .then(daemon =>
                daemon.trx('test').run(async trx => {
                    for (const obj of data)
                        await trx.bucket('test').put(obj as any)
                })
            )
            .then(res => {
                if (res.error) throw res.error;
                return res.output!;
            });
    }

    const step2 = {
        async as(parsed: Record<string, any> | Record<string, any>[]) {
            await dataStep();
            const status = await promise();
            if (status.state === 'error') {
                console.log(status.summary());
                console.error({
                    data: status.error?.data,
                    unionErrors: status.error?.data?.unionErrors,
                    stack: status.error?.stack
                });
                throw status.error;
            }
            expect(status.state).toEqual('ok')
            expect(status.output)
                .toEqual(parsed)
        },
        async butFail(error: ErrorFn) {
            await dataStep();
            const errorObj = error({});
            try {
                const status = await promise();
                expect(status.state).toEqual('error')
                expect(status.error?.name)
                    .toEqual(errorObj.name)
            }
            catch (e: any) {
                expect(e.toString())
                    .toMatch(new RegExp(`^\\[${errorObj.name}\\]`))
            }
        }
    }

    return step1;
}