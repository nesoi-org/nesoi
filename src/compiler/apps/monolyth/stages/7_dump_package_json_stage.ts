import * as fs from 'fs';
import * as path from 'path';
import { Log } from '~/engine/util/log';
import { MonolythCompiler } from '../monolyth_compiler';
import { Space } from '~/engine/space';
import { MonolythApp } from '~/engine/apps/monolyth/monolyth.app';
import { App } from '~/engine/apps/app';

/**
 * [Monolyth Compiler Stage #7]
 * Dump the package.json file to build folder.
 * 
 * @category Monolyth Compiler
 * @subcategory Stages
 */
export class DumpPackageJsonStage {
    
    public constructor(
        private monolyth: MonolythCompiler,
        private app: MonolythApp<any, any>
    ) {}

    public async run() {
        Log.info('compiler', 'monolyth', 'Dumping package.json to build folder...')

        const { config, compiler, dirs } = this.monolyth;

        const packageJsonPath = config.nesoiPath
            ? path.join(config.nesoiPath, 'package.json')
            : path.join('..', '..', '..', '..', '..', 'package.json');

        const nesoiPackageJson = await import(packageJsonPath);
        const spacePackageJson = await import(Space.path(compiler.space,'package.json'));

        const filePath = path.resolve(dirs.build, 'package.json');
        const scripts: Record<string, string> = {
            cli: 'node bin/cli.js'
        };

        Object.entries(config.scripts || {}).forEach(([name, path]) => {
            const jspath = path.replace(/\.ts/,'.js');
            scripts[name] = `node ${jspath}`;
        });

        const info = App.getInfo(this.app);

        const { nesoi: _, spaceDependencies } = spacePackageJson.dependencies;
        const dependencies = {
            ...spaceDependencies,
            [info.nesoiNpmPkg]: config.nesoiPath
                ? `file:${config.nesoiPath || config.nesoiVersion}`
                : config.nesoiVersion || nesoiPackageJson.version
        }
        const packageJson = MonolythApp.package(this.app, scripts, dependencies);
        fs.writeFileSync(filePath, JSON.stringify(packageJson, undefined, 2))
    }
    
}