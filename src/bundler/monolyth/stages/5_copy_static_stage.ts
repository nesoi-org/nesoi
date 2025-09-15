import * as fs from 'fs';
import * as path from 'path';
import { Log } from '~/engine/util/log';
import { MonolythApp } from '~/engine/app/native/monolyth.app';
import { MonolythBundler } from '../monolyth.bundler';
import { Space } from '~/engine/space';

/**
 * [Monolyth Compiler Stage #5]
 * Copy the paths passed to `staticPaths` on the compiler
 * config to the build folder.
 * 
 * @category Monolyth Compiler
 * @subcategory Stages
 */
export class CopyStaticStage {
    
    public constructor(
        private bundler: MonolythBundler,
        private app: MonolythApp<any, any>
    ) {}

    public async run() {
        Log.info('compiler', 'monolyth', 'Copying static paths to build folder...')

        for (const staticPath of this.bundler.config.staticPaths || []) {

            const from = Space.path(this.bundler.compiler.space, staticPath);
            const to = path.join(this.bundler.dirs.build, staticPath);

            fs.cpSync(from, to, {
                recursive: true
            })
        }
    }
    
}