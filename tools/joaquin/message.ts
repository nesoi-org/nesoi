import { MessageBuilder } from '~/elements/entities/message/message.builder';
import { MessageTemplateDef } from '~/elements/entities/message/template/message_template.builder';
import { NesoiError } from '~/engine/data/error';
import { InlineApp } from '~/engine/apps/inline.app';
import { TrxStatus } from '~/engine/transaction/trx';

export function expectMessage(
    def: MessageTemplateDef<any, any, any>
) {
    const builder = new MessageBuilder('test', 'test')
    builder.template(def);

    const app = new InlineApp('test', [ builder ])

    let promise: Promise<TrxStatus<any>[]>;

    const step1 = {
        toParse(raw: Record<string, any>) {
            promise = Promise.all([raw].map(raw =>
                app.daemon().then(daemon =>
                    daemon.trx('test').run(
                        trx => trx.message({ $: 'test', ...raw })
                    )
                )))
            return step2;
        },
        toParseAll(raws: Record<string, any>[]) {
            promise = Promise.all(raws.map(raw =>
                app.daemon().then(daemon =>
                    daemon.trx('test').run(
                        trx => trx.message({ $: 'test', ...raw })
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
                expect(st.state).toEqual('ok')
                expect(st.output.getData())
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