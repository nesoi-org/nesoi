import { AnyBucketBuilder, BucketBuilder } from '~/elements/entities/bucket/bucket.builder';
import { NesoiError } from '~/engine/data/error';
import { InlineApp } from '~/engine/apps/inline.app';
import { TrxStatus } from '~/engine/transaction/trx';
import { AnyBuilder } from '~/engine/module';

export function expectBucket(
    def: (builder: AnyBucketBuilder) => any,
    inject: AnyBuilder[] = []
) {
    const builder = new BucketBuilder('test', 'test')
    def(builder);

    const app = new InlineApp('test', [ ...inject, builder ])

    let promise: Promise<TrxStatus<any>[]>;

    const step1 = {
        toBuildOne(raw: Record<string, any>, view: string) {
            promise = Promise.all([raw].map(raw =>
                app.daemon().then(daemon =>
                    daemon.trx('test').run(
                        trx => trx.bucket('test').buildOne(raw as any, view)
                    )
                )))
            return step2;
        }
    }

    type ErrorFn = (...args: any[]) => NesoiError.BaseError;

    const step2 = {
        async as(parsed: Record<string, any>) {
            const status = await promise;
            status.forEach(st => {
                if (st.state === 'error') {
                    console.log(st.summary());
                    console.error(st.error?.data);
                    console.error(st.error?.data?.unionErrors);
                    console.error(st.error?.stack);
                }
                expect(st.state).toEqual('ok')
                expect(st.output)
                    .toEqual(parsed)
            })
        },
        async butFail(error: ErrorFn) {
            const errorObj = error({});
            try {
                const status = await promise;
                status.forEach(st => {
                    expect(st.state).toEqual('error')
                    expect(st.error?.name)
                        .toEqual(errorObj.name)
                })
            }
            catch (e: any) {
                expect(e.toString())
                    .toMatch(new RegExp(`^\\[${errorObj.name}\\]`))
            }
        }
    }

    return step1;
}