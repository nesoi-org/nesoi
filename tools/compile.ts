import * as path from 'path';
import * as fs from 'fs';
import { parseArgs } from 'node:util';
import { Compiler } from '~/compiler/compiler';
import { Log } from '~/engine/util/log';
import Console from '~/engine/util/console';

Log.level = 'info';

/**
 * [ compile ]
 * This script is used by projects built with nesoi,
 * to compile the schemas.
 */


Console.header('Compile')

async function main() {
  
    const { positionals } = parseArgs({ allowPositionals: true });
    const arg = positionals[0] || '.';
    const spacePath = path.resolve(process.cwd(), arg, 'nesoi.ts');

    if (!fs.existsSync(spacePath)) {
        throw new Error('This command expects to be run on a directory with a `nesoi.ts` file, which exports as default a nesoi Space.')
    }

    const Nesoi = (await import(spacePath)).default;

    const compiler = new Compiler(Nesoi, {
        nesoiPath: 'nesoi',
        exclude: [
            '*.test.ts'
        ]
    });

    await compiler.run();
}

main();