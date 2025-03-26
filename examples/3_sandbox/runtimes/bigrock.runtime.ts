import { MemoryBucketAdapter } from 'nesoi/lib/elements';

import { Bigbox, Circle } from '../.nesoi/example.module';
import { Area } from '../.nesoi/irrigation.module';
import Nesoi from '../nesoi';
import { MonolythRuntime } from 'nesoi/lib/engine/runtimes/monolyth.runtime';
import { ZeroAuthnProvider } from 'nesoi/lib/engine/auth/zero.authn_provider';
import { PostgresBucketAdapterConfig } from '~/adapters/postgres/src/postgres.bucket_adapter';
import postgres from 'postgres';

const PostgresConfig: PostgresBucketAdapterConfig = {
    updatedAtField: 'updated_at',
    postgres: {
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        pass: 'postgres',
        db: 'bkp_dev_aliseo',
    }
}

class PostgresProvider {

    public sql!: postgres.Sql<any>

}

export default new MonolythRuntime('bigrock', Nesoi)

    .modules([
        'example',
        'irrigation'
    ])

    .provider('postgres', {
        up: () => new PostgresProvider(),
        down: () => {}
    })

    .config.authn({
        api: new ZeroAuthnProvider()
    })

    .config.buckets({
        example: {
            bigbox: {
                adapter: $ => new MemoryBucketAdapter<Bigbox>($, {
                    1: {
                        id: 1,
                        namhe: 'Big Box 1',
                        amount: 3,
                        reco: {},
                        kaka: [{
                            lala: {
                                koko: true
                            }
                        }],
                        la: 'a',
                        state: 'idle',
                        jojo: {},
                        la2: 'rgb',
                        simpleobj: [{
                            a: 1,
                            b: true,
                            c: [{
                                d: 1,
                                e: 3
                            }]
                        },{
                            a: 2,
                            b: true,
                            c: [{
                                d: 1,
                                e: 3
                            }]
                        }]
                    },
                    2: {
                        id: 2,
                        namhe: 'Big Box 2',
                        amount: 3,
                        reco: {},
                        kaka: [{
                            lala: {
                                koko: true
                            }
                        }],
                        la: 'a',
                        state: 'idle',
                        jojo: {},
                        la2: 'rgb',
                        simpleobj: [{
                            a: 1,
                            b: true,
                            c: [{
                                d: 1,
                                e: 3
                            }]
                        },{
                            a: 1,
                            b: true,
                            c: [{
                                d: 2,
                                e: 3
                            }]
                        }]
                    }
                })
            },
            circle: {
                adapter: $ => new MemoryBucketAdapter<Circle>($, {
                    1: {
                        id: 1,
                        name: 'Circulo 1',
                        radius: 3,
                        state: 'idle'
                    },
                    2: {
                        id: 2,
                        name: 'Circulo 2',
                        radius: 14.32,
                        state: 'rotating'
                    },
                    3: {
                        id: 3,
                        name: 'Circulo 3',
                        radius: 3.8,
                        state: 'stretched'
                    }
                })
            }
        },
        irrigation: {
            area: {
                adapter: $ => new MemoryBucketAdapter<Area>($, {
                    1: {
                        id: 1,
                        name: 'Área 1',
                        radius: 3,
                        state: 'lalla'
                    }
                })
            }
        }
    })

    .config.compiler({
        
    })

    .config.trx({
        example: {
            trx: {
                wrap: (trx, fn, providers) => {
                    return providers.postgres.sql.begin(sql => {
                        return fn(trx.root);
                    })
                }
            }
        }
    })