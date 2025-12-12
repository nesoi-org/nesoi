import type { AnyModule } from '~/engine/module';
import { Log } from '~/engine/util/log'
import { expectBucket, givenBucket } from 'nesoi/tools/joaquin/bucket';
import { ModuleTree } from '~/engine/tree';
import { t, TypeCompiler, TypeDumper } from '~/compiler/types/type_compiler';
import { Tag } from '~/engine/dependency';
import type { $Bucket } from 'index';

Log.level = 'off';

async function compileTypes($: {
    schema: $Bucket
    module: AnyModule
}, inject: string[] = []) {
    const tree = new ModuleTree({
        'test': $.module
    })
    await tree.resolve();
    tree.allNodes().find(node =>
        Tag.matches(node.tag, new Tag('test', 'bucket', 'test'))
    )!.schema = $.schema;

    for (const bucket of inject) {
        tree.allNodes().find(node =>
            Tag.matches(node.tag, new Tag('test', 'bucket', bucket))
        )!.schema = $.module.buckets[bucket].schema;
    }


    const compiler = new TypeCompiler(tree);
    await compiler.run();

    const type = compiler.bucket.views['test::test#default'];
    const str = TypeDumper.dump('test', type);
    return { type, str }
}

describe('Bucket Type Compiler', () => {

    describe('Model Fields', () => {

        it('should parse view with unknown model fields', async () => 
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    m_any: $.any
                }))
                .view('default', $ => ({
                    v_any: $.model('m_any')
                }))
            )
                .schema(async $ => {
                    const { type } = await compileTypes($);
                    expect(type).toEqual(
                        t.obj({
                            id: t.number(),
                            v_any: t.unknown()
                        })
                    )
                })
        )

        it('should parse view with primitive model fields', async () => 
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    m_string: $.string,
                    m_int: $.int,
                    m_float: $.float,
                    m_boolean: $.boolean,
                }))
                .view('default', $ => ({
                    v_string: $.model('m_string'),
                    v_int: $.model('m_int'),
                    v_float: $.model('m_float'),
                    v_boolean: $.model('m_boolean'),
                }))
            )
                .schema(async $ => {
                    const { type } = await compileTypes($);
                    expect(type).toEqual(
                        t.obj({
                            id: t.number(),
                            v_string: t.string(),
                            v_int: t.number(),
                            v_float: t.number(),
                            v_boolean: t.boolean(),
                        })
                    )
                })
        )

        it('should parse view with literal model fields', async () => 
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    m_literal: $.literal(/something/)
                }))
                .view('default', $ => ({
                    v_literal: $.model('m_literal'),
                }))
            )
                .schema(async $ => {
                    const { type } = await compileTypes($);
                    expect(type).toEqual(
                        t.obj({
                            id: t.number(),
                            v_literal: t.literal('`something`')
                        })
                    )
                })
        )

        it('should parse view with list model fields', async () => 
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    m_list_any: $.list($.any),
                    m_list_string: $.list($.string),
                    m_list_literal: $.list($.literal(/something/)),
                }))
                .view('default', $ => ({
                    v_list_any: $.model('m_list_any'),
                    v_list_string: $.model('m_list_string'),
                    v_list_literal: $.model('m_list_literal')
                }))
            )
                .schema(async $ => {
                    const { type, str } = await compileTypes($);
                    expect(type).toEqual(
                        t.obj({
                            id: t.number(),
                            v_list_any: t.list(t.unknown()),
                            v_list_string: t.list(t.string()),
                            v_list_literal: t.list(t.literal('`something`'))
                        })
                    )
                })
        )

        it('should parse view with dict model fields', async () => 
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    m_dict_any: $.dict($.any),
                    m_dict_string: $.dict($.string),
                    m_dict_literal: $.dict($.literal(/something/)),
                }))
                .view('default', $ => ({
                    v_dict_any: $.model('m_dict_any'),
                    v_dict_string: $.model('m_dict_string'),
                    v_dict_literal: $.model('m_dict_literal')
                }))
            )
                .schema(async $ => {
                    const { type, str } = await compileTypes($);
                    expect(type).toEqual(
                        t.obj({
                            id: t.number(),
                            v_dict_any: t.dict(t.unknown()),
                            v_dict_string: t.dict(t.string()),
                            v_dict_literal: t.dict(t.literal('`something`'))
                        })
                    )
                })
        )

        it('should parse view with obj model fields', async () => 
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    m_obj: $.obj({
                        m_any: $.any,
                        m_string: $.string,
                        m_literal: $.literal(/something/),
                    })
                }))
                .view('default', $ => ({
                    v_obj: $.model('m_obj')
                }))
            )
                .schema(async $ => {
                    const { type, str } = await compileTypes($);
                    expect(type).toEqual(
                        t.obj({
                            id: t.number(),
                            v_obj: t.obj({
                                m_any: t.unknown(),
                                m_string: t.string(),
                                m_literal: t.literal('`something`')
                            })
                        })
                    )
                })
        )

        it('should parse view with union model fields', async () => 
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    m_union: $.union(
                        $.any,
                        $.string,
                        $.literal(/something/),
                    )
                }))
                .view('default', $ => ({
                    v_union: $.model('m_union')
                }))
            )
                .schema(async $ => {
                    const { type, str } = await compileTypes($);
                    expect(type).toEqual(
                        t.obj({
                            id: t.number(),
                            v_union: t.union([
                                t.unknown(),
                                t.string(),
                                t.literal('`something`')
                            ])
                        })
                    )
                })
        )
    })

    describe('Drive Fields', () => {

        it('should parse view with unknown model fields', async () => 
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    m_file: $.file()
                }))
                .view('default', $ => ({
                    v_file: $.drive('m_file')
                }))
            )
                .schema(async $ => {
                    const { type } = await compileTypes($);
                    expect(type).toEqual(
                        t.obj({
                            id: t.number(),
                            v_file: t.string()
                        })
                    )
                })
        )
    })

    describe('Obj Fields', () => {

        it('should parse view with unknown model fields', async () => 
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    m_any: $.any,
                    m_string: $.string,
                    m_literal: $.literal(/something/),
                }))
                .view('default', $ => ({
                    v_obj: $.obj({
                        v_any: $.model('m_any'),
                        v_string: $.model('m_string'),
                        v_literal: $.model('m_literal'),
                    })
                }))
            )
                .schema(async $ => {
                    const { type, str } = await compileTypes($);
                    expect(type).toEqual(
                        t.obj({
                            id: t.number(),
                            v_obj: t.obj({
                                v_any: t.unknown(),
                                v_string: t.string(),
                                v_literal: t.literal('`something`')
                            })
                        })
                    )
                })
        )
    })

    describe('Inject Fields', () => {

        it('should parse view with inject fields', async () => 
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    m_any: $.any,
                    m_string: $.string,
                    m_literal: $.literal(/something/),
                }))
                .view('default', $ => ({
                    ...$.inject.root
                }))
            )
                .schema(async $ => {
                    const { type, str } = await compileTypes($);
                    expect(type).toEqual(
                        t.obj({
                            id: t.number(),
                            m_any: t.unknown(),
                            m_string: t.string(),
                            m_literal: t.literal('`something`')
                        })
                    )
                })
        )
    })

    describe('Graph Fields', () => {

        const baseBucket = givenBucket('base', $ => $
            .model($ => ({
                id: $.int,
                name: $.string,
                value: $.float
            }))
            .view('default', $ => ({
                v_name: $.model('name'),
                v_value: $.model('value'),
            }))
        )

        it('should parse view with graph fields - without view', async () => 
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    m_key: $.string
                }))
                .graph($ => ({
                    'base': $.one('base', {
                        'name':  {'.': 'm_key'}
                    } as any)
                }))
                .view('default', $ => ({
                    v_key: $.model('m_key'),
                    v_base: $.graph('base')
                })),
            [
                baseBucket
            ])
                .schema(async $ => {
                    const { type, str } = await compileTypes($, ['base']);
                    expect(type).toEqual(
                        t.obj({
                            id: t.number(),
                            v_key: t.string(),
                            v_base: t.bucket(new Tag('test', 'bucket', 'base'))
                        })
                    )
                })
        )

        it('should parse view with graph fields - with view', async () => 
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    m_key: $.string
                }))
                .graph($ => ({
                    'base': $.one('base', {
                        'name':  {'.': 'm_key'}
                    } as any)
                }))
                .view('default', $ => ({
                    v_key: $.model('m_key'),
                    v_base: $.graph('base', 'default' as any)
                })),
            [
                baseBucket
            ])
                .schema(async $ => {
                    const { type, str } = await compileTypes($, ['base']);
                    expect(type).toEqual(
                        t.obj({
                            id: t.number(),
                            v_key: t.string(),
                            v_base: t.bucket(new Tag('test', 'bucket', 'base'), 'default')
                        })
                    )
                })
        )


        it('should parse view with graph fields (many) - without view', async () => 
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    m_key: $.string
                }))
                .graph($ => ({
                    'base': $.many('base', {
                        'name':  {'.': 'm_key'}
                    } as any)
                }))
                .view('default', $ => ({
                    v_key: $.model('m_key'),
                    v_base: $.graph('base')
                })),
            [
                baseBucket
            ])
                .schema(async $ => {
                    const { type, str } = await compileTypes($, ['base']);
                    expect(type).toEqual(
                        t.obj({
                            id: t.number(),
                            v_key: t.string(),
                            v_base: t.list(t.bucket(new Tag('test', 'bucket', 'base')))
                        })
                    )
                })
        )
    })

    describe('View Fields', () => {

        it('should parse view with view fields', async () => 
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    m_any: $.any,
                    m_string: $.string,
                    m_literal: $.literal(/something/),
                }))
                .view('details', $ => ({
                    v_string: $.model('m_string'),
                    v_literal: $.model('m_literal'),
                }))
                .view('default', $ => ({
                    v_any: $.model('m_any'),
                    v_a: $.view('details')
                }))
            )
                .schema(async $ => {
                    const { type, str } = await compileTypes($);
                    expect(type).toEqual(
                        t.obj({
                            id: t.number(),
                            v_any: t.unknown(),
                            v_a: t.obj({
                                id: t.number(),
                                v_string: t.string(),
                                v_literal: t.literal('`something`'),
                            })
                        })
                    )
                })
        )
    })

    describe('Pick Op', () => {

        it('should parse view with pick op (obj field)', async () => 
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    m_obj: $.obj({
                        m_any: $.any,
                        m_string: $.string,
                        m_literal: $.literal(/something/),
                    })
                }))
                .view('default', $ => ({
                    v_item: $.model('m_obj').pick('m_literal')
                }))
            )
                .schema(async $ => {
                    const { type, str } = await compileTypes($);
                    expect(type).toEqual(
                        t.obj({
                            id: t.number(),
                            v_item: t.literal('`something`')
                        })
                    )
                })
        )

        it('should parse view with pick op (list field)', async () => 
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    m_list: $.list(
                        $.literal(/something/),
                    )
                }))
                .view('default', $ => ({
                    v_item: $.model('m_list').pick(0)
                }))
            )
                .schema(async $ => {
                    const { type, str } = await compileTypes($);
                    expect(type).toEqual(
                        t.obj({
                            id: t.number(),
                            v_item: t.literal('`something`')
                        })
                    )
                })
        )

        it('should parse view with pick op (dict field)', async () => 
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    m_dict: $.dict(
                        $.literal(/something/),
                    )
                }))
                .view('default', $ => ({
                    v_item: $.model('m_dict').pick('a')
                }))
            )
                .schema(async $ => {
                    const { type, str } = await compileTypes($);
                    expect(type).toEqual(
                        t.obj({
                            id: t.number(),
                            v_item: t.literal('`something`')
                        })
                    )
                })
        )
    })

    describe('List Op', () => {

        it('should parse view with list op (obj field)', async () => 
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    m_obj: $.obj({
                        m_any: $.any,
                        m_string: $.string,
                        m_literal: $.literal(/something/),
                    })
                }))
                .view('default', $ => ({
                    v_list: $.model('m_obj').as_list()
                }))
            )
                .schema(async $ => {
                    const { type, str } = await compileTypes($);
                    expect(type).toEqual(
                        t.obj({
                            id: t.number(),
                            v_list: t.list(t.union([
                                t.unknown(),
                                t.string(),
                                t.literal('`something`')
                            ]))
                        })
                    )
                })
        )

        it('should parse view with list op (dict field)', async () => 
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    m_dict: $.dict($.literal(/something/))
                }))
                .view('default', $ => ({
                    v_list: $.model('m_dict').as_list()
                }))
            )
                .schema(async $ => {
                    const { type, str } = await compileTypes($);
                    expect(type).toEqual(
                        t.obj({
                            id: t.number(),
                            v_list: t.list(t.literal('`something`'))
                        })
                    )
                })
        )

    })

    describe('Dict Op', () => {

        it('should parse view with dict op (list of literals field)', async () => 
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    m_list: $.list($.literal(/something/))
                }))
                .view('default', $ => ({
                    v_list: $.model('m_list').as_dict()
                }))
            )
                .schema(async $ => {
                    const { type, str } = await compileTypes($);
                    expect(type).toEqual(
                        t.obj({
                            id: t.number(),
                            v_list: t.dict(t.literal('`something`'))
                        })
                    )
                })
        )

        it('should parse view with dict op (list of objects field)', async () => 
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    m_list_obj: $.list($.obj({
                        m_any: $.any,
                        m_string: $.string,
                        m_literal: $.literal(/something/),
                    }))
                }))
                .view('default', $ => ({
                    v_list: $.model('m_list_obj').as_dict()
                }))
            )
                .schema(async $ => {
                    const { type, str } = await compileTypes($);
                    expect(type).toEqual(
                        t.obj({
                            id: t.number(),
                            v_list: t.dict(t.obj({
                                m_any: t.unknown(),
                                m_string: t.string(),
                                m_literal: t.literal('`something`')
                            }))
                        })
                    )
                })
        )

    })

    describe('Group Op', () => {

        it('should parse view with group op (list of objects field)', async () => 
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    m_list_obj: $.list($.obj({
                        m_any: $.any,
                        m_string: $.string,
                        m_literal: $.literal(/something/),
                    }))
                }))
                .view('default', $ => ({
                    v_list: $.model('m_list_obj').group_by('m_string')
                }))
            )
                .schema(async $ => {
                    const { type, str } = await compileTypes($);
                    expect(type).toEqual(
                        t.obj({
                            id: t.number(),
                            v_list: t.dict(t.list(t.obj({
                                m_any: t.unknown(),
                                m_string: t.string(),
                                m_literal: t.literal('`something`')
                            })))
                        })
                    )
                })
        )

    })
    
    describe('Map Op', () => {
        
        it('should parse view with map op (list of objects field)', async () => 
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    m_list_obj: $.list($.obj({
                        m_any: $.any,
                        m_string: $.string,
                        m_literal: $.literal(/something/),
                    }))
                }))
                .view('default', $ => ({
                    v_list: $.model('m_list_obj').map($ => $
                        .pick('m_literal')
                    )
                }))
            )
                .schema(async $ => {
                    const { type, str } = await compileTypes($);
                    expect(type).toEqual(
                        t.obj({
                            id: t.number(),
                            v_list: t.list(t.literal('`something`'))
                        })
                    )
                })
        )
        
        it('should parse view with map op (list of objects field) - infered map', async () => 
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    m_list_obj: $.list($.obj({
                        m_any: $.any,
                        m_string: $.string,
                        m_literal: $.literal(/something/),
                    }))
                }))
                .view('default', $ => ({
                    v_list: $.model('m_list_obj.*').pick('m_literal')
                }))
            )
                .schema(async $ => {
                    const { type, str } = await compileTypes($);
                    expect(type).toEqual(
                        t.obj({
                            id: t.number(),
                            v_list: t.list(t.literal('`something`'))
                        })
                    )
                })
        )
        
        it('*should parse view without map op, with modelpath only', async () => 
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    m_list_obj: $.list($.obj({
                        m_any: $.any,
                        m_string: $.string,
                        m_literal: $.literal(/something/),
                    }))
                }))
                .view('default', $ => ({
                    v_list: $.model('m_list_obj.*.m_literal')
                }))
            )
                .schema(async $ => {
                    const { type, str } = await compileTypes($);
                    expect(type).toEqual(
                        t.obj({
                            id: t.number(),
                            v_list: t.list(t.literal('`something`'))
                        })
                    )
                })
        )

    })


    describe('Graph Fields with Ops', () => {

        const baseBucket = givenBucket('base', $ => $
            .model($ => ({
                id: $.int,
                name: $.string,
                value: $.float
            }))
            .view('default', $ => ({
                v_name: $.model('name'),
                v_value: $.model('value'),
            }))
        )

        it('should parse view with graph fields and pick (without view)', async () => 
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    m_key: $.string
                }))
                .graph($ => ({
                    'base': $.one('base', {
                        'name':  {'.': 'm_key'}
                    } as any)
                }))
                .view('default', $ => ({
                    v_value: $.graph('base').pick('value')
                })),
            [
                baseBucket
            ])
                .schema(async $ => {
                    const { type, str } = await compileTypes($, ['base']);
                    expect(type).toEqual(
                        t.obj({
                            id: t.number(),
                            v_value: t.number()
                        })
                    )
                })
        )

        it('should parse view with graph fields and pick (with view)', async () => 
            await expectBucket($ => $
                .model($ => ({
                    id: $.int,
                    m_key: $.string
                }))
                .graph($ => ({
                    'base': $.one('base', {
                        'name':  {'.': 'm_key'}
                    } as any)
                }))
                .view('default', $ => ({
                    v_value: $.graph('base', 'default' as any).pick('v_value')
                })),
            [
                baseBucket
            ])
                .schema(async $ => {
                    const { type, str } = await compileTypes($, ['base']);
                    expect(type).toEqual(
                        t.obj({
                            id: t.number(),
                            v_value: t.number()
                        })
                    )
                })
        )
        
    })

})