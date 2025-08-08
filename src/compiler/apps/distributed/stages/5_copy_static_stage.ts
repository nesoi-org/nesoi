// import * as fs from 'fs';
// import * as path from 'path';
// import { Log } from '~/engine/util/log';
// import { MonolythApp } from '~/engine/apps/monolyth/monolyth.app';
// import { MonolythCompiler } from '../monolyth_compiler';
// import { Space } from '~/engine/space';

// /**
//  * [Monolyth Compiler Stage #5]
//  * Copy the paths passed to `staticPaths` on the compiler
//  * config to the build folder.
//  * 
//  * @category Monolyth Compiler
//  * @subcategory Stages
//  */
// export class CopyStaticStage {
    
//     public constructor(
//         private monolyth: MonolythCompiler,
//         private app: MonolythApp<any, any>
//     ) {}

//     public async run() {
//         Log.info('compiler', 'monolyth', 'Copying static paths to build folder...')

//         for (const staticPath of this.monolyth.config.staticPaths || []) {

//             const from = Space.path(this.monolyth.compiler.space, staticPath);
//             const to = path.join(this.monolyth.dirs.build, staticPath);

//             fs.cpSync(from, to, {
//                 recursive: true
//             })
//         }
//     }
    
// }