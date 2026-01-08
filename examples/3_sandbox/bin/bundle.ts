import { Compiler } from 'nesoi/lib/compiler';
import { Log } from 'nesoi/lib/engine/util/log';
import nesoi from '../nesoi';
import * as fs from 'fs';
import path from 'path';
import { MonolythBundler } from 'nesoi/lib/bundler/monolyth/monolyth.bundler';
import script from 'nesoi/lib/engine/cli/script';

const args = script('bundle', $ => $
    .d('Bundles the Monolyth Application')
    .arg('--debug', '-d', $ => $.d('Enable debug logging'))
).init();

Log.level = args.debug ? 'debug' : 'info';

async function main() {

    // Clean .nesoi
    const dotNesoiPath = path.join(process.cwd(), '.nesoi');
    if (fs.existsSync(dotNesoiPath)) {
        fs.rmSync(dotNesoiPath, {
            recursive: true
        });
    }

    // Nesoi compiler, used to compile the TypeScript schemas into JavaScript
    const compiler = await new Compiler(nesoi, {
        exclude: ['*.test.ts']
    }).run();

    // Nesoi Monolyth Bundler, used to create a Monolyth NPM package
    await new MonolythBundler(compiler, './apps/bigrock.app.ts').run();

    // TODO: find out what stays open requiring this
    process.exit();
}

void main();
