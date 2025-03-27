import { MemoryBucketAdapter } from 'nesoi/lib/elements';

import { Bigbox, Circle } from '../.nesoi/example.module';
import { Area } from '../.nesoi/irrigation.module';
import Nesoi from '../nesoi';
import { ZeroAuthnProvider } from 'nesoi/lib/engine/auth/zero.authn_provider';
import { MonolythApp } from 'nesoi/lib/engine/apps/monolyth/monolyth.app';
import { PostgresBucketAdapter, PostgresConfig, PostgresProvider } from '~/adapters/postgres/src/postgres.bucket_adapter';
import { PostgresCLI } from '~/adapters/postgres/src/postgres.cli';

const PostgresConfig: PostgresConfig = {
    updatedAtField: 'updated_at',
    connection: {
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        pass: 'postgres',
        db: 'bigrock_sandbox',
    }
}

export default new MonolythApp('bigrock', Nesoi)

    .modules([
        'example',
        'irrigation'
    ])

    .provider(
        PostgresProvider.make('pg', PostgresConfig)
    )

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
            },
            camera: {
                adapter: ($, { pg }) => new PostgresBucketAdapter($, pg, 'cameras')
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

    .config.cli({
        adapters: {
            pg: ({ pg }) => new PostgresCLI(pg)
        }
    })