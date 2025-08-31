import * as fs from 'fs';
import * as path from 'path';
import { Space } from '~/engine/space';
import { Log } from '~/engine/util/log';
import { MonolythApp } from '~/bundler/monolyth/monolyth.app';
import { MonolythBundler } from '../monolyth.bundler';

/**
 * [Monolyth Compiler Stage #1]
 * Create the directory structure
 * 
 * @category Monolyth Compiler
 * @subcategory Stages
 */
export class MkdirStage {
    
    public constructor(
        private bundler: MonolythBundler,
        private app: MonolythApp<any, any>
    ) {}

    public async run() {
        Log.info('compiler', 'monolyth', 'Creating build directory tree')

        const dirs = this.bundler.dirs;

        dirs.build = Space.path(this.bundler.compiler.space, 'build', this.app.name);
        
        // Remove build folder
        Log.debug('compiler', 'monolyth', `Removing folder ${dirs.build}`)
        fs.rmSync(dirs.build, {recursive: true, force: true});

        // Create build folder
        Log.debug('compiler', 'monolyth', `Creating folder ${dirs.build}`)
        fs.mkdirSync(dirs.build, { recursive: true });

        // Create build/modules folder
        dirs.build_modules = path.resolve(dirs.build, 'modules');
        Log.debug('compiler', 'monolyth', `Creating folder ${dirs.build_modules}`)
        if (!fs.existsSync(dirs.build_modules)) {
            fs.mkdirSync(dirs.build_modules, { recursive: true });
        }

        // Create build/types folder
        dirs.build_types = path.resolve(dirs.build, 'types');
        Log.debug('compiler', 'monolyth', `Creating folder ${dirs.build_types}`)
        if (!fs.existsSync(dirs.build_types)) {
            fs.mkdirSync(dirs.build_types, { recursive: true });
        }

        // Create build/bin folder
        dirs.build_bin = path.resolve(dirs.build, 'bin');
        Log.debug('compiler', 'monolyth', `Creating folder ${dirs.build_bin}`)
        if (!fs.existsSync(dirs.build_bin)) {
            fs.mkdirSync(dirs.build_bin, { recursive: true });
        }
    }
    
}