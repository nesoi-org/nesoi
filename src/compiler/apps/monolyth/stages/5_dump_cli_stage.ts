import * as fs from 'fs';
import * as path from 'path';
import { Log } from '~/engine/util/log';
import { MonolythApp } from '~/engine/apps/monolyth/monolyth.app';
import { MonolythCompiler } from '../monolyth_compiler';

/**
 * [Monolyth Compiler Stage #5]
 * Dump the cli.js file to build/bin folder.
 */
export class DumpCLIStage {
    
    public constructor(
        private monolyth: MonolythCompiler,
        private app: MonolythApp<any, any>
    ) {}

    public async run() {
        Log.info('compiler', 'monolyth', 'Dumping cli.js file to build/bin folder...')

        const { dirs } = this.monolyth;

        let str = '';
        str += 'require("dotenv/config");\n';
        str += 'const app = require(\'../app\').default\n';
        str += 'const { Log } = require(\'nesoi/lib/engine/util/log\');\n';
        str += 'Log.level = \'debug\';\n'
        str += '\n';
        str += '(async () => {\n';
        str += '  (await app.daemon()).cli();\n';
        str += '})()'
        const filePath = path.resolve(dirs.build_bin, 'cli.js')
        fs.writeFileSync(filePath, str);
    }
    
}