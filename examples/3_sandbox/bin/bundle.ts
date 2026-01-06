import { Compiler } from 'nesoi/lib/compiler/compiler';
import { MonolythBundler } from 'nesoi/lib/bundler/monolyth/monolyth.bundler';
import { Log } from 'nesoi/lib/engine/util/log';
import Nesoi from '../nesoi';

Log.level = 'info';

async function main() {
    /* Elements */
    
    const compiler = await new Compiler(
        Nesoi,
        {
            nesoiPath: '/home/aboud/git/nesoi/build'
        }
    ).run();
    
    /* Monolyth App */

    await new MonolythBundler(
        compiler,
        './apps/bigrock.app.ts',
        {
            libPaths: ['lib'],
            scripts: {
                'main': 'bin/main.ts'
            },
            nesoiPath: '/home/aboud/git/nesoi/build'
        }).run();
    
}

main();