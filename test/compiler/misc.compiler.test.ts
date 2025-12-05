import { Log } from '~/engine/util/log';
import { CompilerTest } from './compiler_test';

describe('* Compiler', () => {
   
    describe('TypeScript Bridge: Extracted Code types', () => {
        
        it('FunctionExpression', async () => {
            Log.level = 'off';
            const compiler = new CompilerTest();
    
            try {
                compiler.addJob(''
                    +'  .method(function ($) {})\n'
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

        it('ArrowFunction', async () => {
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

        it('Async ArrowFunction', async () => {
            Log.level = 'off';
            const compiler = new CompilerTest();
    
            try {
                compiler.addJob(''
                    +'  .method(async $ => {})\n'
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

        it('Identifier (of FunctionExpression)', async () => {
            Log.level = 'off';
            const compiler = new CompilerTest();
    
            try {
                compiler.addJob(''
                    +'  .method(myMethod)\n',
                undefined,
                {
                    prepend: 'function myMethod() {}\n'
                });

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

        it('Identifier (of ArrowFunction)', async () => {
            Log.level = 'off';
            const compiler = new CompilerTest();
    
            try {
                compiler.addJob(''
                    +'  .method(myMethod)\n',
                undefined,
                {
                    prepend: 'const myMethod = () => {}\n'
                });

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

        it('Identifier on Chain', async () => {
            Log.level = 'off';
            const compiler = new CompilerTest();
    
            try {
                compiler.addJob(''
                    +'  .method(myObj.myMethod)\n',
                undefined,
                {
                    prepend: 'const myObj = { myMethod: () => {} }\n'
                });

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

        it('CallExpression', async () => {
            Log.level = 'off';
            const compiler = new CompilerTest();
    
            try {
                compiler.addJob(''
                    +'  .method(myGenerator())\n',
                undefined,
                {
                    prepend: 'function myGenerator() { return () => {} }\n'
                });

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