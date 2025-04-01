import { Log } from '~/engine/util/log';
import postgres from 'postgres'
import { NesoiDate } from '~/engine/data/date';
import { NesoiDatetime } from '~/engine/data/datetime';
import { Decimal } from '~/engine/data/decimal';
import { PostgresNQLRunner } from './postgres.nql';
import { AnyTrx, Trx } from '~/engine/transaction/trx';
import { TrxEngineWrapFn } from '~/engine/transaction/trx_engine.config';
import { Database } from './migrator/database';
import { PostgresConfig } from './postgres.config';

export class PostgresProvider {

    public static make<
        Name extends string
    >(name: Name, config?: PostgresConfig) {
        return {
            name: name,
            libPaths: [
                'modules/*/migrations'
            ],
            up: () => new PostgresProvider(config),
            down: () => {}
        }
    }

    public sql: postgres.Sql<any>
    public nql: PostgresNQLRunner

    private constructor(
        public config?: PostgresConfig
    ) {
        Log.info('postgres' as any, 'provider', 'Connecting to Postgres database')
        this.sql = Database.connect({
            ...(config?.connection || {}),
            debug: true,
            types: {
                char: {
                    to        : 1042,
                    from      : [1042],
                    serialize : (val?: string) => val?.trim?.(),
                    parse     : (val?: string) => val?.trim?.()
                },
                date: {
                    to        : 1082,
                    from      : [1082],
                    serialize : (val?: NesoiDate) => val?.toISO(),
                    parse     : (val?: string) => val ? NesoiDate.fromISO(val) : undefined
                },
                datetime: {
                    to        : 1114,
                    from      : [1114],
                    serialize : (val?: NesoiDatetime) => 
                        typeof val === 'string'
                            ? val
                            : val?.toISO(),
                    parse     : (val?: string) => NesoiDatetime.fromISO(val?.replace(' ','T')+'Z')
                },
                datetime_z: {
                    to        : 1184,
                    from      : [1184],
                    serialize : (val?: NesoiDatetime) =>
                        typeof val === 'string'
                            ? val
                            : val?.toISO(),
                    parse     : (val?: string) => NesoiDatetime.fromISO(val?.replace(' ','T')+'Z')
                },
                decimal: {
                    to        : 1700,
                    from      : [1700],
                    serialize : (val?: Decimal) => val?.toString(),
                    parse     : (val?: string) => val ? new Decimal(val) : undefined
                }
            }
        })
        this.nql = new PostgresNQLRunner();
    }

    public static wrap(provider: string) {
        return (trx: AnyTrx, fn: TrxEngineWrapFn<any, any>, providers: Record<string, any>) => {
            const postgres = providers[provider].sql as postgres.Sql<any>;
            return postgres.begin(sql => {
                Trx.set(trx.root, 'sql', sql);
                return fn(trx.root);
            })
        }
    }
}