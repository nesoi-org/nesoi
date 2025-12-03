import { Log } from '~/engine/util/log';
import { CompilerTest } from './compiler_test';

describe('* Compiler', () => {
   
    describe('TypeScript Bridge: Extracted Code', () => {
        
        it.only('arrow function', async () => {
            Log.level = 'off';
            const compiler = new CompilerTest();
    
            try {
                compiler.addJob(''
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
    })

})