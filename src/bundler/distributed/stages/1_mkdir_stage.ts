import type { DistributedApp } from '~/engine/app/native/distributed.app';
import type { DistributedBundler } from '../distributed.bundler';

import * as fs from 'fs';
import * as path from 'path';
import { Space } from '~/engine/space';
import { Log } from '~/engine/util/log';

/**
 * [Distributed Compiler Stage #1]
 * Create the directory structure
 * 
 * @category Distributed Compiler
 * @subcategory Stages
 */
export class MkdirStage {
    
    public constructor(
        private bundler: DistributedBundler,
        private app: DistributedApp<any, any>
    ) {}

    public async run() {
        Log.info('compiler', 'distributed', 'Creating build directory tree')

        const dirs = this.bundler.dirs;

        dirs.build = Space.path(this.bundler.compiler.space, 'build', this.app.name);
        
        // Remove build folder
        Log.debug('compiler', 'distributed', `Removing folder ${dirs.build}`)
        fs.rmSync(dirs.build, {recursive: true, force: true});

        // Create build folder
        Log.debug('compiler', 'distributed', `Creating folder ${dirs.build}`)
        fs.mkdirSync(dirs.build, { recursive: true });

        dirs.nodes = {};
        for (const name in this.app.nodes) {
            dirs.nodes[name] = {
                build: path.resolve(dirs.build, name),
                build_modules: path.resolve(dirs.build, name, 'modules'),
                build_externals: path.resolve(dirs.build, name, 'externals'),
                build_types: path.resolve(dirs.build, name, 'types'),
                build_bin: path.resolve(dirs.build, name, 'bin'),
            }
            const nodeDirs = dirs.nodes[name];
    
            // Create build/<node>/modules folder
            Log.debug('compiler', 'distributed', `Creating folder ${nodeDirs.build_modules}`)
            if (!fs.existsSync(nodeDirs.build_modules)) {
                fs.mkdirSync(nodeDirs.build_modules, { recursive: true });
            }
    
            // Create build/<node>/externals folder
            Log.debug('compiler', 'distributed', `Creating folder ${nodeDirs.build_externals}`)
            if (!fs.existsSync(nodeDirs.build_externals)) {
                fs.mkdirSync(nodeDirs.build_externals, { recursive: true });
            }
    
            // Create build/<node>/types folder
            Log.debug('compiler', 'distributed', `Creating folder ${nodeDirs.build_types}`)
            if (!fs.existsSync(nodeDirs.build_types)) {
                fs.mkdirSync(nodeDirs.build_types, { recursive: true });
            }
    
            // Create build/<node>/bin folder
            Log.debug('compiler', 'distributed', `Creating folder ${nodeDirs.build_bin}`)
            if (!fs.existsSync(nodeDirs.build_bin)) {
                fs.mkdirSync(nodeDirs.build_bin, { recursive: true });
            }
        }
    }
    
}