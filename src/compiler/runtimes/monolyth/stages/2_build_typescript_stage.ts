import * as ts from 'typescript';
import * as path from 'path';
import { Space } from '~/engine/space';
import { Log } from '~/engine/util/log';
import { MonolythRuntime } from '~/engine/runtimes/monolyth.runtime';
import { MonolythCompiler } from '../monolyth_compiler';
import { TypeScriptCompiler } from '~/compiler/typescript/typescript_compiler';
import { Runtime } from '~/engine/runtimes/runtime';

/**
 * [Monolyth Compiler Stage #2]
 * Build typescript files to build folder
 */
export class BuildTypescriptStage {
    
    public constructor(
        private monolyth: MonolythCompiler,
        private runtime: MonolythRuntime<any, any>
    ) {}

    public async run() {
        Log.info('compiler', 'monolyth', 'Building TypeScript files...')

        const { config, compiler, dirs, runtimePath } = this.monolyth;
        
        const libPaths = (config.libPaths || []).map(path => {
            return Space.path(compiler.space, path);
        })
        const binFiles = Object.values(config.scripts || {}).map(path => {
            return Space.path(compiler.space, path);
        })
        const info = Runtime.getInfo(this.runtime);
        const modulePaths = info.modules.map(mod => {
            return Space.path(compiler.space, '.nesoi', mod as string);
        })
        const space = compiler.space;
        
        const spacePath = Space.path(space);
        const libFiles = TypeScriptCompiler.allFiles(libPaths)
        const runtimeFile = Space.path(space, runtimePath);
        const nesoiFile = Space.path(space, 'nesoi.ts');
        const moduleFiles = TypeScriptCompiler.allFiles(modulePaths)

        const replacePaths = {
            [nesoiFile]: { __remove: true },
            '$': { __remove: true },
            [runtimeFile]: path.resolve(dirs.build, 'runtime.js'),
            '.nesoi': path.resolve(dirs.build, 'types'),
        }
        const tsPaths: Record<string, string[]> = {
            '$': [nesoiFile]
        }

        if (config.nesoiPath) {
            tsPaths['nesoi/*'] = [`${config.nesoiPath}/*`]
        }

        this.monolyth.config.libPaths?.forEach(lib => {
            replacePaths[lib] = path.resolve(dirs.build, lib)
            tsPaths['.nesoi/*'] = [Space.path(compiler.space, '.nesoi')+'/*'];
            tsPaths[lib+'/*'] = [Space.path(compiler.space, lib)+'/*'];
        })

        const dotNesoiPath = Space.path(compiler.space, '.nesoi');
        moduleFiles.forEach(moduleFile => {
            const module = moduleFile.replace(dotNesoiPath, '').split(path.sep)[1];
            if (!module?.length) {
                throw new Error(`Unable to find module name from path ${moduleFile}`);
            }
            const filename = path.basename(moduleFile).replace(/\.ts$/,'.js');
            replacePaths[moduleFile] = path.resolve(dirs.build, 'modules', module, filename)
        });

        binFiles.forEach(binFile => {
            const filename = path.basename(binFile).replace(/\.ts$/,'.js');
            replacePaths[binFile] = path.resolve(dirs.build, 'bin', filename)
        });

        const emitCode = TypeScriptCompiler.compileRuntime(
            info.modules as string[],
            [
                runtimeFile,
                ...libFiles,
                ...binFiles,
                ...moduleFiles
            ], {
                target: ts.ScriptTarget.ES2020,
                module: ts.ModuleKind.CommonJS,
                moduleResolution: ts.ModuleResolutionKind.Node10,
                noEmitOnError: true,
                declaration: true,
                strict: true,
                esModuleInterop: true,
                paths: {
                    ...tsPaths
                },
                rootDir: Space.path(space),
                outDir: dirs.build,

                // Built methods don't carry all the typings, so we disable this check
                // However, this has been checked before Compiler built them
                noImplicitAny: false, 
            },
            spacePath,
            dirs.build,
            replacePaths);
        
        if (emitCode !== 0) {
            throw new Error('One or more TypeScript files contains errors.')
        }
    }
    
}