import type { Then, When } from 'nesoi/tools/joaquin/bucket';
import { t } from 'nesoi/tools/joaquin/bucket';
import type { t_TrxNode } from '~/engine/transaction/trx_node';
import { Log } from '~/engine/util/log'

Log.level = 'off';

describe('Trx Engine', () => {

    const bucket = t.bucket('test', $ => $
        .model($ => ({
            id: $.int,
            name: $.string,
        }))
    );

    function makeSpies($: Parameters<When<any, any, any, any>>[0]) {
        $.spy($.trx_engine, 'begin')
        $.spy($.trx_engine, 'hold')
        $.spy($.trx_engine, 'continue')
        $.spy($.trx_engine, 'ok')
        $.spy($.trx_engine, 'error')
        $.spy($.trx_engine, 'save_log')
    }

    function expect_spies($: Then<any>, expected: Record<string, number>) {
        expect($.spy['begin']).toHaveBeenCalledTimes(expected['begin'] ?? 0);
        expect($.spy['hold']).toHaveBeenCalledTimes(expected['hold'] ?? 0);
        expect($.spy['continue']).toHaveBeenCalledTimes(expected['continue'] ?? 0);
        expect($.spy['ok']).toHaveBeenCalledTimes(expected['ok'] ?? 0);
        expect($.spy['error']).toHaveBeenCalledTimes(expected['error'] ?? 0);
        expect($.spy['save_log']).toHaveBeenCalledTimes(expected['save_log'] ?? 0);
    }

    describe ('run', () => {

        it('no id, r', async() => t.given(bucket)
            .when.trx_engine(async $ => {
                makeSpies($);
                return $;
            })
            .then(async $ => {
                const status = await $.trx_engine.trx(async node => {
                    const trx = (node as any as t_TrxNode).trx;
                    const status = trx.status();
                    
                    expect(status.state).toEqual('open');
                    expect_spies($, { begin: 1 });
                    return
                });

                expect(status.state).toEqual('ok');
                expect_spies($, { begin: 1, ok: 1 });

                console.log(status.summary());
            })
        )

    })


})
