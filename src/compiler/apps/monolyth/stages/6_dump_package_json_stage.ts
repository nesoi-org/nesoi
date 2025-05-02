import * as fs from 'fs';
import * as path from 'path';
import { Log } from '~/engine/util/log';
import { MonolythCompiler } from '../monolyth_compiler';
import { Space } from '~/engine/space';
import { MonolythApp } from '~/engine/apps/monolyth/monolyth.app';

/**
 * [Monolyth Compiler Stage #6]
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

        const nesoiPackageJson = await import(`${config.nesoiPath || path.join('..', '..', '..', '..', '..', 'package.json')}`);
        const spacePackageJson = await import(Space.path(compiler.space,'package.json'));

        const filePath = path.resolve(dirs.build, 'package.json');
        const scripts: Record<string, string> = {
            cli: 'node bin/cli.js'
        };

        Object.entries(config.scripts || {}).forEach(([name, path]) => {
            const jspath = path.replace(/\.ts/,'.js');
            scripts[name] = `node ${jspath}`;
        });

        const dependencies = {
            ...spacePackageJson.dependencies,
            nesoi: config.nesoiPath
                ? `file:${config.nesoiPath}`
                : nesoiPackageJson.version
        }
        const packageJson = MonolythApp.package(this.app, scripts, dependencies);
        fs.writeFileSync(filePath, JSON.stringify(packageJson, undefined, 2))
    }
    
}