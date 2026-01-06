import { Compiler } from 'nesoi/lib/compiler';
import { Log } from 'nesoi/lib/engine/util/log';
import nesoi from '../nesoi';
import * as fs from 'fs';
import * as path from 'path';
import script from 'nesoi/lib/engine/cli/script';

const args = script('compile', $ => $
    .d('Compiles the TypeScript types for this space')
    .arg('--debug', '-d', $ => $.d('Enable debug logging'))
    .arg('--trace', '-t', $ => $.d('Enable trace logging'))
    .arg('--clean', '-c', $ => $.d('Remove .nesoi folder before compiling'))
).init();

Log.level =
  args.trace ? 'trace'
      : args.debug ? 'debug'
          : 'info';

async function main() {
    if (args.clean) {
        Log.warn('compiler', 'cli', 'Removing .nesoi folder...');
        fs.rmSync(path.join(process.cwd(), '.nesoi'), {
            recursive: true,
            force: true
        });
    }

    await new Compiler(nesoi, {
        exclude: ['*.test.ts'],
    }).run();
}

void main();