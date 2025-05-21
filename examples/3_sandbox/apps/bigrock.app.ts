import { MemoryBucketAdapter } from 'nesoi/lib/elements';

import Nesoi from '../nesoi';
import { ZeroAuthnProvider } from 'nesoi/lib/engine/auth/zero.authn_provider';
import { MonolythApp } from 'nesoi/lib/engine/apps/monolyth/monolyth.app';

export default new MonolythApp('bigrock', Nesoi)

    .modules([
        'example',
        'irrigation'
    ])

    .config.authn({
        api: () => new ZeroAuthnProvider(),
        token: () => new ZeroAuthnProvider() as any
    })

    .config.buckets({
        example: {
            bigbox: {
                adapter: $ => new MemoryBucketAdapter($, {
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
                adapter: $ => new MemoryBucketAdapter($, {
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
                adapter: $ => new MemoryBucketAdapter($, {
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

    .config.trash({
        example: {
            adapter: $ => new MemoryBucketAdapter($)
        }
    })