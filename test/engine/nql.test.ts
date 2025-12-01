import type { AnyModule } from '~/engine/module';
import type { NQL_AnyQuery } from '~/elements/entities/bucket/query/nql.schema';
import type { AnyDaemon} from '~/engine/daemon';

import { BucketBuilder } from '~/elements/entities/bucket/bucket.builder';
import { Log } from '~/engine/util/log'
import { InlineApp } from '~/engine/app/inline.app';
import { MemoryBucketAdapter } from '~/elements';
import { TestBucketAdapter } from '~/elements/entities/bucket/adapters/test.bucket_adapter';
import { NQL_Compiler, NQL_RuleTree } from '~/elements/entities/bucket/query/nql_compiler';
import { Daemon } from '~/engine/daemon';
import { Tag } from '~/engine/dependency';

Log.level = 'off';

let daemon: AnyDaemon;
let _module: AnyModule;

async function setup() {
    if (daemon) {
        return daemon;
    }
    
    // Build buckets used for test

    const tagBucket = new BucketBuilder('MODULE', 'tag')
        .model($ => ({
            id: $.string,
            scope: $.string
        }));

    const colorBucket = new BucketBuilder('MODULE', 'color')
        .model($ => ({
            id: $.int,
            name: $.string,
            r: $.float,
            g: $.float,
            b: $.float,
            tag: $.string,
            scope: $.string.optional
        }));

    const shapeBucket = new BucketBuilder('MODULE', 'shape')
        .model($ => ({
            id: $.int,
            name: $.string,
            size: $.float,
            color_id: $.int,
            tag: $.string,
            scope: $.string.optional
        }));

    const fruitBucket = new BucketBuilder('MODULE', 'fruit')
        .model($ => ({
            id: $.int,
            shape_id: $.int,
            color_id: $.int,
            tag: $.string
        }));

    // Build test app
    const app = new InlineApp('RUNTIME', [
        tagBucket,
        colorBucket,
        shapeBucket,
        fruitBucket
    ])
        .config.module('MODULE', {
            buckets: {
                'tag': {
                    adapter: $ => new MemoryBucketAdapter<any, any>($, {
                        'Tag 1': {
                            id: 'Tag 1',
                            scope: 'Scope 1'
                        },
                        'Tag 2': {
                            id: 'Tag 2',
                            scope: 'Scope 1'
                        },
                        'Tag 3': {
                            id: 'Tag 3',
                            scope: 'Scope 2'
                        },
                    })
                },
                'color': {
                    adapter: $ => new MemoryBucketAdapter<any, any>($, {
                        1: {
                            id: 1,
                            name: 'Red',
                            r: 1, g: 0, b: 0,
                            tag: 'Tag 1',
                            scope: 'Scope 1'
                        },
                        2: {
                            id: 2,
                            name: 'Green',
                            r: 0, g: 1, b: 0,
                            tag: 'Tag 2',
                            scope: 'Scope 2'
                        },
                        3: {
                            id: 3,
                            name: 'Blue',
                            r: 0, g: 0, b: 1,
                            tag: 'Tag 3',
                        }
                    })
                },
                'shape': {
                    adapter: $ => new TestBucketAdapter<any, any>($, {
                        1: {
                            id: 1,
                            name: 'Shape 1',
                            size: 11,
                            color_id: 1,
                            tag: 'Tag 1',
                            scope: 'Scope 1'
                        },
                        2: {
                            id: 2,
                            name: 'Shape 2',
                            size: 22,
                            color_id: 2,
                            tag: 'Tag 2',
                            scope: 'Scope 2'
                        },
                        3: {
                            id: 3,
                            name: 'Shape 3',
                            size: 33,
                            color_id: 3,
                            tag: 'Tag 3'
                        }
                    }, {
                        meta: { created_at: 'created_at', updated_at: 'updated_at', created_by: 'created_by', updated_by: 'updated_by' },
                        queryMeta: {
                            scope: 'TEST_SCOPE',
                            avgTime: 10
                        }
                    })
                },
                'fruit': {
                    adapter: $ => new TestBucketAdapter<any, any>($, {
                        1: {
                            id: 1,
                            tag: 'Tag 1',
                            color_id: 1,
                            shape_id: 2
                        },
                        2: {
                            id: 2,
                            tag: 'Tag 2',
                            color_id: 2,
                            shape_id: 3
                        },
                        3: {
                            id: 3,
                            tag: 'Tag 3',
                            color_id: 3,
                            shape_id: 1
                        }
                    }, {
                        meta: { created_at: 'created_at', updated_at: 'updated_at', created_by: 'created_by', updated_by: 'updated_by' },
                        queryMeta: {
                            scope: 'TEST_SCOPE',
                            avgTime: 10
                        }
                    })
                },
            }
        })
    
    // Run test daemon
    daemon = await app.daemon();
    _module = Daemon.getModule(daemon, 'MODULE');

    return daemon;
}

beforeAll(async () => {
    await setup();
}, 30000)

async function compileQuery(bucket: string, query: NQL_AnyQuery) {
    const tag = new Tag('MODULE', 'bucket', bucket);
    const res = await daemon.trx('MODULE').run(async trx => {
        const tree = new NQL_RuleTree(trx, tag, query);
        return Promise.resolve(tree);
    })
    if (res.error) {
        throw res.error;
    }
    return NQL_Compiler.buildTree(res.output!);
}

async function expectStaticRule(key: string, value: any, _expect: {
    fieldpath: string
    op: string
    not: boolean
    case_i: boolean
}) {
    const compiled = await compileQuery('shape', {
        [key]: value
    });

    const parts = Object.values(compiled.parts);
    expect(parts).toHaveLength(1);
    expect(parts[0].union.inters).toHaveLength(1);
    expect(parts[0].union.inters[0].rules).toHaveLength(1);
    expect(parts[0].union.inters[0].rules[0]).toEqual(
        expect.objectContaining({
            fieldpath: _expect.fieldpath,
            op: _expect.op,
            not: _expect.not,
            case_i: _expect.case_i,
            value: {
                static: value
            }
        })
    )
}

async function expectParamRule(key: string, param: { '.': any }, _expect: {
    fieldpath: string
    op: string
    not: boolean
    case_i: boolean
}) {
    const compiled = await compileQuery('shape', {
        [key]: param
    });

    const parts = Object.values(compiled.parts);
    expect(parts).toHaveLength(1);
    expect(parts[0].union.inters).toHaveLength(1);
    expect(parts[0].union.inters[0].rules).toHaveLength(1);
    expect(parts[0].union.inters[0].rules[0]).toEqual(
        expect.objectContaining({
            fieldpath: _expect.fieldpath,
            op: _expect.op,
            not: _expect.not,
            case_i: _expect.case_i,
            value: {
                param: param['.'],
                param_is_deep: param['.'].includes('.')
            }
        })
    )
}

function expectPart(query: NQL_AnyQuery) {
    const promise = compileQuery('shape', query);
    
    const next = {
        debug: async () => {
            const compiled = await promise;
            console.log(compiled.describe());
            return next;
        },
        _union: async (inters: any) => {
            const compiled = await promise;
            expect(compiled.parts[0])
                .toEqual(expect.objectContaining({
                    union: expect.objectContaining({
                        inters
                    })
                })
                )
        }
    }
    return next;
}

describe('NQL Compiler', () => {

    describe('Rules', () => {

        it('Static Rules', async() => {
                
            await expectStaticRule('id', 1, { fieldpath: 'id', op: '==', not: false, case_i: false })
            await expectStaticRule('id ==', 1, { fieldpath: 'id', op: '==', not: false, case_i: false })
            await expectStaticRule('id >', 1, { fieldpath: 'id', op: '>', not: false, case_i: false })
            await expectStaticRule('id <', 1, { fieldpath: 'id', op: '<', not: false, case_i: false })
            await expectStaticRule('id >=', 1, { fieldpath: 'id', op: '>=', not: false, case_i: false })
            await expectStaticRule('id <=', 1, { fieldpath: 'id', op: '<=', not: false, case_i: false })
            await expectStaticRule('id in', [1,2,3], { fieldpath: 'id', op: 'in', not: false, case_i: false })
            await expectStaticRule('id present', '', { fieldpath: 'id', op: 'present', not: false, case_i: false })
                
            await expectStaticRule('name', 'a', { fieldpath: 'name', op: '==', not: false, case_i: false })
            await expectStaticRule('name ==', 'a', { fieldpath: 'name', op: '==', not: false, case_i: false })
            await expectStaticRule('name in', ['a','b','c'], { fieldpath: 'name', op: 'in', not: false, case_i: false })
            await expectStaticRule('name contains', 'a', { fieldpath: 'name', op: 'contains', not: false, case_i: false })
            await expectStaticRule('name contains_any', ['a','b','c'] , { fieldpath: 'name', op: 'contains_any', not: false, case_i: false })
            await expectStaticRule('name present', '', { fieldpath: 'name', op: 'present', not: false, case_i: false })
                
            await expectStaticRule('name ~', 'a', { fieldpath: 'name', op: '==', not: false, case_i: true })
            await expectStaticRule('name ~==', 'a', { fieldpath: 'name', op: '==', not: false, case_i: true })
            await expectStaticRule('name ~in', ['a','b','c'], { fieldpath: 'name', op: 'in', not: false, case_i: true })
            await expectStaticRule('name ~contains', 'a', { fieldpath: 'name', op: 'contains', not: false, case_i: true })
            await expectStaticRule('name ~contains_any', ['a','b','c'] , { fieldpath: 'name', op: 'contains_any', not: false, case_i: true })
                
            await expectStaticRule('id not', 1, { fieldpath: 'id', op: '==', not: true, case_i: false })
            await expectStaticRule('id not ==', 1, { fieldpath: 'id', op: '==', not: true, case_i: false })
            await expectStaticRule('id not >', 1, { fieldpath: 'id', op: '>', not: true, case_i: false })
            await expectStaticRule('id not <', 1, { fieldpath: 'id', op: '<', not: true, case_i: false })
            await expectStaticRule('id not >=', 1, { fieldpath: 'id', op: '>=', not: true, case_i: false })
            await expectStaticRule('id not <=', 1, { fieldpath: 'id', op: '<=', not: true, case_i: false })
            await expectStaticRule('id not in', [1,2,3], { fieldpath: 'id', op: 'in', not: true, case_i: false })
            await expectStaticRule('id not present', '', { fieldpath: 'id', op: 'present', not: true, case_i: false })
                
            await expectStaticRule('name not', 'a', { fieldpath: 'name', op: '==', not: true, case_i: false })
            await expectStaticRule('name not ==', 'a', { fieldpath: 'name', op: '==', not: true, case_i: false })
            await expectStaticRule('name not in', ['a','b','c'], { fieldpath: 'name', op: 'in', not: true, case_i: false })
            await expectStaticRule('name not contains', 'a', { fieldpath: 'name', op: 'contains', not: true, case_i: false })
            await expectStaticRule('name not contains_any', ['a','b','c'] , { fieldpath: 'name', op: 'contains_any', not: true, case_i: false })
            await expectStaticRule('name not present', '', { fieldpath: 'name', op: 'present', not: true, case_i: false })

            await expectStaticRule('name not ~', 'a', { fieldpath: 'name', op: '==', not: true, case_i: true })
            await expectStaticRule('name not ~==', 'a', { fieldpath: 'name', op: '==', not: true, case_i: true })
            await expectStaticRule('name not ~in', ['a','b','c'], { fieldpath: 'name', op: 'in', not: true, case_i: true })
            await expectStaticRule('name not ~contains', 'a', { fieldpath: 'name', op: 'contains', not: true, case_i: true })
            await expectStaticRule('name not ~contains_any', ['a','b','c'] , { fieldpath: 'name', op: 'contains_any', not: true, case_i: true })
                
        })

        it('Parametric Rules', async() => {
                
            await expectParamRule('id', { '.': 'p_int' }, { fieldpath: 'id', op: '==', not: false, case_i: false })
            await expectParamRule('id ==', { '.': 'p_int' }, { fieldpath: 'id', op: '==', not: false, case_i: false })
            await expectParamRule('id >', { '.': 'p_int' }, { fieldpath: 'id', op: '>', not: false, case_i: false })
            await expectParamRule('id <', { '.': 'p_int' }, { fieldpath: 'id', op: '<', not: false, case_i: false })
            await expectParamRule('id >=', { '.': 'p_int' }, { fieldpath: 'id', op: '>=', not: false, case_i: false })
            await expectParamRule('id <=', { '.': 'p_int' }, { fieldpath: 'id', op: '<=', not: false, case_i: false })
            await expectParamRule('id in', { '.': 'p_int[]' }, { fieldpath: 'id', op: 'in', not: false, case_i: false })
            // expectParamRule('id present', '', { fieldpath: 'id', op: 'present', not: false, case_i: false })
                
            await expectParamRule('name', {'.': 'p_str' }, { fieldpath: 'name', op: '==', not: false, case_i: false })
            await expectParamRule('name ==', {'.': 'p_str' }, { fieldpath: 'name', op: '==', not: false, case_i: false })
            await expectParamRule('name in', { '.': 'p_str[]' }, { fieldpath: 'name', op: 'in', not: false, case_i: false })
            await expectParamRule('name contains', {'.': 'p_str' }, { fieldpath: 'name', op: 'contains', not: false, case_i: false })
            await expectParamRule('name contains_any', { '.': 'p_str[]' } , { fieldpath: 'name', op: 'contains_any', not: false, case_i: false })
            // // expectParamRule('name present', '', { fieldpath: 'name', op: 'present', not: false, case_i: false })
                
            await expectParamRule('name ~', {'.': 'p_str' }, { fieldpath: 'name', op: '==', not: false, case_i: true })
            await expectParamRule('name ~==', {'.': 'p_str' }, { fieldpath: 'name', op: '==', not: false, case_i: true })
            await expectParamRule('name ~in', { '.': 'p_str[]' }, { fieldpath: 'name', op: 'in', not: false, case_i: true })
            await expectParamRule('name ~contains', {'.': 'p_str' }, { fieldpath: 'name', op: 'contains', not: false, case_i: true })
            await expectParamRule('name ~contains_any', { '.': 'p_str[]' } , { fieldpath: 'name', op: 'contains_any', not: false, case_i: true })
                
            await expectParamRule('id not', { '.': 'p_int' }, { fieldpath: 'id', op: '==', not: true, case_i: false })
            await expectParamRule('id not ==', { '.': 'p_int' }, { fieldpath: 'id', op: '==', not: true, case_i: false })
            await expectParamRule('id not >', { '.': 'p_int' }, { fieldpath: 'id', op: '>', not: true, case_i: false })
            await expectParamRule('id not <', { '.': 'p_int' }, { fieldpath: 'id', op: '<', not: true, case_i: false })
            await expectParamRule('id not >=', { '.': 'p_int' }, { fieldpath: 'id', op: '>=', not: true, case_i: false })
            await expectParamRule('id not <=', { '.': 'p_int' }, { fieldpath: 'id', op: '<=', not: true, case_i: false })
            await expectParamRule('id not in', { '.': 'p_int[]' }, { fieldpath: 'id', op: 'in', not: true, case_i: false })
            // // expectParamRule('id not present', '', { fieldpath: 'id', op: 'present', not: true, case_i: false })
                
            await expectParamRule('name not', {'.': 'p_str' }, { fieldpath: 'name', op: '==', not: true, case_i: false })
            await expectParamRule('name not ==', {'.': 'p_str' }, { fieldpath: 'name', op: '==', not: true, case_i: false })
            await expectParamRule('name not in', { '.': 'p_str[]' }, { fieldpath: 'name', op: 'in', not: true, case_i: false })
            await expectParamRule('name not contains', {'.': 'p_str' }, { fieldpath: 'name', op: 'contains', not: true, case_i: false })
            await expectParamRule('name not contains_any', { '.': 'p_str[]' } , { fieldpath: 'name', op: 'contains_any', not: true, case_i: false })
            // // expectParamRule('name not present', '', { fieldpath: 'name', op: 'present', not: true, case_i: false })

            await expectParamRule('name not ~', {'.': 'p_str' }, { fieldpath: 'name', op: '==', not: true, case_i: true })
            await expectParamRule('name not ~==', {'.': 'p_str' }, { fieldpath: 'name', op: '==', not: true, case_i: true })
            await expectParamRule('name not ~in', { '.': 'p_str[]' }, { fieldpath: 'name', op: 'in', not: true, case_i: true })
            await expectParamRule('name not ~contains', {'.': 'p_str' }, { fieldpath: 'name', op: 'contains', not: true, case_i: true })
            await expectParamRule('name not ~contains_any', { '.': 'p_str[]' } , { fieldpath: 'name', op: 'contains_any', not: true, case_i: true })
                
        })

    })

    describe('Boolean Expressions', () => {

        const _rule = (fieldpath: string) => expect.objectContaining({ fieldpath });
        const _inter = (rules: any[]) => expect.objectContaining({ rules });
        const _union = (inters: any[]) => expect.objectContaining({ inters });

        it('A', async() => {
            await expectPart({
                'id': 1
            })._union([
                _inter([
                    _rule('id')
                ])
            ])
        })

        it('A && B', async() => {
            await expectPart({
                'id': 1,
                'name': 'string'
            })._union([
                _inter([ _rule('id'), _rule('name') ])
            ])
        })

        it('A || B', async() => {
            await expectPart({
                'id': 1,
                'or name': 'string'
            })._union([
                _inter([ _rule('id') ]),
                _inter([ _rule('name') ])
            ])
        })

        it('A && B || C', async() => {
            await expectPart({
                'id': 1,
                'name': 'string',
                'or size': 1
            })._union([
                _inter([ _rule('size') ]),
                _inter([ _rule('id'), _rule('name') ]),
            ])
        })

        it('A || B && C', async() => {
            await expectPart({
                'id': 1,
                'or name': 'string',
                'size': 1
            })._union([
                _inter([ _rule('name') ]),
                _inter([ _rule('id'), _rule('size') ])
            ])
        })

        it('A && (B && C)', async() => {
            await expectPart({
                'id': 1,
                '#and': {
                    'name': 'string',
                    'size': 1
                }
            })._union([
                _inter([ _rule('id'), _rule('name'), _rule('size') ])
            ])
        })

        it('A && (B || C)', async() => {
            await expectPart({
                'id': 1,
                '#and': {
                    'name': 'string',
                    'or size': 1
                }
            })._union([
                _inter([
                    _rule('id'), 
                    _union([
                        _inter([ _rule('name') ]),
                        _inter([ _rule('size') ])
                    ])
                ])
            ])
        })

        it('A || (B || C)', async() => {
            await expectPart({
                'id': 1,
                '#or': {
                    'name': 'string',
                    'or size': 1
                }
            })._union([
                _inter([ _rule('id') ]),
                _inter([
                    _union([
                        _inter([ _rule('name') ]),
                        _inter([ _rule('size') ])
                    ])
                ])
            ])
        })

        it('A || (B && C)', async() => {
            await expectPart({
                'id': 1,
                '#or': {
                    'name': 'string',
                    'size': 1
                }
            })._union([
                _inter([ _rule('id') ]),
                _inter([ _rule('name'), _rule('size') ])
            ])
        })

        it('A && (B && (C && D)))', async() => {
            await expectPart({
                'id': 1,
                '#and': {
                    'name': 'string',
                    '#and ': {
                        'size': 1,
                        'scope': 'string'
                    }
                }
            })._union([
                _inter([ _rule('id'), _rule('name'), _rule('size'), _rule('scope') ])
            ])
        })

        it('A && (B || C) && (D || E)', async() => {
            await expectPart({
                'id': 1,
                '#and': {
                    'name': 'string',
                    'or size': 1,
                },
                '#and ': {
                    'scope': 'string',
                    'or tag': 'string'
                }
            })._union([
                _inter([
                    _rule('id'),
                    _union([
                        _inter([ _rule('name')]),
                        _inter([ _rule('size')])
                    ]),
                    _union([
                        _inter([ _rule('scope')]),
                        _inter([ _rule('tag')])
                    ])
                ])
            ])
        })

        it('A || (B && C) || (D && E)', async() => {
            await expectPart({
                'id': 1,
                '#or': {
                    'name': 'string',
                    'size': 1,
                },
                '#or ': {
                    'scope': 'string',
                    'tag': 'string'
                }
            })._union([
                _inter([ _rule('id') ]),
                _inter([ _rule('name'), _rule('size') ]),
                _inter([ _rule('scope'), _rule('tag') ])
            ])
        })

        it('A || (B && C) && (D || E)', async() => {
            await expectPart({
                'id': 1,
                '#or': {
                    'name': 'string',
                    'size': 1,
                },
                '#and ': {
                    'scope': 'string',
                    'or tag': 'string'
                }
            })._union([
                _inter([ _rule('name'), _rule('size')]),
                _inter([
                    _rule('id'),
                    _union([
                        _inter([ _rule('scope')]),
                        _inter([ _rule('tag')])
                    ])
                ]),
            ])
        })

    })

    describe('Sub-Query scopes', () => {

        it('should not split subquery into parts for non-divergent scopes', async () => {
            const tag = new Tag('MODULE', 'bucket', 'shape');

            const compiled = await compileQuery('shape', {
                'id in': {
                    '@fruit.shape_id': {
                        'id': 1
                    }
                }
            });
            const parts = Object.values(compiled.parts);
            expect(parts).toHaveLength(1);
            expect(compiled.execOrder).toEqual([0]);
            expect(compiled.parts[0].union.meta.scope).toEqual('TEST_SCOPE');
        })

        it('should split subquery into parts for divergent scopes', async () => {
            const compiled = await compileQuery('color', {
                'id in': {
                    '@fruit.color_id': {
                        'id': 1
                    }
                }
            });
            const parts = Object.values(compiled.parts);
            expect(parts).toHaveLength(2);
            expect(compiled.execOrder).toEqual([1,0]);
            expect(compiled.parts[1].union.meta.scope).toEqual('TEST_SCOPE');
            expect(compiled.parts[0].union.meta.scope).toEqual('MODULE::color');
        })

        it('should split multiple subqueries into parts for divergent scopes', async () => {
            const compiled = await compileQuery('color', {
                'tag in': {
                    '@tag.id': {
                        'id': 'Tag 1'
                    }
                },
                'or id in': {
                    '@fruit.color_id': {
                        'id': 1
                    }
                },
            })
            const parts = Object.values(compiled.parts);
            expect(parts).toHaveLength(3);
            expect(compiled.execOrder).toEqual([1,2,0]);
            expect(compiled.parts[1].union.meta.scope).toEqual('MODULE::tag');
            expect(compiled.parts[2].union.meta.scope).toEqual('TEST_SCOPE');
            expect(compiled.parts[0].union.meta.scope).toEqual('MODULE::color');
        })

        it('should split nested subquery into parts for divergent scopes', async () => {
            const compiled = await compileQuery('color', {
                'tag in': {
                    '@tag.id': {
                        'id in': {
                            '@fruit.tag': {
                                id: 1
                            }
                        }
                    }
                }
            })
            const parts = Object.values(compiled.parts);
            expect(parts).toHaveLength(3);
            expect(compiled.execOrder).toEqual([2,1,0]);
            expect(compiled.parts[2].union.meta.scope).toEqual('TEST_SCOPE');
            expect(compiled.parts[1].union.meta.scope).toEqual('MODULE::tag');
            expect(compiled.parts[0].union.meta.scope).toEqual('MODULE::color');
        })

        it('should split nested subquery into parts for partially divergent scopes', async () => {
            const compiled = await compileQuery('color', {
                'tag in': {
                    '@shape.id': {
                        'id in': {
                            '@fruit.tag': {
                                id: 1
                            }
                        }
                    }
                }
            })
            const parts = Object.values(compiled.parts);
            expect(parts).toHaveLength(2);
            expect(compiled.execOrder).toEqual([1,0]);
            expect(compiled.parts[1].union.meta.scope).toEqual('TEST_SCOPE');
            expect(compiled.parts[0].union.meta.scope).toEqual('MODULE::color');
        })


    })
})