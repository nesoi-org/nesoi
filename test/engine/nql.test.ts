
import { BucketBuilder } from '~/elements/entities/bucket/bucket.builder';
import { Log } from '~/engine/util/log'
import { InlineApp } from '~/engine/apps/inline.app';
import { MemoryBucketAdapter } from '~/elements';
import { AnyModule } from '~/engine/module';
import { NQL_Compiler, NQL_RuleTree } from '~/elements/entities/bucket/query/nql_compiler';
import { NQL_AnyQuery } from '~/elements/entities/bucket/query/nql.schema';
import { AnyDaemon, Daemon } from '~/engine/daemon';

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

    // Build test app
    const app = new InlineApp('RUNTIME', [
        tagBucket,
        colorBucket,
        shapeBucket
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
                    adapter: $ => new MemoryBucketAdapter<any, any>($, {
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

// NQLCompiler Test Helpers

function expectStaticRule(key: string, value: any, _expect: {
    fieldpath: string
    op: string
    not: boolean
    case_i: boolean
}) {
    const tree = new NQL_RuleTree(_module, 'shape', {
        [key]: value
    })
    const graph = NQL_Compiler.buildUnion(tree.root);

    const parts = Object.values(graph.parts);
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

function expectParamRule(key: string, param: { '.': any }, _expect: {
    fieldpath: string
    op: string
    not: boolean
    case_i: boolean
}) {
    const tree = new NQL_RuleTree(_module, 'shape', {
        [key]: param as any
    })
    const graph = NQL_Compiler.buildUnion(tree.root);

    const parts = Object.values(graph.parts);
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
                param: param['.']
            }
        })
    )
}

function expectPart(query: NQL_AnyQuery) {
    const tree = new NQL_RuleTree(_module, 'shape', query)
    const graph = NQL_Compiler.buildUnion(tree.root);

    const next = {
        debug: () => {
            console.log(tree.describe());
            return next;
        },
        _union: (inters: any) => {
            expect(graph.parts[0])
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

// NQLRunner Test Helpers

async function expectIds(bucket: string, query: NQL_AnyQuery, ids: number[]) {
    const { output } = await daemon.trx('MODULE').run(async trx =>
        trx.bucket(bucket).query(query).all()
    );
    const e = expect(output);

    e.toHaveLength(ids.length);
    e.toEqual(ids.map(id =>
        expect.objectContaining({ id })
    ))
}

describe('NQL', () => {

    describe('Compiler', () => {
    
        describe('Compiler', () => {

            it('Static Rules', async() => {
                
                expectStaticRule('id', 1, { fieldpath: 'id', op: '==', not: false, case_i: false })
                expectStaticRule('id ==', 1, { fieldpath: 'id', op: '==', not: false, case_i: false })
                expectStaticRule('id >', 1, { fieldpath: 'id', op: '>', not: false, case_i: false })
                expectStaticRule('id <', 1, { fieldpath: 'id', op: '<', not: false, case_i: false })
                expectStaticRule('id >=', 1, { fieldpath: 'id', op: '>=', not: false, case_i: false })
                expectStaticRule('id <=', 1, { fieldpath: 'id', op: '<=', not: false, case_i: false })
                expectStaticRule('id in', [1,2,3], { fieldpath: 'id', op: 'in', not: false, case_i: false })
                expectStaticRule('id present', '', { fieldpath: 'id', op: 'present', not: false, case_i: false })
                
                expectStaticRule('name', 'a', { fieldpath: 'name', op: '==', not: false, case_i: false })
                expectStaticRule('name ==', 'a', { fieldpath: 'name', op: '==', not: false, case_i: false })
                expectStaticRule('name in', ['a','b','c'], { fieldpath: 'name', op: 'in', not: false, case_i: false })
                expectStaticRule('name contains', 'a', { fieldpath: 'name', op: 'contains', not: false, case_i: false })
                expectStaticRule('name contains_any', ['a','b','c'] , { fieldpath: 'name', op: 'contains_any', not: false, case_i: false })
                expectStaticRule('name present', '', { fieldpath: 'name', op: 'present', not: false, case_i: false })
                
                expectStaticRule('name ~', 'a', { fieldpath: 'name', op: '==', not: false, case_i: true })
                expectStaticRule('name ~==', 'a', { fieldpath: 'name', op: '==', not: false, case_i: true })
                expectStaticRule('name ~in', ['a','b','c'], { fieldpath: 'name', op: 'in', not: false, case_i: true })
                expectStaticRule('name ~contains', 'a', { fieldpath: 'name', op: 'contains', not: false, case_i: true })
                expectStaticRule('name ~contains_any', ['a','b','c'] , { fieldpath: 'name', op: 'contains_any', not: false, case_i: true })
                
                expectStaticRule('id not', 1, { fieldpath: 'id', op: '==', not: true, case_i: false })
                expectStaticRule('id not ==', 1, { fieldpath: 'id', op: '==', not: true, case_i: false })
                expectStaticRule('id not >', 1, { fieldpath: 'id', op: '>', not: true, case_i: false })
                expectStaticRule('id not <', 1, { fieldpath: 'id', op: '<', not: true, case_i: false })
                expectStaticRule('id not >=', 1, { fieldpath: 'id', op: '>=', not: true, case_i: false })
                expectStaticRule('id not <=', 1, { fieldpath: 'id', op: '<=', not: true, case_i: false })
                expectStaticRule('id not in', [1,2,3], { fieldpath: 'id', op: 'in', not: true, case_i: false })
                expectStaticRule('id not present', '', { fieldpath: 'id', op: 'present', not: true, case_i: false })
                
                expectStaticRule('name not', 'a', { fieldpath: 'name', op: '==', not: true, case_i: false })
                expectStaticRule('name not ==', 'a', { fieldpath: 'name', op: '==', not: true, case_i: false })
                expectStaticRule('name not in', ['a','b','c'], { fieldpath: 'name', op: 'in', not: true, case_i: false })
                expectStaticRule('name not contains', 'a', { fieldpath: 'name', op: 'contains', not: true, case_i: false })
                expectStaticRule('name not contains_any', ['a','b','c'] , { fieldpath: 'name', op: 'contains_any', not: true, case_i: false })
                expectStaticRule('name not present', '', { fieldpath: 'name', op: 'present', not: true, case_i: false })

                expectStaticRule('name not ~', 'a', { fieldpath: 'name', op: '==', not: true, case_i: true })
                expectStaticRule('name not ~==', 'a', { fieldpath: 'name', op: '==', not: true, case_i: true })
                expectStaticRule('name not ~in', ['a','b','c'], { fieldpath: 'name', op: 'in', not: true, case_i: true })
                expectStaticRule('name not ~contains', 'a', { fieldpath: 'name', op: 'contains', not: true, case_i: true })
                expectStaticRule('name not ~contains_any', ['a','b','c'] , { fieldpath: 'name', op: 'contains_any', not: true, case_i: true })
                
            })

            it('Parametric Rules', async() => {
                
                expectParamRule('id', { '.': 'p_int' }, { fieldpath: 'id', op: '==', not: false, case_i: false })
                expectParamRule('id ==', { '.': 'p_int' }, { fieldpath: 'id', op: '==', not: false, case_i: false })
                expectParamRule('id >', { '.': 'p_int' }, { fieldpath: 'id', op: '>', not: false, case_i: false })
                expectParamRule('id <', { '.': 'p_int' }, { fieldpath: 'id', op: '<', not: false, case_i: false })
                expectParamRule('id >=', { '.': 'p_int' }, { fieldpath: 'id', op: '>=', not: false, case_i: false })
                expectParamRule('id <=', { '.': 'p_int' }, { fieldpath: 'id', op: '<=', not: false, case_i: false })
                expectParamRule('id in', { '.': 'p_int[]' }, { fieldpath: 'id', op: 'in', not: false, case_i: false })
                // expectParamRule('id present', '', { fieldpath: 'id', op: 'present', not: false, case_i: false })
                
                expectParamRule('name', {'.': 'p_str' }, { fieldpath: 'name', op: '==', not: false, case_i: false })
                expectParamRule('name ==', {'.': 'p_str' }, { fieldpath: 'name', op: '==', not: false, case_i: false })
                expectParamRule('name in', { '.': 'p_str[]' }, { fieldpath: 'name', op: 'in', not: false, case_i: false })
                expectParamRule('name contains', {'.': 'p_str' }, { fieldpath: 'name', op: 'contains', not: false, case_i: false })
                expectParamRule('name contains_any', { '.': 'p_str[]' } , { fieldpath: 'name', op: 'contains_any', not: false, case_i: false })
                // // expectParamRule('name present', '', { fieldpath: 'name', op: 'present', not: false, case_i: false })
                
                expectParamRule('name ~', {'.': 'p_str' }, { fieldpath: 'name', op: '==', not: false, case_i: true })
                expectParamRule('name ~==', {'.': 'p_str' }, { fieldpath: 'name', op: '==', not: false, case_i: true })
                expectParamRule('name ~in', { '.': 'p_str[]' }, { fieldpath: 'name', op: 'in', not: false, case_i: true })
                expectParamRule('name ~contains', {'.': 'p_str' }, { fieldpath: 'name', op: 'contains', not: false, case_i: true })
                expectParamRule('name ~contains_any', { '.': 'p_str[]' } , { fieldpath: 'name', op: 'contains_any', not: false, case_i: true })
                
                expectParamRule('id not', { '.': 'p_int' }, { fieldpath: 'id', op: '==', not: true, case_i: false })
                expectParamRule('id not ==', { '.': 'p_int' }, { fieldpath: 'id', op: '==', not: true, case_i: false })
                expectParamRule('id not >', { '.': 'p_int' }, { fieldpath: 'id', op: '>', not: true, case_i: false })
                expectParamRule('id not <', { '.': 'p_int' }, { fieldpath: 'id', op: '<', not: true, case_i: false })
                expectParamRule('id not >=', { '.': 'p_int' }, { fieldpath: 'id', op: '>=', not: true, case_i: false })
                expectParamRule('id not <=', { '.': 'p_int' }, { fieldpath: 'id', op: '<=', not: true, case_i: false })
                expectParamRule('id not in', { '.': 'p_int[]' }, { fieldpath: 'id', op: 'in', not: true, case_i: false })
                // // expectParamRule('id not present', '', { fieldpath: 'id', op: 'present', not: true, case_i: false })
                
                expectParamRule('name not', {'.': 'p_str' }, { fieldpath: 'name', op: '==', not: true, case_i: false })
                expectParamRule('name not ==', {'.': 'p_str' }, { fieldpath: 'name', op: '==', not: true, case_i: false })
                expectParamRule('name not in', { '.': 'p_str[]' }, { fieldpath: 'name', op: 'in', not: true, case_i: false })
                expectParamRule('name not contains', {'.': 'p_str' }, { fieldpath: 'name', op: 'contains', not: true, case_i: false })
                expectParamRule('name not contains_any', { '.': 'p_str[]' } , { fieldpath: 'name', op: 'contains_any', not: true, case_i: false })
                // // expectParamRule('name not present', '', { fieldpath: 'name', op: 'present', not: true, case_i: false })

                expectParamRule('name not ~', {'.': 'p_str' }, { fieldpath: 'name', op: '==', not: true, case_i: true })
                expectParamRule('name not ~==', {'.': 'p_str' }, { fieldpath: 'name', op: '==', not: true, case_i: true })
                expectParamRule('name not ~in', { '.': 'p_str[]' }, { fieldpath: 'name', op: 'in', not: true, case_i: true })
                expectParamRule('name not ~contains', {'.': 'p_str' }, { fieldpath: 'name', op: 'contains', not: true, case_i: true })
                expectParamRule('name not ~contains_any', { '.': 'p_str[]' } , { fieldpath: 'name', op: 'contains_any', not: true, case_i: true })
                
            })

        })

        describe('Boolean Expressions', () => {

            const _rule = (fieldpath: string) => expect.objectContaining({ fieldpath });
            const _inter = (rules: any[]) => expect.objectContaining({ rules });
            const _union = (inters: any[]) => expect.objectContaining({ inters });

            it('A', async() => {
                expectPart({
                    'id': 1
                })._union([
                    _inter([
                        _rule('id')
                    ])
                ])
            })

            it('A && B', async() => {
                expectPart({
                    'id': 1,
                    'name': 'string'
                })._union([
                    _inter([ _rule('id'), _rule('name') ])
                ])
            })

            it('A || B', async() => {
                expectPart({
                    'id': 1,
                    'or name': 'string'
                })._union([
                    _inter([ _rule('id') ]),
                    _inter([ _rule('name') ])
                ])
            })

            it('A && B || C', async() => {
                expectPart({
                    'id': 1,
                    'name': 'string',
                    'or size': 1
                })._union([
                    _inter([ _rule('size') ]),
                    _inter([ _rule('id'), _rule('name') ]),
                ])
            })

            it('A || B && C', async() => {
                expectPart({
                    'id': 1,
                    'or name': 'string',
                    'size': 1
                })._union([
                    _inter([ _rule('name') ]),
                    _inter([ _rule('id'), _rule('size') ])
                ])
            })

            it('A && (B && C)', async() => {
                expectPart({
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
                expectPart({
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
                expectPart({
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
                expectPart({
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
                expectPart({
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
                expectPart({
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
                expectPart({
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
                expectPart({
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
    
    })

    describe('Memory NQL Runner', () => {

        describe('Operators', () => {

            /* == */

            it('Operator: ', async () => {
                await expectIds('shape', { 'id': 1 }, [1])
                await expectIds('shape', { 'id': 99 }, [])
                await expectIds('shape', { 'name': 'Shape 1' }, [1])
                await expectIds('shape', { 'name': 'shape 1' }, [])
            })
            it('Operator: not', async () => {
                await expectIds('shape', { 'id not': 1 }, [2,3])
                await expectIds('shape', { 'id not': 99 }, [1,2,3])
                await expectIds('shape', { 'name not': 'Shape 1' }, [2,3])
                await expectIds('shape', { 'name not': 'shape 1' }, [1,2,3])
            })

            it('Operator: ~', async () => {
                await expectIds('shape', { 'name ~': 'Shape 1' }, [1])
                await expectIds('shape', { 'name ~': 'shape 1' }, [1])
                await expectIds('shape', { 'name ~': 'shape 99' }, [])
            })
            it('Operator: not ~', async () => {
                await expectIds('shape', { 'name not ~': 'Shape 1' }, [2,3])
                await expectIds('shape', { 'name not ~': 'shape 1' }, [2,3])
                await expectIds('shape', { 'name not ~': 'shape 99' }, [1,2,3])
            })

            it('Operator: ==', async () => {
                await expectIds('shape', { 'id ==': 1 }, [1])
                await expectIds('shape', { 'id ==': 99 }, [])
                await expectIds('shape', { 'name ==': 'Shape 1' }, [1])
                await expectIds('shape', { 'name ==': 'shape 1' }, [])
            })
            it('Operator: not ==', async () => {
                await expectIds('shape', { 'id not ==': 1 }, [2,3])
                await expectIds('shape', { 'id not ==': 99 }, [1,2,3])
                await expectIds('shape', { 'name not ==': 'Shape 1' }, [2,3])
                await expectIds('shape', { 'name not ==': 'shape 1' }, [1,2,3])
            })

            /* ~== */

            it('Operator: ~==', async () => {
                await expectIds('shape', { 'name ~==': 'Shape 1' }, [1])
                await expectIds('shape', { 'name ~==': 'shape 1' }, [1])
                await expectIds('shape', { 'name ~==': 'shape 99' }, [])
            })
            it('Operator: not ~==', async () => {
                await expectIds('shape', { 'name not ~==': 'Shape 1' }, [2,3])
                await expectIds('shape', { 'name not ~==': 'shape 1' }, [2,3])
                await expectIds('shape', { 'name not ~==': 'shape 99' }, [1,2,3])
            })

            //  >, <, >=, <=

            it('Operator: >', async () => {
                await expectIds('shape', { 'size >': 1 }, [1,2,3])
                await expectIds('shape', { 'size >': 11 }, [2,3])
                await expectIds('shape', { 'size >': 33 }, [])
            })
            it('Operator: not >', async () => {
                await expectIds('shape', { 'size not >': 1 }, [])
                await expectIds('shape', { 'size not >': 11 }, [1])
                await expectIds('shape', { 'size not >': 33 }, [1,2,3])
            })

            it('Operator: <', async () => {
                await expectIds('shape', { 'size <': 44 }, [1,2,3])
                await expectIds('shape', { 'size <': 33 }, [1,2])
                await expectIds('shape', { 'size <': 11 }, [])
            })
            it('Operator: not <', async () => {
                await expectIds('shape', { 'size not <': 44 }, [])
                await expectIds('shape', { 'size not <': 33 }, [3])
                await expectIds('shape', { 'size not <': 11 }, [1,2,3])
            })

            it('Operator: >=', async () => {
                await expectIds('shape', { 'size >=': 1 }, [1,2,3])
                await expectIds('shape', { 'size >=': 22 }, [2,3])
                await expectIds('shape', { 'size >=': 34 }, [])
            })
            it('Operator: not >=', async () => {
                await expectIds('shape', { 'size not >=': 1 }, [])
                await expectIds('shape', { 'size not >=': 22 }, [1])
                await expectIds('shape', { 'size not >=': 34 }, [1,2,3])
            })

            it('Operator: <=', async () => {
                await expectIds('shape', { 'size <=': 33 }, [1,2,3])
                await expectIds('shape', { 'size <=': 22 }, [1,2])
                await expectIds('shape', { 'size <=': 10 }, [])
            })
            it('Operator: not <=', async () => {
                await expectIds('shape', { 'size not <=': 33 }, [])
                await expectIds('shape', { 'size not <=': 22 }, [3])
                await expectIds('shape', { 'size not <=': 10 }, [1,2,3])
            })

            // in

            it('Operator: in', async () => {
                await expectIds('shape', { 'size in': [11,22,33,44] }, [1,2,3])
                await expectIds('shape', { 'size in': [11,33,44] }, [1,3])
                await expectIds('shape', { 'size in': [44] }, [])
            })
            it('Operator: not in', async () => {
                await expectIds('shape', { 'size not in': [11,22,33,44] }, [])
                await expectIds('shape', { 'size not in': [11,33,44] }, [2])
                await expectIds('shape', { 'size not in': [44] }, [1,2,3])
            })

            // contains

            it('Operator: contains', async () => {
                await expectIds('shape', { 'name contains': 'Shape' }, [1,2,3])
                await expectIds('shape', { 'name contains': 'shape' }, [])
                await expectIds('shape', { 'name contains': 'ape 2' }, [2])
                await expectIds('shape', { 'name contains': 'aPe 2' }, [])
                await expectIds('shape', { 'name contains': 'garbage' }, [])
            })
            it('Operator: ~contains', async () => {
                await expectIds('shape', { 'name ~contains': 'Shape' }, [1,2,3])
                await expectIds('shape', { 'name ~contains': 'shape' }, [1,2,3])
                await expectIds('shape', { 'name ~contains': 'ape 2' }, [2])
                await expectIds('shape', { 'name ~contains': 'aPe 2' }, [2])
                await expectIds('shape', { 'name ~contains': 'gARbAgE' }, [])
            })
            it('Operator: not contains', async () => {
                await expectIds('shape', { 'name not contains': 'Shape' }, [])
                await expectIds('shape', { 'name not contains': 'shape' }, [1,2,3])
                await expectIds('shape', { 'name not contains': 'ape 2' }, [1,3])
                await expectIds('shape', { 'name not contains': 'aPe 2' }, [1,2,3])
                await expectIds('shape', { 'name not contains': 'garbage' }, [1,2,3])
            })
            it('Operator: not ~contains', async () => {
                await expectIds('shape', { 'name not ~contains': 'Shape' }, [])
                await expectIds('shape', { 'name not ~contains': 'shape' }, [])
                await expectIds('shape', { 'name not ~contains': 'ape 2' }, [1,3])
                await expectIds('shape', { 'name not ~contains': 'aPe 2' }, [1,3])
                await expectIds('shape', { 'name not ~contains': 'gARbAgE' }, [1,2,3])
            })

            // contains_any

            it('Operator: contains_any', async () => {
                await expectIds('shape', { 'name contains_any': ['pe 1', 'e 2', ' 3', 'garbage'] }, [1,2,3])
                await expectIds('shape', { 'name contains_any': ['Pe 1', 'E 2', ' 3', 'gArBaGe'] }, [3])
                await expectIds('shape', { 'name contains_any': ['ape 2', 'Shape 1', 'garbage'] }, [1,2])
                await expectIds('shape', { 'name contains_any': ['Ape 2', 'shape 1', 'garBage'] }, [])
                await expectIds('shape', { 'name contains_any': ['garbage', 'Shape 99'] }, [])            
            })
            it('Operator: ~contains_any', async () => {
                await expectIds('shape', { 'name ~contains_any': ['pe 1', 'e 2', ' 3', 'garbage'] }, [1,2,3])
                await expectIds('shape', { 'name ~contains_any': ['Pe 1', 'E 2', ' 3', 'gArBaGe'] }, [1,2,3])
                await expectIds('shape', { 'name ~contains_any': ['ape 2', 'Shape 1', 'garbage'] }, [1,2])
                await expectIds('shape', { 'name ~contains_any': ['Ape 2', 'shape 1', 'garBage'] }, [1,2])
                await expectIds('shape', { 'name ~contains_any': ['garbage', 'Shape 99'] }, [])            
            })
            it('Operator: not contains_any', async () => {
                await expectIds('shape', { 'name not contains_any': ['pe 1', 'e 2', ' 3', 'garbage'] }, [])
                await expectIds('shape', { 'name not contains_any': ['Pe 1', 'E 2', ' 3', 'gArBaGe'] }, [1,2])
                await expectIds('shape', { 'name not contains_any': ['ape 2', 'Shape 1', 'garbage'] }, [3])
                await expectIds('shape', { 'name not contains_any': ['Ape 2', 'shape 1', 'garBage'] }, [1,2,3])
                await expectIds('shape', { 'name not contains_any': ['garbage', 'Shape 99'] }, [1,2,3])
            })
            it('Operator: not ~contains_any', async () => {
                await expectIds('shape', { 'name not ~contains_any': ['pe 1', 'e 2', ' 3', 'garbage'] }, [])
                await expectIds('shape', { 'name not ~contains_any': ['Pe 1', 'E 2', ' 3', 'gArBaGe'] }, [])
                await expectIds('shape', { 'name not ~contains_any': ['ape 2', 'Shape 1', 'garbage'] }, [3])
                await expectIds('shape', { 'name not ~contains_any': ['Ape 2', 'shape 1', 'garBage'] }, [3])
                await expectIds('shape', { 'name not ~contains_any': ['garbage', 'Shape 99'] }, [1,2,3])
            })

            // present

            it('Operator: present', async () => {
                await expectIds('shape', { 'id present': '' }, [1,2,3])        
                await expectIds('shape', { 'scope present': '' }, [1,2])        
            })
            it('Operator: not present', async () => {
                await expectIds('shape', { 'id not present': '' }, [])        
                await expectIds('shape', { 'scope not present': '' }, [3])        
            })
        })

        describe('Boolean Expressions', () => {

            it('A && B', async () => {
                await expectIds('shape', {
                    'id': 1,
                    'name': 'Shape 1'
                }, [1])
                await expectIds('shape', {
                    'id': 1,
                    'name': 'Shape 2'
                }, [])
            })

            it('A || B', async () => {
                await expectIds('shape', {
                    'id': 1,
                    'or name': 'Shape 1'
                }, [1])
                await expectIds('shape', {
                    'id': 1,
                    'or name': 'Shape 2'
                }, [1,2])
            })

            it('A && B || C', async () => {
                await expectIds('shape', {
                    'id': 1,
                    'name': 'Shape 1',
                    'or size >': 22
                }, [1,3])
                await expectIds('shape', {
                    'id': 1,
                    'name': 'Shape 1',
                    'or size >': 33
                }, [1])
            })

            it('A || B && C', async () => {
                await expectIds('shape', {
                    'id': 1,
                    'or name': 'Shape 2',
                    'size >=': 11
                }, [1,2])
                await expectIds('shape', {
                    'id': 2,
                    'or name': 'Shape 2',
                    'size >=': 11
                }, [2])
            })

        })

        describe('Sub-Queries', () => {

            it('A -> B (X)', async () => {
                await expectIds('shape', {
                    'color_id': {
                        '@color.id': {
                            'name': 'Red'
                        }
                    }
                }, [1])
            })

            it('A -> B (X && Y)', async () => {
                await expectIds('shape', {
                    'color_id': {
                        '@color.id': {
                            'id': 1,
                            'name': 'Red'
                        }
                    }
                }, [1])
            })

            it('A -> B (X || Y)', async () => {
                await expectIds('shape', {
                    'color_id in': {
                        '@color.id': {
                            'id': 2,
                            'or name': 'Red'
                        }
                    }
                }, [1,2])
            })


            it('A -> B (X) -> C (X)', async () => {
                await expectIds('shape', {
                    'color_id': {
                        '@color.id': {
                            'tag': {
                                '@tag.id': {
                                    'scope': 'Scope 1'
                                }
                            }
                        },
                    }
                }, [1])
            })

            it('A -> B (X) -> C (X and Y)', async () => {
                await expectIds('shape', {
                    'color_id in': {
                        '@color.id': {
                            'tag in': {
                                '@tag.id': {
                                    'id': 'Tag 2',
                                    'scope': 'Scope 1'
                                }
                            }
                        },
                    }
                }, [2])
            })

            it('A -> B (X) -> C (X or Y)', async () => {
                await expectIds('shape', {
                    'color_id in': {
                        '@color.id': {
                            'tag in': {
                                '@tag.id': {
                                    'id': 'Tag 2',
                                    'or scope': 'Scope 1'
                                }
                            }
                        },
                    }
                }, [1, 2])
            })

            it('A -> B (X) -> C and D (X or Y)', async () => {
                await expectIds('shape', {
                    'color_id in': {
                        '@color.id': {
                            'g >': 0,
                            'tag in': {
                                '@tag.id': {
                                    'id': 'Tag 2'
                                }
                            }
                        },
                    }
                }, [2])
            })

            it('A -> B (X) -> C or D (X or Y)', async () => {
                await expectIds('shape', {
                    'color_id in': {
                        '@color.id': {
                            'b >': 0,
                            'or tag in': {
                                '@tag.id': {
                                    'id': 'Tag 2'
                                }
                            }
                        },
                    }
                }, [2, 3])
            })
        })
    })
})