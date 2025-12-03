import { Log } from '~/engine/util/log';
import { CompilerTest } from './compiler_test';

describe('Job Compiler', () => {
   
    describe('Schemas', () => {
        
        it('simple job', async () => {
            Log.level = 'off';
            const compiler = new CompilerTest();
    
            try {
                compiler.addJob(''
                    +'  .message(\'\', $ => ({\n'
                    +'    prop: $.string\n'
                    +'  }))\n'
                    +'  .method($ => {})\n'
                );
    
                await compiler.compile()
                const schema = await compiler.schema.job()

                expect(schema).toEqual({
                    module: 'core',
                    name: 'test',
                    alias: 'test',
                    auth: [

                    ],
                    input: [

                    ],
                    output: undefined,
                    '$t': 'job',
                    extrasAndAsserts: [],
                    method: expect.anything(),
                    scope: undefined,
                    '#output': undefined as any,
                    '#authn': undefined as any,
                    '#input': undefined as never,
                    '#extra': undefined as any
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
        
        it.only('method', async () => {
            Log.level = 'off';
            const compiler = new CompilerTest();
    
            try {
                compiler.addJob(''
                    +'  .message(\'\', $ => ({\n'
                    +'    prop: $.string\n'
                    +'  }))\n'
                    +'  .method($ => {})\n'
                );
    
                await compiler.compile()

                const textJob = await compiler.schema_file.job();
                expect(textJob).not.toContain('TS BRIDGE WARN');
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
                compiler.addJob(''
                    +'  .auth(\'api\', $ => true)\n'
                    +'  .message(\'\', $ => ({\n'
                    +'    prop: $.string\n'
                    +'  }))\n'
                    +'  .method($ => {})\n'
                );
    
                await compiler.compile()

                const textJob = await compiler.schema_file.job();
                expect(textJob).not.toContain('TS BRIDGE WARN');
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
                compiler.addJob(''
                    +'  .auth(\'api1\', $ => true)\n'
                    +'  .auth(\'api2\', $ => true)\n'
                    +'  .message(\'\', $ => ({\n'
                    +'    prop: $.string\n'
                    +'  }))\n'
                    +'  .method($ => {})\n'
                );
    
                await compiler.compile()

                const textJob = await compiler.schema_file.job();
                expect(textJob).not.toContain('TS BRIDGE WARN');
            }
            catch(e) {
                console.error(e);
                throw e;
            }
            finally {
                compiler.cleanup();
            }
        }, 30000)
        
        it('extras and asserts', async () => {
            Log.level = 'off';
            const compiler = new CompilerTest();
    
            try {
                compiler.addJob(''
                    +'  .message(\'\', $ => ({\n'
                    +'    prop: $.string\n'
                    +'  }))\n'
                    +'  .assert($ => true || true)\n'
                    +'  .extra($ => ({ a: 1 }))\n'
                    +'  .assert($ => \'error1\')\n'
                    +'  .extra($ => ({ b: 2 }))\n'
                    +'  .method($ => {})\n'
                );
    
                await compiler.compile()
                
                const textJob = await compiler.schema_file.job();
                expect(textJob).not.toContain('TS BRIDGE WARN');
            }
            catch(e) {
                console.error(e);
                throw e;
            }
            finally {
                compiler.cleanup();
            }
        }, 30000)

        it('message rule', async () => {
            Log.level = 'off';
            const compiler = new CompilerTest();
    
            try {
                compiler.addJob(''
                    +'  .message(\'\', $ => ({\n'
                    +'    prop: $.string.rule($ => true)\n'
                    +'  }))\n'
                    +'  .method($ => {})\n'
                );
    
                await compiler.compile()

                const textMsg = await compiler.schema_file.message();
                expect(textMsg).not.toContain('TS BRIDGE WARN');
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