import { Compiler, MonolythCompiler } from 'nesoi/lib/compiler';
import { Log } from 'nesoi/lib/engine/util/log';
import Nesoi from '../nesoi';

Log.level = 'debug';

async function main() {

    /* Elements */
    
    const compiler = await new Compiler(
        Nesoi,
        {
            nesoiPath: '/home/aboud/git/nesoi/build'
        }
    ).run();
    
    /* Monolyth Runtime */

    await new MonolythCompiler(
        compiler,
        './runtimes/simple.runtime.ts',
        {
            scripts: {
                'main': 'bin/main.ts'
            },
            nesoiPath: '/home/aboud/git/nesoi/build'
        }).run();
    
}

main();