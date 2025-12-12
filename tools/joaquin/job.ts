import type { AnyJobBuilder} from '~/elements/blocks/job/job.builder';
import { JobBuilder } from '~/elements/blocks/job/job.builder';
import type { AnyMessage } from '~/elements/entities/message/message';
import type { NesoiError } from '~/engine/data/error';
import { InlineApp } from '~/engine/app/inline.app';
import type { TrxStatus } from '~/engine/transaction/trx';

export function expectJob(
    def: ($: AnyJobBuilder) => any
) {
    const builder = new JobBuilder('test', 'test')
    def(builder);

    const app = new InlineApp('test', [ builder ])

    let promise: () => Promise<TrxStatus<any>>;
    let raw: { $?: string, [x: string]: any } | undefined;
    let msg: AnyMessage | undefined;

    const step1 = {
        onRaw(_raw: { $?: string, [x: string]: any }) {
            raw = _raw;
            promise = () => app.daemon().then(daemon =>
                daemon.trx('test').run(
                    trx => trx.job('test').run(_raw as any)
                )
            )
            return step2;
        },
        onMessage(_msg: AnyMessage) {
            msg = _msg;
            promise = () => app.daemon().then(daemon =>
                daemon.trx('test').run(
                    trx => trx.job('test').forward(_msg)
                )
            )
            return step2;
        }
    }

    type ErrorFn = (...args: any[]) => NesoiError.BaseError;

    const step2 = {
        async toResolve(value: ($: { raw?: { $?: string, [x: string]: any }, msg?: AnyMessage }) => any) {
            const status = await promise();
            expect(status.state).toEqual('ok')
            expect(status.output)
                .toEqual(value({raw, msg}))
        },
        async toReject(error: ($: { raw?: { $?: string, [x: string]: any }, msg?: AnyMessage }) => ErrorFn) {
            const errorObj = error({raw, msg})({});
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