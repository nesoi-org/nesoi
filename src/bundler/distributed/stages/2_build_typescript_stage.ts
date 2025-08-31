import * as ts from 'typescript';
import * as path from 'path';
import { Space } from '~/engine/space';
import { Log } from '~/engine/util/log';
import { TypeScriptCompiler } from '~/compiler/typescript/typescript_compiler';
import { App } from '~/engine/app/app';
import { DistributedApp } from '../distributed.app';
import { DistributedBundler } from '../distributed.bundler';
import { DistributedNodeApp } from '../distributed_node.app';

/**
 * [Distributed Compiler Stage #2]
 * Build typescript files to build folder
 * 
 * @category Distributed Compiler
 * @subcategory Stages
 */
export class BuildTypescriptStage {
    
    public constructor(
        private bundler: DistributedBundler,
        private app: DistributedApp<any, any>
    ) {}

    public async run() {
        
        const { config, compiler, dirs: _dirs, appPath } = this.bundler;
        
        for (const name in this.app.nodes) {
            Log.info('compiler', 'distributed', `[${name}] Building TypeScript files...`)

            const node = (this.app.nodes as any)[name] as DistributedNodeApp<any, any, any, any>;
            const dirs = _dirs.nodes[name];

            const libPaths = (config.libPaths || []).map(path => {
                return Space.path(compiler.space, path);
            })
            const binFiles = Object.values(config.scripts || {}).map(path => {
                return Space.path(compiler.space, path);
            })
            const info = App.getInfo(node);
    
            const modulePaths: string[] = []
            Space.scan(compiler.space, (name) => {
                if (info.spaceModules.includes(name)) {
                    modulePaths.push(
                        Space.path(compiler.space, '.nesoi', name)
                    );
                }
            })
    
            const space = compiler.space;
            
            const spacePath = Space.path(space);
            const libFiles = TypeScriptCompiler.allFiles(libPaths)
            const appFile = Space.path(space, appPath);
            const nesoiFile = Space.path(space, 'nesoi.ts');
            const moduleFiles = TypeScriptCompiler.allFiles(modulePaths)
    
            const replacePaths = {
                [nesoiFile]: { __remove: true },
                '$': { __remove: true },
                [appFile]: path.resolve(dirs.build, 'app.js'),
                '.nesoi': path.resolve(dirs.build, 'types'),
            }
            const tsPaths: Record<string, string[]> = {
                '$': [nesoiFile]
            }
    
            if (config.nesoiPath) {
                tsPaths['nesoi/*'] = [`${config.nesoiPath}/*`]
            }
    
            const moduleDirs = Object.values(compiler.modules).map(mod => 
                [mod.module.name, Space.path(compiler.space, 'modules', ...mod.module.subdir, mod.module.name)]
            );
    
            libFiles.forEach(lib => {
                let libModule;
                for (const [module, modulePath] of moduleDirs) {
                    if (lib.startsWith(modulePath)) {
                        libModule = { name: module, path: modulePath };
                        break;
                    }
                }
                let outPath;
                if (!libModule) {
                    lib = Space.relPath(compiler.space, lib)
                    outPath = path.resolve(dirs.build, lib)
                }
                else {
                    const rel = path.relative(libModule.path, lib)
                    outPath = path.resolve(dirs.build, 'modules', libModule.name, rel)
                }
                replacePaths[lib] = path.resolve(dirs.build, outPath)
            })
    
            libPaths.forEach(lib => {
                let libModule;
                for (const [module, modulePath] of moduleDirs) {
                    if (lib.startsWith(modulePath)) {
                        libModule = { name: module, path: modulePath };
                        break;
                    }
                }
                let outPath;
                if (!libModule) {
                    lib = Space.relPath(compiler.space, lib)
                    outPath = path.resolve(dirs.build, lib)
                }
                else {
                    const rel = path.relative(libModule.path, lib)
                    outPath = path.resolve(dirs.build, 'modules', libModule.name, rel)
                }
                replacePaths[lib] = path.resolve(dirs.build, outPath)
                tsPaths[lib+'/*'] = [Space.path(compiler.space, lib)+'/*'];
            })
            tsPaths['.nesoi/*'] = [Space.path(compiler.space, '.nesoi')+'/*'];
    
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
    
            const emitCode = TypeScriptCompiler.compileApp(
                info.spaceModules as string[],
                [
                    appFile,
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
    
}