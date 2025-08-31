import { Compiler } from 'nesoi/lib/compiler/compiler';
import { DistributedBundler } from '~/bundler/distributed/distributed_compiler';
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
    
    /* Distributed App */

    await new DistributedBundler(
        compiler,
        './apps/mandala.app.ts',
        {
            libPaths: ['lib'],
            scripts: {
                'main': 'bin/main.ts'
            },
            nesoiPath: '/home/aboud/git/nesoi/build'
        }).run();
    
}

main();