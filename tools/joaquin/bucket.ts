import { AnyBucketBuilder, BucketBuilder } from '~/elements/entities/bucket/bucket.builder';
import { NesoiError } from '~/engine/data/error';
import { InlineApp } from '~/engine/apps/inline.app';
import { TrxStatus } from '~/engine/transaction/trx';
import { AnyBuilder } from '~/engine/module';
import { AppBucketConfig } from '~/engine/apps/app.config';
import { MemoryBucketAdapter } from '~/elements';

export function givenBucket<Def>(
    name: string,
    def: (builder: AnyBucketBuilder) => any
) {
    const builder = new BucketBuilder('test', name)
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

export function expectBucket(
    def: (builder: AnyBucketBuilder) => any,
    inject: (AnyBuilder | { builder: AnyBucketBuilder, data: Record<string, any> })[] = []
) {
    const builder = new BucketBuilder('test', 'test')
    def(builder);

    const injectBuilders = inject.map(i => 'builder' in i ? i.builder : i);
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

    let promise: () => Promise<TrxStatus<any>>;

    const step1 = {
        toBuildOne(raw: Record<string, any>, view: string) {
            promise = () => app.daemon().then(daemon =>
                daemon.trx('test').run(
                    trx => trx.bucket('test').buildOne(raw as any, view)
                )
            )
            return step2;
        },
        toBuildMany(raws: Record<string, any>[], view: string) {
            promise = () => app.daemon().then(daemon =>
                daemon.trx('test').run(
                    trx => trx.bucket('test').buildMany(raws as any, view)
                )
            )
            return step2;
        }
    }

    type ErrorFn = (...args: any[]) => NesoiError.BaseError;

    const step2 = {
        async as(parsed: Record<string, any> | Record<string, any>[]) {
            const status = await promise();
            if (status.state === 'error') {
                console.log(status.summary());
                console.error(status.error?.data);
                console.error(status.error?.data?.unionErrors);
                console.error(status.error?.stack);
            }
            expect(status.state).toEqual('ok')
            expect(status.output)
                .toEqual(parsed)
        },
        async butFail(error: ErrorFn) {
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