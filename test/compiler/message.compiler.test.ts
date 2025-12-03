import { Log } from '~/engine/util/log';
import { CompilerTest } from './compiler_test';

describe('Message Compiler', () => {
   
    describe('Schemas', () => {
        
        it('single field', async () => {
            Log.level = 'off';
            const compiler = new CompilerTest();
    
            try {
                compiler.addMessage(''
                    +'  p: $.int'
                );
    
                await compiler.compile()
                const schema = await compiler.schema.message()
    
                expect(schema).toEqual({
                    '#parsed': undefined,
                    '#raw': undefined,
                    $t: 'message',
                    module: 'core',
                    name: 'test',
                    alias: 'test',
                    template: {
                        $t: 'message.template',
                        fields: {
                            p: {
                                '#parsed': undefined,
                                '#raw': undefined,
                                $t: 'message.template.field',
                                alias: 'p',
                                children: undefined,
                                defaultValue: undefined,
                                meta: {},
                                name: 'p',
                                nullable: false,
                                pathParsed: 'p',
                                pathRaw: 'p',
                                required: true,
                                rules: [],
                                type: 'int',
                            }
                        }
                    }
                })
            }
            catch(e) {
                console.error(e);
                throw e;
            }
            finally {
                compiler.cleanup();
            }
        }, 30000)
        
        it('simple obj', async () => {
            const compiler = new CompilerTest();
    
            try {
                compiler.addMessage(''
                    +'  p: $.obj({\n'
                    +'    sub1: $.string.as(\'Sub 1\'),\n'
                    +'    sub2: $.boolean.as(\'Sub 2\'),\n'
                    +'  }).as(\'The Object\')'
                );
    
                await compiler.compile()
                const schema = await compiler.schema.message()
    
                expect(schema).toEqual({
                    '#parsed': undefined,
                    '#raw': undefined,
                    $t: 'message',
                    module: 'core',
                    name: 'test',
                    alias: 'test',
                    template: {
                        $t: 'message.template',
                        fields: {
                            p: {
                                '#parsed': undefined,
                                '#raw': undefined,
                                $t: 'message.template.field',
                                alias: 'The Object',
                                children: {
                                    'sub1': {
                                        '#parsed': undefined,
                                        '#raw': undefined,
                                        $t: 'message.template.field',
                                        alias: 'Sub 1',
                                        children: undefined,
                                        defaultValue: undefined,
                                        meta: {},
                                        name: 'sub1',
                                        nullable: false,
                                        pathParsed: 'p.sub1',
                                        pathRaw: 'p.sub1',
                                        required: true,
                                        rules: [],
                                        type: 'string',
                                    },
                                    'sub2': {
                                        '#parsed': undefined,
                                        '#raw': undefined,
                                        $t: 'message.template.field',
                                        alias: 'Sub 2',
                                        children: undefined,
                                        defaultValue: undefined,
                                        meta: {},
                                        name: 'sub2',
                                        nullable: false,
                                        pathParsed: 'p.sub2',
                                        pathRaw: 'p.sub2',
                                        required: true,
                                        rules: [],
                                        type: 'boolean',
                                    }
                                },
                                defaultValue: undefined,
                                meta: {},
                                name: 'p',
                                nullable: false,
                                pathParsed: 'p',
                                pathRaw: 'p',
                                required: true,
                                rules: [],
                                type: 'obj',
                            }
                        }
                    }
                })
            }
            catch(e) {
                console.error(e);
                throw e;
            }
            finally {
                compiler.cleanup();
            }
        }, 30000)
        
        it('simple list', async () => {
            const compiler = new CompilerTest();
    
            try {
                compiler.addMessage(''
                    +'  p: $.list($.int.as(\'A List Item\')).as(\'The Whole List\')'
                );
    
                await compiler.compile()
                const schema = await compiler.schema.message()
    
                expect(schema).toEqual({
                    '#parsed': undefined,
                    '#raw': undefined,
                    $t: 'message',
                    module: 'core',
                    name: 'test',
                    alias: 'test',
                    template: {
                        $t: 'message.template',
                        fields: {
                            p: {
                                '#parsed': undefined,
                                '#raw': undefined,
                                $t: 'message.template.field',
                                alias: 'The Whole List',
                                children: {
                                    '#': {
                                        '#parsed': undefined,
                                        '#raw': undefined,
                                        $t: 'message.template.field',
                                        alias: 'A List Item',
                                        children: undefined,
                                        defaultValue: undefined,
                                        meta: {},
                                        name: '#',
                                        nullable: false,
                                        pathParsed: 'p.#',
                                        pathRaw: 'p.#',
                                        required: true,
                                        rules: [],
                                        type: 'int',
                                    }
                                },
                                defaultValue: undefined,
                                meta: {},
                                name: 'p',
                                nullable: false,
                                pathParsed: 'p',
                                pathRaw: 'p',
                                required: true,
                                rules: [],
                                type: 'list',
                            }
                        }
                    }
                })
            }
            catch(e) {
                console.error(e);
                throw e;
            }
            finally {
                compiler.cleanup();
            }
        }, 30000)
        
        it('simple dict', async () => {
            const compiler = new CompilerTest();
    
            try {
                compiler.addMessage(''
                    +'  p: $.dict($.int.as(\'A Dict Item\')).as(\'The Whole Dict\')'
                );
    
                await compiler.compile()
                const schema = await compiler.schema.message()
    
                expect(schema).toEqual({
                    '#parsed': undefined,
                    '#raw': undefined,
                    $t: 'message',
                    module: 'core',
                    name: 'test',
                    alias: 'test',
                    template: {
                        $t: 'message.template',
                        fields: {
                            p: {
                                '#parsed': undefined,
                                '#raw': undefined,
                                $t: 'message.template.field',
                                alias: 'The Whole Dict',
                                children: {
                                    '#': {
                                        '#parsed': undefined,
                                        '#raw': undefined,
                                        $t: 'message.template.field',
                                        alias: 'A Dict Item',
                                        children: undefined,
                                        defaultValue: undefined,
                                        meta: {},
                                        name: '#',
                                        nullable: false,
                                        pathParsed: 'p.#',
                                        pathRaw: 'p.#',
                                        required: true,
                                        rules: [],
                                        type: 'int',
                                    }
                                },
                                defaultValue: undefined,
                                meta: {},
                                name: 'p',
                                nullable: false,
                                pathParsed: 'p',
                                pathRaw: 'p',
                                required: true,
                                rules: [],
                                type: 'dict',
                            }
                        }
                    }
                })
            }
            catch(e) {
                console.error(e);
                throw e;
            }
            finally {
                compiler.cleanup();
            }
        }, 30000)
        
        it('simple union', async () => {
            const compiler = new CompilerTest();
    
            try {
                compiler.addMessage(''
                    +'  p: $.union($.int.as(\'Some Int\'), $.boolean.as(\'Some Bool\')).as(\'The Union\')'
                );
    
                await compiler.compile()
                const schema = await compiler.schema.message()
    
                expect(schema).toEqual({
                    '#parsed': undefined,
                    '#raw': undefined,
                    $t: 'message',
                    module: 'core',
                    name: 'test',
                    alias: 'test',
                    template: {
                        $t: 'message.template',
                        fields: {
                            p: {
                                '#parsed': undefined,
                                '#raw': undefined,
                                $t: 'message.template.field',
                                alias: 'The Union',
                                children: {
                                    0: {
                                        '#parsed': undefined,
                                        '#raw': undefined,
                                        $t: 'message.template.field',
                                        alias: 'Some Int',
                                        children: undefined,
                                        defaultValue: undefined,
                                        meta: {},
                                        name: 'p',
                                        nullable: false,
                                        pathParsed: 'p',
                                        pathRaw: 'p',
                                        required: true,
                                        rules: [],
                                        type: 'int',
                                    },
                                    1: {
                                        '#parsed': undefined,
                                        '#raw': undefined,
                                        $t: 'message.template.field',
                                        alias: 'Some Bool',
                                        children: undefined,
                                        defaultValue: undefined,
                                        meta: {},
                                        name: 'p',
                                        nullable: false,
                                        pathParsed: 'p',
                                        pathRaw: 'p',
                                        required: true,
                                        rules: [],
                                        type: 'boolean',
                                    }
                                },
                                defaultValue: undefined,
                                meta: {},
                                name: 'p',
                                nullable: false,
                                pathParsed: 'p',
                                pathRaw: 'p',
                                required: true,
                                rules: [],
                                type: 'union',
                            }
                        }
                    }
                })
            }
            catch(e) {
                console.error(e);
                throw e;
            }
            finally {
                compiler.cleanup();
            }
        }, 30000)

    })

    describe('TypeScript Bridge', () => {

        it('simple rule', async () => {
            const compiler = new CompilerTest();
    
            try {
                compiler.addMessage(''
                    +'  p: $.int.rule($ => true)'
                );
    
                await compiler.compile()

                const schema = await compiler.schema.message()    
                expect(schema.template.fields.p.rules).toHaveLength(1);

                const text = await compiler.schema_file.message();
                expect(text).not.toContain('TS BRIDGE WARN');

            }
            catch(e) {
                console.error(e);
                throw e;
            }
            finally {
                compiler.cleanup();
            }
        }, 30000)

        it('rule inside obj', async () => {
            const compiler = new CompilerTest();
    
            try {
                compiler.addMessage(''
                    +'  p: $.obj({\n'
                    +'    a: $.int.rule($ => true)\n'
                    +'  })'
                );
    
                await compiler.compile()

                const schema = await compiler.schema.message()    
                expect(schema.template.fields.p.rules).toHaveLength(0);
                expect(schema.template.fields.p.children!.a.rules).toHaveLength(1);

                const text = await compiler.schema_file.message();
                expect(text).not.toContain('TS BRIDGE WARN');

            }
            catch(e) {
                console.error(e);
                throw e;
            }
            finally {
                compiler.cleanup();
            }
        }, 30000)

        it('rule inside list', async () => {
            const compiler = new CompilerTest();
    
            try {
                compiler.addMessage(''
                    +'  p: $.list(\n'
                    +'    $.int.rule($ => true)\n'
                    +'  )'
                );
    
                await compiler.compile()

                const schema = await compiler.schema.message()    
                expect(schema.template.fields.p.rules).toHaveLength(0);
                expect(schema.template.fields.p.children!['#'].rules).toHaveLength(1);

                const text = await compiler.schema_file.message();
                expect(text).not.toContain('TS BRIDGE WARN');

            }
            catch(e) {
                console.error(e);
                throw e;
            }
            finally {
                compiler.cleanup();
            }
        }, 30000)

        it('rule inside dict', async () => {
            const compiler = new CompilerTest();
    
            try {
                compiler.addMessage(''
                    +'  p: $.dict(\n'
                    +'    $.int.rule($ => true)\n'
                    +'  )'
                );
    
                await compiler.compile()

                const schema = await compiler.schema.message()    
                expect(schema.template.fields.p.rules).toHaveLength(0);
                expect(schema.template.fields.p.children!['#'].rules).toHaveLength(1);

                const text = await compiler.schema_file.message();
                expect(text).not.toContain('TS BRIDGE WARN');

            }
            catch(e) {
                console.error(e);
                throw e;
            }
            finally {
                compiler.cleanup();
            }
        }, 30000)

        it('rule inside union', async () => {
            const compiler = new CompilerTest();
    
            try {
                compiler.addMessage(''
                    +'  p: $.union(\n'
                    +'    $.int,\n'
                    +'    $.boolean.rule($ => true)\n'
                    +'  )'
                );
    
                await compiler.compile()

                const schema = await compiler.schema.message()    
                expect(schema.template.fields.p.rules).toHaveLength(0);
                expect(schema.template.fields.p.children![0].rules).toHaveLength(0);
                expect(schema.template.fields.p.children![1].rules).toHaveLength(1);

                const text = await compiler.schema_file.message();
                expect(text).not.toContain('TS BRIDGE WARN');

            }
            catch(e) {
                console.error(e);
                throw e;
            }
            finally {
                compiler.cleanup();
            }
        }, 30000)

        it('rule from external message', async () => {
            const compiler = new CompilerTest();
    
            try {
                compiler.addMessage(''
                    +'  b: $.int.rule($ => true)\n'
                , 'base');
                compiler.addMessage(''
                    +'  p: $.msg(\'base\')'
                );
    
                await compiler.compile()

                const schema = await compiler.schema.message()    
                expect(schema.template.fields.p.rules).toHaveLength(0);
                expect(schema.template.fields.p.children!['b'].rules).toHaveLength(1);

                const text = await compiler.schema_file.message();
                expect(text).not.toContain('TS BRIDGE WARN');

            }
            catch(e) {
                console.error(e);
                throw e;
            }
            finally {
                compiler.cleanup();
            }
        }, 30000)


        it('deep rule', async () => {
            const compiler = new CompilerTest();
    
            try {
                compiler.addMessage(''
                    +'  p: $.obj({\n'
                    +'    a: $.list(\n'
                    +'      $.dict(\n'
                    +'        $.union(\n'
                    +'          $.int,\n'
                    +'          $.string.optional.rule($ => true)\n'
                    +'        )\n'
                    +'      )\n'
                    +'    )\n'
                    +'  })\n'
                );
    
                await compiler.compile()

                const schema = await compiler.schema.message()    
                expect(schema.template.fields.p.rules).toHaveLength(0);
                expect(schema.template.fields.p.children!['a'].rules).toHaveLength(0);
                expect(schema.template.fields.p.children!['a'].children!['#'].rules).toHaveLength(0);
                expect(schema.template.fields.p.children!['a'].children!['#'].children!['#'].rules).toHaveLength(0);
                expect(schema.template.fields.p.children!['a'].children!['#'].children!['#'].children![0].rules).toHaveLength(0);
                expect(schema.template.fields.p.children!['a'].children!['#'].children!['#'].children![1].rules).toHaveLength(1);

                const text = await compiler.schema_file.message();
                expect(text).not.toContain('TS BRIDGE WARN');

            }
            catch(e) {
                console.error(e);
                throw e;
            }
            finally {
                compiler.cleanup();
            }
        }, 30000)

        it('deep external rule', async () => {
            const compiler = new CompilerTest();
    
            try {
                compiler.addMessage(''
                    +'  b: $.obj({\n'
                    +'    y: $.list(\n'
                    +'      $.dict(\n'
                    +'        $.union(\n'
                    +'          $.int,\n'
                    +'          $.string.rule($ => true)\n'
                    +'        )\n'
                    +'      )\n'
                    +'    )\n'
                    +'  })\n'
                , 'base');
                compiler.addMessage(''
                    +'  p: $.obj({\n'
                    +'    x: $.list(\n'
                    +'      $.dict(\n'
                    +'        $.union(\n'
                    +'          $.int,\n'
                    +'          $.msg(\'base\')\n'
                    +'        )\n'
                    +'      )\n'
                    +'    )\n'
                    +'  })\n'
                );
    
                await compiler.compile()

                const schema = await compiler.schema.message()    
                expect(schema.template.fields.p.rules).toHaveLength(0);
                expect(schema.template.fields.p.children!['x'].rules).toHaveLength(0);
                expect(schema.template.fields.p.children!['x'].children!['#'].rules).toHaveLength(0);
                expect(schema.template.fields.p.children!['x'].children!['#'].children!['#'].rules).toHaveLength(0);
                expect(schema.template.fields.p.children!['x'].children!['#'].children!['#'].children![0].rules).toHaveLength(0);
                expect(schema.template.fields.p.children!['x'].children!['#'].children!['#'].children![1].rules).toHaveLength(0);
                expect(schema.template.fields.p.children!['x'].children!['#'].children!['#'].children![1].children!['b'].rules).toHaveLength(0);
                expect(schema.template.fields.p.children!['x'].children!['#'].children!['#'].children![1].children!['b'].children!['y'].rules).toHaveLength(0);
                expect(schema.template.fields.p.children!['x'].children!['#'].children!['#'].children![1].children!['b'].children!['y'].children!['#'].rules).toHaveLength(0);
                expect(schema.template.fields.p.children!['x'].children!['#'].children!['#'].children![1].children!['b'].children!['y'].children!['#'].children!['#'].rules).toHaveLength(0);
                expect(schema.template.fields.p.children!['x'].children!['#'].children!['#'].children![1].children!['b'].children!['y'].children!['#'].children!['#'].children![0].rules).toHaveLength(0);
                expect(schema.template.fields.p.children!['x'].children!['#'].children!['#'].children![1].children!['b'].children!['y'].children!['#'].children!['#'].children![1].rules).toHaveLength(1);

                const text = await compiler.schema_file.message();
                expect(text).not.toContain('TS BRIDGE WARN');

            }
            catch(e) {
                console.error(e);
                throw e;
            }
            finally {
                compiler.cleanup();
            }
        }, 30000)
    })

})