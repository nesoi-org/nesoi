import { MemoryBucketAdapter } from 'nesoi/lib/elements';

import Nesoi from '../nesoi';
import { ZeroAuthnProvider } from 'nesoi/lib/engine/auth/zero.authn_provider';
import { DistributedApp } from 'nesoi/lib/engine/app/native/distributed.app';

export default new DistributedApp('mandala', Nesoi)

    .node('alpha-1', $ => $
        .host({
            host: 'localhost',
            port: 3425
        })
        .modules([
            'example'
        ])
        .service({
            name: 'express' as const,
            up: () => {},
            down: () => {}
        })
        .config.auth({
            api: () => new ZeroAuthnProvider(),
            token: () => new ZeroAuthnProvider() as any
        })
        .config.module('example', {
            buckets: {
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
                            simplelist: [1, 2, 3],
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
                            simplelist: [1, 2, 3],
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
            trash: {
                adapter: $ => new MemoryBucketAdapter($)
            }
        })
    )

    .node('beta-2', $ => $
        .host({
            host: 'localhost',
            port: 3426
        })
        .modules([
            'irrigation'
        ])
        .config.module('irrigation', {
            jobs: {
                'example::bigbox.create': 'alpha-1'
            }
        })
    )