import { Compiler } from 'nesoi/lib/compiler/compiler';
import { MonolythBundler } from '~/bundler/monolyth/monolyth.bundler';
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

    await new MonolythBundler(
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