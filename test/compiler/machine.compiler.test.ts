import { Log } from '~/engine/util/log';
import { CompilerTest } from './compiler_test';

describe('Machine Compiler', () => {
   
    describe('TypeScript Bridge', () => {
        
        it('simple machine', async () => {
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
                compiler.addMachine(''
                    +'  .bucket(\'test\')\n'
                    +'  .message(\'run\', $ => ({\n'
                    +'    prop: $.string'
                    +'  }))\n'
                    +'  .state(\'state1\', $ => $\n'
                    +'    .transition(\'@.run\', $ => $\n'
                    +'      .if($ => true)'
                    +'      .goTo(\'state2\')'
                    +'    )'
                    +'  )\n'
                    +'  .state(\'state2\')\n'
                );
    
                await compiler.compile()
                
                const text = await compiler.schema_file.machine();
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