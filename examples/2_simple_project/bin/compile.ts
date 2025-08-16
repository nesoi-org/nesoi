import { Compiler } from 'nesoi/lib/compiler/compiler';
import { MonolythCompiler } from 'nesoi/lib/compiler/apps/monolyth/monolyth_compiler';
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
    
    /* Monolyth App */

    await new MonolythCompiler(
        compiler,
        './apps/simple.app.ts',
        {
            scripts: {
                'main': 'bin/main.ts'
            },
            nesoiPath: '/home/aboud/git/nesoi/build'
        }).run();
    
}

main();