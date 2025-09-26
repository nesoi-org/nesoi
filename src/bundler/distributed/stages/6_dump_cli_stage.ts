// import * as fs from 'fs';
// import * as path from 'path';
// import { Log } from '~/engine/util/log';
// import { MonolythApp } from '~/engine/app/native/monolyth.app';
// import { MonolythBundler } from '../monolyth.bundler';

// /**
//  * [Monolyth Compiler Stage #6]
//  * Dump the cli.js file to build/bin folder.
//  * 
//  * @category Monolyth Compiler
//  * @subcategory Stages
//  */
// export class DumpCLIStage {
    
//     public constructor(
//         private monolyth: MonolythBundler,
//         private app: MonolythApp<any, any>
//     ) {}

//     public async run() {
//         Log.info('compiler', 'monolyth', 'Dumping cli.js file to build/bin folder...')

//         const { dirs } = this.monolyth;

//         let str = '';
//         str += 'const app = require(\'../app\').default\n';
//         str += 'const { Log } = require(\'nesoi/lib/engine/util/log\');\n';
//         str += 'Log.level = \'debug\';\n'
//         str += '\n';
//         str += '(async () => {\n';
//         str += '  (await app.daemon()).cli();\n';
//         str += '})()'
//         const filePath = path.resolve(dirs.build_bin, 'cli.js')
//         fs.writeFileSync(filePath, str);
//     }
    
// }