import { CompilerTest } from './compiler_test';

describe('Job Compiler', () => {
   
    describe('TypeScript Bridge', () => {
        
        it('simple job', async () => {
            const compiler = new CompilerTest();
    
            try {
                compiler.addJob(''
                    +'  .message(\'\', $ => ({\n'
                    +'    prop: $.string.rule($ => true)\n'
                    +'  }))\n'
                    +'  .assert($ => true)\n'
                    +'  .extra($ => ({}))\n'
                    +'  .assert($ => true)\n'
                    +'  .extra($ => ({}))\n'
                    +'  .method($ => {})\n'
                );
    
                await compiler.compile()
                const schema = await compiler.schema.job()

                const textMsg = await compiler.schema_file.message();
                expect(textMsg).not.toContain('TS BRIDGE WARN');
                
                const textJob = await compiler.schema_file.job();
                expect(textJob).not.toContain('TS BRIDGE WARN');

                expect(schema).toEqual({
                    module: 'core',
                    name: 'test',
                    alias: 'test',
                    authn: [

                    ],
                    input: [

                    ],
                    output: undefined,
                    '$t': 'job',
                    extrasAndAsserts: [
                        {
                            assert: expect.anything()
                        },
                        {
                            extra: expect.anything()
                        },
                        {
                            assert: expect.anything()
                        },
                        {
                            extra: expect.anything()
                        }
                    ],
                    method: expect.anything(),
                    scope: undefined,
                    '#output': undefined as any,
                    '#authn': undefined as any,
                    '#input': undefined as never,
                    '#extra': undefined as any
                })
            }
            finally {
                compiler.cleanup();
            }
        }, 30000)
        
    })

})