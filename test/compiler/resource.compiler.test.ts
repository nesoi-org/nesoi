import { Log } from '~/engine/util/log';
import { CompilerTest } from './compiler_test';

describe('Resource Compiler', () => {
   
    describe('TypeScript Bridge', () => {
        
        it('simple resource', async () => {
            Log.level = 'error';
            const compiler = new CompilerTest();
    
            try {
                compiler.addBucket(''
                    +'  .model($ => ({\n'
                    +'    id: $.int,\n'
                    +'    prop1: $.string,\n'
                    +'    prop2: $.list($.string),\n'
                    +'    prop3: $.list($.obj({\n'
                    +'      a: $.string'
                    +'    }))\n'
                    +'  }))\n'
                );
                compiler.addResource(''
                    +'  .bucket(\'test\')\n'
                    +'  .create($ => $\n'
                    +'    .input($ => ({\n'
                    +'      prop1: $.string.rule($ => true),\n'
                    +'      prop2: $.list($.string.rule($ => true)),\n'
                    +'      prop3: $.list($.obj({\n'
                    +'        a: $.string.rule($ => true)\n'
                    +'      }))\n'
                    +'    }))\n'
                    +'    .prepare($ => $.msg)\n'
                    +'  )\n'
                );
    
                await compiler.compile()

                const textMsgCreate = await compiler.schema_file.message('test.create');
                expect(textMsgCreate).not.toContain('TS BRIDGE WARN');

                const textJobCreate = await compiler.schema_file.job('test.create');
                expect(textJobCreate).not.toContain('TS BRIDGE WARN');
                
                const text = await compiler.schema_file.resource();
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


        it('auth resolver', async () => {
            Log.level = 'off';
            const compiler = new CompilerTest();
    
            try {
                compiler.addBucket(''
                    +'  .model($ => ({\n'
                    +'    id: $.int,\n'
                    +'  }))\n'
                );
                compiler.addResource(''
                    +'  .auth(\'api\', $ => true)\n'
                    +'  .bucket(\'test\')\n'
                );
    
                await compiler.compile()

                const textResource = await compiler.schema_file.resource();
                expect(textResource).not.toContain('TS BRIDGE WARN');
            }
            catch(e) {
                console.error(e);
                throw e;
            }
            finally {
                compiler.cleanup();
            }
        }, 30000)
        
        it('multiple auth resolvers', async () => {
            Log.level = 'off';
            const compiler = new CompilerTest();
    
            try {
                compiler.addBucket(''
                    +'  .model($ => ({\n'
                    +'    id: $.int,\n'
                    +'  }))\n'
                );
                compiler.addResource(''
                    +'  .auth(\'api1\', $ => true)\n'
                    +'  .auth(\'api2\', $ => true)\n'
                    +'  .bucket(\'test\')\n'
                );
    
                await compiler.compile()

                const textResource = await compiler.schema_file.resource();
                expect(textResource).not.toContain('TS BRIDGE WARN');
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
                compiler.addBucket(''
                    +'  .model($ => ({\n'
                    +'    id: $.int,\n'
                    +'    p: $.any\n'
                    +'  }))\n'
                );
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
                compiler.addResource(''
                    +'  .bucket(\'test\')\n'
                    +'  .create($ => $\n'
                    +'    .input($ => ({\n'
                    +'      p: $.obj({\n'
                    +'        x: $.list(\n'
                    +'          $.dict(\n'
                    +'            $.union(\n'
                    +'              $.int,\n'
                    +'              $.msg(\'base\')\n'
                    +'            )\n'
                    +'          )\n'
                    +'        )\n'
                    +'      })\n'
                    +'    }))\n'
                    +'    .prepare($ => $.msg)\n'
                    +'    .after($ => {})\n'
                    +'  )\n'
                    +'  .update($ => $\n'
                    +'    .input($ => ({\n'
                    +'      p: $.obj({\n'
                    +'        x: $.list(\n'
                    +'          $.dict(\n'
                    +'            $.union(\n'
                    +'              $.int,\n'
                    +'              $.msg(\'base\')\n'
                    +'            )\n'
                    +'          )\n'
                    +'        )\n'
                    +'      })\n'
                    +'    }))\n'
                    +'    .prepare($ => $.msg)\n'
                    +'    .after($ => {})\n'
                    +'  )\n'
                    +'  .delete($ => $\n'
                    +'    .input($ => ({\n'
                    +'      p: $.obj({\n'
                    +'        x: $.list(\n'
                    +'          $.dict(\n'
                    +'            $.union(\n'
                    +'              $.int,\n'
                    +'              $.msg(\'base\')\n'
                    +'            )\n'
                    +'          )\n'
                    +'        )\n'
                    +'      })\n'
                    +'    }))\n'
                    +'    .prepare($ => true)\n'
                    +'    .after($ => {})\n'
                    +'  )\n'
                );
    
                await compiler.compile()

                const textMsgBase = await compiler.schema_file.message('base');
                expect(textMsgBase).not.toContain('TS BRIDGE WARN');

                {
                    const textMsg = await compiler.schema_file.message('test.create');
                    expect(textMsg).not.toContain('TS BRIDGE WARN');
    
                    const textJob = await compiler.schema_file.job('test.create');
                    expect(textJob).not.toContain('TS BRIDGE WARN');
    
                    const textResource = await compiler.schema_file.resource();
                    expect(textResource).not.toContain('TS BRIDGE WARN');
    
                    const schema = await compiler.schema.message('test.create')    
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
                }

                {
                    const textMsg = await compiler.schema_file.message('test.update');
                    expect(textMsg).not.toContain('TS BRIDGE WARN');
    
                    const textJob = await compiler.schema_file.job('test.update');
                    expect(textJob).not.toContain('TS BRIDGE WARN');
    
                    const textResource = await compiler.schema_file.resource();
                    expect(textResource).not.toContain('TS BRIDGE WARN');
    
                    const schema = await compiler.schema.message('test.update')    
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
                }

                {
                    const textMsg = await compiler.schema_file.message('test.delete');
                    expect(textMsg).not.toContain('TS BRIDGE WARN');
    
                    const textJob = await compiler.schema_file.job('test.delete');
                    expect(textJob).not.toContain('TS BRIDGE WARN');
    
                    const textResource = await compiler.schema_file.resource();
                    expect(textResource).not.toContain('TS BRIDGE WARN');
    
                    const schema = await compiler.schema.message('test.delete')    
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
                }

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